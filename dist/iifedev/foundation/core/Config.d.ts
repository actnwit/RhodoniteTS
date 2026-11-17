/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */
import type { BoneDataTypeEnum } from '../definitions/BoneDataType';
import { LogLevel } from '../misc/Logger';
type ConfigInitDescription = {
    scenegraphComponentCountPerBufferView?: number;
    skeletalComponentCountPerBufferView?: number;
    cameraComponentCountPerBufferView?: number;
    lightComponentCountPerBufferView?: number;
    maxLightNumber?: number;
    materialCountPerBufferView?: number;
    boneDataType?: BoneDataTypeEnum;
    isUboEnabled?: boolean;
    eventTargetDom?: HTMLElement;
    cacheWebGpuRenderBundles?: boolean;
    cgApiDebugConsoleOutput?: boolean;
    multiViewForWebVR?: boolean;
    physicsTimeIntervalScale?: number;
    isMobile?: boolean;
    bufferSizeDivisionRatiosForGPUInstanceDataUsage?: number[];
    logLevel?: LogLevel;
    isMultiDrawEnabled?: boolean;
    isDepthPrepassEnabled?: boolean;
    isClusteredForwardEnabled?: boolean;
    clusteredForwardBuildMode?: ClusteredForwardBuildMode;
    clusteredForwardGridSize?: [number, number, number];
    clusteredForwardMaxViewNumber?: number;
    clusteredForwardLightCapacityPerCluster?: number;
    clusteredForwardMinLocalLightNumber?: number;
    clusteredForwardLightSelection?: ClusteredForwardLightSelection;
    maxLightListLength?: number;
    lightAutoRangeThreshold?: number;
    lightRangeAdjustmentLevel?: LightRangeAdjustmentLevel;
};
/**
 * Where the light clusters of Clustered Forward rendering are built.
 * - `'auto'`: WebGPU builds them with compute shaders, WebGL2 builds them on the CPU.
 * - `'cpu'`: Both backends build them on the CPU.
 */
export type ClusteredForwardBuildMode = 'auto' | 'cpu';
/**
 * How much {@link Config.lightRangeAdjustmentLevel} shortens the range of point and spot lights.
 * - 0: No adjustment.
 * - 1: Mild (range x0.9, intensity x1.16).
 * - 2: Performance first (range x0.8, intensity x1.35).
 */
export type LightRangeAdjustmentLevel = 0 | 1 | 2;
/**
 * How the lights are selected when a cluster reaches {@link Config.clusteredForwardLightCapacityPerCluster}.
 * - `'nearest'`: keep the lights nearest to the camera (the historical behavior).
 * - `'contribution'`: keep the lights that contribute most to the cluster, approximated from their intensity,
 *   range window and distance to the cluster's 2D tile group. WebGPU only; the WebGL2/CPU build keeps the
 *   nearest lights.
 */
export type ClusteredForwardLightSelection = 'nearest' | 'contribution';
/**
 * Config is a configuration class that contains the configuration for the library.
 */
