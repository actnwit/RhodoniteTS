import { LightClusterLayout, type LightClusterViewLayout } from './LightClusterLayout';

/**
 * Pure functions that build the Clustered Forward light clusters of a view on the CPU.
 * The memory layout is described in LightClusterLayout.ts.
 *
 * A light is assigned to a cluster `(x, y, z)` when its bounding sphere `(c, r)` passes all of these tests
 * (the WebGPU compute shader in WebGpuLightClusterBuilder.ts implements the same tests):
 * - The sphere is not entirely behind the eye plane: `dot(rowW, c) / |rowW.xyz| > -r` (skipped when rowW.xyz is 0).
 * - Column: `x == 0 || dist(rowX - x * rowW, c) >= -r` and `x == gridX - 1 || dist((x + 1) * rowW - rowX, c) >= -r`.
 * - Row: the same with rowY and y.
 * - Slice: `z == 0 || d + r >= zs(z)` and `z == gridZ - 1 || d - r <= zs(z + 1)`,
 *   where `d = dot(rowDepth, c)` and `zs(k) = exp((k - sliceBias) / sliceScale)`.
 *
 * `dist(plane, c)` is the signed distance `(dot(plane.xyz, c) + plane.w) / |plane.xyz|`.
 * The clusters at the borders of the grid extend to infinity, so a fragment whose cluster coordinates are clamped
 * is still inside its cluster.
 */

/** Scratch memory reused between builds. */
export type LightClusterBuildScratch = {
  counts: Uint32Array;
  offsets: Uint32Array;
  columnPass: Uint8Array;
  rowPass: Uint8Array;
  slicePass: Uint8Array;
  sliceBoundaries: Float64Array;
};

/**
 * Creates the scratch memory for a layout.
 */
export function createLightClusterBuildScratch(layout: LightClusterViewLayout): LightClusterBuildScratch {
  return {
    counts: new Uint32Array(layout.clusterCount),
    offsets: new Uint32Array(layout.clusterCount),
    columnPass: new Uint8Array(layout.gridX),
    rowPass: new Uint8Array(layout.gridY),
    slicePass: new Uint8Array(layout.gridZ),
    sliceBoundaries: new Float64Array(layout.gridZ + 1),
  };
}

/** The ratio between the far and near depth of the slices is at least this value. */
const MinSliceDepthRatio = 2;
/** The ratio between the far and near depth of the slices is at most this value. */
const MaxSliceDepthRatio = 1024;
/** The smallest far depth of the slices. */
const MinSliceFarDepth = 1e-4;

/**
 * Writes the header of a view region: the clip rows, the depth row, the grid size and the depth slices.
 *
 * The depth range of the slices is fitted to the depth range of the light spheres, so that the slices are not
 * wasted on depths where no light reaches.
 *
 * @param dst - The memory of the view region
 * @param viewOffset - The float offset of the view region in `dst`
 * @param viewMatrix - The view matrix (column-major, as uploaded to the GPU)
 * @param projectionMatrix - The projection matrix (column-major, as uploaded to the GPU)
 * @param spheres - The light spheres in world space (cx, cy, cz, r) * localCount
 * @param localCount - The number of light spheres
 * @param layout - The layout of the view region
 */
