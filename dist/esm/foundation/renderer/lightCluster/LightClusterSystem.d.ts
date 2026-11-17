import type { Engine } from '../../system/Engine';
import type { Expression } from '../Expression';
import { type LightClusterViewLayout } from './LightClusterLayout';
/**
 * The parameters of the light cluster build on the GPU (WebGPU compute shaders).
 *
 * @internal
 */
export type LightClusterGpuBuildView = {
    /** The vec4 index of the view region to build. */
    viewVec4Base: number;
    /** The number of local lights of the view. */
    localCount: number;
    /** The float offset of the view in `data`. */
    dataOffset: number;
};
export type LightClusterGpuBuildParams = {
    views: readonly LightClusterGpuBuildView[];
    /** The sorted light spheres, entries and Z slice ranges of the views, `dataStride` floats per view. */
    data: Float32Array;
    dataStride: number;
    /** The maximum number of local lights stored in the build data of a view. */
    localCapacity: number;
    layout: LightClusterViewLayout;
};
/**
 * Builds the light lists of Clustered Forward rendering once per frame.
 *
 * - Every enabled light is written to the all-light list of the `clusteredLightData` global property
 *   (lights that can not be culled first, then the local lights, each sorted by the component SID).
 * - For each camera used by the render passes of the frame (up to `Config.clusteredForwardMaxViewNumber`),
 *   a view region with the cluster grid is built when there are local lights, and the camera's
 *   `lightClusterViewInfo` points to it. Other cameras use the all-light list.
 *
 * The light data is read from the GPU instance data of the light components (the values the shaders see),
 * so the clusters always match the lights the shaders evaluate.
 *
 * The data lives in the GPU instance data, so it is uploaded by the rendering strategy. `dataVersion` changes
 * whenever this system writes the data, and the strategies upload the data when it changes.
 */
export declare class LightClusterSystem {
    private __engine;
    private __dataVersion;
    private __globalData?;
    private __globalDataVec4Base;
    private __capacity;
    private __layout?;
    private __scratch?;
    private __entries;
    private __prevEntries;
    private __spheres;
    private __prevSpheres;
    private __localEntries;
    private __allCount;
    private __globalCount;
    private __localCount;
    /** The number of local lights that emit light (counted for Config.clusteredForwardMinLocalLightNumber). */
    private __emittingLocalCount;
    private __prevAllCount;
    private __prevGlobalCount;
    private __prevSphereVec4Base;
    private __viewRegions;
    /** The camera component SID of each view slot (-1: free). */
    private __slotCameraSids;
    /** Whether each view slot holds valid clusters for its camera, the current lights and the matrices below. */
    private __slotValid;
    /** The view and projection matrices each view slot was built with. */
    private __slotMatrices;
    /** The cameras whose `lightClusterViewInfo` currently points to a view region. */
    private __camerasWithView;
    private __isAllocationFailed;
    private __isCapacityWarned;
    /** The order of the local lights of the view being built, sorted by view depth when the number of lights is large. */
    private __sortOrder;
    private __sortDepths;
    private __sortedSpheres;
    private __sortedEntries;
    private __sliceRanges;
    /** The GPU build inputs (sorted spheres, entries and slice ranges) of the views, stored per view slot. */
    private __gpuBuildData;
    private __gpuBuildStride;
    private __gpuBuildViews;
    /** The number of local lights of the view built in each slot. */
    private __slotLocalCounts;
    /**
     * The byte ranges (in the GPU instance data) of the cluster tables and light index lists of the views. They are
     * large and written by this system or the compute shaders, so the generic upload of the GPU instance data skips them.
     */
    private __excludedByteRanges;
    /** The byte ranges built on the CPU since the last upload, which the rendering strategy uploads separately. */
    private __dirtyByteRanges;
    /** The data of `u_lightClusterView` of the WebGL2 shaders (7 vec4). */
    private __viewUniformData;
    constructor(engine: Engine);
    /**
     * Incremented whenever this system writes to the GPU instance data.
     */
    get dataVersion(): number;
    /**
     * Whether the cluster tables are built by WebGPU compute shaders instead of the CPU.
     */
    get isGpuBuild(): boolean;
    /**
     * The parameters of the views to build on the GPU, or undefined when nothing has to be built on the GPU.
     *
     * @internal
     */
    _getGpuBuildParams(): LightClusterGpuBuildParams | undefined;
    /**
     * The byte ranges of the GPU instance data that the generic upload must skip, sorted by the start.
     * The ranges are uploaded by `_takeDirtyByteRanges` (CPU build) or written by the compute shaders (GPU build).
     *
     * @internal
     */
    _getExcludedByteRanges(): readonly [number, number][];
    /**
     * Returns the byte ranges of the GPU instance data built on the CPU since the last call, and clears them.
     * The rendering strategy uploads them after the generic upload.
     *
     * @internal
     */
    _takeDirtyByteRanges(): [number, number][];
    /**
     * Returns the data of the `u_lightClusterView` uniform of the WebGL2 shaders for a camera: the view header
     * (6 vec4) and (vec4 index of the view, 0, 0, 0), or a view index of -1 when the camera has no light clusters.
     * The returned array is reused.
     *
     * @internal
     */
    _getViewUniformData(cameraSid: number): Float32Array;
    /**
     * Updates the light lists for the render passes of this frame.
     * This must be called after the Logic stage (the light and camera data are final) and before the strategy
     * uploads the GPU instance data.
     *
     * @param expressions - The expressions rendered in this frame
     */
    update(expressions: readonly Expression[]): void;
    private __initialize;
    /**
     * Collects the enabled lights into the all-light list and the local light spheres.
     * @returns true if the lists changed since the previous frame
     */
    private __collectLights;
    private __writeGlobalData;
    /**
     * Lists the cameras of the render passes that may draw lit materials, in the order of the render passes.
     * The rules are the same as the camera selection of the rendering strategies.
     */
    private __collectCameras;
    /**
     * Assigns the view slots to the cameras, builds the views whose inputs changed and updates the
     * `lightClusterViewInfo` of the cameras.
     * @returns true if anything was written
     */
    private __assignViews;
    /**
     * Prepares the light order and the Z slice ranges of a view for the builders.
     *
     * The lights are sorted by their view depth when there are more local lights than the capacity of a cluster, so
     * that a cluster which is full keeps its nearest lights. Otherwise the light component SID order is kept (no
     * cluster can be full), which keeps the result identical to a build without a capacity.
     *
     * For the GPU build, the sorted spheres, entries and ranges are copied to the GPU build data of the view.
     */
    private __prepareViewBuild;
    /**
     * Allocates a region in the GPU instance data. Returns undefined (and disables the clusters) when it fails.
     */
    private __allocate;
}
