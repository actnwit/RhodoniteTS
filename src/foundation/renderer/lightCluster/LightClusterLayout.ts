/**
 * Memory layout of the Clustered Forward light data.
 *
 * All values are stored as 32-bit floats in the GPU instance data (the data texture in WebGL2,
 * the storage buffer in WebGPU) and read with `fetchElement(vec4Index)` / `get_clusteredLightData(0u, idx)`.
 * Integers are below 2^24 and are therefore represented exactly.
 *
 * ## Global property `clusteredLightData` (always present)
 * ```
 * [0]   (allCount, globalCount, localCount, sphereBase)
 * [1..] allList: light entries, 4 entries per vec4.
 *       The lights that can not be culled (directional lights, lights without range) come first,
 *       then the local lights. Both groups are sorted by the light component SID.
 * ```
 * `sphereBase` is the absolute vec4 index of the local light spheres (only written when the clusters are built
 * on the GPU), -1 otherwise.
 *
 * ## Light entry
 * `entry = lightComponentSID + 65536 * (shadowSlot + 1)` (`shadowSlot` is -1 when the light has no shadow slot).
 *
 * ## View region (one per camera, allocated on demand, referenced by `CameraComponent.lightClusterViewInfo.x`)
 * ```
 * [0] rowX      0.5 * gridX * (clipRow0 + clipRow3): tileX = floor(dot(rowX, p) / dot(rowW, p))
 * [1] rowY      0.5 * gridY * (clipRow1 + clipRow3)
 * [2] rowW      clipRow3
 * [3] rowDepth  normalized view depth row: depth = dot(rowDepth, p) (positive in front of the camera)
 * [4] (gridX, gridY, gridZ, state)        state: 0 = valid, 1 = overflow (use the all-light list)
 * [5] (sliceScale, sliceBias, zNear, zFar) slice = floor(log(depth) * sliceScale + sliceBias)
 * [6..] cluster table: one vec4 per cluster, (offset, count, 0, 0).
 *       offset is the vec4 index of the list of the cluster from the index list start.
 * [6 + clusterCount..] index list: 4 entries per vec4. The list of each cluster starts at a vec4 boundary and the
 *       rest of its last vec4 is zero.
 * ```
 * The cluster index is `(z * gridY + y) * gridX + x`. The clusters at the borders of the grid extend to infinity,
 * so clamping the cluster coordinates of a fragment is always correct.
 *
 * Every cluster owns whole vec4s of the table and of the index list, so the compute shaders never write to a vec4
 * that another invocation writes (some backends store a vector component by rewriting the whole vector).
 */
export const LightClusterLayout = {
  /** The radix used to pack the shadow slot into a light entry. */
  entryRadix: 65536,
  /** The maximum number of lights in the light list (light component SIDs must be below the radix). */
  maxLightListLength: 65535,
  /** The number of vec4 of the header of the global property. */
  globalHeaderVec4Count: 1,
  /** The number of vec4 of the header of a view region. */
  viewHeaderVec4Count: 6,
  /** The vec4 offset of the grid info (gridX, gridY, gridZ, state) in a view region. */
  viewGridOffset: 4,
  /** The vec4 offset of the slice info (sliceScale, sliceBias, zNear, zFar) in a view region. */
  viewSliceOffset: 5,
  /** The state of a view whose light index list overflowed. */
  stateOverflow: 1,
} as const;

/**
 * Clamps the length of the light list to the supported range.
 */
export function getLightListCapacity(maxLightListLength: number) {
  return Math.max(1, Math.min(Math.floor(maxLightListLength), LightClusterLayout.maxLightListLength));
}

/**
 * Returns the array length (in vec4) of the `clusteredLightData` global property.
 */
export function getLightClusterGlobalPropertyLength(maxLightListLength: number) {
  return LightClusterLayout.globalHeaderVec4Count + Math.ceil(getLightListCapacity(maxLightListLength) / 4);
}

/**
 * Packs a light component SID and a shadow slot into a light entry.
 */
export function packLightEntry(lightComponentSid: number, shadowSlot: number) {
  return lightComponentSid + LightClusterLayout.entryRadix * (shadowSlot + 1);
}

/**
 * Unpacks a light entry into the light component SID and the shadow slot (-1 = no shadow slot).
 */
export function unpackLightEntry(entry: number): [number, number] {
  const lightComponentSid = entry % LightClusterLayout.entryRadix;
  const shadowSlot = Math.floor(entry / LightClusterLayout.entryRadix) - 1;
  return [lightComponentSid, shadowSlot];
}

/**
 * The sizes of a view region (in vec4).
 */
export type LightClusterViewLayout = {
  gridX: number;
  gridY: number;
  gridZ: number;
  clusterCount: number;
  tableVec4Count: number;
  indexCapacity: number;
  indexVec4Count: number;
  viewVec4Count: number;
};

/**
 * Computes the sizes of a view region from the grid size and the number of lights per cluster the light index list
 * is sized for. The list is shared by the clusters, and each cluster pads its list to a multiple of 4 entries, so
 * the list never overflows while no cluster has more lights than `lightCapacityPerCluster`.
 */
export function getLightClusterViewLayout(
  gridSize: readonly [number, number, number],
  lightCapacityPerCluster: number
): LightClusterViewLayout {
  const gridX = Math.max(1, Math.floor(gridSize[0]));
  const gridY = Math.max(1, Math.floor(gridSize[1]));
  const gridZ = Math.max(1, Math.floor(gridSize[2]));
  const clusterCount = gridX * gridY * gridZ;
  const tableVec4Count = clusterCount;
  const indexVec4Count = clusterCount * Math.max(1, Math.ceil(Math.floor(lightCapacityPerCluster) / 4));
  const indexCapacity = indexVec4Count * 4;
  return {
    gridX,
    gridY,
    gridZ,
    clusterCount,
    tableVec4Count,
    indexCapacity,
    indexVec4Count,
    viewVec4Count: LightClusterLayout.viewHeaderVec4Count + tableVec4Count + indexVec4Count,
  };
}