export function writeLightClusterViewHeader(
  dst: Float32Array,
  viewOffset: number,
  viewMatrix: ArrayLike<number>,
  projectionMatrix: ArrayLike<number>,
  spheres: ArrayLike<number>,
  localCount: number,
  layout: LightClusterViewLayout
) {
  // clip = P * V. Column-major: m[row][col] = v[col * 4 + row].
  const clip = new Float64Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += projectionMatrix[k * 4 + row] * viewMatrix[col * 4 + k];
      }
      clip[row * 4 + col] = sum; // row-major
    }
  }

  const halfX = 0.5 * layout.gridX;
  const halfY = 0.5 * layout.gridY;
  for (let col = 0; col < 4; col++) {
    const w = clip[12 + col];
    dst[viewOffset + col] = halfX * (clip[col] + w);
    dst[viewOffset + 4 + col] = halfY * (clip[4 + col] + w);
    dst[viewOffset + 8 + col] = w;
  }

  // depth = -z_view, normalized so that it is a distance in world units even if the view matrix has a scale.
  const dx = -viewMatrix[2];
  const dy = -viewMatrix[6];
  const dz = -viewMatrix[10];
  const dw = -viewMatrix[14];
  const depthLength = Math.hypot(dx, dy, dz);
  const invDepthLength = depthLength > 0 ? 1 / depthLength : 1;
  dst[viewOffset + 12] = dx * invDepthLength;
  dst[viewOffset + 13] = dy * invDepthLength;
  dst[viewOffset + 14] = dz * invDepthLength;
  dst[viewOffset + 15] = dw * invDepthLength;

  let minDepth = Number.POSITIVE_INFINITY;
  let maxDepth = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < localCount; i++) {
    const cx = spheres[i * 4];
    const cy = spheres[i * 4 + 1];
    const cz = spheres[i * 4 + 2];
    const r = spheres[i * 4 + 3];
    const d = (dx * cx + dy * cy + dz * cz + dw) * invDepthLength;
    minDepth = Math.min(minDepth, d - r);
    maxDepth = Math.max(maxDepth, d + r);
  }
  const zFar = Math.max(Number.isFinite(maxDepth) ? maxDepth : MinSliceFarDepth, MinSliceFarDepth);
  const zNear = Math.min(
    Math.max(Number.isFinite(minDepth) ? minDepth : 0, zFar / MaxSliceDepthRatio),
    zFar / MinSliceDepthRatio
  );
  const sliceScale = layout.gridZ / Math.log(zFar / zNear);
  const sliceBias = -Math.log(zNear) * sliceScale;

  dst[viewOffset + 16] = layout.gridX;
  dst[viewOffset + 17] = layout.gridY;
  dst[viewOffset + 18] = layout.gridZ;
  dst[viewOffset + 19] = 0; // state
  dst[viewOffset + 20] = sliceScale;
  dst[viewOffset + 21] = sliceBias;
  dst[viewOffset + 22] = zNear;
  dst[viewOffset + 23] = zFar;
}

/**
 * Computes the slice boundaries `zs(k)` from the slice parameters stored in the header.
 * `zs(0)` and `zs(gridZ)` are not used by the tests (the border slices are unbounded).
 */
function computeSliceBoundaries(
  dst: Float32Array,
  viewOffset: number,
  layout: LightClusterViewLayout,
  out: Float64Array
) {
  const sliceScale = dst[viewOffset + 20];
  const sliceBias = dst[viewOffset + 21];
  for (let k = 0; k <= layout.gridZ; k++) {
    out[k] = Math.exp((k - sliceBias) / sliceScale);
  }
}

/**
 * The signed distance from a plane `base - k * step` (or `k * step - base` when `flip` is true) to a point.
 * Returns +Infinity for a degenerate plane so that the test passes (conservative).
 */
function planeDistance(
  dst: Float32Array,
  baseOffset: number,
  stepOffset: number,
  k: number,
  flip: boolean,
  cx: number,
  cy: number,
  cz: number
) {
  const sign = flip ? -1 : 1;
  const nx = sign * (dst[baseOffset] - k * dst[stepOffset]);
  const ny = sign * (dst[baseOffset + 1] - k * dst[stepOffset + 1]);
  const nz = sign * (dst[baseOffset + 2] - k * dst[stepOffset + 2]);
  const nw = sign * (dst[baseOffset + 3] - k * dst[stepOffset + 3]);
  const length = Math.hypot(nx, ny, nz);
  if (!(length > 1e-30)) {
    return Number.POSITIVE_INFINITY;
  }
  return (nx * cx + ny * cy + nz * cz + nw) / length;
}

/**
 * Whether a sphere is entirely behind the eye plane (w <= 0) of the view.
 * Fragments there use the all-light list, so such a light is not assigned to any cluster.
 */
