// src/foundation/core/Config.ts
import { Logger, LogLevel } from "../misc/Logger.js";
var Config = class {
  constructor(initDescription = {}) {
    /**　The number of scenegraph components per buffer view */
    this.scenegraphComponentCountPerBufferView = 1e3;
    /**　The number of skeletal components per buffer view */
    this.skeletalComponentCountPerBufferView = 100;
    /**　The number of camera components per buffer view */
    this.cameraComponentCountPerBufferView = 1;
    /**
     * The number of light components per buffer view.
     * Every new buffer view changes the generated shader getters and recompiles all shaders,
     * so this is large enough for scenes with many lights.
     */
    this.lightComponentCountPerBufferView = 64;
    /**
     * The maximum number of lights that can cast shadows at the same time.
     * This is also the length of the per-light arrays of the MToon 0.x shader.
     *
     * @remarks
     * 0 disables the per-light shadow map slots: the shaders compile out the shadow sampling and no shadow map
     * textures are created. The shader arrays themselves cannot have a length of 0, so they use
     * {@link Config.maxLightNumberOrOne} instead. Negative and NaN values are treated as 0.
     */
    this.Pi = 6;
    /**
     * Whether Clustered Forward rendering is enabled.
     * When enabled, each fragment evaluates only the lights whose range reaches the cluster (froxel) of the fragment.
     * Lights without a range limit and directional lights are always evaluated.
     */
    this.isClusteredForwardEnabled = true;
    /** Where the light clusters are built. See {@link ClusteredForwardBuildMode}. */
    this.clusteredForwardBuildMode = "auto";
    /**
     * The number of clusters along the screen X, screen Y and view depth axes.
     *
     * @remarks
     * The default puts about a 40 pixel tile on a 1920x1080 canvas. The screen tiles should stay roughly 30-40 pixels
     * at the rendered resolution: a coarser grid lets many lights share each cluster (the cost is paid by every
     * fragment), and a finer grid increases the per-frame cluster build cost (the cost is paid once per frame, and the
     * build is proportional to the cluster count in the current implementation).
     */
    this.clusteredForwardGridSize = [48, 27, 48];
    /**
     * The maximum number of cameras whose light clusters are built in one frame.
     * The other cameras evaluate all lights.
     */
    this.clusteredForwardMaxViewNumber = 4;
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
    this.clusteredForwardMinLocalLightNumber = 1;
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
    this.clusteredForwardLightCapacityPerCluster = 96;
    /** The maximum number of enabled lights that are shaded. The other lights are ignored. (max: 65535) */
    this.maxLightListLength = 1024;
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
    this.lightAutoRangeThreshold = 0;
    /**
     * Scales the effective range of the point and spot lights, and raises their intensity to compensate.
     * A shorter range reaches fewer clusters, so fewer fragments evaluate the light in Clustered Forward rendering.
     *
     * @remarks
     * `1` (default) applies no adjustment. The measured presets are:
     *
     * | lightRangeScale | Intensity | GPU frame time (measured)  |
     * |-----------------|-----------|----------------------------|
     * | 1               | x1        | 5.5-6.4 ms                 |
     * | 0.9             | x1.16     | 4.2-4.5 ms (-20 to -24%)   |
     * | 0.8             | x1.35     | 3.1-3.2 ms (-43 to -50%)   |
     *
     * The measurement is a Sponza scene with 1000 animated point lights (WebGPU, 1920x1080, clustered forward).
     * Intermediate values interpolate the measured intensity factors: `1 -> 1`, `0.9 -> 1.16`, `0.8 -> 1.35`,
     * and below 0.8 the last slope continues. A constant factor cannot compensate the range window exactly: with
     * a shorter range the falloff `(1 - (d / range)^4)^4 / d^2` is slightly dimmer at mid distances, and the lights
     * fade out closer to their centers. 0.9 changes only 0.1% of the pixels by more than 32/255; 0.8 changes about
     * 7% of the pixels that much (the lit area of each light becomes smaller).
     *
     * The engine does not change this value by itself. An application that targets a frame budget can adjust it
     * at runtime (for example, from the measured GPU time and the display refresh interval).
     *
     * Only point and spot lights with a positive effective range are adjusted. Directional lights and lights without
     * a range limit are unchanged. The values of `LightComponent.range` and `LightComponent.intensity` themselves are
     * not modified: only the values uploaded to the GPU (and read by the light clusters and the shaders) are scaled,
     * so all rendering paths see the same light.
     */
    this.Qi = 1;
    /**
     * Number of instances of each material type to be placed consecutively in memory.
     * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
     * If this limit is exceeded, the material type is internally treated as a separate material type.
     */
    this.materialCountPerBufferView = 100;
    /**
     * Forces the bone data type of all SkeletalComponents.
     * When undefined (default), each SkeletalComponent uses its own bone data type
     * (see SkeletalComponent.setBoneDataType). Importers choose Vec4x1 or Vec4x2 automatically,
     * and other SkeletalComponents default to Vec4x2.
     */
    this.boneDataType = void 0;
    /**　Whether the UBO is enabled */
    this.isUboEnabled = false;
    /**　Whether to cache the WebGPU render bundles */
    this.cacheWebGpuRenderBundles = true;
    /**　Whether to output the CG API debug console */
    this.cgApiDebugConsoleOutput = false;
    /**　Whether to enable multi-view extension for WebVR */
    this.multiViewForWebVR = false;
    /**　The scale of the physics time interval */
    this.physicsTimeIntervalScale = 1;
    /**　Whether the device is a mobile device */
    this.isMobile = false;
    /** The buffer size division ratios for GPU instance data usage */
    this.bufferSizeDivisionRatiosForGPUInstanceDataUsage = [1 / 32, 5 / 32, 6 / 32, 12 / 32];
    /** The minimum log level that will be output. Messages below this level are ignored. */
    this.logLevel = LogLevel.Warn;
    /**
     * Whether to enable WebGL multi-draw rendering.
     * When enabled (and supported), primitives sharing a source Buffer are merged into shared
     * vertex/index buffers and consecutive draws with the same state are issued with WEBGL_multi_draw.
     */
    this.isMultiDrawEnabled = true;
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
    this.isDepthPrepassEnabled = false;
    /**
     * Whether to cull the instances against the view frustum on the GPU (WebGPU only).
     *
     * @remarks
     * Each frame, one compute pass tests the instances of the drawn meshes against the frustum of the render pass camera
     * and writes the visible instances and their count for indirect draws (`drawIndexedIndirect`). The render bundles
     * record the indirect draws, so they no longer have to be re-recorded when the camera moves and the set of visible
     * objects changes, and the instances of an instanced mesh are culled one by one.
     *
     * Meshes with skinning or blend shapes are culled on the GPU too when `isComputeSkinningEnabled` is true (their
     * vertices are deformed by a compute shader, which also computes their bounding boxes); otherwise they keep the CPU
     * frustum culling. A culled mesh still records its (zero-instance) draw, so its pipeline and bind groups are still set.
     * The WebGL2 backend ignores this option. `MeshRendererComponent._isFrustumCullingEnabled = false` disables both
     * the CPU and the GPU culling.
     */
    this.isGpuCullingEnabled = true;
    /**
     * Whether to deform (morph, then skin) the vertices of the meshes with skinning or blend shapes in a compute shader
     * (WebGPU only, used with `isGpuCullingEnabled`).
     *
     * @remarks
     * Once per frame, a compute pass applies the blend shapes and the skinning to the vertices of each instance of such
     * meshes and computes the bounding box of each deformed instance. The vertex shaders read the deformed vertices
     * instead of deforming them in every render pass (e.g. the shadow and depth prepasses), and the GPU frustum culling
     * tests the deformed bounding boxes, so these meshes are culled per instance on the GPU like the other meshes.
     * The draws that are not GPU culled (e.g. when the culling tables are full or for a multi-view pass) keep the
     * vertex shader deformation.
     */
    this.isComputeSkinningEnabled = true;
    if (initDescription.scenegraphComponentCountPerBufferView !== void 0) {
      this.scenegraphComponentCountPerBufferView = initDescription.scenegraphComponentCountPerBufferView;
    }
    if (initDescription.skeletalComponentCountPerBufferView !== void 0) {
      this.skeletalComponentCountPerBufferView = initDescription.skeletalComponentCountPerBufferView;
    }
    if (initDescription.cameraComponentCountPerBufferView !== void 0) {
      this.cameraComponentCountPerBufferView = initDescription.cameraComponentCountPerBufferView;
    }
    if (initDescription.lightComponentCountPerBufferView !== void 0) {
      this.lightComponentCountPerBufferView = initDescription.lightComponentCountPerBufferView;
    }
    if (initDescription.maxLightNumber !== void 0) {
      this.maxLightNumber = initDescription.maxLightNumber;
    }
    if (initDescription.materialCountPerBufferView !== void 0) {
      this.materialCountPerBufferView = initDescription.materialCountPerBufferView;
    }
    if (initDescription.boneDataType !== void 0) {
      this.boneDataType = initDescription.boneDataType;
    }
    if (initDescription.isUboEnabled !== void 0) {
      this.isUboEnabled = initDescription.isUboEnabled;
    }
    if (initDescription.eventTargetDom !== void 0) {
      this.eventTargetDom = initDescription.eventTargetDom;
    }
    if (initDescription.cacheWebGpuRenderBundles !== void 0) {
      this.cacheWebGpuRenderBundles = initDescription.cacheWebGpuRenderBundles;
    }
    if (initDescription.cgApiDebugConsoleOutput !== void 0) {
      this.cgApiDebugConsoleOutput = initDescription.cgApiDebugConsoleOutput;
    }
    if (initDescription.multiViewForWebVR !== void 0) {
      this.multiViewForWebVR = initDescription.multiViewForWebVR;
    }
    if (initDescription.physicsTimeIntervalScale !== void 0) {
      this.physicsTimeIntervalScale = initDescription.physicsTimeIntervalScale;
    }
    if (initDescription.isMobile !== void 0) {
      this.isMobile = initDescription.isMobile;
    }
    if (initDescription.bufferSizeDivisionRatiosForGPUInstanceDataUsage !== void 0) {
      this.bufferSizeDivisionRatiosForGPUInstanceDataUsage = initDescription.bufferSizeDivisionRatiosForGPUInstanceDataUsage;
    }
    if (initDescription.logLevel !== void 0) {
      this.logLevel = initDescription.logLevel;
    }
    if (initDescription.isMultiDrawEnabled !== void 0) {
      this.isMultiDrawEnabled = initDescription.isMultiDrawEnabled;
    }
    if (initDescription.isDepthPrepassEnabled !== void 0) {
      this.isDepthPrepassEnabled = initDescription.isDepthPrepassEnabled;
    }
    if (initDescription.isGpuCullingEnabled !== void 0) {
      this.isGpuCullingEnabled = initDescription.isGpuCullingEnabled;
    }
    if (initDescription.isComputeSkinningEnabled !== void 0) {
      this.isComputeSkinningEnabled = initDescription.isComputeSkinningEnabled;
    }
    if (initDescription.isClusteredForwardEnabled !== void 0) {
      this.isClusteredForwardEnabled = initDescription.isClusteredForwardEnabled;
    }
    if (initDescription.clusteredForwardBuildMode !== void 0) {
      this.clusteredForwardBuildMode = initDescription.clusteredForwardBuildMode;
    }
    if (initDescription.clusteredForwardGridSize !== void 0) {
      this.clusteredForwardGridSize = [...initDescription.clusteredForwardGridSize];
    }
    if (initDescription.clusteredForwardMinLocalLightNumber !== void 0) {
      this.clusteredForwardMinLocalLightNumber = initDescription.clusteredForwardMinLocalLightNumber;
    }
    if (initDescription.clusteredForwardMaxViewNumber !== void 0) {
      this.clusteredForwardMaxViewNumber = initDescription.clusteredForwardMaxViewNumber;
    }
    if (initDescription.clusteredForwardLightCapacityPerCluster !== void 0) {
      this.clusteredForwardLightCapacityPerCluster = initDescription.clusteredForwardLightCapacityPerCluster;
    }
    if (initDescription.maxLightListLength !== void 0) {
      this.maxLightListLength = initDescription.maxLightListLength;
    }
    if (initDescription.lightAutoRangeThreshold !== void 0) {
      this.lightAutoRangeThreshold = initDescription.lightAutoRangeThreshold;
    }
    if (initDescription.lightRangeScale !== void 0) {
      this.lightRangeScale = initDescription.lightRangeScale;
    }
  }
  /** See {@link Config.maxLightNumber}. */
  get maxLightNumber() {
    return this.Pi;
  }
  /** See {@link Config.maxLightNumber}. */
  set maxLightNumber(value) {
    if (!(value >= 0)) {
      Logger.default.warn(`Config.maxLightNumber (${value}) is invalid. Values below 0 are treated as 0.`);
      this.Pi = 0;
      return;
    }
    this.Pi = value;
  }
  /**
   * The length-safe value of {@link Config.maxLightNumber}: `maxLightNumber`, or 1 when it is 0.
   *
   * @remarks
   * Shader arrays, material parameters and texture arrays cannot have a length of 0. The shaders use this value
   * for their per-light array sizes and loop bounds. Shadow processing itself is controlled by
   * {@link Config.maxLightNumber}: when it is 0, the shadow code is compiled out and no shadow slots are assigned.
   */
  get maxLightNumberOrOne() {
    return this.Pi > 0 ? this.Pi : 1;
  }
  /** See {@link Config.lightRangeScale}. */
  get lightRangeScale() {
    return this.Qi;
  }
  /** See {@link Config.lightRangeScale}. */
  set lightRangeScale(value) {
    if (!(value > 0) || value > 1) {
      Logger.default.warn(`Config.lightRangeScale (${value}) is invalid. Use a value in (0, 1].`);
      this.Qi = 1;
      return;
    }
    this.Qi = value;
  }
};
export {
  Config
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vY29yZS9Db25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQ29uZmlnLnRzIGlzIGEgY29uZmlndXJhdGlvbiBmaWxlIHRoYXQgY29udGFpbnMgdGhlIGNvbmZpZ3VyYXRpb24gZm9yIHRoZSBsaWJyYXJ5LlxuICovXG5cbi8qIGVzbGludC1kaXNhYmxlIHByZWZlci1jb25zdCAqL1xuaW1wb3J0IHR5cGUgeyBCb25lRGF0YVR5cGVFbnVtIH0gZnJvbSAnLi4vZGVmaW5pdGlvbnMvQm9uZURhdGFUeXBlJztcbmltcG9ydCB7IExvZ2dlciwgTG9nTGV2ZWwgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5cbnR5cGUgQ29uZmlnSW5pdERlc2NyaXB0aW9uID0ge1xuICBzY2VuZWdyYXBoQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3PzogbnVtYmVyO1xuICBza2VsZXRhbENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldz86IG51bWJlcjtcbiAgY2FtZXJhQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3PzogbnVtYmVyO1xuICBsaWdodENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldz86IG51bWJlcjtcbiAgbWF4TGlnaHROdW1iZXI/OiBudW1iZXI7XG4gIG1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3PzogbnVtYmVyO1xuICBib25lRGF0YVR5cGU/OiBCb25lRGF0YVR5cGVFbnVtO1xuICBpc1Vib0VuYWJsZWQ/OiBib29sZWFuO1xuICBldmVudFRhcmdldERvbT86IEhUTUxFbGVtZW50O1xuICBjYWNoZVdlYkdwdVJlbmRlckJ1bmRsZXM/OiBib29sZWFuO1xuICBjZ0FwaURlYnVnQ29uc29sZU91dHB1dD86IGJvb2xlYW47XG4gIG11bHRpVmlld0ZvcldlYlZSPzogYm9vbGVhbjtcbiAgcGh5c2ljc1RpbWVJbnRlcnZhbFNjYWxlPzogbnVtYmVyO1xuICBpc01vYmlsZT86IGJvb2xlYW47XG4gIGJ1ZmZlclNpemVEaXZpc2lvblJhdGlvc0ZvckdQVUluc3RhbmNlRGF0YVVzYWdlPzogbnVtYmVyW107XG4gIGxvZ0xldmVsPzogTG9nTGV2ZWw7XG4gIGlzTXVsdGlEcmF3RW5hYmxlZD86IGJvb2xlYW47XG4gIGlzRGVwdGhQcmVwYXNzRW5hYmxlZD86IGJvb2xlYW47XG4gIGlzR3B1Q3VsbGluZ0VuYWJsZWQ/OiBib29sZWFuO1xuICBpc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQ/OiBib29sZWFuO1xuICBpc0NsdXN0ZXJlZEZvcndhcmRFbmFibGVkPzogYm9vbGVhbjtcbiAgY2x1c3RlcmVkRm9yd2FyZEJ1aWxkTW9kZT86IENsdXN0ZXJlZEZvcndhcmRCdWlsZE1vZGU7XG4gIGNsdXN0ZXJlZEZvcndhcmRHcmlkU2l6ZT86IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXTtcbiAgY2x1c3RlcmVkRm9yd2FyZE1heFZpZXdOdW1iZXI/OiBudW1iZXI7XG4gIGNsdXN0ZXJlZEZvcndhcmRMaWdodENhcGFjaXR5UGVyQ2x1c3Rlcj86IG51bWJlcjtcbiAgY2x1c3RlcmVkRm9yd2FyZE1pbkxvY2FsTGlnaHROdW1iZXI/OiBudW1iZXI7XG4gIG1heExpZ2h0TGlzdExlbmd0aD86IG51bWJlcjtcbiAgbGlnaHRBdXRvUmFuZ2VUaHJlc2hvbGQ/OiBudW1iZXI7XG4gIGxpZ2h0UmFuZ2VTY2FsZT86IG51bWJlcjtcbn07XG5cbi8qKlxuICogV2hlcmUgdGhlIGxpZ2h0IGNsdXN0ZXJzIG9mIENsdXN0ZXJlZCBGb3J3YXJkIHJlbmRlcmluZyBhcmUgYnVpbHQuXG4gKiAtIGAnYXV0bydgOiBXZWJHUFUgYnVpbGRzIHRoZW0gd2l0aCBjb21wdXRlIHNoYWRlcnMsIFdlYkdMMiBidWlsZHMgdGhlbSBvbiB0aGUgQ1BVLlxuICogLSBgJ2NwdSdgOiBCb3RoIGJhY2tlbmRzIGJ1aWxkIHRoZW0gb24gdGhlIENQVS5cbiAqL1xuZXhwb3J0IHR5cGUgQ2x1c3RlcmVkRm9yd2FyZEJ1aWxkTW9kZSA9ICdhdXRvJyB8ICdjcHUnO1xuXG4vKipcbiAqIENvbmZpZyBpcyBhIGNvbmZpZ3VyYXRpb24gY2xhc3MgdGhhdCBjb250YWlucyB0aGUgY29uZmlndXJhdGlvbiBmb3IgdGhlIGxpYnJhcnkuXG4gKi9cbmV4cG9ydCBjbGFzcyBDb25maWcge1xuICAvKipcdTMwMDBUaGUgbnVtYmVyIG9mIHNjZW5lZ3JhcGggY29tcG9uZW50cyBwZXIgYnVmZmVyIHZpZXcgKi9cbiAgc2NlbmVncmFwaENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyA9IDEwMDA7XG4gIC8qKlx1MzAwMFRoZSBudW1iZXIgb2Ygc2tlbGV0YWwgY29tcG9uZW50cyBwZXIgYnVmZmVyIHZpZXcgKi9cbiAgc2tlbGV0YWxDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgPSAxMDA7XG4gIC8qKlx1MzAwMFRoZSBudW1iZXIgb2YgY2FtZXJhIGNvbXBvbmVudHMgcGVyIGJ1ZmZlciB2aWV3ICovXG4gIGNhbWVyYUNvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyA9IDE7XG4gIC8qKlxuICAgKiBUaGUgbnVtYmVyIG9mIGxpZ2h0IGNvbXBvbmVudHMgcGVyIGJ1ZmZlciB2aWV3LlxuICAgKiBFdmVyeSBuZXcgYnVmZmVyIHZpZXcgY2hhbmdlcyB0aGUgZ2VuZXJhdGVkIHNoYWRlciBnZXR0ZXJzIGFuZCByZWNvbXBpbGVzIGFsbCBzaGFkZXJzLFxuICAgKiBzbyB0aGlzIGlzIGxhcmdlIGVub3VnaCBmb3Igc2NlbmVzIHdpdGggbWFueSBsaWdodHMuXG4gICAqL1xuICBsaWdodENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyA9IDY0O1xuICAvKipcbiAgICogVGhlIG1heGltdW0gbnVtYmVyIG9mIGxpZ2h0cyB0aGF0IGNhbiBjYXN0IHNoYWRvd3MgYXQgdGhlIHNhbWUgdGltZS5cbiAgICogVGhpcyBpcyBhbHNvIHRoZSBsZW5ndGggb2YgdGhlIHBlci1saWdodCBhcnJheXMgb2YgdGhlIE1Ub29uIDAueCBzaGFkZXIuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIDAgZGlzYWJsZXMgdGhlIHBlci1saWdodCBzaGFkb3cgbWFwIHNsb3RzOiB0aGUgc2hhZGVycyBjb21waWxlIG91dCB0aGUgc2hhZG93IHNhbXBsaW5nIGFuZCBubyBzaGFkb3cgbWFwXG4gICAqIHRleHR1cmVzIGFyZSBjcmVhdGVkLiBUaGUgc2hhZGVyIGFycmF5cyB0aGVtc2VsdmVzIGNhbm5vdCBoYXZlIGEgbGVuZ3RoIG9mIDAsIHNvIHRoZXkgdXNlXG4gICAqIHtAbGluayBDb25maWcubWF4TGlnaHROdW1iZXJPck9uZX0gaW5zdGVhZC4gTmVnYXRpdmUgYW5kIE5hTiB2YWx1ZXMgYXJlIHRyZWF0ZWQgYXMgMC5cbiAgICovXG4gIHByaXZhdGUgX19tYXhMaWdodE51bWJlciA9IDY7XG4gIC8qKiBTZWUge0BsaW5rIENvbmZpZy5tYXhMaWdodE51bWJlcn0uICovXG4gIGdldCBtYXhMaWdodE51bWJlcigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl9fbWF4TGlnaHROdW1iZXI7XG4gIH1cbiAgLyoqIFNlZSB7QGxpbmsgQ29uZmlnLm1heExpZ2h0TnVtYmVyfS4gKi9cbiAgc2V0IG1heExpZ2h0TnVtYmVyKHZhbHVlOiBudW1iZXIpIHtcbiAgICBpZiAoISh2YWx1ZSA+PSAwKSkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQud2FybihgQ29uZmlnLm1heExpZ2h0TnVtYmVyICgke3ZhbHVlfSkgaXMgaW52YWxpZC4gVmFsdWVzIGJlbG93IDAgYXJlIHRyZWF0ZWQgYXMgMC5gKTtcbiAgICAgIHRoaXMuX19tYXhMaWdodE51bWJlciA9IDA7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuX19tYXhMaWdodE51bWJlciA9IHZhbHVlO1xuICB9XG4gIC8qKlxuICAgKiBUaGUgbGVuZ3RoLXNhZmUgdmFsdWUgb2Yge0BsaW5rIENvbmZpZy5tYXhMaWdodE51bWJlcn06IGBtYXhMaWdodE51bWJlcmAsIG9yIDEgd2hlbiBpdCBpcyAwLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBTaGFkZXIgYXJyYXlzLCBtYXRlcmlhbCBwYXJhbWV0ZXJzIGFuZCB0ZXh0dXJlIGFycmF5cyBjYW5ub3QgaGF2ZSBhIGxlbmd0aCBvZiAwLiBUaGUgc2hhZGVycyB1c2UgdGhpcyB2YWx1ZVxuICAgKiBmb3IgdGhlaXIgcGVyLWxpZ2h0IGFycmF5IHNpemVzIGFuZCBsb29wIGJvdW5kcy4gU2hhZG93IHByb2Nlc3NpbmcgaXRzZWxmIGlzIGNvbnRyb2xsZWQgYnlcbiAgICoge0BsaW5rIENvbmZpZy5tYXhMaWdodE51bWJlcn06IHdoZW4gaXQgaXMgMCwgdGhlIHNoYWRvdyBjb2RlIGlzIGNvbXBpbGVkIG91dCBhbmQgbm8gc2hhZG93IHNsb3RzIGFyZSBhc3NpZ25lZC5cbiAgICovXG4gIGdldCBtYXhMaWdodE51bWJlck9yT25lKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXhMaWdodE51bWJlciA+IDAgPyB0aGlzLl9fbWF4TGlnaHROdW1iZXIgOiAxO1xuICB9XG4gIC8qKlxuICAgKiBXaGV0aGVyIENsdXN0ZXJlZCBGb3J3YXJkIHJlbmRlcmluZyBpcyBlbmFibGVkLlxuICAgKiBXaGVuIGVuYWJsZWQsIGVhY2ggZnJhZ21lbnQgZXZhbHVhdGVzIG9ubHkgdGhlIGxpZ2h0cyB3aG9zZSByYW5nZSByZWFjaGVzIHRoZSBjbHVzdGVyIChmcm94ZWwpIG9mIHRoZSBmcmFnbWVudC5cbiAgICogTGlnaHRzIHdpdGhvdXQgYSByYW5nZSBsaW1pdCBhbmQgZGlyZWN0aW9uYWwgbGlnaHRzIGFyZSBhbHdheXMgZXZhbHVhdGVkLlxuICAgKi9cbiAgaXNDbHVzdGVyZWRGb3J3YXJkRW5hYmxlZCA9IHRydWU7XG4gIC8qKiBXaGVyZSB0aGUgbGlnaHQgY2x1c3RlcnMgYXJlIGJ1aWx0LiBTZWUge0BsaW5rIENsdXN0ZXJlZEZvcndhcmRCdWlsZE1vZGV9LiAqL1xuICBjbHVzdGVyZWRGb3J3YXJkQnVpbGRNb2RlOiBDbHVzdGVyZWRGb3J3YXJkQnVpbGRNb2RlID0gJ2F1dG8nO1xuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBjbHVzdGVycyBhbG9uZyB0aGUgc2NyZWVuIFgsIHNjcmVlbiBZIGFuZCB2aWV3IGRlcHRoIGF4ZXMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSBkZWZhdWx0IHB1dHMgYWJvdXQgYSA0MCBwaXhlbCB0aWxlIG9uIGEgMTkyMHgxMDgwIGNhbnZhcy4gVGhlIHNjcmVlbiB0aWxlcyBzaG91bGQgc3RheSByb3VnaGx5IDMwLTQwIHBpeGVsc1xuICAgKiBhdCB0aGUgcmVuZGVyZWQgcmVzb2x1dGlvbjogYSBjb2Fyc2VyIGdyaWQgbGV0cyBtYW55IGxpZ2h0cyBzaGFyZSBlYWNoIGNsdXN0ZXIgKHRoZSBjb3N0IGlzIHBhaWQgYnkgZXZlcnlcbiAgICogZnJhZ21lbnQpLCBhbmQgYSBmaW5lciBncmlkIGluY3JlYXNlcyB0aGUgcGVyLWZyYW1lIGNsdXN0ZXIgYnVpbGQgY29zdCAodGhlIGNvc3QgaXMgcGFpZCBvbmNlIHBlciBmcmFtZSwgYW5kIHRoZVxuICAgKiBidWlsZCBpcyBwcm9wb3J0aW9uYWwgdG8gdGhlIGNsdXN0ZXIgY291bnQgaW4gdGhlIGN1cnJlbnQgaW1wbGVtZW50YXRpb24pLlxuICAgKi9cbiAgY2x1c3RlcmVkRm9yd2FyZEdyaWRTaXplOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gPSBbNDgsIDI3LCA0OF07XG4gIC8qKlxuICAgKiBUaGUgbWF4aW11bSBudW1iZXIgb2YgY2FtZXJhcyB3aG9zZSBsaWdodCBjbHVzdGVycyBhcmUgYnVpbHQgaW4gb25lIGZyYW1lLlxuICAgKiBUaGUgb3RoZXIgY2FtZXJhcyBldmFsdWF0ZSBhbGwgbGlnaHRzLlxuICAgKi9cbiAgY2x1c3RlcmVkRm9yd2FyZE1heFZpZXdOdW1iZXIgPSA0O1xuICAvKipcbiAgICogVGhlIGxpZ2h0IGNsdXN0ZXJzIGFyZSBidWlsdCBvbmx5IHdoZW4gdGhlIG51bWJlciBvZiBsaWdodHMgdGhhdCBjYW4gYmUgY3VsbGVkIChwb2ludCBhbmQgc3BvdCBsaWdodHMgd2l0aCBhXG4gICAqIHJhbmdlLCBpbmNsdWRpbmcgYW4gYXV0b21hdGljIHJhbmdlIG9mIHtAbGluayBDb25maWcubGlnaHRBdXRvUmFuZ2VUaHJlc2hvbGR9KSBhbmQgZW1pdCBsaWdodCAoYW4gaW50ZW5zaXR5XG4gICAqIGdyZWF0ZXIgdGhhbiAwKSBpcyBhdCBsZWFzdCB0aGlzIHZhbHVlLiBXaXRoIGZld2VyIGxpZ2h0cywgZXZlcnkgZnJhZ21lbnQgZXZhbHVhdGVzIGFsbCBsaWdodHMgYXMgaW4gcGxhaW4gZm9yd2FyZFxuICAgKiByZW5kZXJpbmcsIHdoaWNoIHNraXBzIHRoZSBjbHVzdGVyIGJ1aWxkIGFuZCB0aGUgY2x1c3RlciBsb29rdXAgb2YgdGhlIGZyYWdtZW50IHNoYWRlcnMuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSBkZWZhdWx0IHZhbHVlIDEgaXMgdGhlIG1lYXN1cmVkIGJyZWFrLWV2ZW4gcG9pbnQgb2YgYm90aCBiYWNrZW5kczogb24gQXBwbGUgTTIgTWF4IChDaHJvbWUsIEFOR0xFLU1ldGFsIC9cbiAgICogRGF3bi1NZXRhbCkgd2l0aCBhIGZ1bGwtc2NyZWVuIDIwNDh4MjA0OCBQQlIgc3VyZmFjZSwgdGhlIEdQVSBmcmFtZSB0aW1lIHdpdGggYW5kIHdpdGhvdXQgY2x1c3RlcnMgd2FzXG4gICAqIChyYXRpbyA9IGNsdXN0ZXJlZCAvIHBsYWluIGZvcndhcmQsIGxvd2VyIGlzIGJldHRlcjsgYSByYW5nZSBpcyB0aGUgc3ByZWFkIG9mIHNldmVyYWwgcnVucyk6XG4gICAqXG4gICAqIHwgTGlnaHRzIHwgV2ViR0wyIChyYWRpdXMgMyAvIDYpICB8IFdlYkdQVSAocmFkaXVzIDMgLyA2KSB8XG4gICAqIHwtLS0tLS0tLXwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18LS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4gICAqIHwgMSAgICAgIHwgMC45MC0wLjkyIC8gMC44Mi0xLjA5ICB8IDAuODMgLyAwLjkyICAgICAgICAgICB8XG4gICAqIHwgMiAgICAgIHwgMC42NCAvIDAuNzYtMC44NCAgICAgICB8IDAuNjEgLyAwLjc2ICAgICAgICAgICB8XG4gICAqIHwgMyAgICAgIHwgMC42MiAvIDAuNzIgICAgICAgICAgICB8IDAuNDkgLyAwLjY2ICAgICAgICAgICB8XG4gICAqIHwgOCAgICAgIHwgMC40MiAvIDAuNjIgICAgICAgICAgICB8IDAuMzIgLyAwLjUxICAgICAgICAgICB8XG4gICAqXG4gICAqIChBIGxpZ2h0IHdpdGggdGhlIHJhZGl1cyAzIG9yIDYgY292ZXJzIGFib3V0IDclIG9yIDI4JSBvZiB0aGUgc2NyZWVuLikgVGhlIGNsdXN0ZXIgbG9va3VwIGNvc3RzIGFib3V0IGhhbGYgYVxuICAgKiBsaWdodCBpbiBib3RoIGJhY2tlbmRzLiBUaGUgQ2xhc3NpYyBzaGFkZXIgYW5kIGEgbW92aW5nIGNhbWVyYSAoY2x1c3RlcnMgcmVidWlsdCBldmVyeSBmcmFtZSkgZ2F2ZSB0aGUgc2FtZVxuICAgKiBicmVhay1ldmVuIHBvaW50cy4gTGlnaHRzIHRoYXQgY292ZXIgdGhlIHdob2xlIHNjcmVlbiBjYW4gbm90IGJlIGN1bGxlZCwgc28gY2x1c3RlcmluZyB0aGVtIGlzIGFsd2F5cyBhIGZld1xuICAgKiBwZXJjZW50IHNsb3dlciAoV2ViR0wyIDItMyUsIFdlYkdQVSAxLTExJSkgd2hhdGV2ZXIgdGhpcyB2YWx1ZSBpcy4gUmFpc2UgdGhpcyB2YWx1ZSBmb3Igc3VjaCBzY2VuZXMuXG4gICAqIE90aGVyIEdQVXMgbWF5IGRpZmZlci5cbiAgICovXG4gIGNsdXN0ZXJlZEZvcndhcmRNaW5Mb2NhbExpZ2h0TnVtYmVyID0gMTtcbiAgLyoqXG4gICAqIFRoZSBtYXhpbXVtIG51bWJlciBvZiBsaWdodHMgaW4gdGhlIGxpc3Qgb2YgZWFjaCBjbHVzdGVyLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBFdmVyeSBjbHVzdGVyIGtlZXBzIGF0IG1vc3QgdGhpcyBtYW55IGxpZ2h0cy4gV2hlbiB0aGUgbnVtYmVyIG9mIGxvY2FsIGxpZ2h0cyBpcyBncmVhdGVyIHRoYW4gdGhpcyB2YWx1ZSwgdGhlXG4gICAqIGxpZ2h0cyBhcmUgc29ydGVkIGJ5IHRoZWlyIHZpZXcgZGVwdGggYW5kIGVhY2ggY2x1c3RlciBrZWVwcyB0aGUgbmVhcmVzdCBvbmVzLCBzbyB0aGUgbGlnaHRzIHRoYXQgYXJlIGRyb3BwZWRcbiAgICogYXJlIHRoZSBmYXJ0aGVzdCBvbmVzLiBUaGUgY29zdCBvZiBhIGZyYWdtZW50IGlzIGJvdW5kZWQgYnkgdGhpcyB2YWx1ZS5cbiAgICpcbiAgICogTWVtb3J5IHBlciBjYW1lcmE6IGFib3V0IGAxNiAqIGNsdXN0ZXJDb3VudCAqIGNlaWwodmFsdWUgLyA0KWAgYnl0ZXMsIHdoZXJlIGNsdXN0ZXJDb3VudCBpcyB0aGUgcHJvZHVjdCBvZlxuICAgKiB7QGxpbmsgQ29uZmlnLmNsdXN0ZXJlZEZvcndhcmRHcmlkU2l6ZX0gKDYyLDIwOCBieSBkZWZhdWx0KS4gVGhlIGRlZmF1bHQgOTYgaXMgYWJvdXQgMjUgTUIgcGVyIGNhbWVyYS5cbiAgICovXG4gIGNsdXN0ZXJlZEZvcndhcmRMaWdodENhcGFjaXR5UGVyQ2x1c3RlciA9IDk2O1xuICAvKiogVGhlIG1heGltdW0gbnVtYmVyIG9mIGVuYWJsZWQgbGlnaHRzIHRoYXQgYXJlIHNoYWRlZC4gVGhlIG90aGVyIGxpZ2h0cyBhcmUgaWdub3JlZC4gKG1heDogNjU1MzUpICovXG4gIG1heExpZ2h0TGlzdExlbmd0aCA9IDEwMjQ7XG4gIC8qKlxuICAgKiBXaGVuIGdyZWF0ZXIgdGhhbiAwLCBwb2ludCBhbmQgc3BvdCBsaWdodHMgd2l0aG91dCBhIHJhbmdlIGdldCBhbiBlZmZlY3RpdmUgcmFuZ2Ugd2hlcmUgdGhlaXIgaW50ZW5zaXR5XG4gICAqICh0aGUgbWF4aW11bSBvZiBjb2xvciAqIGludGVuc2l0eSwgZGl2aWRlZCBieSB0aGUgc3F1YXJlZCBkaXN0YW5jZSkgZmFsbHMgdG8gdGhpcyB2YWx1ZS5cbiAgICogVGhpcyBtYWtlcyB0aG9zZSBsaWdodHMgZmFkZSBvdXQgc21vb3RobHkgYXQgdGhhdCBkaXN0YW5jZSBhbmQgbGV0cyBDbHVzdGVyZWQgRm9yd2FyZCByZW5kZXJpbmcgY3VsbCB0aGVtLlxuICAgKiAwIChkZWZhdWx0KSBkaXNhYmxlcyBpdC4gTGlnaHRzIHdpdGggYSByYW5nZSBhbmQgZGlyZWN0aW9uYWwgbGlnaHRzIGFyZSBub3QgYWZmZWN0ZWQuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSBlZmZlY3RpdmUgcmFuZ2UgaXMgYFIgPSBzcXJ0KG1heChjb2xvcikgKiBpbnRlbnNpdHkgLyBsaWdodEF1dG9SYW5nZVRocmVzaG9sZClgLiBXaXRoIHRoZSByYW5nZSB3aW5kb3dcbiAgICogb2YgdGhlIHNoYWRlcnMgKGAoMSAtIChkIC8gUileNCkgLyBkXjJgKSwgdGhlIGRpZmZlcmVuY2UgZnJvbSB0aGUgdW5saW1pdGVkIGludmVyc2Utc3F1YXJlIGZhbGxvZmYgYXQgdGhlXG4gICAqIGRpc3RhbmNlIGBkYCBpcyBgbGlnaHRBdXRvUmFuZ2VUaHJlc2hvbGQgKiAoZCAvIFIpXjJgLiBTbyB0aGlzIHZhbHVlIGlzIHRoZSB1cHBlciBib3VuZCBvZiB0aGUgZXJyb3IgYWRkZWQgdG9cbiAgICogdGhlIGxpbmVhciBicmlnaHRuZXNzIChmb3IgdGhlIGRpZmZ1c2UgbGlnaHRpbmcgb2YgYSB3aGl0ZSBzdXJmYWNlIGZhY2luZyB0aGUgbGlnaHQpLiBUaGUgZXJyb3IgaXMgbGFyZ2VzdCBhdFxuICAgKiB0aGUgYm9yZGVyIG9mIHRoZSByYW5nZSBhbmQgc21hbGxlciBpbnNpZGUgaXQuXG4gICAqXG4gICAqIFJlZmVyZW5jZSB2YWx1ZXMgKHdpdGhvdXQgdG9uZSBtYXBwaW5nLCBleHBvc3VyZSAxKTpcbiAgICpcbiAgICogfCBWYWx1ZSAgfCBSYW5nZSAoaW50ZW5zaXR5IDEgLyAxMCkgfCBFZmZlY3Qgb24gdGhlIGltYWdlIHxcbiAgICogfC0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLXxcbiAgICogfCAwLjAwMDMgfCA1OCAvIDE4MyAgICAgICAgICAgICAgICAgfCBQcmFjdGljYWxseSBsb3NzbGVzcywgYnV0IHRoZSByYW5nZSBpcyBzbyBsYXJnZSB0aGF0IHRoZSBsaWdodHMgYXJlIHJhcmVseSBjdWxsZWQuIHxcbiAgICogfCAwLjAwMSAgfCAzMiAvIDEwMCAgICAgICAgICAgICAgICAgfCBBdCBtb3N0IGFib3V0IDMvMjU1IGV2ZW4gb24gYSBibGFjayBiYWNrZ3JvdW5kLiBOb3Qgbm90aWNlYWJsZSBvbiBsaXQgc3VyZmFjZXMuIFJlY29tbWVuZGVkIHN0YXJ0aW5nIHBvaW50LiB8XG4gICAqIHwgMC4wMDMgIHwgMTggLyA1OCAgICAgICAgICAgICAgICAgIHwgSGFyZGx5IG5vdGljZWFibGUgaW4gc2NlbmVzIHdpdGggYW1iaWVudCBsaWdodCBvciBJQkwuIHxcbiAgICogfCAwLjAxICAgfCAxMCAvIDMyICAgICAgICAgICAgICAgICAgfCBPbiBhIGRhcmsgYmFja2dyb3VuZCwgdGhlIHRhaWwgb2YgdGhlIGxpZ2h0IGZhZGVzIG91dCBhIGxpdHRsZSBlYXJseS4gQWJvdXQgMy8yNTUgb24gbGl0IHN1cmZhY2VzLiB8XG4gICAqXG4gICAqIFRpcHM6XG4gICAqIC0gQ29tcGFyZSB0aGUgcmVzdWx0aW5nIHJhbmdlIHdpdGggdGhlIHZpc2libGUgYXJlYSBhbmQgdGhlIHNwYWNpbmcgb2YgdGhlIGxpZ2h0cy4gQSByYW5nZSBsYXJnZXIgdGhhbiB0aGVtXG4gICAqICAgcHV0cyB0aGUgbGlnaHQgaW4gYWxtb3N0IGV2ZXJ5IGNsdXN0ZXIsIHNvIGl0IGRvZXMgbm90IG1ha2UgcmVuZGVyaW5nIGZhc3Rlci5cbiAgICogLSBTY2FsZSB0aGUgdmFsdWUgd2l0aCB0aGUgYnJpZ2h0bmVzcyBsZXZlbCBvZiB0aGUgc2NlbmUuIEZvciBleGFtcGxlLCB3aGVuIHRoZSBsaWdodCBpbnRlbnNpdGllcyBhcmUgaW4gdGhlXG4gICAqICAgaHVuZHJlZHMgYW5kIHRoZSBleHBvc3VyZSBicmluZ3MgdGhlbSBkb3duLCBzY2FsZSB0aGUgdmFsdWUgYnkgdGhlIHNhbWUgZmFjdG9yLiBBYm91dCAxLzMwMCB0byAxLzEwMDAgb2YgdGhlXG4gICAqICAgdHlwaWNhbCBicmlnaHRuZXNzIG9mIHRoZSBzY2VuZSBpcyBhIGdvb2QgZ3VpZGUuXG4gICAqIC0gVXNlIGEgc21hbGxlciB2YWx1ZSBmb3IgZGFyayBzY2VuZXMgb3Igd2hlbiB0aGUgZXhwb3N1cmUgYnJpZ2h0ZW5zIGRhcmsgYXJlYXMsIHdoZXJlIHRoZSBjdXQtb2ZmIHRhaWwgaXNcbiAgICogICBtb3JlIG5vdGljZWFibGUuXG4gICAqIC0gVGhlIGVycm9yIG9mIHNwZWN1bGFyIGhpZ2hsaWdodHMgb24gZ2xvc3N5IHN1cmZhY2VzIGNhbiBiZSBsYXJnZXIgdGhhbiB0aGUgdGFibGUgYWJvdmUsIGJ1dCB0aGUgbGlnaHQgaXNcbiAgICogICB3ZWFrIG5lYXIgdGhlIGJvcmRlciBvZiB0aGUgcmFuZ2UsIHNvIGl0IGlzIHJhcmVseSBub3RpY2VhYmxlLlxuICAgKiAtIFNldCB0aGlzIHdoZW4gaW5pdGlhbGl6aW5nIHRoZSBlbmdpbmUuIEEgY2hhbmdlIGF0IHJ1bnRpbWUgdGFrZXMgZWZmZWN0IGZvciBlYWNoIGxpZ2h0IHdoZW4gdGhlIGxpZ2h0IGlzXG4gICAqICAgdXBkYXRlZCBuZXh0LlxuICAgKi9cbiAgbGlnaHRBdXRvUmFuZ2VUaHJlc2hvbGQgPSAwO1xuICAvKipcbiAgICogU2NhbGVzIHRoZSBlZmZlY3RpdmUgcmFuZ2Ugb2YgdGhlIHBvaW50IGFuZCBzcG90IGxpZ2h0cywgYW5kIHJhaXNlcyB0aGVpciBpbnRlbnNpdHkgdG8gY29tcGVuc2F0ZS5cbiAgICogQSBzaG9ydGVyIHJhbmdlIHJlYWNoZXMgZmV3ZXIgY2x1c3RlcnMsIHNvIGZld2VyIGZyYWdtZW50cyBldmFsdWF0ZSB0aGUgbGlnaHQgaW4gQ2x1c3RlcmVkIEZvcndhcmQgcmVuZGVyaW5nLlxuICAgKlxuICAgKiBAcmVtYXJrc1xuICAgKiBgMWAgKGRlZmF1bHQpIGFwcGxpZXMgbm8gYWRqdXN0bWVudC4gVGhlIG1lYXN1cmVkIHByZXNldHMgYXJlOlxuICAgKlxuICAgKiB8IGxpZ2h0UmFuZ2VTY2FsZSB8IEludGVuc2l0eSB8IEdQVSBmcmFtZSB0aW1lIChtZWFzdXJlZCkgIHxcbiAgICogfC0tLS0tLS0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tfC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS18XG4gICAqIHwgMSAgICAgICAgICAgICAgIHwgeDEgICAgICAgIHwgNS41LTYuNCBtcyAgICAgICAgICAgICAgICAgfFxuICAgKiB8IDAuOSAgICAgICAgICAgICB8IHgxLjE2ICAgICB8IDQuMi00LjUgbXMgKC0yMCB0byAtMjQlKSAgIHxcbiAgICogfCAwLjggICAgICAgICAgICAgfCB4MS4zNSAgICAgfCAzLjEtMy4yIG1zICgtNDMgdG8gLTUwJSkgICB8XG4gICAqXG4gICAqIFRoZSBtZWFzdXJlbWVudCBpcyBhIFNwb256YSBzY2VuZSB3aXRoIDEwMDAgYW5pbWF0ZWQgcG9pbnQgbGlnaHRzIChXZWJHUFUsIDE5MjB4MTA4MCwgY2x1c3RlcmVkIGZvcndhcmQpLlxuICAgKiBJbnRlcm1lZGlhdGUgdmFsdWVzIGludGVycG9sYXRlIHRoZSBtZWFzdXJlZCBpbnRlbnNpdHkgZmFjdG9yczogYDEgLT4gMWAsIGAwLjkgLT4gMS4xNmAsIGAwLjggLT4gMS4zNWAsXG4gICAqIGFuZCBiZWxvdyAwLjggdGhlIGxhc3Qgc2xvcGUgY29udGludWVzLiBBIGNvbnN0YW50IGZhY3RvciBjYW5ub3QgY29tcGVuc2F0ZSB0aGUgcmFuZ2Ugd2luZG93IGV4YWN0bHk6IHdpdGhcbiAgICogYSBzaG9ydGVyIHJhbmdlIHRoZSBmYWxsb2ZmIGAoMSAtIChkIC8gcmFuZ2UpXjQpXjQgLyBkXjJgIGlzIHNsaWdodGx5IGRpbW1lciBhdCBtaWQgZGlzdGFuY2VzLCBhbmQgdGhlIGxpZ2h0c1xuICAgKiBmYWRlIG91dCBjbG9zZXIgdG8gdGhlaXIgY2VudGVycy4gMC45IGNoYW5nZXMgb25seSAwLjElIG9mIHRoZSBwaXhlbHMgYnkgbW9yZSB0aGFuIDMyLzI1NTsgMC44IGNoYW5nZXMgYWJvdXRcbiAgICogNyUgb2YgdGhlIHBpeGVscyB0aGF0IG11Y2ggKHRoZSBsaXQgYXJlYSBvZiBlYWNoIGxpZ2h0IGJlY29tZXMgc21hbGxlcikuXG4gICAqXG4gICAqIFRoZSBlbmdpbmUgZG9lcyBub3QgY2hhbmdlIHRoaXMgdmFsdWUgYnkgaXRzZWxmLiBBbiBhcHBsaWNhdGlvbiB0aGF0IHRhcmdldHMgYSBmcmFtZSBidWRnZXQgY2FuIGFkanVzdCBpdFxuICAgKiBhdCBydW50aW1lIChmb3IgZXhhbXBsZSwgZnJvbSB0aGUgbWVhc3VyZWQgR1BVIHRpbWUgYW5kIHRoZSBkaXNwbGF5IHJlZnJlc2ggaW50ZXJ2YWwpLlxuICAgKlxuICAgKiBPbmx5IHBvaW50IGFuZCBzcG90IGxpZ2h0cyB3aXRoIGEgcG9zaXRpdmUgZWZmZWN0aXZlIHJhbmdlIGFyZSBhZGp1c3RlZC4gRGlyZWN0aW9uYWwgbGlnaHRzIGFuZCBsaWdodHMgd2l0aG91dFxuICAgKiBhIHJhbmdlIGxpbWl0IGFyZSB1bmNoYW5nZWQuIFRoZSB2YWx1ZXMgb2YgYExpZ2h0Q29tcG9uZW50LnJhbmdlYCBhbmQgYExpZ2h0Q29tcG9uZW50LmludGVuc2l0eWAgdGhlbXNlbHZlcyBhcmVcbiAgICogbm90IG1vZGlmaWVkOiBvbmx5IHRoZSB2YWx1ZXMgdXBsb2FkZWQgdG8gdGhlIEdQVSAoYW5kIHJlYWQgYnkgdGhlIGxpZ2h0IGNsdXN0ZXJzIGFuZCB0aGUgc2hhZGVycykgYXJlIHNjYWxlZCxcbiAgICogc28gYWxsIHJlbmRlcmluZyBwYXRocyBzZWUgdGhlIHNhbWUgbGlnaHQuXG4gICAqL1xuICBwcml2YXRlIF9fbGlnaHRSYW5nZVNjYWxlID0gMTtcbiAgLyoqIFNlZSB7QGxpbmsgQ29uZmlnLmxpZ2h0UmFuZ2VTY2FsZX0uICovXG4gIGdldCBsaWdodFJhbmdlU2NhbGUoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fX2xpZ2h0UmFuZ2VTY2FsZTtcbiAgfVxuICAvKiogU2VlIHtAbGluayBDb25maWcubGlnaHRSYW5nZVNjYWxlfS4gKi9cbiAgc2V0IGxpZ2h0UmFuZ2VTY2FsZSh2YWx1ZTogbnVtYmVyKSB7XG4gICAgaWYgKCEodmFsdWUgPiAwKSB8fCB2YWx1ZSA+IDEpIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0Lndhcm4oYENvbmZpZy5saWdodFJhbmdlU2NhbGUgKCR7dmFsdWV9KSBpcyBpbnZhbGlkLiBVc2UgYSB2YWx1ZSBpbiAoMCwgMV0uYCk7XG4gICAgICB0aGlzLl9fbGlnaHRSYW5nZVNjYWxlID0gMTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5fX2xpZ2h0UmFuZ2VTY2FsZSA9IHZhbHVlO1xuICB9XG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgaW5zdGFuY2VzIG9mIGVhY2ggbWF0ZXJpYWwgdHlwZSB0byBiZSBwbGFjZWQgY29uc2VjdXRpdmVseSBpbiBtZW1vcnkuXG4gICAqIFRoaXMgaXMgb24gdGhlIG1lbW9yeSBsYXlvdXQsIGFuZCB0aGUgbnVtYmVyIG9mIG1hdGVyaWFsIGluc3RhbmNlcyB0aGF0IGNhbiBiZSBnZW5lcmF0ZWQgaXMgbm90IGxpbWl0ZWQgYnkgdGhpcyBzZXR0aW5nLlxuICAgKiBJZiB0aGlzIGxpbWl0IGlzIGV4Y2VlZGVkLCB0aGUgbWF0ZXJpYWwgdHlwZSBpcyBpbnRlcm5hbGx5IHRyZWF0ZWQgYXMgYSBzZXBhcmF0ZSBtYXRlcmlhbCB0eXBlLlxuICAgKi9cbiAgbWF0ZXJpYWxDb3VudFBlckJ1ZmZlclZpZXcgPSAxMDA7XG4gIC8qKlxuICAgKiBGb3JjZXMgdGhlIGJvbmUgZGF0YSB0eXBlIG9mIGFsbCBTa2VsZXRhbENvbXBvbmVudHMuXG4gICAqIFdoZW4gdW5kZWZpbmVkIChkZWZhdWx0KSwgZWFjaCBTa2VsZXRhbENvbXBvbmVudCB1c2VzIGl0cyBvd24gYm9uZSBkYXRhIHR5cGVcbiAgICogKHNlZSBTa2VsZXRhbENvbXBvbmVudC5zZXRCb25lRGF0YVR5cGUpLiBJbXBvcnRlcnMgY2hvb3NlIFZlYzR4MSBvciBWZWM0eDIgYXV0b21hdGljYWxseSxcbiAgICogYW5kIG90aGVyIFNrZWxldGFsQ29tcG9uZW50cyBkZWZhdWx0IHRvIFZlYzR4Mi5cbiAgICovXG4gIGJvbmVEYXRhVHlwZTogQm9uZURhdGFUeXBlRW51bSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcbiAgLyoqXHUzMDAwV2hldGhlciB0aGUgVUJPIGlzIGVuYWJsZWQgKi9cbiAgaXNVYm9FbmFibGVkID0gZmFsc2U7XG4gIC8qKlx1MzAwMFRoZSBldmVudCB0YXJnZXQgRE9NIGZvciBtb3VzZSBvcGVyYXRpb24gKi9cbiAgZXZlbnRUYXJnZXREb206IEhUTUxFbGVtZW50IHwgdW5kZWZpbmVkO1xuICAvKipcdTMwMDBXaGV0aGVyIHRvIGNhY2hlIHRoZSBXZWJHUFUgcmVuZGVyIGJ1bmRsZXMgKi9cbiAgY2FjaGVXZWJHcHVSZW5kZXJCdW5kbGVzID0gdHJ1ZTtcbiAgLyoqXHUzMDAwV2hldGhlciB0byBvdXRwdXQgdGhlIENHIEFQSSBkZWJ1ZyBjb25zb2xlICovXG4gIGNnQXBpRGVidWdDb25zb2xlT3V0cHV0ID0gZmFsc2U7XG4gIC8qKlx1MzAwMFdoZXRoZXIgdG8gZW5hYmxlIG11bHRpLXZpZXcgZXh0ZW5zaW9uIGZvciBXZWJWUiAqL1xuICBtdWx0aVZpZXdGb3JXZWJWUiA9IGZhbHNlO1xuICAvKipcdTMwMDBUaGUgc2NhbGUgb2YgdGhlIHBoeXNpY3MgdGltZSBpbnRlcnZhbCAqL1xuICBwaHlzaWNzVGltZUludGVydmFsU2NhbGUgPSAxO1xuICAvKipcdTMwMDBXaGV0aGVyIHRoZSBkZXZpY2UgaXMgYSBtb2JpbGUgZGV2aWNlICovXG4gIGlzTW9iaWxlID0gZmFsc2U7XG4gIC8qKiBUaGUgYnVmZmVyIHNpemUgZGl2aXNpb24gcmF0aW9zIGZvciBHUFUgaW5zdGFuY2UgZGF0YSB1c2FnZSAqL1xuICBidWZmZXJTaXplRGl2aXNpb25SYXRpb3NGb3JHUFVJbnN0YW5jZURhdGFVc2FnZSA9IFsxIC8gMzIsIDUgLyAzMiwgNiAvIDMyLCAxMiAvIDMyXTtcbiAgLyoqIFRoZSBtaW5pbXVtIGxvZyBsZXZlbCB0aGF0IHdpbGwgYmUgb3V0cHV0LiBNZXNzYWdlcyBiZWxvdyB0aGlzIGxldmVsIGFyZSBpZ25vcmVkLiAqL1xuICBsb2dMZXZlbDogTG9nTGV2ZWwgPSBMb2dMZXZlbC5XYXJuO1xuICAvKipcbiAgICogV2hldGhlciB0byBlbmFibGUgV2ViR0wgbXVsdGktZHJhdyByZW5kZXJpbmcuXG4gICAqIFdoZW4gZW5hYmxlZCAoYW5kIHN1cHBvcnRlZCksIHByaW1pdGl2ZXMgc2hhcmluZyBhIHNvdXJjZSBCdWZmZXIgYXJlIG1lcmdlZCBpbnRvIHNoYXJlZFxuICAgKiB2ZXJ0ZXgvaW5kZXggYnVmZmVycyBhbmQgY29uc2VjdXRpdmUgZHJhd3Mgd2l0aCB0aGUgc2FtZSBzdGF0ZSBhcmUgaXNzdWVkIHdpdGggV0VCR0xfbXVsdGlfZHJhdy5cbiAgICovXG4gIGlzTXVsdGlEcmF3RW5hYmxlZCA9IHRydWU7XG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIHJlbmRlciBhIGRlcHRoIHByZXBhc3MgZm9yIHRoZSBvcGFxdWUgcHJpbWl0aXZlcyBvZiB0aGUgbWFpbiByZW5kZXIgcGFzc2VzIChXZWJHUFUgb25seSkuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIFRoZSBwcmVwYXNzIGRyYXdzIHRoZSBvcGFxdWUgcHJpbWl0aXZlcyB3aXRoIGEgZGVwdGgtb25seSBwaXBlbGluZSBiZWZvcmUgdGhlIGNvbG9yIHBhc3MsIGFuZCB0aGUgY29sb3IgcGFzc1xuICAgKiB0ZXN0cyB0aGUgZGVwdGggd2l0aCBgbGVzcy1lcXVhbGAuIEhpZGRlbiBmcmFnbWVudHMgYXJlIHJlamVjdGVkIGJlZm9yZSB0aGUgZnJhZ21lbnQgc2hhZGVyLCBzbyB0aGUgY29zdCBvZiB0aGVcbiAgICogcHJlcGFzcyAodmVydGV4IHByb2Nlc3NpbmcgYW5kIGEgdHJpdmlhbCBmcmFnbWVudCBzaGFkZXIpIGlzIHRyYWRlZCBmb3IgdGhlIHNoYWRpbmcgb2YgdGhlIG92ZXJkcmF3biBmcmFnbWVudHMuXG4gICAqXG4gICAqIFByaW1pdGl2ZXMgdGhhdCBhbHBoYSB0ZXN0IChNYXNrKSwgYWxwaGEtdG8tY292ZXJhZ2UsIGRpc2NhcmQgZm9yIHdpcmVmcmFtZSwgb3IgYmxlbmQgYXJlIG5vdCBwYXJ0IG9mIHRoZSBwcmVwYXNzOlxuICAgKiB0aGV5IGtlZXAgdGhlaXIgbm9ybWFsIGRyYXcsIGRlcHRoIHRlc3QgYW5kIGRlcHRoIHdyaXRlLiBBIG1hdGVyaWFsIHRoYXQgZGlzY2FyZHMgaW4gYW5vdGhlciB3YXkgc2hvdWxkIG5vdCBiZVxuICAgKiB1c2VkIHdpdGggdGhpcyBvcHRpb24uIEF0IGV4YWN0bHkgY29wbGFuYXIgc3VyZmFjZXMgdGhlIHZpc2libGUgc3VyZmFjZSBjYW4gY2hhbmdlLCBiZWNhdXNlIHRoZSBjb2xvciBwYXNzIHBhc3Nlc1xuICAgKiBmcmFnbWVudHMgd2hvc2UgZGVwdGggaXMgZXF1YWwgdG8gdGhlIHByZXBhc3MgZGVwdGggKGEgZmV3IGh1bmRyZWQgcGl4ZWxzIG9uIGEgU3BvbnphLXNjYWxlIHNjZW5lKS5cbiAgICpcbiAgICogUmVuZGVyIHBhc3NlcyB3aXRoIGEgbWF0ZXJpYWwgb3ZlcnJpZGUgKHNoYWRvdyBtYXBzLCBwb3N0IGVmZmVjdHMgYW5kIG90aGVyIGhlbHBlciBwYXNzZXMpIGFyZSBub3QgYWZmZWN0ZWQuXG4gICAqIFRoZSBwcmVwYXNzIGlzIHBlciByZW5kZXIgcGFzcywgc28gc3RlcmVvIHJlbmRlcmluZyBydW5zIGl0IG9uY2UgcGVyIGV5ZS4gVGhlIFdlYkdMMiBiYWNrZW5kIGlnbm9yZXMgdGhpcyBvcHRpb25cbiAgICogKGl0cyBtdWx0aS1kcmF3IHBhdGgga2VlcHMgdGhlIG1hdGVyaWFsIG9yZGVyKS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogTWVhc3VyZWQgb24gdGhlIDEwMDAtcG9pbnQtbGlnaHQgU3BvbnphIChXZWJHUFUsIEFwcGxlIE0yIE1heCk6IHRoZSBHUFUgdGltZSBmZWxsIGJ5IGFib3V0IDUtNyUgKDEyODB4NzIwOlxuICAgKiA0LjQ2IC0+IDQuMTMgbXMpIGFuZCB0aGUgZnJhbWUgd2FsbCB0aW1lIGJ5IGFib3V0IDAtMTAlICh0aGUgcnVuIHdhcyB0aGVybWFsbHkgdGhyb3R0bGVkLCBzbyB0cmVhdCB0aGUgd2FsbFxuICAgKiBudW1iZXIgYXMgYW4gdXBwZXIgYm91bmQpLiBUaGUgZ2FpbiBncm93cyB3aXRoIHRoZSBhbW91bnQgb2Ygb3ZlcmRyYXduIHNoYWRpbmcuIFRoZSBkZWZhdWx0IGlzIG9mZiBiZWNhdXNlIHRoZVxuICAgKiBleHRyYSBnZW9tZXRyeSBwYXNzIGh1cnRzIHNjZW5lcyB3aXRoIGxpdHRsZSBvdmVyZHJhdyBvciBoZWF2eSB2ZXJ0ZXggc2hhZGVycy5cbiAgICovXG4gIGlzRGVwdGhQcmVwYXNzRW5hYmxlZCA9IGZhbHNlO1xuICAvKipcbiAgICogV2hldGhlciB0byBjdWxsIHRoZSBpbnN0YW5jZXMgYWdhaW5zdCB0aGUgdmlldyBmcnVzdHVtIG9uIHRoZSBHUFUgKFdlYkdQVSBvbmx5KS5cbiAgICpcbiAgICogQHJlbWFya3NcbiAgICogRWFjaCBmcmFtZSwgb25lIGNvbXB1dGUgcGFzcyB0ZXN0cyB0aGUgaW5zdGFuY2VzIG9mIHRoZSBkcmF3biBtZXNoZXMgYWdhaW5zdCB0aGUgZnJ1c3R1bSBvZiB0aGUgcmVuZGVyIHBhc3MgY2FtZXJhXG4gICAqIGFuZCB3cml0ZXMgdGhlIHZpc2libGUgaW5zdGFuY2VzIGFuZCB0aGVpciBjb3VudCBmb3IgaW5kaXJlY3QgZHJhd3MgKGBkcmF3SW5kZXhlZEluZGlyZWN0YCkuIFRoZSByZW5kZXIgYnVuZGxlc1xuICAgKiByZWNvcmQgdGhlIGluZGlyZWN0IGRyYXdzLCBzbyB0aGV5IG5vIGxvbmdlciBoYXZlIHRvIGJlIHJlLXJlY29yZGVkIHdoZW4gdGhlIGNhbWVyYSBtb3ZlcyBhbmQgdGhlIHNldCBvZiB2aXNpYmxlXG4gICAqIG9iamVjdHMgY2hhbmdlcywgYW5kIHRoZSBpbnN0YW5jZXMgb2YgYW4gaW5zdGFuY2VkIG1lc2ggYXJlIGN1bGxlZCBvbmUgYnkgb25lLlxuICAgKlxuICAgKiBNZXNoZXMgd2l0aCBza2lubmluZyBvciBibGVuZCBzaGFwZXMgYXJlIGN1bGxlZCBvbiB0aGUgR1BVIHRvbyB3aGVuIGBpc0NvbXB1dGVTa2lubmluZ0VuYWJsZWRgIGlzIHRydWUgKHRoZWlyXG4gICAqIHZlcnRpY2VzIGFyZSBkZWZvcm1lZCBieSBhIGNvbXB1dGUgc2hhZGVyLCB3aGljaCBhbHNvIGNvbXB1dGVzIHRoZWlyIGJvdW5kaW5nIGJveGVzKTsgb3RoZXJ3aXNlIHRoZXkga2VlcCB0aGUgQ1BVXG4gICAqIGZydXN0dW0gY3VsbGluZy4gQSBjdWxsZWQgbWVzaCBzdGlsbCByZWNvcmRzIGl0cyAoemVyby1pbnN0YW5jZSkgZHJhdywgc28gaXRzIHBpcGVsaW5lIGFuZCBiaW5kIGdyb3VwcyBhcmUgc3RpbGwgc2V0LlxuICAgKiBUaGUgV2ViR0wyIGJhY2tlbmQgaWdub3JlcyB0aGlzIG9wdGlvbi4gYE1lc2hSZW5kZXJlckNvbXBvbmVudC5faXNGcnVzdHVtQ3VsbGluZ0VuYWJsZWQgPSBmYWxzZWAgZGlzYWJsZXMgYm90aFxuICAgKiB0aGUgQ1BVIGFuZCB0aGUgR1BVIGN1bGxpbmcuXG4gICAqL1xuICBpc0dwdUN1bGxpbmdFbmFibGVkID0gdHJ1ZTtcbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gZGVmb3JtIChtb3JwaCwgdGhlbiBza2luKSB0aGUgdmVydGljZXMgb2YgdGhlIG1lc2hlcyB3aXRoIHNraW5uaW5nIG9yIGJsZW5kIHNoYXBlcyBpbiBhIGNvbXB1dGUgc2hhZGVyXG4gICAqIChXZWJHUFUgb25seSwgdXNlZCB3aXRoIGBpc0dwdUN1bGxpbmdFbmFibGVkYCkuXG4gICAqXG4gICAqIEByZW1hcmtzXG4gICAqIE9uY2UgcGVyIGZyYW1lLCBhIGNvbXB1dGUgcGFzcyBhcHBsaWVzIHRoZSBibGVuZCBzaGFwZXMgYW5kIHRoZSBza2lubmluZyB0byB0aGUgdmVydGljZXMgb2YgZWFjaCBpbnN0YW5jZSBvZiBzdWNoXG4gICAqIG1lc2hlcyBhbmQgY29tcHV0ZXMgdGhlIGJvdW5kaW5nIGJveCBvZiBlYWNoIGRlZm9ybWVkIGluc3RhbmNlLiBUaGUgdmVydGV4IHNoYWRlcnMgcmVhZCB0aGUgZGVmb3JtZWQgdmVydGljZXNcbiAgICogaW5zdGVhZCBvZiBkZWZvcm1pbmcgdGhlbSBpbiBldmVyeSByZW5kZXIgcGFzcyAoZS5nLiB0aGUgc2hhZG93IGFuZCBkZXB0aCBwcmVwYXNzZXMpLCBhbmQgdGhlIEdQVSBmcnVzdHVtIGN1bGxpbmdcbiAgICogdGVzdHMgdGhlIGRlZm9ybWVkIGJvdW5kaW5nIGJveGVzLCBzbyB0aGVzZSBtZXNoZXMgYXJlIGN1bGxlZCBwZXIgaW5zdGFuY2Ugb24gdGhlIEdQVSBsaWtlIHRoZSBvdGhlciBtZXNoZXMuXG4gICAqIFRoZSBkcmF3cyB0aGF0IGFyZSBub3QgR1BVIGN1bGxlZCAoZS5nLiB3aGVuIHRoZSBjdWxsaW5nIHRhYmxlcyBhcmUgZnVsbCBvciBmb3IgYSBtdWx0aS12aWV3IHBhc3MpIGtlZXAgdGhlXG4gICAqIHZlcnRleCBzaGFkZXIgZGVmb3JtYXRpb24uXG4gICAqL1xuICBpc0NvbXB1dGVTa2lubmluZ0VuYWJsZWQgPSB0cnVlO1xuXG4gIGNvbnN0cnVjdG9yKGluaXREZXNjcmlwdGlvbjogQ29uZmlnSW5pdERlc2NyaXB0aW9uID0ge30pIHtcbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLnNjZW5lZ3JhcGhDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5zY2VuZWdyYXBoQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3ID0gaW5pdERlc2NyaXB0aW9uLnNjZW5lZ3JhcGhDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXc7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24uc2tlbGV0YWxDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5za2VsZXRhbENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldyA9IGluaXREZXNjcmlwdGlvbi5za2VsZXRhbENvbXBvbmVudENvdW50UGVyQnVmZmVyVmlldztcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5jYW1lcmFDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5jYW1lcmFDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgPSBpbml0RGVzY3JpcHRpb24uY2FtZXJhQ29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3O1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLmxpZ2h0Q29tcG9uZW50Q291bnRQZXJCdWZmZXJWaWV3ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMubGlnaHRDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXcgPSBpbml0RGVzY3JpcHRpb24ubGlnaHRDb21wb25lbnRDb3VudFBlckJ1ZmZlclZpZXc7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24ubWF4TGlnaHROdW1iZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5tYXhMaWdodE51bWJlciA9IGluaXREZXNjcmlwdGlvbi5tYXhMaWdodE51bWJlcjtcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5tYXRlcmlhbENvdW50UGVyQnVmZmVyVmlldyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3ID0gaW5pdERlc2NyaXB0aW9uLm1hdGVyaWFsQ291bnRQZXJCdWZmZXJWaWV3O1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLmJvbmVEYXRhVHlwZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmJvbmVEYXRhVHlwZSA9IGluaXREZXNjcmlwdGlvbi5ib25lRGF0YVR5cGU7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24uaXNVYm9FbmFibGVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuaXNVYm9FbmFibGVkID0gaW5pdERlc2NyaXB0aW9uLmlzVWJvRW5hYmxlZDtcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5ldmVudFRhcmdldERvbSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV2ZW50VGFyZ2V0RG9tID0gaW5pdERlc2NyaXB0aW9uLmV2ZW50VGFyZ2V0RG9tO1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLmNhY2hlV2ViR3B1UmVuZGVyQnVuZGxlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmNhY2hlV2ViR3B1UmVuZGVyQnVuZGxlcyA9IGluaXREZXNjcmlwdGlvbi5jYWNoZVdlYkdwdVJlbmRlckJ1bmRsZXM7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24uY2dBcGlEZWJ1Z0NvbnNvbGVPdXRwdXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5jZ0FwaURlYnVnQ29uc29sZU91dHB1dCA9IGluaXREZXNjcmlwdGlvbi5jZ0FwaURlYnVnQ29uc29sZU91dHB1dDtcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5tdWx0aVZpZXdGb3JXZWJWUiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm11bHRpVmlld0ZvcldlYlZSID0gaW5pdERlc2NyaXB0aW9uLm11bHRpVmlld0ZvcldlYlZSO1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLnBoeXNpY3NUaW1lSW50ZXJ2YWxTY2FsZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLnBoeXNpY3NUaW1lSW50ZXJ2YWxTY2FsZSA9IGluaXREZXNjcmlwdGlvbi5waHlzaWNzVGltZUludGVydmFsU2NhbGU7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24uaXNNb2JpbGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5pc01vYmlsZSA9IGluaXREZXNjcmlwdGlvbi5pc01vYmlsZTtcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5idWZmZXJTaXplRGl2aXNpb25SYXRpb3NGb3JHUFVJbnN0YW5jZURhdGFVc2FnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmJ1ZmZlclNpemVEaXZpc2lvblJhdGlvc0ZvckdQVUluc3RhbmNlRGF0YVVzYWdlID1cbiAgICAgICAgaW5pdERlc2NyaXB0aW9uLmJ1ZmZlclNpemVEaXZpc2lvblJhdGlvc0ZvckdQVUluc3RhbmNlRGF0YVVzYWdlO1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLmxvZ0xldmVsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMubG9nTGV2ZWwgPSBpbml0RGVzY3JpcHRpb24ubG9nTGV2ZWw7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24uaXNNdWx0aURyYXdFbmFibGVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuaXNNdWx0aURyYXdFbmFibGVkID0gaW5pdERlc2NyaXB0aW9uLmlzTXVsdGlEcmF3RW5hYmxlZDtcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5pc0RlcHRoUHJlcGFzc0VuYWJsZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5pc0RlcHRoUHJlcGFzc0VuYWJsZWQgPSBpbml0RGVzY3JpcHRpb24uaXNEZXB0aFByZXBhc3NFbmFibGVkO1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLmlzR3B1Q3VsbGluZ0VuYWJsZWQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5pc0dwdUN1bGxpbmdFbmFibGVkID0gaW5pdERlc2NyaXB0aW9uLmlzR3B1Q3VsbGluZ0VuYWJsZWQ7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24uaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuaXNDb21wdXRlU2tpbm5pbmdFbmFibGVkID0gaW5pdERlc2NyaXB0aW9uLmlzQ29tcHV0ZVNraW5uaW5nRW5hYmxlZDtcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5pc0NsdXN0ZXJlZEZvcndhcmRFbmFibGVkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuaXNDbHVzdGVyZWRGb3J3YXJkRW5hYmxlZCA9IGluaXREZXNjcmlwdGlvbi5pc0NsdXN0ZXJlZEZvcndhcmRFbmFibGVkO1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLmNsdXN0ZXJlZEZvcndhcmRCdWlsZE1vZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5jbHVzdGVyZWRGb3J3YXJkQnVpbGRNb2RlID0gaW5pdERlc2NyaXB0aW9uLmNsdXN0ZXJlZEZvcndhcmRCdWlsZE1vZGU7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24uY2x1c3RlcmVkRm9yd2FyZEdyaWRTaXplICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuY2x1c3RlcmVkRm9yd2FyZEdyaWRTaXplID0gWy4uLmluaXREZXNjcmlwdGlvbi5jbHVzdGVyZWRGb3J3YXJkR3JpZFNpemVdO1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLmNsdXN0ZXJlZEZvcndhcmRNaW5Mb2NhbExpZ2h0TnVtYmVyICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuY2x1c3RlcmVkRm9yd2FyZE1pbkxvY2FsTGlnaHROdW1iZXIgPSBpbml0RGVzY3JpcHRpb24uY2x1c3RlcmVkRm9yd2FyZE1pbkxvY2FsTGlnaHROdW1iZXI7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24uY2x1c3RlcmVkRm9yd2FyZE1heFZpZXdOdW1iZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5jbHVzdGVyZWRGb3J3YXJkTWF4Vmlld051bWJlciA9IGluaXREZXNjcmlwdGlvbi5jbHVzdGVyZWRGb3J3YXJkTWF4Vmlld051bWJlcjtcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5jbHVzdGVyZWRGb3J3YXJkTGlnaHRDYXBhY2l0eVBlckNsdXN0ZXIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5jbHVzdGVyZWRGb3J3YXJkTGlnaHRDYXBhY2l0eVBlckNsdXN0ZXIgPSBpbml0RGVzY3JpcHRpb24uY2x1c3RlcmVkRm9yd2FyZExpZ2h0Q2FwYWNpdHlQZXJDbHVzdGVyO1xuICAgIH1cbiAgICBpZiAoaW5pdERlc2NyaXB0aW9uLm1heExpZ2h0TGlzdExlbmd0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLm1heExpZ2h0TGlzdExlbmd0aCA9IGluaXREZXNjcmlwdGlvbi5tYXhMaWdodExpc3RMZW5ndGg7XG4gICAgfVxuICAgIGlmIChpbml0RGVzY3JpcHRpb24ubGlnaHRBdXRvUmFuZ2VUaHJlc2hvbGQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5saWdodEF1dG9SYW5nZVRocmVzaG9sZCA9IGluaXREZXNjcmlwdGlvbi5saWdodEF1dG9SYW5nZVRocmVzaG9sZDtcbiAgICB9XG4gICAgaWYgKGluaXREZXNjcmlwdGlvbi5saWdodFJhbmdlU2NhbGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5saWdodFJhbmdlU2NhbGUgPSBpbml0RGVzY3JpcHRpb24ubGlnaHRSYW5nZVNjYWxlO1xuICAgIH1cbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQU1BLFNBQVMsUUFBUSxnQkFBZ0I7QUE0QzFCLElBQU0sU0FBTixNQUFhO0FBQUEsRUFzUmxCLFlBQVksa0JBQXlDLENBQUMsR0FBRztBQXBSekQ7QUFBQSxpREFBd0M7QUFFeEM7QUFBQSwrQ0FBc0M7QUFFdEM7QUFBQSw2Q0FBb0M7QUFNcEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLDRDQUFtQztBQVVuQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFRQSxLQUFt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SSxnQkFBZ0IsOEJBQThCLFFBQVc7QUFDM0QsV0FBSyw0QkFBNEIsZ0JBQWdCO0FBQUEsSUFDbkQ7QUFDQSxRQUFJLGdCQUFnQiw2QkFBNkIsUUFBVztBQUMxRCxXQUFLLDJCQUEyQixDQUFDLEdBQUcsZ0JBQWdCLHdCQUF3QjtBQUFBLElBQzlFO0FBQ0EsUUFBSSxnQkFBZ0Isd0NBQXdDLFFBQVc7QUFDckUsV0FBSyxzQ0FBc0MsZ0JBQWdCO0FBQUEsSUFDN0Q7QUFDQSxRQUFJLGdCQUFnQixrQ0FBa0MsUUFBVztBQUMvRCxXQUFLLGdDQUFnQyxnQkFBZ0I7QUFBQSxJQUN2RDtBQUNBLFFBQUksZ0JBQWdCLDRDQUE0QyxRQUFXO0FBQ3pFLFdBQUssMENBQTBDLGdCQUFnQjtBQUFBLElBQ2pFO0FBQ0EsUUFBSSxnQkFBZ0IsdUJBQXVCLFFBQVc7QUFDcEQsV0FBSyxxQkFBcUIsZ0JBQWdCO0FBQUEsSUFDNUM7QUFDQSxRQUFJLGdCQUFnQiw0QkFBNEIsUUFBVztBQUN6RCxXQUFLLDBCQUEwQixnQkFBZ0I7QUFBQSxJQUNqRDtBQUNBLFFBQUksZ0JBQWdCLG9CQUFvQixRQUFXO0FBQ2pELFdBQUssa0JBQWtCLGdCQUFnQjtBQUFBLElBQ3pDO0FBQUEsRUFDRjtBQUFBO0FBQUEsRUF2VkEsSUFBSSxpQkFBeUI7QUFDM0IsV0FBTyxLQUFLRDtBQUFBLEVBQ2Q7QUFBQTtBQUFBLEVBRUEsSUFBSSxlQUFlLE9BQWU7QUFDaEMsUUFBSSxFQUFFLFNBQVMsSUFBSTtBQUNqQixhQUFPLFFBQVEsS0FBSywwQkFBMEIsS0FBSyxnREFBZ0Q7QUFDbkcsV0FBS0EsS0FBbUI7QUFDeEI7QUFBQSxJQUNGO0FBQ0EsU0FBS0EsS0FBbUI7QUFBQSxFQUMxQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVNBLElBQUksc0JBQThCO0FBQ2hDLFdBQU8sS0FBS0EsS0FBbUIsSUFBSSxLQUFLQSxLQUFtQjtBQUFBLEVBQzdEO0FBQUE7QUFBQSxFQWlJQSxJQUFJLGtCQUEwQjtBQUM1QixXQUFPLEtBQUtDO0FBQUEsRUFDZDtBQUFBO0FBQUEsRUFFQSxJQUFJLGdCQUFnQixPQUFlO0FBQ2pDLFFBQUksRUFBRSxRQUFRLE1BQU0sUUFBUSxHQUFHO0FBQzdCLGFBQU8sUUFBUSxLQUFLLDJCQUEyQixLQUFLLHNDQUFzQztBQUMxRixXQUFLQSxLQUFvQjtBQUN6QjtBQUFBLElBQ0Y7QUFDQSxTQUFLQSxLQUFvQjtBQUFBLEVBQzNCO0FBc0xGOyIsCiAgIm5hbWVzIjogWyJfX21heExpZ2h0TnVtYmVyIiwgIl9fbGlnaHRSYW5nZVNjYWxlIl0KfQo=
