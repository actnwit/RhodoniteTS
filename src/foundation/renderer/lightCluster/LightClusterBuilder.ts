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

/**
 * The result of a light cluster build.
 * - `'built'`: every light was stored.
 * - `'truncated'`: some clusters had more lights than `clusterLightCapacity` and kept only their nearest lights.
 */
export type LightClusterBuildResult = 'built' | 'truncated';

/** Scratch memory reused between builds. */
export type LightClusterBuildScratch = {
  /** The number of vec4 of the light index list used by the last build. */
  usedIndexVec4Count: number;
  counts: Uint32Array;
  offsets: Uint32Array;
  sliceBoundaries: Float64Array;
  /** The normalized tile planes `rowX - k * rowW` (k = 0..gridX), (nx, ny, nz, w) each. Degenerate planes are 0. */
  planesX: Float64Array;
  /** The normalized tile planes `rowY - k * rowW` (k = 0..gridY). */
  planesY: Float64Array;
  /**
   * The columns, rows and slices each light passes (gridX + gridY + gridZ flags per light), evaluated once and
   * reused by the count and fill passes. Grown on demand.
   */
  axisPass: Uint8Array;
  /** Whether each light touches any cluster. Grown on demand. */
  isLightInView: Uint8Array;
  /** The first and last passing column, row and slice of each light (6 per light). Grown on demand. */
  axisRanges: Int32Array;
};

/**
 * Creates the scratch memory for a layout.
 */