function isSphereBehindEye(dst: Float32Array, viewOffset: number, cx: number, cy: number, cz: number, r: number) {
  const wx = dst[viewOffset + 8];
  const wy = dst[viewOffset + 9];
  const wz = dst[viewOffset + 10];
  const ww = dst[viewOffset + 11];
  const length = Math.hypot(wx, wy, wz);
  if (!(length > 1e-30)) {
    return false;
  }
  return (wx * cx + wy * cy + wz * cz + ww) / length <= -r;
}

/**
 * Evaluates the per-axis tests of a sphere. Returns false when the sphere can not touch any cluster.
 */
function evaluateSphereAxes(
  dst: Float32Array,
  viewOffset: number,
  layout: LightClusterViewLayout,
  scratch: LightClusterBuildScratch,
  cx: number,
  cy: number,
  cz: number,
  r: number
) {
  if (isSphereBehindEye(dst, viewOffset, cx, cy, cz, r)) {
    return false;
  }
  const { gridX, gridY, gridZ } = layout;
  const rowXOffset = viewOffset;
  const rowYOffset = viewOffset + 4;
  const rowWOffset = viewOffset + 8;

  let anyColumn = false;
  for (let x = 0; x < gridX; x++) {
    const pass =
      (x === 0 || planeDistance(dst, rowXOffset, rowWOffset, x, false, cx, cy, cz) >= -r) &&
      (x === gridX - 1 || planeDistance(dst, rowXOffset, rowWOffset, x + 1, true, cx, cy, cz) >= -r);
    scratch.columnPass[x] = pass ? 1 : 0;
    anyColumn ||= pass;
  }
  if (!anyColumn) {
    return false;
  }

  let anyRow = false;
  for (let y = 0; y < gridY; y++) {
    const pass =
      (y === 0 || planeDistance(dst, rowYOffset, rowWOffset, y, false, cx, cy, cz) >= -r) &&
      (y === gridY - 1 || planeDistance(dst, rowYOffset, rowWOffset, y + 1, true, cx, cy, cz) >= -r);
    scratch.rowPass[y] = pass ? 1 : 0;
    anyRow ||= pass;
  }
  if (!anyRow) {
    return false;
  }

  const d = dst[viewOffset + 12] * cx + dst[viewOffset + 13] * cy + dst[viewOffset + 14] * cz + dst[viewOffset + 15];
  const boundaries = scratch.sliceBoundaries;
  let anySlice = false;
  for (let z = 0; z < gridZ; z++) {
    const pass = (z === 0 || d + r >= boundaries[z]) && (z === gridZ - 1 || d - r <= boundaries[z + 1]);
    scratch.slicePass[z] = pass ? 1 : 0;
    anySlice ||= pass;
  }
  return anySlice;
}

/**
 * Builds the cluster table and the light index list of a view whose header has been written.
 *
 * The lights of each cluster are stored in the order of `localEntries` (sorted by the light component SID).
 * When the light index list overflows, the state of the view is set to overflow and the shaders use the all-light
 * list for the whole view.
 *
 * @returns false if the light index list overflowed
 */