export declare class Config {
    /**　The number of scenegraph components per buffer view */
    scenegraphComponentCountPerBufferView: number;
    /**　The number of skeletal components per buffer view */
    skeletalComponentCountPerBufferView: number;
    /**　The number of camera components per buffer view */
    cameraComponentCountPerBufferView: number;
    /**
     * The number of light components per buffer view.
     * Every new buffer view changes the generated shader getters and recompiles all shaders,
     * so this is large enough for scenes with many lights.
     */
    lightComponentCountPerBufferView: number;
    /**
     * The maximum number of lights that can cast shadows at the same time.
     * This is also the length of the per-light arrays of the MToon 0.x shader.
     *
     * @remarks
     * 0 disables the per-light shadow map slots: the shaders compile out the shadow sampling and no shadow map
     * textures are created. The shader arrays themselves cannot have a length of 0, so they use
     * {@link Config.maxLightNumberOrOne} instead. Negative and NaN values are treated as 0.
     */
    private __maxLightNumber;
    /** See {@link Config.maxLightNumber}. */
    get maxLightNumber(): number;
    /** See {@link Config.maxLightNumber}. */
    set maxLightNumber(value: number);
    /**
     * The length-safe value of {@link Config.maxLightNumber}: `maxLightNumber`, or 1 when it is 0.
     *
     * @remarks
     * Shader arrays, material parameters and texture arrays cannot have a length of 0. The shaders use this value
     * for their per-light array sizes and loop bounds. Shadow processing itself is controlled by
     * {@link Config.maxLightNumber}: when it is 0, the shadow code is compiled out and no shadow slots are assigned.
     */
    get maxLightNumberOrOne(): number;
    /**
     * Whether Clustered Forward rendering is enabled.
     * When enabled, each fragment evaluates only the lights whose range reaches the cluster (froxel) of the fragment.
     * Lights without a range limit and directional lights are always evaluated.
     */
    isClusteredForwardEnabled: boolean;
    /** Where the light clusters are built. See {@link ClusteredForwardBuildMode}. */
    clusteredForwardBuildMode: ClusteredForwardBuildMode;
    /**
     * The number of clusters along the screen X, screen Y and view depth axes.
     *
     * @remarks
     * The default puts about a 40 pixel tile on a 1920x1080 canvas. The screen tiles should stay roughly 30-40 pixels
     * at the rendered resolution: a coarser grid lets many lights share each cluster (the cost is paid by every
     * fragment), and a finer grid increases the per-frame cluster build cost (the cost is paid once per frame, and the
     * build is proportional to the cluster count in the current implementation).
     */
    clusteredForwardGridSize: [number, number, number];
    /**
     * The maximum number of cameras whose light clusters are built in one frame.
     * The other cameras evaluate all lights.
     */
    clusteredForwardMaxViewNumber: number;
    /**
     * The light clusters are built only when the number of lights that can be culled (point and spot lights with a
     * range, including an automatic range of {@link Config.lightAutoRangeThreshold}) and emit light (an intensity
     * greater than 0) is at least this value. With fewer lights, every fragment evaluates all lights as in plain forward
     * rendering, which skips the cluster build and the cluster lookup of the fragment shaders.
     *
     * @remarks
     * The default value 1 is the measured break-even point of both backends: on Apple M2 Max (Chrome, ANGLE-Metal /
     * Dawn-Metal) with a full-screen 2048x2048 PBR surface, the GPU frame time with and without clusters was
     * (ratio = clustered / plain forward, lower is better; a range is the spread of several runs):
     *
     * | Lights | WebGL2 (radius 3 / 6)  | WebGPU (radius 3 / 6) |
     * |--------|------------------------|-----------------------|
     * | 1      | 0.90-0.92 / 0.82-1.09  | 0.83 / 0.92           |
     * | 2      | 0.64 / 0.76-0.84       | 0.61 / 0.76           |
     * | 3      | 0.62 / 0.72            | 0.49 / 0.66           |
     * | 8      | 0.42 / 0.62            | 0.32 / 0.51           |
     *
     * (A light with the radius 3 or 6 covers about 7% or 28% of the screen.) The cluster lookup costs about half a
     * light in both backends. The Classic shader and a moving camera (clusters rebuilt every frame) gave the same
     * break-even points. Lights that cover the whole screen can not be culled, so clustering them is always a few
     * percent slower (WebGL2 2-3%, WebGPU 1-11%) whatever this value is. Raise this value for such scenes.
     * Other GPUs may differ.
     */
    clusteredForwardMinLocalLightNumber: number;
    /**
     * The maximum number of lights in the list of each cluster.
     *
     * @remarks
     * Every cluster keeps at most this many lights. When the number of local lights is greater than this value, the
     * lights are sorted by their view depth and each cluster keeps the nearest ones, so the lights that are dropped
     * are the farthest ones. The cost of a fragment is bounded by this value.
     *
     * Memory per camera: about `16 * clusterCount * ceil(value / 4)` bytes, where clusterCount is the product of
     * {@link Config.clusteredForwardGridSize} (62,208 by default). The default 96 is about 25 MB per camera.
     */
    clusteredForwardLightCapacityPerCluster: number;
    /**
     * How the lights are selected when a cluster reaches {@link Config.clusteredForwardLightCapacityPerCluster}.
     *
     * @remarks
     * `'nearest'` (default) keeps the lights nearest to the camera, which is the historical behavior. `'contribution'`
     * keeps the lights that contribute most to the cluster, approximated from the intensity, the range window and the
     * distance to the 2D tile group of the cluster. It allows a smaller capacity with less visible darkening. The
     * selection is done in the WebGPU compute build; the WebGL2/CPU build keeps the nearest lights.
     */
    clusteredForwardLightSelection: ClusteredForwardLightSelection;
    /** The maximum number of enabled lights that are shaded. The other lights are ignored. (max: 65535) */
    maxLightListLength: number;
    /**
     * When greater than 0, point and spot lights without a range get an effective range where their intensity
     * (the maximum of color * intensity, divided by the squared distance) falls to this value.
     * This makes those lights fade out smoothly at that distance and lets Clustered Forward rendering cull them.
     * 0 (default) disables it. Lights with a range and directional lights are not affected.
     *
     * @remarks
     * The effective range is `R = sqrt(max(color) * intensity / lightAutoRangeThreshold)`. With the range window
     * of the shaders (`(1 - (d / R)^4) / d^2`), the difference from the unlimited inverse-square falloff at the
     * distance `d` is `lightAutoRangeThreshold * (d / R)^2`. So this value is the upper bound of the error added to
     * the linear brightness (for the diffuse lighting of a white surface facing the light). The error is largest at
     * the border of the range and smaller inside it.
     *
     * Reference values (without tone mapping, exposure 1):
     *
     * | Value  | Range (intensity 1 / 10) | Effect on the image |
     * |--------|--------------------------|---------------------|
     * | 0.0003 | 58 / 183                 | Practically lossless, but the range is so large that the lights are rarely culled. |
     * | 0.001  | 32 / 100                 | At most about 3/255 even on a black background. Not noticeable on lit surfaces. Recommended starting point. |
     * | 0.003  | 18 / 58                  | Hardly noticeable in scenes with ambient light or IBL. |
     * | 0.01   | 10 / 32                  | On a dark background, the tail of the light fades out a little early. About 3/255 on lit surfaces. |
     *
     * Tips:
     * - Compare the resulting range with the visible area and the spacing of the lights. A range larger than them
     *   puts the light in almost every cluster, so it does not make rendering faster.
     * - Scale the value with the brightness level of the scene. For example, when the light intensities are in the
     *   hundreds and the exposure brings them down, scale the value by the same factor. About 1/300 to 1/1000 of the
     *   typical brightness of the scene is a good guide.
     * - Use a smaller value for dark scenes or when the exposure brightens dark areas, where the cut-off tail is
     *   more noticeable.
     * - The error of specular highlights on glossy surfaces can be larger than the table above, but the light is
     *   weak near the border of the range, so it is rarely noticeable.
     * - Set this when initializing the engine. A change at runtime takes effect for each light when the light is
     *   updated next.
     */
    lightAutoRangeThreshold: number;
    /**
     * Shortens the effective range of the point and spot lights, and raises their intensity to compensate.
     * A shorter range reaches fewer clusters, so fewer fragments evaluate the light in Clustered Forward rendering.
     *
     * @remarks
     * | Level | Range   | Intensity | GPU frame time (measured)  |
     * |-------|---------|-----------|----------------------------|
     * | 0     | x1      | x1        | 5.5-6.4 ms                 |
     * | 1     | x0.9    | x1.16     | 4.2-4.5 ms (-20 to -24%)   |
     * | 2     | x0.8    | x1.35     | 3.1-3.2 ms (-43 to -50%)   |
     *
     * The measurement is a Sponza scene with 1000 animated point lights (WebGPU, 1920x1080, clustered forward). The
     * intensity factors were chosen by comparing screenshots until the brightness looked close to level 0. A
     * constant factor cannot compensate the range window exactly: with a shorter range the falloff
     * `(1 - (d / range)^4)^4 / d^2` is slightly dimmer at mid distances, and the lights fade out closer to their
     * centers. Level 1 changes only 0.1% of the pixels by more than 32/255. Level 2 changes about 7% of the pixels that
     * much (the lit area of each light becomes smaller), so use it only when the frame rate matters more than the
     * exact light distribution.
     *
     * Only point and spot lights with a positive effective range are adjusted. Directional lights and lights without
     * a range limit are unchanged. The values of `LightComponent.range` and `LightComponent.intensity` themselves are
     * not modified: only the values uploaded to the GPU (and read by the light clusters and the shaders) are scaled,
     * so all rendering paths see the same light.
     *
     * Set this when initializing the engine. A change at runtime takes effect for each light when the light is
     * updated next.
     */
    private __lightRangeAdjustmentLevel;
    /** See {@link Config.lightRangeAdjustmentLevel}. */
    get lightRangeAdjustmentLevel(): LightRangeAdjustmentLevel;
    /** See {@link Config.lightRangeAdjustmentLevel}. */
    set lightRangeAdjustmentLevel(value: LightRangeAdjustmentLevel);
    /**
     * Number of instances of each material type to be placed consecutively in memory.
     * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
     * If this limit is exceeded, the material type is internally treated as a separate material type.
     */
    materialCountPerBufferView: number;
    /**
     * Forces the bone data type of all SkeletalComponents.
     * When undefined (default), each SkeletalComponent uses its own bone data type
     * (see SkeletalComponent.setBoneDataType). Importers choose Vec4x1 or Vec4x2 automatically,
     * and other SkeletalComponents default to Vec4x2.
     */
    boneDataType: BoneDataTypeEnum | undefined;
    /**　Whether the UBO is enabled */
    isUboEnabled: boolean;
    /**　The event target DOM for mouse operation */
    eventTargetDom: HTMLElement | undefined;
    /**　Whether to cache the WebGPU render bundles */
    cacheWebGpuRenderBundles: boolean;
    /**　Whether to output the CG API debug console */
    cgApiDebugConsoleOutput: boolean;
    /**　Whether to enable multi-view extension for WebVR */
    multiViewForWebVR: boolean;
    /**　The scale of the physics time interval */
    physicsTimeIntervalScale: number;
    /**　Whether the device is a mobile device */
    isMobile: boolean;
    /** The buffer size division ratios for GPU instance data usage */
    bufferSizeDivisionRatiosForGPUInstanceDataUsage: number[];
    /** The minimum log level that will be output. Messages below this level are ignored. */
    logLevel: LogLevel;
    /**
     * Whether to enable WebGL multi-draw rendering.
     * When enabled (and supported), primitives sharing a source Buffer are merged into shared
     * vertex/index buffers and consecutive draws with the same state are issued with WEBGL_multi_draw.
     */
    isMultiDrawEnabled: boolean;
    /**
     * Whether to render a depth prepass for the opaque primitives of the main render passes (WebGPU only).
     *
     * @remarks
     * The prepass draws the opaque primitives with a depth-only pipeline before the color pass, and the color pass
     * tests the depth with `less-equal`. Hidden fragments are rejected before the fragment shader, so the cost of the
     * prepass (vertex processing and a trivial fragment shader) is traded for the shading of the overdrawn fragments.
     *
     * Primitives that alpha test (Mask), alpha-to-coverage, discard for wireframe, or blend are not part of the prepass:
     * they keep their normal draw, depth test and depth write. A material that discards in another way should not be
     * used with this option. At exactly coplanar surfaces the visible surface can change, because the color pass passes
     * fragments whose depth is equal to the prepass depth (a few hundred pixels on a Sponza-scale scene).
     *
     * Render passes with a material override (shadow maps, post effects and other helper passes) are not affected.
     * The prepass is per render pass, so stereo rendering runs it once per eye. The WebGL2 backend ignores this option
     * (its multi-draw path keeps the material order).
     *
     * @remarks
     * Measured on the 1000-point-light Sponza (WebGPU, Apple M2 Max): the GPU time fell by about 5-7% (1280x720:
     * 4.46 -> 4.13 ms) and the frame wall time by about 0-10% (the run was thermally throttled, so treat the wall
     * number as an upper bound). The gain grows with the amount of overdrawn shading. The default is off because the
     * extra geometry pass hurts scenes with little overdraw or heavy vertex shaders.
     */
    isDepthPrepassEnabled: boolean;
    constructor(initDescription?: ConfigInitDescription);
}
export {};
