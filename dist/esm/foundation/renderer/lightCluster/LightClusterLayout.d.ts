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
 * `sphereBase` is -1 (the GPU cluster build receives its own sorted light input in a separate storage buffer).
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
 * [4] (gridX, gridY, gridZ, state)        state: 0 (valid; reserved)
 * [5] (sliceScale, sliceBias, zNear, zFar) slice = floor(log(depth) * sliceScale + sliceBias)
 * [6..] cluster table: one vec4 per cluster, (offset, count, 0, 0).
 *       offset is the vec4 index of the list of the cluster from the index list start.
 * [6 + clusterCount..] index list: 4 entries per vec4.
 *       The CPU build packs the lists densely (offset is the exclusive prefix sum of the cluster counts); the WebGPU
 *       build gives every cluster its own `ceil(clusterLightCapacity / 4)` vec4s (offset = cluster * that). The rest
 *       of the last vec4 of a list is zero.
 * ```
 * The cluster index is `(z * gridY + y) * gridX + x`. The clusters at the borders of the grid extend to infinity,
 * so clamping the cluster coordinates of a fragment is always correct.
 *
 * Every cluster owns whole vec4s of the table and of the index list, so the compute shaders never write to a vec4
 * that another invocation writes (some backends store a vector component by rewriting the whole vector).
 */
export declare const LightClusterLayout: {
    /** The radix used to pack the shadow slot into a light entry. */
    readonly entryRadix: 65536;
    /** The maximum number of lights in the light list (light component SIDs must be below the radix). */
    readonly maxLightListLength: 65535;
    /** The number of vec4 of the header of the global property. */
    readonly globalHeaderVec4Count: 1;
    /** The number of vec4 of the header of a view region. */
    readonly viewHeaderVec4Count: 6;
    /** The vec4 offset of the grid info (gridX, gridY, gridZ, state) in a view region. */
    readonly viewGridOffset: 4;
    /** The vec4 offset of the slice info (sliceScale, sliceBias, zNear, zFar) in a view region. */
    readonly viewSliceOffset: 5;
};
/**
 * Clamps the length of the light list to the supported range.
 */
export declare function getLightListCapacity(maxLightListLength: number): number;
/**
 * Returns the array length (in vec4) of the `clusteredLightData` global property.
 *
 * The light entries are read 4 at a time (`entries[n >> 2][n & 3]` in the shaders), so the list is rounded up to
 * whole vec4s: the last vec4 can hold fewer than 4 lights.
 */
export declare function getLightClusterGlobalPropertyLength(maxLightListLength: number): number;
/**
 * Packs a light component SID and a shadow slot into a light entry.
 *
 * The SID is stored in the low 16 bits and `shadowSlot + 1` above them, so -1 (no shadow slot) is representable
 * without a sign. The shaders unpack the same way: `(entry & 0xFFFF, (entry >> 16) - 1)`.
 * The value stays below 2^24, so a float32 stores it exactly.
 */
export declare function packLightEntry(lightComponentSid: number, shadowSlot: number): number;
/**
 * Unpacks a light entry into the light component SID and the shadow slot (-1 = no shadow slot).
 */
export declare function unpackLightEntry(entry: number): [number, number];
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
    /** The maximum number of lights stored in one cluster. */
    clusterLightCapacity: number;
    viewVec4Count: number;
};
/**
 * Computes the sizes of a view region from the grid size and the number of lights per cluster the light index list
 * is sized for. The list is shared by the clusters, and each cluster pads its list to a multiple of 4 entries, so
 * the list never overflows while no cluster has more lights than `lightCapacityPerCluster`.
 */
export declare function getLightClusterViewLayout(gridSize: readonly [number, number, number], lightCapacityPerCluster: number): LightClusterViewLayout;
/**
 * Splits the byte range `[start, end)` into the parts outside the excluded ranges.
 *
 * The rendering strategies use this to upload the whole GPU instance data in one call while leaving out the
 * regions owned by the light cluster system: the cluster tables are large, are unchanged for many frames and
 * may be written by compute shaders, so they are uploaded (or not uploaded) separately as dirty ranges.
 *
 * @param excluded - Ranges `[start, end)` sorted by their start
 * @returns The remaining ranges `[start, end)` in ascending order
 */
export declare function subtractByteRanges(start: number, end: number, excluded: readonly [number, number][]): [number, number][];