export function createLightClusterBuildScratch(layout: LightClusterViewLayout): LightClusterBuildScratch {
  return {
    usedIndexVec4Count: 0,
    counts: new Uint32Array(layout.clusterCount),
    offsets: new Uint32Array(layout.clusterCount),
    sliceBoundaries: new Float64Array(layout.gridZ + 1),
    planesX: new Float64Array((layout.gridX + 1) * 4),
    planesY: new Float64Array((layout.gridY + 1) * 4),
    axisPass: new Uint8Array(0),
    isLightInView: new Uint8Array(0),
    axisRanges: new Int32Array(0),
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
 * The depth range of the slices is the intersection of the depth range of the light spheres and the visible depth
 * range of the camera: the slices are not wasted on depths where no light reaches, nor in front of the camera near
 * plane or beyond the far plane.
 *
 * @param dst - The memory of the view region
 * @param viewOffset - The float offset of the view region in `dst`
 * @param viewMatrix - The view matrix (column-major, as uploaded to the GPU)
 * @param projectionMatrix - The projection matrix (column-major, as uploaded to the GPU)
 * @param spheres - The light spheres in world space (cx, cy, cz, r) * localCount
 * @param localCount - The number of light spheres
 * @param layout - The layout of the view region
 * @param visibleNearDepth - The view depth of the camera near plane (0 disables the clamp)
 * @param visibleFarDepth - The view depth of the camera far plane (Infinity disables the clamp)
 */
export function writeLightClusterViewHeader(
  dst: Float32Array,
  viewOffset: number,
  viewMatrix: ArrayLike<number>,
  projectionMatrix: ArrayLike<number>,
  spheres: ArrayLike<number>,
  localCount: number,
  layout: LightClusterViewLayout,
  visibleNearDepth = 0,
  visibleFarDepth = Number.POSITIVE_INFINITY
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
  const lightNear = Number.isFinite(minDepth) ? minDepth : 0;
  const lightFar = Number.isFinite(maxDepth) ? maxDepth : MinSliceFarDepth;
  const cameraFar =
    Number.isFinite(visibleFarDepth) && visibleFarDepth > 0 ? visibleFarDepth : Number.POSITIVE_INFINITY;
  const zFar = Math.max(Math.min(lightFar, cameraFar), MinSliceFarDepth);
  // The ratio limits keep a valid mapping when the camera range does not overlap the lights: the cluster lists then
  // only contain the lights whose spheres reach into the visible range (the border slices extend to infinity).
  const cameraNear = Math.min(Math.max(visibleNearDepth, 0), zFar / MinSliceDepthRatio);
  const zNear = Math.min(Math.max(lightNear, cameraNear, zFar / MaxSliceDepthRatio), zFar / MinSliceDepthRatio);
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
 * Normalizes the tile planes `base - k * step` (k = 0..count) once per view. A degenerate plane is stored as 0,
 * and the tests treat it as passing (as `planeDistance` returns +Infinity for it).
 */
function computeTilePlanes(
  dst: Float32Array,
  baseOffset: number,
  stepOffset: number,
  count: number,
  out: Float64Array
) {
  for (let k = 0; k <= count; k++) {
    const nx = dst[baseOffset] - k * dst[stepOffset];
    const ny = dst[baseOffset + 1] - k * dst[stepOffset + 1];
    const nz = dst[baseOffset + 2] - k * dst[stepOffset + 2];
    const nw = dst[baseOffset + 3] - k * dst[stepOffset + 3];
    const length = Math.hypot(nx, ny, nz);
    const o = k * 4;
    if (length > 1e-30) {
      out[o] = nx / length;
      out[o + 1] = ny / length;
      out[o + 2] = nz / length;
      out[o + 3] = nw / length;
    } else {
      out[o] = 0;
      out[o + 1] = 0;
      out[o + 2] = 0;
      out[o + 3] = Number.NaN; // marks a degenerate plane
    }
  }
}

/**
 * Evaluates the tile tests of one axis for a sphere and writes a pass flag per tile to `pass` at `passOffset`.
 * Tile `t` passes when `t == 0 || dist(plane t) >= -r` and `t == count - 1 || -dist(plane t + 1) >= -r`
 * (the right plane of a tile is the negated left plane of the next tile).
 * @returns whether any tile passes
 */
function evaluateTileAxis(
  planes: Float64Array,
  count: number,
  cx: number,
  cy: number,
  cz: number,
  r: number,
  pass: Uint8Array,
  passOffset: number
) {
  let any = false;
  // `leftPasses` is the test of the left plane of the current tile
  let leftPasses = true;
  for (let t = 0; t < count; t++) {
    let rightPasses = true;
    if (t < count - 1) {
      const o = (t + 1) * 4;
      const w = planes[o + 3];
      if (!Number.isNaN(w)) {
        // dist of the plane of the next tile; the right plane of this tile has the opposite sign
        const distance = planes[o] * cx + planes[o + 1] * cy + planes[o + 2] * cz + w;
        rightPasses = -distance >= -r;
        pass[passOffset + t] = leftPasses && rightPasses ? 1 : 0;
        any ||= leftPasses && rightPasses;
        leftPasses = distance >= -r;
        continue;
      }
    }
    pass[passOffset + t] = leftPasses && rightPasses ? 1 : 0;
    any ||= leftPasses && rightPasses;
    leftPasses = true;
  }
  return any;
}

/**
 * Evaluates the column, row and slice tests of light `i` into `scratch.axisPass`.
 * @returns whether the light touches any cluster
 */
function evaluateLightAxes(
  dst: Float32Array,
  viewOffset: number,
  layout: LightClusterViewLayout,
  scratch: LightClusterBuildScratch,
  spheres: ArrayLike<number>,
  i: number
) {
  const { gridX, gridY, gridZ } = layout;
  const cx = spheres[i * 4];
  const cy = spheres[i * 4 + 1];
  const cz = spheres[i * 4 + 2];
  const r = spheres[i * 4 + 3];
  const base = i * (gridX + gridY + gridZ);
  const axisPass = scratch.axisPass;
  if (
    isSphereBehindEye(dst, viewOffset, cx, cy, cz, r) ||
    !evaluateTileAxis(scratch.planesX, gridX, cx, cy, cz, r, axisPass, base) ||
    !evaluateTileAxis(scratch.planesY, gridY, cx, cy, cz, r, axisPass, base + gridX)
  ) {
    return false;
  }
  const boundaries = scratch.sliceBoundaries;
  const d = dst[viewOffset + 12] * cx + dst[viewOffset + 13] * cy + dst[viewOffset + 14] * cz + dst[viewOffset + 15];
  const sliceBase = base + gridX + gridY;
  let anySlice = false;
  for (let z = 0; z < gridZ; z++) {
    const pass = (z === 0 || d + r >= boundaries[z]) && (z === gridZ - 1 || d - r <= boundaries[z + 1]);
    axisPass[sliceBase + z] = pass ? 1 : 0;
    anySlice ||= pass;
  }
  if (!anySlice) {
    return false;
  }
  // The range of the passing tiles of each axis, so that the visits skip the tiles outside it
  const ranges = scratch.axisRanges;
  const rangeOffset = i * 6;
  storePassRange(axisPass, base, gridX, ranges, rangeOffset);
  storePassRange(axisPass, base + gridX, gridY, ranges, rangeOffset + 2);
  storePassRange(axisPass, sliceBase, gridZ, ranges, rangeOffset + 4);
  return true;
}

/** Stores the first and the last passing tile of an axis (the axis has at least one passing tile). */
function storePassRange(axisPass: Uint8Array, offset: number, count: number, out: Int32Array, outOffset: number) {
  let first = 0;
  while (axisPass[offset + first] === 0) first++;
  let last = count - 1;
  while (axisPass[offset + last] === 0) last--;
  out[outOffset] = first;
  out[outOffset + 1] = last;
}

/**
 * Visits the clusters a light touches (from its axis flags at `base`). Without `dst`, it increments `cursors` of each
 * cluster while it is below `capacity` (counting). With `dst`, it writes `entry` at the cursor of each cluster while
 * it is below the end (filling) and below `capacity`.
 * @returns whether some cluster was full and skipped the light
 */
function visitLightClusters(
  layout: LightClusterViewLayout,
  scratch: LightClusterBuildScratch,
  i: number,
  cursors: Uint32Array,
  capacity: number,
  ends: Uint32Array | null,
  dst: Float32Array | null,
  indexOffset: number,
  entry: number
) {
  const { gridX, gridY, gridZ } = layout;
  const axisPass = scratch.axisPass;
  const ranges = scratch.axisRanges;
  const r = i * 6;
  const base = i * (gridX + gridY + gridZ);
  const rowBase = base + gridX;
  const sliceBase = rowBase + gridY;
  const x0 = ranges[r];
  const x1 = ranges[r + 1];
  let isFull = false;
  for (let z = ranges[r + 4]; z <= ranges[r + 5]; z++) {
    if (axisPass[sliceBase + z] === 0) continue;
    for (let y = ranges[r + 2]; y <= ranges[r + 3]; y++) {
      if (axisPass[rowBase + y] === 0) continue;
      const rowStart = (z * gridY + y) * gridX;
      for (let x = x0; x <= x1; x++) {
        if (axisPass[base + x] === 0) continue;
        const c = rowStart + x;
        if (ends == null) {
          const cursor = cursors[c];
          if (cursor < capacity) {
            cursors[c] = cursor + 1;
          } else {
            isFull = true;
          }
        } else if (cursors[c] < ends[c]) {
          dst![indexOffset + cursors[c]] = entry;
          cursors[c]++;
        }
      }
    }
  }
  return isFull;
}

/**
 * Builds the cluster table and the light index list of a view whose header has been written.
 *
 * The lights of each cluster are stored in the order of `localEntries`. The caller passes the lights sorted by their
 * view depth (nearest first) when the number of local lights exceeds the capacity, so that a cluster which is full
 * keeps its nearest lights. Every cluster keeps at most `layout.clusterLightCapacity` lights, so the list cannot
 * overflow.
 */
export function buildLightClustersOnCpu(
  dst: Float32Array,
  viewOffset: number,
  layout: LightClusterViewLayout,
  spheres: ArrayLike<number>,
  localEntries: ArrayLike<number>,
  localCount: number,
  scratch: LightClusterBuildScratch
): LightClusterBuildResult {
  const { gridX, gridY, gridZ, clusterCount } = layout;
  const capacity = layout.clusterLightCapacity;
  const counts = scratch.counts;
  const offsets = scratch.offsets;
  counts.fill(0);
  computeSliceBoundaries(dst, viewOffset, layout, scratch.sliceBoundaries);
  computeTilePlanes(dst, viewOffset, viewOffset + 8, gridX, scratch.planesX);
  computeTilePlanes(dst, viewOffset + 4, viewOffset + 8, gridY, scratch.planesY);

  const axisStride = gridX + gridY + gridZ;
  if (scratch.axisPass.length < localCount * axisStride) {
    scratch.axisPass = new Uint8Array(Math.max(localCount * axisStride, scratch.axisPass.length * 2));
  }
  if (scratch.isLightInView.length < localCount) {
    const length = Math.max(localCount, scratch.isLightInView.length * 2);
    scratch.isLightInView = new Uint8Array(length);
    scratch.axisRanges = new Int32Array(length * 6);
  }
  const isLightInView = scratch.isLightInView;

  // Pass 1: evaluate the axes of each light once, and count the nearest lights of each cluster up to the capacity
  let isTruncated = false;
  for (let i = 0; i < localCount; i++) {
    const inView = evaluateLightAxes(dst, viewOffset, layout, scratch, spheres, i);
    isLightInView[i] = inView ? 1 : 0;
    if (inView) {
      isTruncated = visitLightClusters(layout, scratch, i, counts, capacity, null, null, 0, 0) || isTruncated;
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
  dst[stateOffset] = 0;
  scratch.usedIndexVec4Count = totalVec4;

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

  // Pass 3: fill the light index list. `offsets` (converted to entries) is used as the write cursor of each cluster,
  // and `counts` becomes the end of the list of each cluster.
  for (let c = 0; c < clusterCount; c++) {
    offsets[c] *= 4;
    counts[c] += offsets[c];
  }
  for (let i = 0; i < localCount; i++) {
    if (isLightInView[i] !== 0) {
      visitLightClusters(layout, scratch, i, offsets, capacity, counts, dst, indexOffset, localEntries[i]);
    }
  }
  return isTruncated ? 'truncated' : 'built';
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