export function buildLightClustersOnCpu(
  dst: Float32Array,
  viewOffset: number,
  layout: LightClusterViewLayout,
  spheres: ArrayLike<number>,
  localEntries: ArrayLike<number>,
  localCount: number,
  scratch: LightClusterBuildScratch
): boolean {
  const { gridX, gridY, gridZ, clusterCount } = layout;
  const counts = scratch.counts;
  const offsets = scratch.offsets;
  counts.fill(0);
  computeSliceBoundaries(dst, viewOffset, layout, scratch.sliceBoundaries);

  const forEachCluster = (visit: (clusterIndex: number) => void) => {
    for (let z = 0; z < gridZ; z++) {
      if (scratch.slicePass[z] === 0) continue;
      for (let y = 0; y < gridY; y++) {
        if (scratch.rowPass[y] === 0) continue;
        const rowStart = (z * gridY + y) * gridX;
        for (let x = 0; x < gridX; x++) {
          if (scratch.columnPass[x] !== 0) {
            visit(rowStart + x);
          }
        }
      }
    }
  };

  // Pass 1: count the lights of each cluster
  for (let i = 0; i < localCount; i++) {
    if (
      evaluateSphereAxes(
        dst,
        viewOffset,
        layout,
        scratch,
        spheres[i * 4],
        spheres[i * 4 + 1],
        spheres[i * 4 + 2],
        spheres[i * 4 + 3]
      )
    ) {
      forEachCluster(c => {
        counts[c]++;
      });
    }
  }

  // Pass 2: offsets (exclusive prefix sum in vec4, each list starts at a vec4 boundary)
  let totalVec4 = 0;
  for (let c = 0; c < clusterCount; c++) {
    offsets[c] = totalVec4;
    totalVec4 += (counts[c] + 3) >> 2;
  }

  const tableOffset = viewOffset + LightClusterLayout.viewHeaderVec4Count * 4;
  const indexOffset = tableOffset + layout.tableVec4Count * 4;
  const stateOffset = viewOffset + LightClusterLayout.viewGridOffset * 4 + 3;
  if (totalVec4 > layout.indexVec4Count) {
    dst[stateOffset] = LightClusterLayout.stateOverflow;
    return false;
  }
  dst[stateOffset] = 0;

  for (let c = 0; c < clusterCount; c++) {
    const o = tableOffset + c * 4;
    dst[o] = offsets[c];
    dst[o + 1] = counts[c];
    dst[o + 2] = 0;
    dst[o + 3] = 0;
    // The padding of the last vec4 of the list is zero (as written by the compute shader)
    if ((counts[c] & 3) !== 0) {
      const lastVec4 = indexOffset + (offsets[c] + (counts[c] >> 2)) * 4;
      dst.fill(0, lastVec4, lastVec4 + 4);
    }
  }

  // Pass 3: fill the light index list. `offsets` (converted to entries) is used as the write cursor of each cluster.
  for (let c = 0; c < clusterCount; c++) {
    offsets[c] *= 4;
  }
  for (let i = 0; i < localCount; i++) {
    if (
      evaluateSphereAxes(
        dst,
        viewOffset,
        layout,
        scratch,
        spheres[i * 4],
        spheres[i * 4 + 1],
        spheres[i * 4 + 2],
        spheres[i * 4 + 3]
      )
    ) {
      const entry = localEntries[i];
      forEachCluster(c => {
        dst[indexOffset + offsets[c]] = entry;
        offsets[c]++;
      });
    }
  }
  return true;
}

/**
 * The cluster-centric form of the assignment test (the form the WebGPU compute shader uses).
 * It must agree with the light-centric build of `buildLightClustersOnCpu`.
 */
export function sphereIntersectsLightCluster(
  dst: Float32Array,
  viewOffset: number,
  layout: LightClusterViewLayout,
  x: number,
  y: number,
  z: number,
  cx: number,
  cy: number,
  cz: number,
  r: number
): boolean {
  if (isSphereBehindEye(dst, viewOffset, cx, cy, cz, r)) {
    return false;
  }
  const rowXOffset = viewOffset;
  const rowYOffset = viewOffset + 4;
  const rowWOffset = viewOffset + 8;
  if (x > 0 && planeDistance(dst, rowXOffset, rowWOffset, x, false, cx, cy, cz) < -r) return false;
  if (x < layout.gridX - 1 && planeDistance(dst, rowXOffset, rowWOffset, x + 1, true, cx, cy, cz) < -r) return false;
  if (y > 0 && planeDistance(dst, rowYOffset, rowWOffset, y, false, cx, cy, cz) < -r) return false;
  if (y < layout.gridY - 1 && planeDistance(dst, rowYOffset, rowWOffset, y + 1, true, cx, cy, cz) < -r) return false;
  const sliceScale = dst[viewOffset + 20];
  const sliceBias = dst[viewOffset + 21];
  const d = dst[viewOffset + 12] * cx + dst[viewOffset + 13] * cy + dst[viewOffset + 14] * cz + dst[viewOffset + 15];
  if (z > 0 && d + r < Math.exp((z - sliceBias) / sliceScale)) return false;
  if (z < layout.gridZ - 1 && d - r > Math.exp((z + 1 - sliceBias) / sliceScale)) return false;
  return true;
}

