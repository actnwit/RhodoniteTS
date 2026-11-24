// src/foundation/renderer/lightCluster/LightClusterBuilder.ts
import { LightClusterLayout } from "./LightClusterLayout.js";
function createLightClusterBuildScratch(layout) {
  return {
    usedIndexVec4Count: 0,
    counts: new Uint32Array(layout.clusterCount),
    offsets: new Uint32Array(layout.clusterCount),
    sliceBoundaries: new Float64Array(layout.gridZ + 1),
    planesX: new Float64Array((layout.gridX + 1) * 4),
    planesY: new Float64Array((layout.gridY + 1) * 4),
    axisPass: new Uint8Array(0),
    isLightInView: new Uint8Array(0),
    axisRanges: new Int32Array(0)
  };
}
var MinSliceDepthRatio = 2;
var MaxSliceDepthRatio = 1024;
var MinSliceFarDepth = 1e-4;
function writeLightClusterViewHeader(dst, viewOffset, viewMatrix, projectionMatrix, spheres, localCount, layout, visibleNearDepth = 0, visibleFarDepth = Number.POSITIVE_INFINITY) {
  const clip = new Float64Array(16);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += projectionMatrix[k * 4 + row] * viewMatrix[col * 4 + k];
      }
      clip[row * 4 + col] = sum;
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
  const cameraFar = Number.isFinite(visibleFarDepth) && visibleFarDepth > 0 ? visibleFarDepth : Number.POSITIVE_INFINITY;
  const zFar = Math.max(Math.min(lightFar, cameraFar), MinSliceFarDepth);
  const cameraNear = Math.min(Math.max(visibleNearDepth, 0), zFar / MinSliceDepthRatio);
  const zNear = Math.min(Math.max(lightNear, cameraNear, zFar / MaxSliceDepthRatio), zFar / MinSliceDepthRatio);
  const sliceScale = layout.gridZ / Math.log(zFar / zNear);
  const sliceBias = -Math.log(zNear) * sliceScale;
  dst[viewOffset + 16] = layout.gridX;
  dst[viewOffset + 17] = layout.gridY;
  dst[viewOffset + 18] = layout.gridZ;
  dst[viewOffset + 19] = 0;
  dst[viewOffset + 20] = sliceScale;
  dst[viewOffset + 21] = sliceBias;
  dst[viewOffset + 22] = zNear;
  dst[viewOffset + 23] = zFar;
}
function computeSliceBoundaries(dst, viewOffset, layout, out) {
  const sliceScale = dst[viewOffset + 20];
  const sliceBias = dst[viewOffset + 21];
  for (let k = 0; k <= layout.gridZ; k++) {
    out[k] = Math.exp((k - sliceBias) / sliceScale);
  }
}
function planeDistance(dst, baseOffset, stepOffset, k, flip, cx, cy, cz) {
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
function isSphereBehindEye(dst, viewOffset, cx, cy, cz, r) {
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
function computeTilePlanes(dst, baseOffset, stepOffset, count, out) {
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
      out[o + 3] = Number.NaN;
    }
  }
}
function evaluateTileAxis(planes, count, cx, cy, cz, r, pass, passOffset) {
  let any = false;
  let leftPasses = true;
  for (let t = 0; t < count; t++) {
    let rightPasses = true;
    if (t < count - 1) {
      const o = (t + 1) * 4;
      const w = planes[o + 3];
      if (!Number.isNaN(w)) {
        const distance = planes[o] * cx + planes[o + 1] * cy + planes[o + 2] * cz + w;
        rightPasses = -distance >= -r;
        pass[passOffset + t] = leftPasses && rightPasses ? 1 : 0;
        any || (any = leftPasses && rightPasses);
        leftPasses = distance >= -r;
        continue;
      }
    }
    pass[passOffset + t] = leftPasses && rightPasses ? 1 : 0;
    any || (any = leftPasses && rightPasses);
    leftPasses = true;
  }
  return any;
}
function evaluateLightAxes(dst, viewOffset, layout, scratch, spheres, i) {
  const { gridX, gridY, gridZ } = layout;
  const cx = spheres[i * 4];
  const cy = spheres[i * 4 + 1];
  const cz = spheres[i * 4 + 2];
  const r = spheres[i * 4 + 3];
  const base = i * (gridX + gridY + gridZ);
  const axisPass = scratch.axisPass;
  if (isSphereBehindEye(dst, viewOffset, cx, cy, cz, r) || !evaluateTileAxis(scratch.planesX, gridX, cx, cy, cz, r, axisPass, base) || !evaluateTileAxis(scratch.planesY, gridY, cx, cy, cz, r, axisPass, base + gridX)) {
    return false;
  }
  const boundaries = scratch.sliceBoundaries;
  const d = dst[viewOffset + 12] * cx + dst[viewOffset + 13] * cy + dst[viewOffset + 14] * cz + dst[viewOffset + 15];
  const sliceBase = base + gridX + gridY;
  let anySlice = false;
  for (let z = 0; z < gridZ; z++) {
    const pass = (z === 0 || d + r >= boundaries[z]) && (z === gridZ - 1 || d - r <= boundaries[z + 1]);
    axisPass[sliceBase + z] = pass ? 1 : 0;
    anySlice || (anySlice = pass);
  }
  if (!anySlice) {
    return false;
  }
  const ranges = scratch.axisRanges;
  const rangeOffset = i * 6;
  storePassRange(axisPass, base, gridX, ranges, rangeOffset);
  storePassRange(axisPass, base + gridX, gridY, ranges, rangeOffset + 2);
  storePassRange(axisPass, sliceBase, gridZ, ranges, rangeOffset + 4);
  return true;
}
function storePassRange(axisPass, offset, count, out, outOffset) {
  let first = 0;
  while (axisPass[offset + first] === 0) first++;
  let last = count - 1;
  while (axisPass[offset + last] === 0) last--;
  out[outOffset] = first;
  out[outOffset + 1] = last;
}
function visitLightClusters(layout, scratch, i, cursors, capacity, ends, dst, indexOffset, entry) {
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
          dst[indexOffset + cursors[c]] = entry;
          cursors[c]++;
        }
      }
    }
  }
  return isFull;
}
function buildLightClustersOnCpu(dst, viewOffset, layout, spheres, localEntries, localCount, scratch) {
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
  let isTruncated = false;
  for (let i = 0; i < localCount; i++) {
    const inView = evaluateLightAxes(dst, viewOffset, layout, scratch, spheres, i);
    isLightInView[i] = inView ? 1 : 0;
    if (inView) {
      isTruncated = visitLightClusters(layout, scratch, i, counts, capacity, null, null, 0, 0) || isTruncated;
    }
  }
  let totalVec4 = 0;
  for (let c = 0; c < clusterCount; c++) {
    offsets[c] = totalVec4;
    totalVec4 += counts[c] + 3 >> 2;
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
    if ((counts[c] & 3) !== 0) {
      const lastVec4 = indexOffset + (offsets[c] + (counts[c] >> 2)) * 4;
      dst.fill(0, lastVec4, lastVec4 + 4);
    }
  }
  for (let c = 0; c < clusterCount; c++) {
    offsets[c] *= 4;
    counts[c] += offsets[c];
  }
  for (let i = 0; i < localCount; i++) {
    if (isLightInView[i] !== 0) {
      visitLightClusters(layout, scratch, i, offsets, capacity, counts, dst, indexOffset, localEntries[i]);
    }
  }
  return isTruncated ? "truncated" : "built";
}
function sphereIntersectsLightCluster(dst, viewOffset, layout, x, y, z, cx, cy, cz, r) {
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
function computeLightClusterIndex(dst, viewOffset, px, py, pz) {
  const gridX = dst[viewOffset + 16];
  const gridY = dst[viewOffset + 17];
  const gridZ = dst[viewOffset + 18];
  if (dst[viewOffset + 19] !== 0) {
    return -1;
  }
  const dot = (o) => dst[o] * px + dst[o + 1] * py + dst[o + 2] * pz + dst[o + 3];
  const w = dot(viewOffset + 8);
  if (!(w > 0)) {
    return -1;
  }
  const clamp = (v, max) => Math.min(Math.max(Math.floor(v), 0), max - 1);
  const x = clamp(dot(viewOffset) / w, gridX);
  const y = clamp(dot(viewOffset + 4) / w, gridY);
  const depth = Math.max(dot(viewOffset + 12), 1e-30);
  const z = clamp(Math.log(depth) * dst[viewOffset + 20] + dst[viewOffset + 21], gridZ);
  return (z * gridY + y) * gridX + x;
}
function readLightClusterEntries(dst, viewOffset, layout, clusterIndex) {
  const tableOffset = viewOffset + LightClusterLayout.viewHeaderVec4Count * 4;
  const indexOffset = tableOffset + layout.tableVec4Count * 4;
  const offsetVec4 = dst[tableOffset + clusterIndex * 4];
  const count = dst[tableOffset + clusterIndex * 4 + 1];
  const entries = [];
  for (let i = 0; i < count; i++) {
    entries.push(dst[indexOffset + offsetVec4 * 4 + i]);
  }
  return entries;
}
function computeLightBoundingSphere(typeValue, position, direction, range, outerConeCos, out, outOffset) {
  if (!(typeValue > 0.75) || !(range > 0)) {
    return -1;
  }
  let cx = position[0];
  let cy = position[1];
  let cz = position[2];
  let r = range;
  if (typeValue > 1.75) {
    const dx = direction[0];
    const dy = direction[1];
    const dz = direction[2];
    const length = Math.hypot(dx, dy, dz);
    if (Math.abs(length - 1) < 1e-3 && outerConeCos > 0.5) {
      const t = range / (2 * outerConeCos);
      cx += dx / length * t;
      cy += dy / length * t;
      cz += dz / length * t;
      r = t;
    }
  }
  out[outOffset] = cx;
  out[outOffset + 1] = cy;
  out[outOffset + 2] = cz;
  out[outOffset + 3] = r * 1.001;
  return out[outOffset + 3];
}
export {
  buildLightClustersOnCpu,
  computeLightBoundingSphere,
  computeLightClusterIndex,
  createLightClusterBuildScratch,
  readLightClusterEntries,
  sphereIntersectsLightCluster,
  writeLightClusterViewHeader
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vcmVuZGVyZXIvbGlnaHRDbHVzdGVyL0xpZ2h0Q2x1c3RlckJ1aWxkZXIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IExpZ2h0Q2x1c3RlckxheW91dCwgdHlwZSBMaWdodENsdXN0ZXJWaWV3TGF5b3V0IH0gZnJvbSAnLi9MaWdodENsdXN0ZXJMYXlvdXQnO1xuXG4vKipcbiAqIFB1cmUgZnVuY3Rpb25zIHRoYXQgYnVpbGQgdGhlIENsdXN0ZXJlZCBGb3J3YXJkIGxpZ2h0IGNsdXN0ZXJzIG9mIGEgdmlldyBvbiB0aGUgQ1BVLlxuICogVGhlIG1lbW9yeSBsYXlvdXQgaXMgZGVzY3JpYmVkIGluIExpZ2h0Q2x1c3RlckxheW91dC50cy5cbiAqXG4gKiBBIGxpZ2h0IGlzIGFzc2lnbmVkIHRvIGEgY2x1c3RlciBgKHgsIHksIHopYCB3aGVuIGl0cyBib3VuZGluZyBzcGhlcmUgYChjLCByKWAgcGFzc2VzIGFsbCBvZiB0aGVzZSB0ZXN0c1xuICogKHRoZSBXZWJHUFUgY29tcHV0ZSBzaGFkZXIgaW4gV2ViR3B1TGlnaHRDbHVzdGVyQnVpbGRlci50cyBpbXBsZW1lbnRzIHRoZSBzYW1lIHRlc3RzKTpcbiAqIC0gVGhlIHNwaGVyZSBpcyBub3QgZW50aXJlbHkgYmVoaW5kIHRoZSBleWUgcGxhbmU6IGBkb3Qocm93VywgYykgLyB8cm93Vy54eXp8ID4gLXJgIChza2lwcGVkIHdoZW4gcm93Vy54eXogaXMgMCkuXG4gKiAtIENvbHVtbjogYHggPT0gMCB8fCBkaXN0KHJvd1ggLSB4ICogcm93VywgYykgPj0gLXJgIGFuZCBgeCA9PSBncmlkWCAtIDEgfHwgZGlzdCgoeCArIDEpICogcm93VyAtIHJvd1gsIGMpID49IC1yYC5cbiAqIC0gUm93OiB0aGUgc2FtZSB3aXRoIHJvd1kgYW5kIHkuXG4gKiAtIFNsaWNlOiBgeiA9PSAwIHx8IGQgKyByID49IHpzKHopYCBhbmQgYHogPT0gZ3JpZFogLSAxIHx8IGQgLSByIDw9IHpzKHogKyAxKWAsXG4gKiAgIHdoZXJlIGBkID0gZG90KHJvd0RlcHRoLCBjKWAgYW5kIGB6cyhrKSA9IGV4cCgoayAtIHNsaWNlQmlhcykgLyBzbGljZVNjYWxlKWAuXG4gKlxuICogYGRpc3QocGxhbmUsIGMpYCBpcyB0aGUgc2lnbmVkIGRpc3RhbmNlIGAoZG90KHBsYW5lLnh5eiwgYykgKyBwbGFuZS53KSAvIHxwbGFuZS54eXp8YC5cbiAqIFRoZSBjbHVzdGVycyBhdCB0aGUgYm9yZGVycyBvZiB0aGUgZ3JpZCBleHRlbmQgdG8gaW5maW5pdHksIHNvIGEgZnJhZ21lbnQgd2hvc2UgY2x1c3RlciBjb29yZGluYXRlcyBhcmUgY2xhbXBlZFxuICogaXMgc3RpbGwgaW5zaWRlIGl0cyBjbHVzdGVyLlxuICovXG5cbi8qKlxuICogVGhlIHJlc3VsdCBvZiBhIGxpZ2h0IGNsdXN0ZXIgYnVpbGQuXG4gKiAtIGAnYnVpbHQnYDogZXZlcnkgbGlnaHQgd2FzIHN0b3JlZC5cbiAqIC0gYCd0cnVuY2F0ZWQnYDogc29tZSBjbHVzdGVycyBoYWQgbW9yZSBsaWdodHMgdGhhbiBgY2x1c3RlckxpZ2h0Q2FwYWNpdHlgIGFuZCBrZXB0IG9ubHkgdGhlaXIgbmVhcmVzdCBsaWdodHMuXG4gKi9cbmV4cG9ydCB0eXBlIExpZ2h0Q2x1c3RlckJ1aWxkUmVzdWx0ID0gJ2J1aWx0JyB8ICd0cnVuY2F0ZWQnO1xuXG4vKiogU2NyYXRjaCBtZW1vcnkgcmV1c2VkIGJldHdlZW4gYnVpbGRzLiAqL1xuZXhwb3J0IHR5cGUgTGlnaHRDbHVzdGVyQnVpbGRTY3JhdGNoID0ge1xuICAvKiogVGhlIG51bWJlciBvZiB2ZWM0IG9mIHRoZSBsaWdodCBpbmRleCBsaXN0IHVzZWQgYnkgdGhlIGxhc3QgYnVpbGQuICovXG4gIHVzZWRJbmRleFZlYzRDb3VudDogbnVtYmVyO1xuICBjb3VudHM6IFVpbnQzMkFycmF5O1xuICBvZmZzZXRzOiBVaW50MzJBcnJheTtcbiAgc2xpY2VCb3VuZGFyaWVzOiBGbG9hdDY0QXJyYXk7XG4gIC8qKiBUaGUgbm9ybWFsaXplZCB0aWxlIHBsYW5lcyBgcm93WCAtIGsgKiByb3dXYCAoayA9IDAuLmdyaWRYKSwgKG54LCBueSwgbnosIHcpIGVhY2guIERlZ2VuZXJhdGUgcGxhbmVzIGFyZSAwLiAqL1xuICBwbGFuZXNYOiBGbG9hdDY0QXJyYXk7XG4gIC8qKiBUaGUgbm9ybWFsaXplZCB0aWxlIHBsYW5lcyBgcm93WSAtIGsgKiByb3dXYCAoayA9IDAuLmdyaWRZKS4gKi9cbiAgcGxhbmVzWTogRmxvYXQ2NEFycmF5O1xuICAvKipcbiAgICogVGhlIGNvbHVtbnMsIHJvd3MgYW5kIHNsaWNlcyBlYWNoIGxpZ2h0IHBhc3NlcyAoZ3JpZFggKyBncmlkWSArIGdyaWRaIGZsYWdzIHBlciBsaWdodCksIGV2YWx1YXRlZCBvbmNlIGFuZFxuICAgKiByZXVzZWQgYnkgdGhlIGNvdW50IGFuZCBmaWxsIHBhc3Nlcy4gR3Jvd24gb24gZGVtYW5kLlxuICAgKi9cbiAgYXhpc1Bhc3M6IFVpbnQ4QXJyYXk7XG4gIC8qKiBXaGV0aGVyIGVhY2ggbGlnaHQgdG91Y2hlcyBhbnkgY2x1c3Rlci4gR3Jvd24gb24gZGVtYW5kLiAqL1xuICBpc0xpZ2h0SW5WaWV3OiBVaW50OEFycmF5O1xuICAvKiogVGhlIGZpcnN0IGFuZCBsYXN0IHBhc3NpbmcgY29sdW1uLCByb3cgYW5kIHNsaWNlIG9mIGVhY2ggbGlnaHQgKDYgcGVyIGxpZ2h0KS4gR3Jvd24gb24gZGVtYW5kLiAqL1xuICBheGlzUmFuZ2VzOiBJbnQzMkFycmF5O1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBzY3JhdGNoIG1lbW9yeSBmb3IgYSBsYXlvdXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMaWdodENsdXN0ZXJCdWlsZFNjcmF0Y2gobGF5b3V0OiBMaWdodENsdXN0ZXJWaWV3TGF5b3V0KTogTGlnaHRDbHVzdGVyQnVpbGRTY3JhdGNoIHtcbiAgcmV0dXJuIHtcbiAgICB1c2VkSW5kZXhWZWM0Q291bnQ6IDAsXG4gICAgY291bnRzOiBuZXcgVWludDMyQXJyYXkobGF5b3V0LmNsdXN0ZXJDb3VudCksXG4gICAgb2Zmc2V0czogbmV3IFVpbnQzMkFycmF5KGxheW91dC5jbHVzdGVyQ291bnQpLFxuICAgIHNsaWNlQm91bmRhcmllczogbmV3IEZsb2F0NjRBcnJheShsYXlvdXQuZ3JpZFogKyAxKSxcbiAgICBwbGFuZXNYOiBuZXcgRmxvYXQ2NEFycmF5KChsYXlvdXQuZ3JpZFggKyAxKSAqIDQpLFxuICAgIHBsYW5lc1k6IG5ldyBGbG9hdDY0QXJyYXkoKGxheW91dC5ncmlkWSArIDEpICogNCksXG4gICAgYXhpc1Bhc3M6IG5ldyBVaW50OEFycmF5KDApLFxuICAgIGlzTGlnaHRJblZpZXc6IG5ldyBVaW50OEFycmF5KDApLFxuICAgIGF4aXNSYW5nZXM6IG5ldyBJbnQzMkFycmF5KDApLFxuICB9O1xufVxuXG4vKiogVGhlIHJhdGlvIGJldHdlZW4gdGhlIGZhciBhbmQgbmVhciBkZXB0aCBvZiB0aGUgc2xpY2VzIGlzIGF0IGxlYXN0IHRoaXMgdmFsdWUuICovXG5jb25zdCBNaW5TbGljZURlcHRoUmF0aW8gPSAyO1xuLyoqIFRoZSByYXRpbyBiZXR3ZWVuIHRoZSBmYXIgYW5kIG5lYXIgZGVwdGggb2YgdGhlIHNsaWNlcyBpcyBhdCBtb3N0IHRoaXMgdmFsdWUuICovXG5jb25zdCBNYXhTbGljZURlcHRoUmF0aW8gPSAxMDI0O1xuLyoqIFRoZSBzbWFsbGVzdCBmYXIgZGVwdGggb2YgdGhlIHNsaWNlcy4gKi9cbmNvbnN0IE1pblNsaWNlRmFyRGVwdGggPSAxZS00O1xuXG4vKipcbiAqIFdyaXRlcyB0aGUgaGVhZGVyIG9mIGEgdmlldyByZWdpb246IHRoZSBjbGlwIHJvd3MsIHRoZSBkZXB0aCByb3csIHRoZSBncmlkIHNpemUgYW5kIHRoZSBkZXB0aCBzbGljZXMuXG4gKlxuICogVGhlIGRlcHRoIHJhbmdlIG9mIHRoZSBzbGljZXMgaXMgdGhlIGludGVyc2VjdGlvbiBvZiB0aGUgZGVwdGggcmFuZ2Ugb2YgdGhlIGxpZ2h0IHNwaGVyZXMgYW5kIHRoZSB2aXNpYmxlIGRlcHRoXG4gKiByYW5nZSBvZiB0aGUgY2FtZXJhOiB0aGUgc2xpY2VzIGFyZSBub3Qgd2FzdGVkIG9uIGRlcHRocyB3aGVyZSBubyBsaWdodCByZWFjaGVzLCBub3IgaW4gZnJvbnQgb2YgdGhlIGNhbWVyYSBuZWFyXG4gKiBwbGFuZSBvciBiZXlvbmQgdGhlIGZhciBwbGFuZS5cbiAqXG4gKiBAcGFyYW0gZHN0IC0gVGhlIG1lbW9yeSBvZiB0aGUgdmlldyByZWdpb25cbiAqIEBwYXJhbSB2aWV3T2Zmc2V0IC0gVGhlIGZsb2F0IG9mZnNldCBvZiB0aGUgdmlldyByZWdpb24gaW4gYGRzdGBcbiAqIEBwYXJhbSB2aWV3TWF0cml4IC0gVGhlIHZpZXcgbWF0cml4IChjb2x1bW4tbWFqb3IsIGFzIHVwbG9hZGVkIHRvIHRoZSBHUFUpXG4gKiBAcGFyYW0gcHJvamVjdGlvbk1hdHJpeCAtIFRoZSBwcm9qZWN0aW9uIG1hdHJpeCAoY29sdW1uLW1ham9yLCBhcyB1cGxvYWRlZCB0byB0aGUgR1BVKVxuICogQHBhcmFtIHNwaGVyZXMgLSBUaGUgbGlnaHQgc3BoZXJlcyBpbiB3b3JsZCBzcGFjZSAoY3gsIGN5LCBjeiwgcikgKiBsb2NhbENvdW50XG4gKiBAcGFyYW0gbG9jYWxDb3VudCAtIFRoZSBudW1iZXIgb2YgbGlnaHQgc3BoZXJlc1xuICogQHBhcmFtIGxheW91dCAtIFRoZSBsYXlvdXQgb2YgdGhlIHZpZXcgcmVnaW9uXG4gKiBAcGFyYW0gdmlzaWJsZU5lYXJEZXB0aCAtIFRoZSB2aWV3IGRlcHRoIG9mIHRoZSBjYW1lcmEgbmVhciBwbGFuZSAoMCBkaXNhYmxlcyB0aGUgY2xhbXApXG4gKiBAcGFyYW0gdmlzaWJsZUZhckRlcHRoIC0gVGhlIHZpZXcgZGVwdGggb2YgdGhlIGNhbWVyYSBmYXIgcGxhbmUgKEluZmluaXR5IGRpc2FibGVzIHRoZSBjbGFtcClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlTGlnaHRDbHVzdGVyVmlld0hlYWRlcihcbiAgZHN0OiBGbG9hdDMyQXJyYXksXG4gIHZpZXdPZmZzZXQ6IG51bWJlcixcbiAgdmlld01hdHJpeDogQXJyYXlMaWtlPG51bWJlcj4sXG4gIHByb2plY3Rpb25NYXRyaXg6IEFycmF5TGlrZTxudW1iZXI+LFxuICBzcGhlcmVzOiBBcnJheUxpa2U8bnVtYmVyPixcbiAgbG9jYWxDb3VudDogbnVtYmVyLFxuICBsYXlvdXQ6IExpZ2h0Q2x1c3RlclZpZXdMYXlvdXQsXG4gIHZpc2libGVOZWFyRGVwdGggPSAwLFxuICB2aXNpYmxlRmFyRGVwdGggPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFlcbikge1xuICAvLyBjbGlwID0gUCAqIFYuIENvbHVtbi1tYWpvcjogbVtyb3ddW2NvbF0gPSB2W2NvbCAqIDQgKyByb3ddLlxuICBjb25zdCBjbGlwID0gbmV3IEZsb2F0NjRBcnJheSgxNik7XG4gIGZvciAobGV0IHJvdyA9IDA7IHJvdyA8IDQ7IHJvdysrKSB7XG4gICAgZm9yIChsZXQgY29sID0gMDsgY29sIDwgNDsgY29sKyspIHtcbiAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgZm9yIChsZXQgayA9IDA7IGsgPCA0OyBrKyspIHtcbiAgICAgICAgc3VtICs9IHByb2plY3Rpb25NYXRyaXhbayAqIDQgKyByb3ddICogdmlld01hdHJpeFtjb2wgKiA0ICsga107XG4gICAgICB9XG4gICAgICBjbGlwW3JvdyAqIDQgKyBjb2xdID0gc3VtOyAvLyByb3ctbWFqb3JcbiAgICB9XG4gIH1cblxuICAvLyBUaGUgY2x1c3RlciBsb29rdXAgb2YgdGhlIGZyYWdtZW50IHNoYWRlcnMgbmVlZHMgYSBzY3JlZW4gdGlsZSBjb29yZGluYXRlIGZyb20gYSB3b3JsZCBwb3NpdGlvbiB3aXRob3V0XG4gIC8vIGRpdmlkaW5nIGJ5IHcgKHRoZSBzaGFkZXJzIGF2b2lkIG9uZSBkaXZpZGUgYW5kIG9uZSBicmFuY2gpOlxuICAvLyBOREMgPSAoY2xpcFJvdzBcdTAwQjdwIC8gdywgY2xpcFJvdzFcdTAwQjdwIC8gdykgd2l0aCB3ID0gY2xpcFJvdzNcdTAwQjdwLCBzb1xuICAvLyB0aWxlWCA9IGZsb29yKCgwLjUgKyAwLjUgKiBOREN4KSAqIGdyaWRYKVxuICAvLyAgICAgICA9IGZsb29yKDAuNSAqIGdyaWRYICogKGNsaXBSb3cwXHUwMEI3cCArIHcpIC8gdykuXG4gIC8vIFRoZSBmaXJzdCB0d28gc3RvcmVkIHJvd3MgYXJlIHRoZSBudW1lcmF0b3JzLCBhbmQgdGhlIHRoaXJkIHJvdyAocm93VykgaXMgdGhlIHNoYXJlZCBkZW5vbWluYXRvciB3LlxuICAvLyByb3dXIGlzIGFsc28gdGhlIHBsYW5lIG9mIHRoZSBleWUgKHcgPSAwKSwgdXNlZCBieSB0aGUgY3VsbGluZyB0ZXN0cy5cbiAgLy8gVGhlIHRpbGUgcGxhbmVzOiBgcm93WCAtIHggKiByb3dXYCBpcyB0aGUgbGVmdCBwbGFuZSBvZiB0aGUgdGlsZSBjb2x1bW4geCxcbiAgLy8gYCh4ICsgMSkgKiByb3dXIC0gcm93WGAgaXMgdGhlIHJpZ2h0IHBsYW5lIG9mIGl0LiBUaGUgYnVpbGRlcnMgZGVyaXZlIHRob3NlIGZyb20gdGhlc2Ugcm93cy5cbiAgY29uc3QgaGFsZlggPSAwLjUgKiBsYXlvdXQuZ3JpZFg7XG4gIGNvbnN0IGhhbGZZID0gMC41ICogbGF5b3V0LmdyaWRZO1xuICBmb3IgKGxldCBjb2wgPSAwOyBjb2wgPCA0OyBjb2wrKykge1xuICAgIGNvbnN0IHcgPSBjbGlwWzEyICsgY29sXTtcbiAgICBkc3Rbdmlld09mZnNldCArIGNvbF0gPSBoYWxmWCAqIChjbGlwW2NvbF0gKyB3KTtcbiAgICBkc3Rbdmlld09mZnNldCArIDQgKyBjb2xdID0gaGFsZlkgKiAoY2xpcFs0ICsgY29sXSArIHcpO1xuICAgIGRzdFt2aWV3T2Zmc2V0ICsgOCArIGNvbF0gPSB3O1xuICB9XG5cbiAgLy8gZGVwdGggPSAtel92aWV3LCBub3JtYWxpemVkIHNvIHRoYXQgaXQgaXMgYSBkaXN0YW5jZSBpbiB3b3JsZCB1bml0cyBldmVuIGlmIHRoZSB2aWV3IG1hdHJpeCBoYXMgYSBzY2FsZS5cbiAgLy8gKENvbHVtbiAyIG9mIHRoZSB2aWV3IG1hdHJpeCBpcyB0aGUgY2FtZXJhIGJhY2t3YXJkIGF4aXMgaW4gd29ybGQgc3BhY2U7IG5lZ2F0ZWQgaXQgcG9pbnRzIGludG8gdGhlIHNjcmVlbi4pXG4gIGNvbnN0IGR4ID0gLXZpZXdNYXRyaXhbMl07XG4gIGNvbnN0IGR5ID0gLXZpZXdNYXRyaXhbNl07XG4gIGNvbnN0IGR6ID0gLXZpZXdNYXRyaXhbMTBdO1xuICBjb25zdCBkdyA9IC12aWV3TWF0cml4WzE0XTtcbiAgY29uc3QgZGVwdGhMZW5ndGggPSBNYXRoLmh5cG90KGR4LCBkeSwgZHopO1xuICBjb25zdCBpbnZEZXB0aExlbmd0aCA9IGRlcHRoTGVuZ3RoID4gMCA/IDEgLyBkZXB0aExlbmd0aCA6IDE7XG4gIGRzdFt2aWV3T2Zmc2V0ICsgMTJdID0gZHggKiBpbnZEZXB0aExlbmd0aDtcbiAgZHN0W3ZpZXdPZmZzZXQgKyAxM10gPSBkeSAqIGludkRlcHRoTGVuZ3RoO1xuICBkc3Rbdmlld09mZnNldCArIDE0XSA9IGR6ICogaW52RGVwdGhMZW5ndGg7XG4gIGRzdFt2aWV3T2Zmc2V0ICsgMTVdID0gZHcgKiBpbnZEZXB0aExlbmd0aDtcblxuICAvLyBUaGUgZGVwdGggcmFuZ2UgdGhlIHNsaWNlcyBjb3ZlcjogdGhlIHVuaW9uIG9mIHRoZSBsaWdodCBzcGhlcmVzLCBjbGFtcGVkIHRvIHRoZSBjYW1lcmEgcmFuZ2UgYmVsb3cuXG4gIGxldCBtaW5EZXB0aCA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgbGV0IG1heERlcHRoID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IGN4ID0gc3BoZXJlc1tpICogNF07XG4gICAgY29uc3QgY3kgPSBzcGhlcmVzW2kgKiA0ICsgMV07XG4gICAgY29uc3QgY3ogPSBzcGhlcmVzW2kgKiA0ICsgMl07XG4gICAgY29uc3QgciA9IHNwaGVyZXNbaSAqIDQgKyAzXTtcbiAgICBjb25zdCBkID0gKGR4ICogY3ggKyBkeSAqIGN5ICsgZHogKiBjeiArIGR3KSAqIGludkRlcHRoTGVuZ3RoO1xuICAgIG1pbkRlcHRoID0gTWF0aC5taW4obWluRGVwdGgsIGQgLSByKTtcbiAgICBtYXhEZXB0aCA9IE1hdGgubWF4KG1heERlcHRoLCBkICsgcik7XG4gIH1cbiAgY29uc3QgbGlnaHROZWFyID0gTnVtYmVyLmlzRmluaXRlKG1pbkRlcHRoKSA/IG1pbkRlcHRoIDogMDtcbiAgY29uc3QgbGlnaHRGYXIgPSBOdW1iZXIuaXNGaW5pdGUobWF4RGVwdGgpID8gbWF4RGVwdGggOiBNaW5TbGljZUZhckRlcHRoO1xuICBjb25zdCBjYW1lcmFGYXIgPVxuICAgIE51bWJlci5pc0Zpbml0ZSh2aXNpYmxlRmFyRGVwdGgpICYmIHZpc2libGVGYXJEZXB0aCA+IDAgPyB2aXNpYmxlRmFyRGVwdGggOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gIGNvbnN0IHpGYXIgPSBNYXRoLm1heChNYXRoLm1pbihsaWdodEZhciwgY2FtZXJhRmFyKSwgTWluU2xpY2VGYXJEZXB0aCk7XG4gIC8vIFRoZSByYXRpbyBsaW1pdHMga2VlcCBhIHZhbGlkIG1hcHBpbmcgd2hlbiB0aGUgY2FtZXJhIHJhbmdlIGRvZXMgbm90IG92ZXJsYXAgdGhlIGxpZ2h0czogdGhlIGNsdXN0ZXIgbGlzdHMgdGhlblxuICAvLyBvbmx5IGNvbnRhaW4gdGhlIGxpZ2h0cyB3aG9zZSBzcGhlcmVzIHJlYWNoIGludG8gdGhlIHZpc2libGUgcmFuZ2UgKHRoZSBib3JkZXIgc2xpY2VzIGV4dGVuZCB0byBpbmZpbml0eSkuXG4gIC8vIHpOZWFyIGlzIGNsYW1wZWQgc28gdGhhdCB6RmFyIC8gek5lYXIgc3RheXMgd2l0aGluIFtNaW5TbGljZURlcHRoUmF0aW8sIE1heFNsaWNlRGVwdGhSYXRpb106XG4gIC8vIHdpdGhvdXQgdGhlIHJhdGlvIGxpbWl0cyBsb2coekZhciAvIHpOZWFyKSBjb3VsZCBiZSAwIChhbGwgc2xpY2VzIGNvbGxhcHNlZCkgb3IgaHVnZSAodGhlIHNsaWNlcyBjcm93ZGVkXG4gIC8vIG5lYXIgdGhlIGV5ZSkuIFRoZSBjbGFtcHMgb25seSB3aWRlbiB0aGUgY292ZXJlZCByYW5nZSwgbmV2ZXIgbmFycm93IGl0LCBzbyBubyBsaWdodCBpcyBsb3N0LlxuICBjb25zdCBjYW1lcmFOZWFyID0gTWF0aC5taW4oTWF0aC5tYXgodmlzaWJsZU5lYXJEZXB0aCwgMCksIHpGYXIgLyBNaW5TbGljZURlcHRoUmF0aW8pO1xuICBjb25zdCB6TmVhciA9IE1hdGgubWluKE1hdGgubWF4KGxpZ2h0TmVhciwgY2FtZXJhTmVhciwgekZhciAvIE1heFNsaWNlRGVwdGhSYXRpbyksIHpGYXIgLyBNaW5TbGljZURlcHRoUmF0aW8pO1xuICAvLyBUaGUgc2xpY2VzIGFyZSBsb2dhcml0aG1pYzogc2xpY2UoZGVwdGgpID0gZmxvb3IobG9nKGRlcHRoKSAqIHNsaWNlU2NhbGUgKyBzbGljZUJpYXMpLCB3aGljaCBhbGxvY2F0ZXNcbiAgLy8gdGhlIHNhbWUgd29ybGQtc3BhY2UgdGhpY2tuZXNzIHJhdGlvIHRvIGV2ZXJ5IHNsaWNlIChuZWFyIHNsaWNlcyBhcmUgdGhpbiwgZmFyIHNsaWNlcyBhcmUgdGhpY2spIGFuZFxuICAvLyBtYXRjaGVzIHRoZSBwZXJzcGVjdGl2ZSBkaXN0cmlidXRpb24gb2YgdGhlIGxpdCBmcmFnbWVudHMuIFRoZSBzaGFkZXJzIGV2YWx1YXRlIHRoZSBzYW1lIGV4cHJlc3Npb24uXG4gIGNvbnN0IHNsaWNlU2NhbGUgPSBsYXlvdXQuZ3JpZFogLyBNYXRoLmxvZyh6RmFyIC8gek5lYXIpO1xuICBjb25zdCBzbGljZUJpYXMgPSAtTWF0aC5sb2coek5lYXIpICogc2xpY2VTY2FsZTtcblxuICBkc3Rbdmlld09mZnNldCArIDE2XSA9IGxheW91dC5ncmlkWDtcbiAgZHN0W3ZpZXdPZmZzZXQgKyAxN10gPSBsYXlvdXQuZ3JpZFk7XG4gIGRzdFt2aWV3T2Zmc2V0ICsgMThdID0gbGF5b3V0LmdyaWRaO1xuICBkc3Rbdmlld09mZnNldCArIDE5XSA9IDA7IC8vIHN0YXRlXG4gIGRzdFt2aWV3T2Zmc2V0ICsgMjBdID0gc2xpY2VTY2FsZTtcbiAgZHN0W3ZpZXdPZmZzZXQgKyAyMV0gPSBzbGljZUJpYXM7XG4gIGRzdFt2aWV3T2Zmc2V0ICsgMjJdID0gek5lYXI7XG4gIGRzdFt2aWV3T2Zmc2V0ICsgMjNdID0gekZhcjtcbn1cblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgc2xpY2UgYm91bmRhcmllcyBgenMoaylgIGZyb20gdGhlIHNsaWNlIHBhcmFtZXRlcnMgc3RvcmVkIGluIHRoZSBoZWFkZXIuXG4gKiBgenMoMClgIGFuZCBgenMoZ3JpZFopYCBhcmUgbm90IHVzZWQgYnkgdGhlIHRlc3RzICh0aGUgYm9yZGVyIHNsaWNlcyBhcmUgdW5ib3VuZGVkKS5cbiAqL1xuZnVuY3Rpb24gY29tcHV0ZVNsaWNlQm91bmRhcmllcyhcbiAgZHN0OiBGbG9hdDMyQXJyYXksXG4gIHZpZXdPZmZzZXQ6IG51bWJlcixcbiAgbGF5b3V0OiBMaWdodENsdXN0ZXJWaWV3TGF5b3V0LFxuICBvdXQ6IEZsb2F0NjRBcnJheVxuKSB7XG4gIGNvbnN0IHNsaWNlU2NhbGUgPSBkc3Rbdmlld09mZnNldCArIDIwXTtcbiAgY29uc3Qgc2xpY2VCaWFzID0gZHN0W3ZpZXdPZmZzZXQgKyAyMV07XG4gIC8vIFRoZSBpbnZlcnNlIG9mIGBzbGljZSA9IGxvZyhkZXB0aCkgKiBzbGljZVNjYWxlICsgc2xpY2VCaWFzYDogenMoaykgaXMgdGhlIGRlcHRoIG9mIHRoZSBuZWFyIGJvdW5kYXJ5IG9mXG4gIC8vIHNsaWNlIGsuIFNsaWNlIGsgc3BhbnMgW3pzKGspLCB6cyhrICsgMSldLCBzbyBhIGxpZ2h0IG5lZWRzIG9uZSBzbGljZSB0ZXN0IHBlciBib3VuZGFyeSBvbmx5LlxuICBmb3IgKGxldCBrID0gMDsgayA8PSBsYXlvdXQuZ3JpZFo7IGsrKykge1xuICAgIG91dFtrXSA9IE1hdGguZXhwKChrIC0gc2xpY2VCaWFzKSAvIHNsaWNlU2NhbGUpO1xuICB9XG59XG5cbi8qKlxuICogVGhlIHNpZ25lZCBkaXN0YW5jZSBmcm9tIGEgcGxhbmUgYGJhc2UgLSBrICogc3RlcGAgKG9yIGBrICogc3RlcCAtIGJhc2VgIHdoZW4gYGZsaXBgIGlzIHRydWUpIHRvIGEgcG9pbnQuXG4gKiBSZXR1cm5zICtJbmZpbml0eSBmb3IgYSBkZWdlbmVyYXRlIHBsYW5lIHNvIHRoYXQgdGhlIHRlc3QgcGFzc2VzIChjb25zZXJ2YXRpdmUpLlxuICovXG5mdW5jdGlvbiBwbGFuZURpc3RhbmNlKFxuICBkc3Q6IEZsb2F0MzJBcnJheSxcbiAgYmFzZU9mZnNldDogbnVtYmVyLFxuICBzdGVwT2Zmc2V0OiBudW1iZXIsXG4gIGs6IG51bWJlcixcbiAgZmxpcDogYm9vbGVhbixcbiAgY3g6IG51bWJlcixcbiAgY3k6IG51bWJlcixcbiAgY3o6IG51bWJlclxuKSB7XG4gIC8vIFRoZSBwbGFuZSBpcyBidWlsdCBmcm9tIHRoZSB2aWV3IGhlYWRlciByb3dzIChgYmFzZSAtIGsgKiBzdGVwYCkgYW5kIHRoZW4gbm9ybWFsaXplZCwgYmVjYXVzZSB0aGUgcm93cyBhcmVcbiAgLy8gc2NhbGVkIGJ5IDAuNSAqIGdyaWRYIC8gZ3JpZFk6IHRoZSBub3JtYWxpemF0aW9uIG1ha2VzIHRoZSByZXN1bHQgYSB0cnVlIGRpc3RhbmNlIHNvIHRoYXQgaXQgY2FuIGJlIGNvbXBhcmVkXG4gIC8vIHdpdGggdGhlIGxpZ2h0IHJhZGl1cy5cbiAgY29uc3Qgc2lnbiA9IGZsaXAgPyAtMSA6IDE7XG4gIGNvbnN0IG54ID0gc2lnbiAqIChkc3RbYmFzZU9mZnNldF0gLSBrICogZHN0W3N0ZXBPZmZzZXRdKTtcbiAgY29uc3QgbnkgPSBzaWduICogKGRzdFtiYXNlT2Zmc2V0ICsgMV0gLSBrICogZHN0W3N0ZXBPZmZzZXQgKyAxXSk7XG4gIGNvbnN0IG56ID0gc2lnbiAqIChkc3RbYmFzZU9mZnNldCArIDJdIC0gayAqIGRzdFtzdGVwT2Zmc2V0ICsgMl0pO1xuICBjb25zdCBudyA9IHNpZ24gKiAoZHN0W2Jhc2VPZmZzZXQgKyAzXSAtIGsgKiBkc3Rbc3RlcE9mZnNldCArIDNdKTtcbiAgY29uc3QgbGVuZ3RoID0gTWF0aC5oeXBvdChueCwgbnksIG56KTtcbiAgaWYgKCEobGVuZ3RoID4gMWUtMzApKSB7XG4gICAgLy8gQSBkZWdlbmVyYXRlIHBsYW5lIChlLmcuIGEgdGlsZSByb3cgcHJvamVjdGVkIHRvIHplcm8sIG9yIGFuIG9ydGhvZ3JhcGhpYyBheGlzIHBhcmFsbGVsIHRvIHRoZSBwbGFuZSlcbiAgICAvLyBtdXN0IG5vdCBjdWxsIGFueXRoaW5nOiByZXBvcnQgK0luZmluaXR5IHNvIHRoYXQgdGhlIGNvbXBhcmlzb24gd2l0aCAtciBwYXNzZXMuXG4gICAgcmV0dXJuIE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgfVxuICByZXR1cm4gKG54ICogY3ggKyBueSAqIGN5ICsgbnogKiBjeiArIG53KSAvIGxlbmd0aDtcbn1cblxuLyoqXG4gKiBXaGV0aGVyIGEgc3BoZXJlIGlzIGVudGlyZWx5IGJlaGluZCB0aGUgZXllIHBsYW5lICh3IDw9IDApIG9mIHRoZSB2aWV3LlxuICogRnJhZ21lbnRzIHRoZXJlIHVzZSB0aGUgYWxsLWxpZ2h0IGxpc3QsIHNvIHN1Y2ggYSBsaWdodCBpcyBub3QgYXNzaWduZWQgdG8gYW55IGNsdXN0ZXIuXG4gKi9cbmZ1bmN0aW9uIGlzU3BoZXJlQmVoaW5kRXllKGRzdDogRmxvYXQzMkFycmF5LCB2aWV3T2Zmc2V0OiBudW1iZXIsIGN4OiBudW1iZXIsIGN5OiBudW1iZXIsIGN6OiBudW1iZXIsIHI6IG51bWJlcikge1xuICBjb25zdCB3eCA9IGRzdFt2aWV3T2Zmc2V0ICsgOF07XG4gIGNvbnN0IHd5ID0gZHN0W3ZpZXdPZmZzZXQgKyA5XTtcbiAgY29uc3Qgd3ogPSBkc3Rbdmlld09mZnNldCArIDEwXTtcbiAgY29uc3Qgd3cgPSBkc3Rbdmlld09mZnNldCArIDExXTtcbiAgY29uc3QgbGVuZ3RoID0gTWF0aC5oeXBvdCh3eCwgd3ksIHd6KTtcbiAgaWYgKCEobGVuZ3RoID4gMWUtMzApKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiAod3ggKiBjeCArIHd5ICogY3kgKyB3eiAqIGN6ICsgd3cpIC8gbGVuZ3RoIDw9IC1yO1xufVxuXG4vKipcbiAqIE5vcm1hbGl6ZXMgdGhlIHRpbGUgcGxhbmVzIGBiYXNlIC0gayAqIHN0ZXBgIChrID0gMC4uY291bnQpIG9uY2UgcGVyIHZpZXcuIEEgZGVnZW5lcmF0ZSBwbGFuZSBpcyBzdG9yZWQgYXMgMCxcbiAqIGFuZCB0aGUgdGVzdHMgdHJlYXQgaXQgYXMgcGFzc2luZyAoYXMgYHBsYW5lRGlzdGFuY2VgIHJldHVybnMgK0luZmluaXR5IGZvciBpdCkuXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVUaWxlUGxhbmVzKFxuICBkc3Q6IEZsb2F0MzJBcnJheSxcbiAgYmFzZU9mZnNldDogbnVtYmVyLFxuICBzdGVwT2Zmc2V0OiBudW1iZXIsXG4gIGNvdW50OiBudW1iZXIsXG4gIG91dDogRmxvYXQ2NEFycmF5XG4pIHtcbiAgZm9yIChsZXQgayA9IDA7IGsgPD0gY291bnQ7IGsrKykge1xuICAgIGNvbnN0IG54ID0gZHN0W2Jhc2VPZmZzZXRdIC0gayAqIGRzdFtzdGVwT2Zmc2V0XTtcbiAgICBjb25zdCBueSA9IGRzdFtiYXNlT2Zmc2V0ICsgMV0gLSBrICogZHN0W3N0ZXBPZmZzZXQgKyAxXTtcbiAgICBjb25zdCBueiA9IGRzdFtiYXNlT2Zmc2V0ICsgMl0gLSBrICogZHN0W3N0ZXBPZmZzZXQgKyAyXTtcbiAgICBjb25zdCBudyA9IGRzdFtiYXNlT2Zmc2V0ICsgM10gLSBrICogZHN0W3N0ZXBPZmZzZXQgKyAzXTtcbiAgICBjb25zdCBsZW5ndGggPSBNYXRoLmh5cG90KG54LCBueSwgbnopO1xuICAgIGNvbnN0IG8gPSBrICogNDtcbiAgICAvLyBUaGUgbm9ybWFsaXphdGlvbiAoZGl2aWRpbmcgYnkgfHh5enwpIGlzIGRvbmUgb25jZSBwZXIgdmlldywgc28gdGhlIHBlci1saWdodCB0ZXN0IGlzIGEgcGxhaW4gZG90IHByb2R1Y3QuXG4gICAgaWYgKGxlbmd0aCA+IDFlLTMwKSB7XG4gICAgICBvdXRbb10gPSBueCAvIGxlbmd0aDtcbiAgICAgIG91dFtvICsgMV0gPSBueSAvIGxlbmd0aDtcbiAgICAgIG91dFtvICsgMl0gPSBueiAvIGxlbmd0aDtcbiAgICAgIG91dFtvICsgM10gPSBudyAvIGxlbmd0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgb3V0W29dID0gMDtcbiAgICAgIG91dFtvICsgMV0gPSAwO1xuICAgICAgb3V0W28gKyAyXSA9IDA7XG4gICAgICBvdXRbbyArIDNdID0gTnVtYmVyLk5hTjsgLy8gbWFya3MgYSBkZWdlbmVyYXRlIHBsYW5lXG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRXZhbHVhdGVzIHRoZSB0aWxlIHRlc3RzIG9mIG9uZSBheGlzIGZvciBhIHNwaGVyZSBhbmQgd3JpdGVzIGEgcGFzcyBmbGFnIHBlciB0aWxlIHRvIGBwYXNzYCBhdCBgcGFzc09mZnNldGAuXG4gKiBUaWxlIGB0YCBwYXNzZXMgd2hlbiBgdCA9PSAwIHx8IGRpc3QocGxhbmUgdCkgPj0gLXJgIGFuZCBgdCA9PSBjb3VudCAtIDEgfHwgLWRpc3QocGxhbmUgdCArIDEpID49IC1yYFxuICogKHRoZSByaWdodCBwbGFuZSBvZiBhIHRpbGUgaXMgdGhlIG5lZ2F0ZWQgbGVmdCBwbGFuZSBvZiB0aGUgbmV4dCB0aWxlKS5cbiAqIEByZXR1cm5zIHdoZXRoZXIgYW55IHRpbGUgcGFzc2VzXG4gKi9cbmZ1bmN0aW9uIGV2YWx1YXRlVGlsZUF4aXMoXG4gIHBsYW5lczogRmxvYXQ2NEFycmF5LFxuICBjb3VudDogbnVtYmVyLFxuICBjeDogbnVtYmVyLFxuICBjeTogbnVtYmVyLFxuICBjejogbnVtYmVyLFxuICByOiBudW1iZXIsXG4gIHBhc3M6IFVpbnQ4QXJyYXksXG4gIHBhc3NPZmZzZXQ6IG51bWJlclxuKSB7XG4gIGxldCBhbnkgPSBmYWxzZTtcbiAgLy8gVGhlIHBsYW5lcyBhcmUgdmlzaXRlZCBpbiBpbmNyZWFzaW5nIG9yZGVyIGFsb25nIHRoZSBheGlzLiBUaGUgbGVmdCBwbGFuZSBvZiB0aWxlIHQgKyAxIGlzIHRoZSBib3VuZGFyeSB0aGF0XG4gIC8vIGlzIHNoYXJlZCB3aXRoIHRoZSByaWdodCBwbGFuZSBvZiB0aWxlIHQsIHNvIGl0cyBkaXN0YW5jZSBpcyBldmFsdWF0ZWQgb25jZSBhbmQgcmV1c2VkIGZvciBib3RoIHRpbGVzOlxuICAvLyBgbGVmdFBhc3Nlc2AgY2FycmllcyBpdCBpbnRvIHRoZSBuZXh0IGl0ZXJhdGlvbiBpbnN0ZWFkIG9mIGV2YWx1YXRpbmcgdGhlIHNhbWUgcGxhbmUgdHdpY2UuXG4gIC8vIGBsZWZ0UGFzc2VzYCBpcyB0aGUgdGVzdCBvZiB0aGUgbGVmdCBwbGFuZSBvZiB0aGUgY3VycmVudCB0aWxlXG4gIGxldCBsZWZ0UGFzc2VzID0gdHJ1ZTtcbiAgZm9yIChsZXQgdCA9IDA7IHQgPCBjb3VudDsgdCsrKSB7XG4gICAgLy8gVGhlIGxhc3QgdGlsZSBoYXMgbm8gcmlnaHQgYm9yZGVyICh0aGUgY2x1c3RlcnMgYXQgdGhlIGJvcmRlciBleHRlbmQgdG8gaW5maW5pdHkpLlxuICAgIGxldCByaWdodFBhc3NlcyA9IHRydWU7XG4gICAgaWYgKHQgPCBjb3VudCAtIDEpIHtcbiAgICAgIGNvbnN0IG8gPSAodCArIDEpICogNDtcbiAgICAgIGNvbnN0IHcgPSBwbGFuZXNbbyArIDNdO1xuICAgICAgaWYgKCFOdW1iZXIuaXNOYU4odykpIHtcbiAgICAgICAgLy8gZGlzdCBvZiB0aGUgcGxhbmUgb2YgdGhlIG5leHQgdGlsZTsgdGhlIHJpZ2h0IHBsYW5lIG9mIHRoaXMgdGlsZSBoYXMgdGhlIG9wcG9zaXRlIHNpZ24uXG4gICAgICAgIC8vIFRoZSB0ZXN0IHBhc3NlcyB3aGlsZSB0aGUgZGlzdGFuY2UgaXMgc3RpbGwgaW5zaWRlIHRoZSBzcGhlcmUgKD49IC1yKSwgaS5lLiB0aGUgc3BoZXJlIG1heSByZWFjaCB0aGUgdGlsZS5cbiAgICAgICAgY29uc3QgZGlzdGFuY2UgPSBwbGFuZXNbb10gKiBjeCArIHBsYW5lc1tvICsgMV0gKiBjeSArIHBsYW5lc1tvICsgMl0gKiBjeiArIHc7XG4gICAgICAgIHJpZ2h0UGFzc2VzID0gLWRpc3RhbmNlID49IC1yO1xuICAgICAgICBwYXNzW3Bhc3NPZmZzZXQgKyB0XSA9IGxlZnRQYXNzZXMgJiYgcmlnaHRQYXNzZXMgPyAxIDogMDtcbiAgICAgICAgYW55IHx8PSBsZWZ0UGFzc2VzICYmIHJpZ2h0UGFzc2VzO1xuICAgICAgICBsZWZ0UGFzc2VzID0gZGlzdGFuY2UgPj0gLXI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgLy8gQSBkZWdlbmVyYXRlIHBsYW5lIHBhc3Nlcywgc28gb25seSB0aGUgbGVmdCB0ZXN0IHJlbWFpbnM7IGBsZWZ0UGFzc2VzID0gdHJ1ZWAgZm9yIHRoZSBuZXh0IHRpbGUuXG4gICAgfVxuICAgIHBhc3NbcGFzc09mZnNldCArIHRdID0gbGVmdFBhc3NlcyAmJiByaWdodFBhc3NlcyA/IDEgOiAwO1xuICAgIGFueSB8fD0gbGVmdFBhc3NlcyAmJiByaWdodFBhc3NlcztcbiAgICBsZWZ0UGFzc2VzID0gdHJ1ZTtcbiAgfVxuICByZXR1cm4gYW55O1xufVxuXG4vKipcbiAqIEV2YWx1YXRlcyB0aGUgY29sdW1uLCByb3cgYW5kIHNsaWNlIHRlc3RzIG9mIGxpZ2h0IGBpYCBpbnRvIGBzY3JhdGNoLmF4aXNQYXNzYC5cbiAqIEByZXR1cm5zIHdoZXRoZXIgdGhlIGxpZ2h0IHRvdWNoZXMgYW55IGNsdXN0ZXJcbiAqL1xuZnVuY3Rpb24gZXZhbHVhdGVMaWdodEF4ZXMoXG4gIGRzdDogRmxvYXQzMkFycmF5LFxuICB2aWV3T2Zmc2V0OiBudW1iZXIsXG4gIGxheW91dDogTGlnaHRDbHVzdGVyVmlld0xheW91dCxcbiAgc2NyYXRjaDogTGlnaHRDbHVzdGVyQnVpbGRTY3JhdGNoLFxuICBzcGhlcmVzOiBBcnJheUxpa2U8bnVtYmVyPixcbiAgaTogbnVtYmVyXG4pIHtcbiAgY29uc3QgeyBncmlkWCwgZ3JpZFksIGdyaWRaIH0gPSBsYXlvdXQ7XG4gIGNvbnN0IGN4ID0gc3BoZXJlc1tpICogNF07XG4gIGNvbnN0IGN5ID0gc3BoZXJlc1tpICogNCArIDFdO1xuICBjb25zdCBjeiA9IHNwaGVyZXNbaSAqIDQgKyAyXTtcbiAgY29uc3QgciA9IHNwaGVyZXNbaSAqIDQgKyAzXTtcbiAgY29uc3QgYmFzZSA9IGkgKiAoZ3JpZFggKyBncmlkWSArIGdyaWRaKTtcbiAgY29uc3QgYXhpc1Bhc3MgPSBzY3JhdGNoLmF4aXNQYXNzO1xuICAvLyBUaGUgdGVzdHMgYXJlIG9yZGVyZWQgZnJvbSB0aGUgY2hlYXBlc3QgYW5kIG1vc3QgcmVqZWN0aW5nIHRvIHRoZSBtb3N0IGV4cGVuc2l2ZTogdGhlIGV5ZSBwbGFuZSBmaXJzdCxcbiAgLy8gdGhlbiB0aGUgY29sdW1ucywgdGhlbiB0aGUgcm93cywgYW5kIG9ubHkgdGhlbiB0aGUgc2xpY2VzICh3aGljaCBuZWVkIHRoZSBleHBvbmVudGlhbCBib3VuZGFyaWVzKS5cbiAgLy8gQSBsaWdodCB0aGF0IGZhaWxzIGFuIGF4aXMgaXMgbm90IHRlc3RlZCBmdXJ0aGVyLCBhbmQgdGhlIHBlci1heGlzIHBhc3MgZmxhZ3MgYWxyZWFkeSByZWNvcmRlZCBhcmUgaWdub3JlZFxuICAvLyBiZWNhdXNlIGBpc0xpZ2h0SW5WaWV3YCBtYXJrcyB0aGUgbGlnaHQgYXMgc2tpcHBlZC5cbiAgaWYgKFxuICAgIGlzU3BoZXJlQmVoaW5kRXllKGRzdCwgdmlld09mZnNldCwgY3gsIGN5LCBjeiwgcikgfHxcbiAgICAhZXZhbHVhdGVUaWxlQXhpcyhzY3JhdGNoLnBsYW5lc1gsIGdyaWRYLCBjeCwgY3ksIGN6LCByLCBheGlzUGFzcywgYmFzZSkgfHxcbiAgICAhZXZhbHVhdGVUaWxlQXhpcyhzY3JhdGNoLnBsYW5lc1ksIGdyaWRZLCBjeCwgY3ksIGN6LCByLCBheGlzUGFzcywgYmFzZSArIGdyaWRYKVxuICApIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgYm91bmRhcmllcyA9IHNjcmF0Y2guc2xpY2VCb3VuZGFyaWVzO1xuICAvLyBUaGUgdmlldyBkZXB0aCBvZiB0aGUgbGlnaHQgY2VudGVyLCB1c2luZyB0aGUgbm9ybWFsaXplZCBkZXB0aCByb3cgb2YgdGhlIGhlYWRlci5cbiAgY29uc3QgZCA9IGRzdFt2aWV3T2Zmc2V0ICsgMTJdICogY3ggKyBkc3Rbdmlld09mZnNldCArIDEzXSAqIGN5ICsgZHN0W3ZpZXdPZmZzZXQgKyAxNF0gKiBjeiArIGRzdFt2aWV3T2Zmc2V0ICsgMTVdO1xuICBjb25zdCBzbGljZUJhc2UgPSBiYXNlICsgZ3JpZFggKyBncmlkWTtcbiAgbGV0IGFueVNsaWNlID0gZmFsc2U7XG4gIC8vIFRoZSBmaXJzdCBhbmQgbGFzdCBzbGljZXMgaGF2ZSBubyBvdXRlciBib3JkZXIgKHRoZXkgZXh0ZW5kIHRvIC1JbmZpbml0eSAvICtJbmZpbml0eSkuXG4gIGZvciAobGV0IHogPSAwOyB6IDwgZ3JpZFo7IHorKykge1xuICAgIGNvbnN0IHBhc3MgPSAoeiA9PT0gMCB8fCBkICsgciA+PSBib3VuZGFyaWVzW3pdKSAmJiAoeiA9PT0gZ3JpZFogLSAxIHx8IGQgLSByIDw9IGJvdW5kYXJpZXNbeiArIDFdKTtcbiAgICBheGlzUGFzc1tzbGljZUJhc2UgKyB6XSA9IHBhc3MgPyAxIDogMDtcbiAgICBhbnlTbGljZSB8fD0gcGFzcztcbiAgfVxuICBpZiAoIWFueVNsaWNlKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIC8vIFRoZSByYW5nZSBvZiB0aGUgcGFzc2luZyB0aWxlcyBvZiBlYWNoIGF4aXMsIHNvIHRoYXQgdGhlIHZpc2l0cyBza2lwIHRoZSB0aWxlcyBvdXRzaWRlIGl0XG4gIGNvbnN0IHJhbmdlcyA9IHNjcmF0Y2guYXhpc1JhbmdlcztcbiAgY29uc3QgcmFuZ2VPZmZzZXQgPSBpICogNjtcbiAgc3RvcmVQYXNzUmFuZ2UoYXhpc1Bhc3MsIGJhc2UsIGdyaWRYLCByYW5nZXMsIHJhbmdlT2Zmc2V0KTtcbiAgc3RvcmVQYXNzUmFuZ2UoYXhpc1Bhc3MsIGJhc2UgKyBncmlkWCwgZ3JpZFksIHJhbmdlcywgcmFuZ2VPZmZzZXQgKyAyKTtcbiAgc3RvcmVQYXNzUmFuZ2UoYXhpc1Bhc3MsIHNsaWNlQmFzZSwgZ3JpZFosIHJhbmdlcywgcmFuZ2VPZmZzZXQgKyA0KTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBTdG9yZXMgdGhlIGZpcnN0IGFuZCB0aGUgbGFzdCBwYXNzaW5nIHRpbGUgb2YgYW4gYXhpcyAodGhlIGF4aXMgaGFzIGF0IGxlYXN0IG9uZSBwYXNzaW5nIHRpbGUpLiAqL1xuZnVuY3Rpb24gc3RvcmVQYXNzUmFuZ2UoYXhpc1Bhc3M6IFVpbnQ4QXJyYXksIG9mZnNldDogbnVtYmVyLCBjb3VudDogbnVtYmVyLCBvdXQ6IEludDMyQXJyYXksIG91dE9mZnNldDogbnVtYmVyKSB7XG4gIGxldCBmaXJzdCA9IDA7XG4gIHdoaWxlIChheGlzUGFzc1tvZmZzZXQgKyBmaXJzdF0gPT09IDApIGZpcnN0Kys7XG4gIGxldCBsYXN0ID0gY291bnQgLSAxO1xuICB3aGlsZSAoYXhpc1Bhc3Nbb2Zmc2V0ICsgbGFzdF0gPT09IDApIGxhc3QtLTtcbiAgb3V0W291dE9mZnNldF0gPSBmaXJzdDtcbiAgb3V0W291dE9mZnNldCArIDFdID0gbGFzdDtcbn1cblxuLyoqXG4gKiBWaXNpdHMgdGhlIGNsdXN0ZXJzIGEgbGlnaHQgdG91Y2hlcyAoZnJvbSBpdHMgYXhpcyBmbGFncyBhdCBgYmFzZWApLiBXaXRob3V0IGBkc3RgLCBpdCBpbmNyZW1lbnRzIGBjdXJzb3JzYCBvZiBlYWNoXG4gKiBjbHVzdGVyIHdoaWxlIGl0IGlzIGJlbG93IGBjYXBhY2l0eWAgKGNvdW50aW5nKS4gV2l0aCBgZHN0YCwgaXQgd3JpdGVzIGBlbnRyeWAgYXQgdGhlIGN1cnNvciBvZiBlYWNoIGNsdXN0ZXIgd2hpbGVcbiAqIGl0IGlzIGJlbG93IHRoZSBlbmQgKGZpbGxpbmcpIGFuZCBiZWxvdyBgY2FwYWNpdHlgLlxuICogQHJldHVybnMgd2hldGhlciBzb21lIGNsdXN0ZXIgd2FzIGZ1bGwgYW5kIHNraXBwZWQgdGhlIGxpZ2h0XG4gKi9cbmZ1bmN0aW9uIHZpc2l0TGlnaHRDbHVzdGVycyhcbiAgbGF5b3V0OiBMaWdodENsdXN0ZXJWaWV3TGF5b3V0LFxuICBzY3JhdGNoOiBMaWdodENsdXN0ZXJCdWlsZFNjcmF0Y2gsXG4gIGk6IG51bWJlcixcbiAgY3Vyc29yczogVWludDMyQXJyYXksXG4gIGNhcGFjaXR5OiBudW1iZXIsXG4gIGVuZHM6IFVpbnQzMkFycmF5IHwgbnVsbCxcbiAgZHN0OiBGbG9hdDMyQXJyYXkgfCBudWxsLFxuICBpbmRleE9mZnNldDogbnVtYmVyLFxuICBlbnRyeTogbnVtYmVyXG4pIHtcbiAgY29uc3QgeyBncmlkWCwgZ3JpZFksIGdyaWRaIH0gPSBsYXlvdXQ7XG4gIGNvbnN0IGF4aXNQYXNzID0gc2NyYXRjaC5heGlzUGFzcztcbiAgY29uc3QgcmFuZ2VzID0gc2NyYXRjaC5heGlzUmFuZ2VzO1xuICBjb25zdCByID0gaSAqIDY7XG4gIGNvbnN0IGJhc2UgPSBpICogKGdyaWRYICsgZ3JpZFkgKyBncmlkWik7XG4gIGNvbnN0IHJvd0Jhc2UgPSBiYXNlICsgZ3JpZFg7XG4gIGNvbnN0IHNsaWNlQmFzZSA9IHJvd0Jhc2UgKyBncmlkWTtcbiAgLy8gVGhlIGxvb3BzIG9ubHkgd2FsayB0aGUgYm91bmRpbmcgcmFuZ2Ugb2YgdGhlIHBhc3NpbmcgdGlsZXMgb2YgZWFjaCBheGlzOyB0aGUgcGVyLXRpbGUgZmxhZ3Mgc2tpcCB0aGUgaG9sZXNcbiAgLy8gaW5zaWRlIHRoZSByYW5nZSAoYSBjb252ZXggc2hhcGUgY2Fubm90IGhhdmUgaG9sZXMsIGJ1dCB0aGUgY29uc2VydmF0aXZlIHRlc3RzIGNhbiBwcm9kdWNlIHRoZW0pLlxuICBjb25zdCB4MCA9IHJhbmdlc1tyXTtcbiAgY29uc3QgeDEgPSByYW5nZXNbciArIDFdO1xuICBsZXQgaXNGdWxsID0gZmFsc2U7XG4gIGZvciAobGV0IHogPSByYW5nZXNbciArIDRdOyB6IDw9IHJhbmdlc1tyICsgNV07IHorKykge1xuICAgIGlmIChheGlzUGFzc1tzbGljZUJhc2UgKyB6XSA9PT0gMCkgY29udGludWU7XG4gICAgZm9yIChsZXQgeSA9IHJhbmdlc1tyICsgMl07IHkgPD0gcmFuZ2VzW3IgKyAzXTsgeSsrKSB7XG4gICAgICBpZiAoYXhpc1Bhc3Nbcm93QmFzZSArIHldID09PSAwKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IHJvd1N0YXJ0ID0gKHogKiBncmlkWSArIHkpICogZ3JpZFg7XG4gICAgICBmb3IgKGxldCB4ID0geDA7IHggPD0geDE7IHgrKykge1xuICAgICAgICBpZiAoYXhpc1Bhc3NbYmFzZSArIHhdID09PSAwKSBjb250aW51ZTtcbiAgICAgICAgLy8gVGhlIGNsdXN0ZXIgaW5kZXggbGF5b3V0OiAoeiAqIGdyaWRZICsgeSkgKiBncmlkWCArIHguXG4gICAgICAgIGNvbnN0IGMgPSByb3dTdGFydCArIHg7XG4gICAgICAgIGlmIChlbmRzID09IG51bGwpIHtcbiAgICAgICAgICAvLyBDb3VudGluZyBwYXNzOiBzdG9yZSBvbmx5IHRoZSBudW1iZXIgb2YgbGlnaHRzIHBlciBjbHVzdGVyLCBhbmQgcmVtZW1iZXIgd2hldGhlciBzb21lIGNsdXN0ZXJcbiAgICAgICAgICAvLyBhbHJlYWR5IGhhZCBgY2FwYWNpdHlgIGxpZ2h0cyAoaXRzIGV4dHJhIGxpZ2h0cyBhcmUgZHJvcHBlZCwgd2hpY2ggcmVwb3J0cyAndHJ1bmNhdGVkJykuXG4gICAgICAgICAgY29uc3QgY3Vyc29yID0gY3Vyc29yc1tjXTtcbiAgICAgICAgICBpZiAoY3Vyc29yIDwgY2FwYWNpdHkpIHtcbiAgICAgICAgICAgIGN1cnNvcnNbY10gPSBjdXJzb3IgKyAxO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpc0Z1bGwgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChjdXJzb3JzW2NdIDwgZW5kc1tjXSkge1xuICAgICAgICAgIC8vIEZpbGxpbmcgcGFzczogYGN1cnNvcnNgIGhvbGRzIHRoZSB3cml0ZSBwb3NpdGlvbiBpbiB0aGUgaW5kZXggbGlzdCBhbmQgYGVuZHNgIHRoZSBlbmQgb2YgdGhlIGxpc3QsXG4gICAgICAgICAgLy8gc28gdGhlIGxpZ2h0cyBhcmUgc3RvcmVkIGluIHRoZSBvcmRlciB0aGUgY2FsbGVyIHZpc2l0cyB0aGVtIChuZWFyZXN0IGZpcnN0IHdoZW4gc29ydGVkKS5cbiAgICAgICAgICBkc3QhW2luZGV4T2Zmc2V0ICsgY3Vyc29yc1tjXV0gPSBlbnRyeTtcbiAgICAgICAgICBjdXJzb3JzW2NdKys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGlzRnVsbDtcbn1cblxuLyoqXG4gKiBCdWlsZHMgdGhlIGNsdXN0ZXIgdGFibGUgYW5kIHRoZSBsaWdodCBpbmRleCBsaXN0IG9mIGEgdmlldyB3aG9zZSBoZWFkZXIgaGFzIGJlZW4gd3JpdHRlbi5cbiAqXG4gKiBUaGUgbGlnaHRzIG9mIGVhY2ggY2x1c3RlciBhcmUgc3RvcmVkIGluIHRoZSBvcmRlciBvZiBgbG9jYWxFbnRyaWVzYC4gVGhlIGNhbGxlciBwYXNzZXMgdGhlIGxpZ2h0cyBzb3J0ZWQgYnkgdGhlaXJcbiAqIHZpZXcgZGVwdGggKG5lYXJlc3QgZmlyc3QpIHdoZW4gdGhlIG51bWJlciBvZiBsb2NhbCBsaWdodHMgZXhjZWVkcyB0aGUgY2FwYWNpdHksIHNvIHRoYXQgYSBjbHVzdGVyIHdoaWNoIGlzIGZ1bGxcbiAqIGtlZXBzIGl0cyBuZWFyZXN0IGxpZ2h0cy4gRXZlcnkgY2x1c3RlciBrZWVwcyBhdCBtb3N0IGBsYXlvdXQuY2x1c3RlckxpZ2h0Q2FwYWNpdHlgIGxpZ2h0cywgc28gdGhlIGxpc3QgY2Fubm90XG4gKiBvdmVyZmxvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkTGlnaHRDbHVzdGVyc09uQ3B1KFxuICBkc3Q6IEZsb2F0MzJBcnJheSxcbiAgdmlld09mZnNldDogbnVtYmVyLFxuICBsYXlvdXQ6IExpZ2h0Q2x1c3RlclZpZXdMYXlvdXQsXG4gIHNwaGVyZXM6IEFycmF5TGlrZTxudW1iZXI+LFxuICBsb2NhbEVudHJpZXM6IEFycmF5TGlrZTxudW1iZXI+LFxuICBsb2NhbENvdW50OiBudW1iZXIsXG4gIHNjcmF0Y2g6IExpZ2h0Q2x1c3RlckJ1aWxkU2NyYXRjaFxuKTogTGlnaHRDbHVzdGVyQnVpbGRSZXN1bHQge1xuICBjb25zdCB7IGdyaWRYLCBncmlkWSwgZ3JpZFosIGNsdXN0ZXJDb3VudCB9ID0gbGF5b3V0O1xuICBjb25zdCBjYXBhY2l0eSA9IGxheW91dC5jbHVzdGVyTGlnaHRDYXBhY2l0eTtcbiAgY29uc3QgY291bnRzID0gc2NyYXRjaC5jb3VudHM7XG4gIGNvbnN0IG9mZnNldHMgPSBzY3JhdGNoLm9mZnNldHM7XG4gIGNvdW50cy5maWxsKDApO1xuICAvLyBUaGUgdGVzdHMgYXJlIGV2YWx1YXRlZCBpbiBsaWdodC1jZW50cmljIGZvcm06IHRoZSBwbGFuZXMgYW5kIHNsaWNlIGJvdW5kYXJpZXMgb2YgdGhlIHZpZXcgYXJlIGNvbXB1dGVkIG9uY2UsXG4gIC8vIHRoZW4gZWFjaCBsaWdodCBpcyB0ZXN0ZWQgYWdhaW5zdCB0aGVtLiAoVGhlIGNvbXB1dGUgc2hhZGVyIGRvZXMgaXQgdGhlIG90aGVyIHdheSByb3VuZCwgb25lIGNsdXN0ZXIgcGVyXG4gIC8vIGludm9jYXRpb24sIHdoaWNoIGlzIHdoeSBgc3BoZXJlSW50ZXJzZWN0c0xpZ2h0Q2x1c3RlcmAga2VlcHMgYSBzZWNvbmQsIGNsdXN0ZXItY2VudHJpYyBmb3JtIG9mIHRoZSBzYW1lIG1hdGguKVxuICBjb21wdXRlU2xpY2VCb3VuZGFyaWVzKGRzdCwgdmlld09mZnNldCwgbGF5b3V0LCBzY3JhdGNoLnNsaWNlQm91bmRhcmllcyk7XG4gIGNvbXB1dGVUaWxlUGxhbmVzKGRzdCwgdmlld09mZnNldCwgdmlld09mZnNldCArIDgsIGdyaWRYLCBzY3JhdGNoLnBsYW5lc1gpO1xuICBjb21wdXRlVGlsZVBsYW5lcyhkc3QsIHZpZXdPZmZzZXQgKyA0LCB2aWV3T2Zmc2V0ICsgOCwgZ3JpZFksIHNjcmF0Y2gucGxhbmVzWSk7XG5cbiAgLy8gVGhlIHBlci1saWdodCBzY3JhdGNoIGdyb3dzIGdlb21ldHJpY2FsbHkgc28gdGhhdCBhIHNjZW5lIHRoYXQgZ2FpbnMgbGlnaHRzIHJhcmVseSByZWFsbG9jYXRlcyBpdC5cbiAgLy8gYXhpc1Bhc3MgaG9sZHMgKGdyaWRYICsgZ3JpZFkgKyBncmlkWikgZmxhZ3MgcGVyIGxpZ2h0LCBheGlzUmFuZ2VzIDYgSW50MzIgcGVyIGxpZ2h0LlxuICBjb25zdCBheGlzU3RyaWRlID0gZ3JpZFggKyBncmlkWSArIGdyaWRaO1xuICBpZiAoc2NyYXRjaC5heGlzUGFzcy5sZW5ndGggPCBsb2NhbENvdW50ICogYXhpc1N0cmlkZSkge1xuICAgIHNjcmF0Y2guYXhpc1Bhc3MgPSBuZXcgVWludDhBcnJheShNYXRoLm1heChsb2NhbENvdW50ICogYXhpc1N0cmlkZSwgc2NyYXRjaC5heGlzUGFzcy5sZW5ndGggKiAyKSk7XG4gIH1cbiAgaWYgKHNjcmF0Y2guaXNMaWdodEluVmlldy5sZW5ndGggPCBsb2NhbENvdW50KSB7XG4gICAgY29uc3QgbGVuZ3RoID0gTWF0aC5tYXgobG9jYWxDb3VudCwgc2NyYXRjaC5pc0xpZ2h0SW5WaWV3Lmxlbmd0aCAqIDIpO1xuICAgIHNjcmF0Y2guaXNMaWdodEluVmlldyA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gICAgc2NyYXRjaC5heGlzUmFuZ2VzID0gbmV3IEludDMyQXJyYXkobGVuZ3RoICogNik7XG4gIH1cbiAgY29uc3QgaXNMaWdodEluVmlldyA9IHNjcmF0Y2guaXNMaWdodEluVmlldztcblxuICAvLyBQYXNzIDE6IGV2YWx1YXRlIHRoZSBheGVzIG9mIGVhY2ggbGlnaHQgb25jZSwgYW5kIGNvdW50IHRoZSBuZWFyZXN0IGxpZ2h0cyBvZiBlYWNoIGNsdXN0ZXIgdXAgdG8gdGhlIGNhcGFjaXR5LlxuICAvLyBUaGUgYXhpcyBmbGFncyBhcmUga2VwdCwgc28gdGhlIGZpbGwgcGFzcyAocGFzcyAzKSBkb2VzIG5vdCBoYXZlIHRvIHRlc3QgdGhlIHBsYW5lcyBhZ2Fpbi5cbiAgbGV0IGlzVHJ1bmNhdGVkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxDb3VudDsgaSsrKSB7XG4gICAgY29uc3QgaW5WaWV3ID0gZXZhbHVhdGVMaWdodEF4ZXMoZHN0LCB2aWV3T2Zmc2V0LCBsYXlvdXQsIHNjcmF0Y2gsIHNwaGVyZXMsIGkpO1xuICAgIGlzTGlnaHRJblZpZXdbaV0gPSBpblZpZXcgPyAxIDogMDtcbiAgICBpZiAoaW5WaWV3KSB7XG4gICAgICBpc1RydW5jYXRlZCA9IHZpc2l0TGlnaHRDbHVzdGVycyhsYXlvdXQsIHNjcmF0Y2gsIGksIGNvdW50cywgY2FwYWNpdHksIG51bGwsIG51bGwsIDAsIDApIHx8IGlzVHJ1bmNhdGVkO1xuICAgIH1cbiAgfVxuXG4gIC8vIFBhc3MgMjogb2Zmc2V0cyAoZXhjbHVzaXZlIHByZWZpeCBzdW0gaW4gdmVjNCwgZWFjaCBsaXN0IHN0YXJ0cyBhdCBhIHZlYzQgYm91bmRhcnkpLlxuICAvLyBUaGUgbGlzdHMgYXJlIHBhY2tlZCBkZW5zZWx5IGhlcmUgKHVubGlrZSB0aGUgR1BVIGJ1aWxkLCB3aGljaCBwYWRzIGV2ZXJ5IGNsdXN0ZXIgdG8gaXRzIG93biBmaXhlZCBzbG90KTpcbiAgLy8gYSBjbHVzdGVyIHdpdGggbiBsaWdodHMgb2NjdXBpZXMgY2VpbChuIC8gNCkgdmVjNHMsIGFuZCB0aGUgd2hvbGUgbGlzdCBuZWVkcyBhcyBtYW55IHZlYzRzIGFzIHRoZSBzdW0uXG4gIC8vIHVzZWRJbmRleFZlYzRDb3VudCBpcyB3aGF0IHRoZSBjYWxsZXIgaGFzIHRvIHVwbG9hZC5cbiAgbGV0IHRvdGFsVmVjNCA9IDA7XG4gIGZvciAobGV0IGMgPSAwOyBjIDwgY2x1c3RlckNvdW50OyBjKyspIHtcbiAgICBvZmZzZXRzW2NdID0gdG90YWxWZWM0O1xuICAgIHRvdGFsVmVjNCArPSAoY291bnRzW2NdICsgMykgPj4gMjtcbiAgfVxuXG4gIC8vIFRoZSB0YWJsZSBpcyByaWdodCBhZnRlciB0aGUgdmlldyBoZWFkZXIsIGFuZCB0aGUgbGlnaHQgaW5kZXggbGlzdCBhZnRlciB0aGUgdGFibGUuXG4gIC8vIChUaGlzIGlzIHRoZSBzYW1lIGFyaXRobWV0aWMgdGhlIHNoYWRlcnMgZG86IGB2aWV3QmFzZSArIDYgKyBjbHVzdGVyYCBhbmQgYC4uLiArIGNsdXN0ZXJDb3VudCArIG9mZnNldGAuKVxuICBjb25zdCB0YWJsZU9mZnNldCA9IHZpZXdPZmZzZXQgKyBMaWdodENsdXN0ZXJMYXlvdXQudmlld0hlYWRlclZlYzRDb3VudCAqIDQ7XG4gIGNvbnN0IGluZGV4T2Zmc2V0ID0gdGFibGVPZmZzZXQgKyBsYXlvdXQudGFibGVWZWM0Q291bnQgKiA0O1xuICBjb25zdCBzdGF0ZU9mZnNldCA9IHZpZXdPZmZzZXQgKyBMaWdodENsdXN0ZXJMYXlvdXQudmlld0dyaWRPZmZzZXQgKiA0ICsgMztcbiAgZHN0W3N0YXRlT2Zmc2V0XSA9IDA7XG4gIHNjcmF0Y2gudXNlZEluZGV4VmVjNENvdW50ID0gdG90YWxWZWM0O1xuXG4gIC8vIFdyaXRlIHRoZSB0YWJsZTogKG9mZnNldCBpbiB2ZWM0IGZyb20gdGhlIGluZGV4IGxpc3Qgc3RhcnQsIGxpZ2h0IGNvdW50LCAwLCAwKSBwZXIgY2x1c3Rlci5cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBjbHVzdGVyQ291bnQ7IGMrKykge1xuICAgIGNvbnN0IG8gPSB0YWJsZU9mZnNldCArIGMgKiA0O1xuICAgIGRzdFtvXSA9IG9mZnNldHNbY107XG4gICAgZHN0W28gKyAxXSA9IGNvdW50c1tjXTtcbiAgICBkc3RbbyArIDJdID0gMDtcbiAgICBkc3RbbyArIDNdID0gMDtcbiAgICAvLyBaZXJvIHRoZSB1bnVzZWQgY29tcG9uZW50cyBvZiB0aGUgbGFzdCB2ZWM0OiB0aGUgc2hhZGVycyBhbHdheXMgcmVhZCB3aG9sZSB2ZWM0cywgc28gdGhlIHBhZGRpbmcgbXVzdCBub3RcbiAgICAvLyBjb250YWluIGEgc3RhbGUgZW50cnkgZnJvbSBhbiBlYXJsaWVyIGZyYW1lIChvbmx5IHJ1bnMgd2hlbiB0aGUgY291bnQgaXMgbm90IGEgbXVsdGlwbGUgb2YgNCkuXG4gICAgLy8gVGhlIGNvbXB1dGUgc2hhZGVyIHdyaXRlcyB0aGUgcGFkZGluZyB0aGUgc2FtZSB3YXksIHdoaWNoIGtlZXBzIHRoZSB0d28gYnVpbGRzIGlkZW50aWNhbC5cbiAgICBpZiAoKGNvdW50c1tjXSAmIDMpICE9PSAwKSB7XG4gICAgICBjb25zdCBsYXN0VmVjNCA9IGluZGV4T2Zmc2V0ICsgKG9mZnNldHNbY10gKyAoY291bnRzW2NdID4+IDIpKSAqIDQ7XG4gICAgICBkc3QuZmlsbCgwLCBsYXN0VmVjNCwgbGFzdFZlYzQgKyA0KTtcbiAgICB9XG4gIH1cblxuICAvLyBQYXNzIDM6IGZpbGwgdGhlIGxpZ2h0IGluZGV4IGxpc3QuIGBvZmZzZXRzYCAoY29udmVydGVkIGZyb20gdmVjNHMgdG8gZW50cmllcykgaXMgdXNlZCBhcyB0aGUgd3JpdGUgY3Vyc29yIG9mXG4gIC8vIGVhY2ggY2x1c3RlciwgYW5kIGBjb3VudHNgIChjb252ZXJ0ZWQgdG8gYW4gYWJzb2x1dGUgZW50cnkgaW5kZXgpIGJlY29tZXMgdGhlIGVuZCBvZiB0aGUgbGlzdCBvZiBlYWNoIGNsdXN0ZXIuXG4gIC8vIFRoZSBsaWdodHMgYXJlIHZpc2l0ZWQgaW4gdGhlIGNhbGxlcidzIG9yZGVyLCBzbyB0aGUgbGlzdHMga2VlcCB0aGUgbmVhcmVzdC1maXJzdCBvcmRlciBvZiBhIHNvcnRlZCBpbnB1dC5cbiAgZm9yIChsZXQgYyA9IDA7IGMgPCBjbHVzdGVyQ291bnQ7IGMrKykge1xuICAgIG9mZnNldHNbY10gKj0gNDtcbiAgICBjb3VudHNbY10gKz0gb2Zmc2V0c1tjXTtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsQ291bnQ7IGkrKykge1xuICAgIGlmIChpc0xpZ2h0SW5WaWV3W2ldICE9PSAwKSB7XG4gICAgICB2aXNpdExpZ2h0Q2x1c3RlcnMobGF5b3V0LCBzY3JhdGNoLCBpLCBvZmZzZXRzLCBjYXBhY2l0eSwgY291bnRzLCBkc3QsIGluZGV4T2Zmc2V0LCBsb2NhbEVudHJpZXNbaV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaXNUcnVuY2F0ZWQgPyAndHJ1bmNhdGVkJyA6ICdidWlsdCc7XG59XG5cbi8qKlxuICogVGhlIGNsdXN0ZXItY2VudHJpYyBmb3JtIG9mIHRoZSBhc3NpZ25tZW50IHRlc3QgKHRoZSBmb3JtIHRoZSBXZWJHUFUgY29tcHV0ZSBzaGFkZXIgdXNlcykuXG4gKiBJdCBtdXN0IGFncmVlIHdpdGggdGhlIGxpZ2h0LWNlbnRyaWMgYnVpbGQgb2YgYGJ1aWxkTGlnaHRDbHVzdGVyc09uQ3B1YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNwaGVyZUludGVyc2VjdHNMaWdodENsdXN0ZXIoXG4gIGRzdDogRmxvYXQzMkFycmF5LFxuICB2aWV3T2Zmc2V0OiBudW1iZXIsXG4gIGxheW91dDogTGlnaHRDbHVzdGVyVmlld0xheW91dCxcbiAgeDogbnVtYmVyLFxuICB5OiBudW1iZXIsXG4gIHo6IG51bWJlcixcbiAgY3g6IG51bWJlcixcbiAgY3k6IG51bWJlcixcbiAgY3o6IG51bWJlcixcbiAgcjogbnVtYmVyXG4pOiBib29sZWFuIHtcbiAgLy8gVGhpcyBpcyB0aGUgc2FtZSB0ZXN0IHNldCBhcyB0aGUgbGlnaHQtY2VudHJpYyBidWlsZCwgYnV0IGV2YWx1YXRlZCBmb3Igb25lIGtub3duIGNsdXN0ZXI6IGVhY2ggdGVzdCBpcyB0aGVcbiAgLy8gcGxhbmUgb2Ygb25lIGJvcmRlciBvZiB0aGUgY2x1c3RlciwgYW5kIGEgYm9yZGVyIHRlc3QgaXMgc2tpcHBlZCB3aGVuIHRoZSBjbHVzdGVyIGlzIGF0IHRoZSBib3JkZXIgb2YgdGhlXG4gIC8vIGdyaWQgKHRob3NlIGNsdXN0ZXJzIGV4dGVuZCB0byBpbmZpbml0eSwgc28gdGhlIHNwaGVyZSBjYW4gbm90IGJlIG91dHNpZGUgdGhlbSBvbiB0aGF0IHNpZGUpLlxuICBpZiAoaXNTcGhlcmVCZWhpbmRFeWUoZHN0LCB2aWV3T2Zmc2V0LCBjeCwgY3ksIGN6LCByKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBjb25zdCByb3dYT2Zmc2V0ID0gdmlld09mZnNldDtcbiAgY29uc3Qgcm93WU9mZnNldCA9IHZpZXdPZmZzZXQgKyA0O1xuICBjb25zdCByb3dXT2Zmc2V0ID0gdmlld09mZnNldCArIDg7XG4gIC8vIFRoZSBsZWZ0IGJvcmRlciBvZiBjb2x1bW4geCwgYW5kIHRoZSByaWdodCBib3JkZXIgKHRoZSBsZWZ0IGJvcmRlciBvZiBjb2x1bW4geCArIDEgd2l0aCBhIGZsaXBwZWQgbm9ybWFsKS5cbiAgaWYgKHggPiAwICYmIHBsYW5lRGlzdGFuY2UoZHN0LCByb3dYT2Zmc2V0LCByb3dXT2Zmc2V0LCB4LCBmYWxzZSwgY3gsIGN5LCBjeikgPCAtcikgcmV0dXJuIGZhbHNlO1xuICBpZiAoeCA8IGxheW91dC5ncmlkWCAtIDEgJiYgcGxhbmVEaXN0YW5jZShkc3QsIHJvd1hPZmZzZXQsIHJvd1dPZmZzZXQsIHggKyAxLCB0cnVlLCBjeCwgY3ksIGN6KSA8IC1yKSByZXR1cm4gZmFsc2U7XG4gIGlmICh5ID4gMCAmJiBwbGFuZURpc3RhbmNlKGRzdCwgcm93WU9mZnNldCwgcm93V09mZnNldCwgeSwgZmFsc2UsIGN4LCBjeSwgY3opIDwgLXIpIHJldHVybiBmYWxzZTtcbiAgaWYgKHkgPCBsYXlvdXQuZ3JpZFkgLSAxICYmIHBsYW5lRGlzdGFuY2UoZHN0LCByb3dZT2Zmc2V0LCByb3dXT2Zmc2V0LCB5ICsgMSwgdHJ1ZSwgY3gsIGN5LCBjeikgPCAtcikgcmV0dXJuIGZhbHNlO1xuICAvLyBUaGUgZGVwdGggc2xpY2UgYm9yZGVycyBhcmUgZXhwb25lbnRpYWw6IGQgKyByIDwgenMoeikgbWVhbnMgdGhlIHNwaGVyZSBpcyBlbnRpcmVseSBpbiBmcm9udCBvZiB0aGUgc2xpY2UuXG4gIGNvbnN0IHNsaWNlU2NhbGUgPSBkc3Rbdmlld09mZnNldCArIDIwXTtcbiAgY29uc3Qgc2xpY2VCaWFzID0gZHN0W3ZpZXdPZmZzZXQgKyAyMV07XG4gIGNvbnN0IGQgPSBkc3Rbdmlld09mZnNldCArIDEyXSAqIGN4ICsgZHN0W3ZpZXdPZmZzZXQgKyAxM10gKiBjeSArIGRzdFt2aWV3T2Zmc2V0ICsgMTRdICogY3ogKyBkc3Rbdmlld09mZnNldCArIDE1XTtcbiAgaWYgKHogPiAwICYmIGQgKyByIDwgTWF0aC5leHAoKHogLSBzbGljZUJpYXMpIC8gc2xpY2VTY2FsZSkpIHJldHVybiBmYWxzZTtcbiAgaWYgKHogPCBsYXlvdXQuZ3JpZFogLSAxICYmIGQgLSByID4gTWF0aC5leHAoKHogKyAxIC0gc2xpY2VCaWFzKSAvIHNsaWNlU2NhbGUpKSByZXR1cm4gZmFsc2U7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKipcbiAqIFRoZSByZWZlcmVuY2UgaW1wbGVtZW50YXRpb24gb2YgdGhlIGNsdXN0ZXIgbG9va3VwIG9mIHRoZSBzaGFkZXJzIChgZ2V0TGlnaHRMaXN0YCBpbiBvcHRpY2FsRGVmaW5pdGlvbi5nbHNsIC9cbiAqIC53Z3NsKSwgdXNlZCBieSB0aGUgdGVzdHMgYW5kIGJ5IENQVS1zaWRlIGNvZGUgdGhhdCBuZWVkcyB0aGUgY2x1c3RlciBvZiBhIHBvc2l0aW9uLlxuICpcbiAqIEl0IHJlYWRzIHRoZSBzYW1lIGhlYWRlciByb3dzIGFzIHRoZSBzaGFkZXJzLCBzbyBhIGNoYW5nZSB0byBvbmUgZm9ybSBtdXN0IGJlIG1hZGUgdG8gdGhlIG90aGVyLlxuICpcbiAqIEByZXR1cm5zIFRoZSBjbHVzdGVyIGluZGV4LCBvciAtMSB3aGVuIHRoZSBwb3NpdGlvbiB1c2VzIHRoZSBhbGwtbGlnaHQgbGlzdCAoYmVoaW5kIHRoZSBleWUgcGxhbmUgb3Igb3ZlcmZsb3cpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxpZ2h0Q2x1c3RlckluZGV4KFxuICBkc3Q6IEZsb2F0MzJBcnJheSxcbiAgdmlld09mZnNldDogbnVtYmVyLFxuICBweDogbnVtYmVyLFxuICBweTogbnVtYmVyLFxuICBwejogbnVtYmVyXG4pOiBudW1iZXIge1xuICBjb25zdCBncmlkWCA9IGRzdFt2aWV3T2Zmc2V0ICsgMTZdO1xuICBjb25zdCBncmlkWSA9IGRzdFt2aWV3T2Zmc2V0ICsgMTddO1xuICBjb25zdCBncmlkWiA9IGRzdFt2aWV3T2Zmc2V0ICsgMThdO1xuICAvLyBzdGF0ZTogYW55dGhpbmcgb3RoZXIgdGhhbiAwIG1hcmtzIHRoZSB2aWV3IHVudXNhYmxlIChyZXNlcnZlZCBmb3IgZnV0dXJlIHVzZSwgZS5nLiBhIGRpc2FibGVkIHZpZXcpLlxuICBpZiAoZHN0W3ZpZXdPZmZzZXQgKyAxOV0gIT09IDApIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgY29uc3QgZG90ID0gKG86IG51bWJlcikgPT4gZHN0W29dICogcHggKyBkc3RbbyArIDFdICogcHkgKyBkc3RbbyArIDJdICogcHogKyBkc3RbbyArIDNdO1xuICAvLyBgd2AgaXMgdGhlIGV5ZS1wbGFuZSBkaXN0YW5jZTogZnJhZ21lbnRzIGJlaGluZCBpdCAodyA8PSAwKSB1c2UgdGhlIGFsbC1saWdodCBsaXN0LCBiZWNhdXNlIHRoZWlyIHByb2plY3Rpb25cbiAgLy8gdG8gc2NyZWVuIHNwYWNlIHdvdWxkIGJlIG1pcnJvcmVkIGFuZCB0aGUgY2x1c3RlciBsb29rdXAgd291bGQgYmUgbWVhbmluZ2xlc3MuXG4gIGNvbnN0IHcgPSBkb3Qodmlld09mZnNldCArIDgpO1xuICBpZiAoISh3ID4gMCkpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgLy8gdGlsZVggLyB0aWxlWSBhcmUgYWxyZWFkeSBpbiBncmlkIHVuaXRzICh0aGUgcm93cyB3ZXJlIHNjYWxlZCBieSAwLjUgKiBncmlkIGluIHRoZSBoZWFkZXIpLlxuICAvLyBDbGFtcGluZyBpcyBjb3JyZWN0IGJlY2F1c2UgdGhlIGJvcmRlciBjbHVzdGVycyBleHRlbmQgdG8gaW5maW5pdHkuXG4gIGNvbnN0IGNsYW1wID0gKHY6IG51bWJlciwgbWF4OiBudW1iZXIpID0+IE1hdGgubWluKE1hdGgubWF4KE1hdGguZmxvb3IodiksIDApLCBtYXggLSAxKTtcbiAgY29uc3QgeCA9IGNsYW1wKGRvdCh2aWV3T2Zmc2V0KSAvIHcsIGdyaWRYKTtcbiAgY29uc3QgeSA9IGNsYW1wKGRvdCh2aWV3T2Zmc2V0ICsgNCkgLyB3LCBncmlkWSk7XG4gIC8vIFRoZSBkZXB0aCBpcyBjbGFtcGVkIHRvIGEgcG9zaXRpdmUgdmFsdWUgYmVmb3JlIHRoZSBsb2cgKGEgcG9zaXRpb24gaW4gdGhlIGV5ZSBwbGFuZSBoYXMgZGVwdGggMCkuXG4gIGNvbnN0IGRlcHRoID0gTWF0aC5tYXgoZG90KHZpZXdPZmZzZXQgKyAxMiksIDFlLTMwKTtcbiAgY29uc3QgeiA9IGNsYW1wKE1hdGgubG9nKGRlcHRoKSAqIGRzdFt2aWV3T2Zmc2V0ICsgMjBdICsgZHN0W3ZpZXdPZmZzZXQgKyAyMV0sIGdyaWRaKTtcbiAgcmV0dXJuICh6ICogZ3JpZFkgKyB5KSAqIGdyaWRYICsgeDtcbn1cblxuLyoqXG4gKiBSZWFkcyB0aGUgbGlnaHQgZW50cmllcyBvZiBhIGNsdXN0ZXIgYnVpbHQgYnkgYGJ1aWxkTGlnaHRDbHVzdGVyc09uQ3B1YCAob3IgYnkgdGhlIGNvbXB1dGUgc2hhZGVyKS5cbiAqXG4gKiBUaGlzIGZvbGxvd3MgdGhlIHNhbWUgdHdvLWxldmVsIGxvb2t1cCBhcyB0aGUgc2hhZGVyczogdGhlIHRhYmxlIGVudHJ5IGdpdmVzIHRoZSB2ZWM0IG9mZnNldCBhbmQgdGhlIGVudHJ5IGNvdW50XG4gKiBvZiB0aGUgY2x1c3RlciwgYW5kIHRoZSBlbnRyaWVzIHRoZW1zZWx2ZXMgYXJlIHJlYWQgZnJvbSB0aGUgaW5kZXggbGlzdCBmcm9tIHRoYXQgb2Zmc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZExpZ2h0Q2x1c3RlckVudHJpZXMoXG4gIGRzdDogRmxvYXQzMkFycmF5LFxuICB2aWV3T2Zmc2V0OiBudW1iZXIsXG4gIGxheW91dDogTGlnaHRDbHVzdGVyVmlld0xheW91dCxcbiAgY2x1c3RlckluZGV4OiBudW1iZXJcbik6IG51bWJlcltdIHtcbiAgY29uc3QgdGFibGVPZmZzZXQgPSB2aWV3T2Zmc2V0ICsgTGlnaHRDbHVzdGVyTGF5b3V0LnZpZXdIZWFkZXJWZWM0Q291bnQgKiA0O1xuICBjb25zdCBpbmRleE9mZnNldCA9IHRhYmxlT2Zmc2V0ICsgbGF5b3V0LnRhYmxlVmVjNENvdW50ICogNDtcbiAgY29uc3Qgb2Zmc2V0VmVjNCA9IGRzdFt0YWJsZU9mZnNldCArIGNsdXN0ZXJJbmRleCAqIDRdO1xuICBjb25zdCBjb3VudCA9IGRzdFt0YWJsZU9mZnNldCArIGNsdXN0ZXJJbmRleCAqIDQgKyAxXTtcbiAgY29uc3QgZW50cmllczogbnVtYmVyW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgZW50cmllcy5wdXNoKGRzdFtpbmRleE9mZnNldCArIG9mZnNldFZlYzQgKiA0ICsgaV0pO1xuICB9XG4gIHJldHVybiBlbnRyaWVzO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBib3VuZGluZyBzcGhlcmUgb2YgYSBsaWdodCBmcm9tIHRoZSB2YWx1ZXMgdXBsb2FkZWQgdG8gdGhlIEdQVS5cbiAqIFJldHVybnMgdGhlIHJhZGl1cywgb3IgLTEgd2hlbiB0aGUgbGlnaHQgY2FuIG5vdCBiZSBjdWxsZWQgKGRpcmVjdGlvbmFsIGxpZ2h0cyBhbmQgbGlnaHRzIHdpdGhvdXQgcmFuZ2UpLlxuICpcbiAqIEBwYXJhbSBvdXQgLSBSZWNlaXZlcyAoY3gsIGN5LCBjeiwgcikgYXQgYG91dE9mZnNldGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMaWdodEJvdW5kaW5nU3BoZXJlKFxuICB0eXBlVmFsdWU6IG51bWJlcixcbiAgcG9zaXRpb246IEFycmF5TGlrZTxudW1iZXI+LFxuICBkaXJlY3Rpb246IEFycmF5TGlrZTxudW1iZXI+LFxuICByYW5nZTogbnVtYmVyLFxuICBvdXRlckNvbmVDb3M6IG51bWJlcixcbiAgb3V0OiBGbG9hdDY0QXJyYXksXG4gIG91dE9mZnNldDogbnVtYmVyXG4pOiBudW1iZXIge1xuICAvLyBUaGUgc2FtZSBjbGFzc2lmaWNhdGlvbiBhcyBnZXRMaWdodCgpIGluIHRoZSBzaGFkZXJzOiA+IDAuNzUgaXMgYSBwb2ludCBvciBzcG90IGxpZ2h0LCA+IDEuNzUgaXMgYSBzcG90IGxpZ2h0LlxuICBpZiAoISh0eXBlVmFsdWUgPiAwLjc1KSB8fCAhKHJhbmdlID4gMCkpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgbGV0IGN4ID0gcG9zaXRpb25bMF07XG4gIGxldCBjeSA9IHBvc2l0aW9uWzFdO1xuICBsZXQgY3ogPSBwb3NpdGlvblsyXTtcbiAgbGV0IHIgPSByYW5nZTtcbiAgaWYgKHR5cGVWYWx1ZSA+IDEuNzUpIHtcbiAgICAvLyBUaGUgbGl0IHJlZ2lvbiBvZiBhIHNwb3QgbGlnaHQgKHRoZSBjb25lIHNlY3RvciB3aXRoIHRoZSBzbGFudCBoZWlnaHQgYHJhbmdlYCkgaXMgaW5zaWRlIHRoZSBzcGhlcmVcbiAgICAvLyBjZW50ZXJlZCBvbiB0aGUgYXhpcyBhdCByYW5nZSAvICgyIGNvcyh0aGV0YSkpIHdpdGggdGhhdCByYWRpdXMuIEl0IGlzIHNtYWxsZXIgdGhhbiB0aGUgcmFuZ2Ugc3BoZXJlXG4gICAgLy8gd2hlbiB0aGUgaGFsZiBhbmdsZSBpcyBiZWxvdyA2MCBkZWdyZWVzLiBUaGUgc2hhZGVyIGRvZXMgbm90IG5vcm1hbGl6ZSB0aGUgZGlyZWN0aW9uLCBzbyB0aGlzIGlzIHVzZWRcbiAgICAvLyBvbmx5IHdoZW4gdGhlIGRpcmVjdGlvbiBpcyBhIHVuaXQgdmVjdG9yLlxuICAgIGNvbnN0IGR4ID0gZGlyZWN0aW9uWzBdO1xuICAgIGNvbnN0IGR5ID0gZGlyZWN0aW9uWzFdO1xuICAgIGNvbnN0IGR6ID0gZGlyZWN0aW9uWzJdO1xuICAgIGNvbnN0IGxlbmd0aCA9IE1hdGguaHlwb3QoZHgsIGR5LCBkeik7XG4gICAgaWYgKE1hdGguYWJzKGxlbmd0aCAtIDEpIDwgMWUtMyAmJiBvdXRlckNvbmVDb3MgPiAwLjUpIHtcbiAgICAgIGNvbnN0IHQgPSByYW5nZSAvICgyICogb3V0ZXJDb25lQ29zKTtcbiAgICAgIGN4ICs9IChkeCAvIGxlbmd0aCkgKiB0O1xuICAgICAgY3kgKz0gKGR5IC8gbGVuZ3RoKSAqIHQ7XG4gICAgICBjeiArPSAoZHogLyBsZW5ndGgpICogdDtcbiAgICAgIHIgPSB0O1xuICAgIH1cbiAgfVxuICAvLyBJbmZsYXRlIHRoZSBzcGhlcmUgYSBsaXR0bGUgc28gdGhhdCB0aGUgZmxvYXQgcHJlY2lzaW9uIG9mIHRoZSBzaGFkZXJzIG5ldmVyIGN1bGxzIGEgY29udHJpYnV0aW5nIGxpZ2h0LlxuICAvLyBUaGUgYXR0ZW51YXRpb24gaXMgZXhhY3RseSB6ZXJvIGJleW9uZCB0aGUgcmFuZ2UsIHNvIHRoaXMgZG9lcyBub3QgY2hhbmdlIHRoZSBpbWFnZS5cbiAgb3V0W291dE9mZnNldF0gPSBjeDtcbiAgb3V0W291dE9mZnNldCArIDFdID0gY3k7XG4gIG91dFtvdXRPZmZzZXQgKyAyXSA9IGN6O1xuICBvdXRbb3V0T2Zmc2V0ICsgM10gPSByICogMS4wMDE7XG4gIHJldHVybiBvdXRbb3V0T2Zmc2V0ICsgM107XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQUEsU0FBUywwQkFBdUQ7QUFtRHpELFNBQVMsK0JBQStCLFFBQTBEO0FBQ3ZHLFNBQU87QUFBQSxJQUNMLG9CQUFvQjtBQUFBLElBQ3BCLFFBQVEsSUFBSSxZQUFZLE9BQU8sWUFBWTtBQUFBLElBQzNDLFNBQVMsSUFBSSxZQUFZLE9BQU8sWUFBWTtBQUFBLElBQzVDLGlCQUFpQixJQUFJLGFBQWEsT0FBTyxRQUFRLENBQUM7QUFBQSxJQUNsRCxTQUFTLElBQUks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
