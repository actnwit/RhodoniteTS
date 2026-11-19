import { type LightClusterViewLayout } from './LightClusterLayout';
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
export declare function createLightClusterBuildScratch(layout: LightClusterViewLayout): LightClusterBuildScratch;
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
export declare function writeLightClusterViewHeader(dst: Float32Array, viewOffset: number, viewMatrix: ArrayLike<number>, projectionMatrix: ArrayLike<number>, spheres: ArrayLike<number>, localCount: number, layout: LightClusterViewLayout, visibleNearDepth?: number, visibleFarDepth?: number): void;
/**
 * Builds the cluster table and the light index list of a view whose header has been written.
 *
 * The lights of each cluster are stored in the order of `localEntries`. The caller passes the lights sorted by their
 * view depth (nearest first) when the number of local lights exceeds the capacity, so that a cluster which is full
 * keeps its nearest lights. Every cluster keeps at most `layout.clusterLightCapacity` lights, so the list cannot
 * overflow.
 */
export declare function buildLightClustersOnCpu(dst: Float32Array, viewOffset: number, layout: LightClusterViewLayout, spheres: ArrayLike<number>, localEntries: ArrayLike<number>, localCount: number, scratch: LightClusterBuildScratch): LightClusterBuildResult;
/**
 * The cluster-centric form of the assignment test (the form the WebGPU compute shader uses).
 * It must agree with the light-centric build of `buildLightClustersOnCpu`.
 */
export declare function sphereIntersectsLightCluster(dst: Float32Array, viewOffset: number, layout: LightClusterViewLayout, x: number, y: number, z: number, cx: number, cy: number, cz: number, r: number): boolean;
/**
 * The reference implementation of the cluster lookup of the shaders (`getLightList` in opticalDefinition.glsl /
 * .wgsl), used by the tests and by CPU-side code that needs the cluster of a position.
 *
 * It reads the same header rows as the shaders, so a change to one form must be made to the other.
 *
 * @returns The cluster index, or -1 when the position uses the all-light list (behind the eye plane or overflow).
 */
export declare function computeLightClusterIndex(dst: Float32Array, viewOffset: number, px: number, py: number, pz: number): number;
/**
 * Reads the light entries of a cluster built by `buildLightClustersOnCpu` (or by the compute shader).
 *
 * This follows the same two-level lookup as the shaders: the table entry gives the vec4 offset and the entry count
 * of the cluster, and the entries themselves are read from the index list from that offset.
 */
export declare function readLightClusterEntries(dst: Float32Array, viewOffset: number, layout: LightClusterViewLayout, clusterIndex: number): number[];
/**
 * Computes the bounding sphere of a light from the values uploaded to the GPU.
 * Returns the radius, or -1 when the light can not be culled (directional lights and lights without range).
 *
 * @param out - Receives (cx, cy, cz, r) at `outOffset`
 */
export declare function computeLightBoundingSphere(typeValue: number, position: ArrayLike<number>, direction: ArrayLike<number>, range: number, outerConeCos: number, out: Float64Array, outOffset: number): number;