/**
 * The reference implementation of the cluster lookup of the shaders (`getLightList`).
 *
 * @returns The cluster index, or -1 when the position uses the all-light list (behind the eye plane or overflow).
 */
export function computeLightClusterIndex(
  dst: Float32Array,
  viewOffset: number,
  px: number,
  py: number,
  pz: number
): number {
  const gridX = dst[viewOffset + 16];
  const gridY = dst[viewOffset + 17];
  const gridZ = dst[viewOffset + 18];
  if (dst[viewOffset + 19] !== 0) {
    return -1;
  }
  const dot = (o: number) => dst[o] * px + dst[o + 1] * py + dst[o + 2] * pz + dst[o + 3];
  const w = dot(viewOffset + 8);
  if (!(w > 0)) {
    return -1;
  }
  const clamp = (v: number, max: number) => Math.min(Math.max(Math.floor(v), 0), max - 1);
  const x = clamp(dot(viewOffset) / w, gridX);
  const y = clamp(dot(viewOffset + 4) / w, gridY);
  const depth = Math.max(dot(viewOffset + 12), 1e-30);
  const z = clamp(Math.log(depth) * dst[viewOffset + 20] + dst[viewOffset + 21], gridZ);
  return (z * gridY + y) * gridX + x;
}

/**
 * Reads the light entries of a cluster built by `buildLightClustersOnCpu` (or by the compute shader).
 */
export function readLightClusterEntries(
  dst: Float32Array,
  viewOffset: number,
  layout: LightClusterViewLayout,
  clusterIndex: number
): number[] {
  const tableOffset = viewOffset + LightClusterLayout.viewHeaderVec4Count * 4;
  const indexOffset = tableOffset + layout.tableVec4Count * 4;
  const offsetVec4 = dst[tableOffset + clusterIndex * 4];
  const count = dst[tableOffset + clusterIndex * 4 + 1];
  const entries: number[] = [];
  for (let i = 0; i < count; i++) {
    entries.push(dst[indexOffset + offsetVec4 * 4 + i]);
  }
  return entries;
}

/**
 * Computes the bounding sphere of a light from the values uploaded to the GPU.
 * Returns the radius, or -1 when the light can not be culled (directional lights and lights without range).
 *
 * @param out - Receives (cx, cy, cz, r) at `outOffset`
 */
export function computeLightBoundingSphere(
  typeValue: number,
  position: ArrayLike<number>,
  direction: ArrayLike<number>,
  range: number,
  outerConeCos: number,
  out: Float64Array,
  outOffset: number
): number {
  // The same classification as getLight() in the shaders: > 0.75 is a point or spot light, > 1.75 is a spot light.
  if (!(typeValue > 0.75) || !(range > 0)) {
    return -1;
  }
  let cx = position[0];
  let cy = position[1];
  let cz = position[2];
  let r = range;
  if (typeValue > 1.75) {
    // The lit region of a spot light (the cone sector with the slant height `range`) is inside the sphere
    // centered on the axis at range / (2 cos(theta)) with that radius. It is smaller than the range sphere
    // when the half angle is below 60 degrees. The shader does not normalize the direction, so this is used
    // only when the direction is a unit vector.
    const dx = direction[0];
    const dy = direction[1];
    const dz = direction[2];
    const length = Math.hypot(dx, dy, dz);
    if (Math.abs(length - 1) < 1e-3 && outerConeCos > 0.5) {
      const t = range / (2 * outerConeCos);
      cx += (dx / length) * t;
      cy += (dy / length) * t;
      cz += (dz / length) * t;
      r = t;
    }
  }
  // Inflate the sphere a little so that the float precision of the shaders never culls a contributing light.
  // The attenuation is exactly zero beyond the range, so this does not change the image.
  out[outOffset] = cx;
  out[outOffset + 1] = cy;
  out[outOffset + 2] = cz;
  out[outOffset + 3] = r * 1.001;
  return out[outOffset + 3];
}
