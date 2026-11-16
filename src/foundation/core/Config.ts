/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */

/* eslint-disable prefer-const */
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
  isClusteredForwardEnabled?: boolean;
  clusteredForwardBuildMode?: ClusteredForwardBuildMode;
  clusteredForwardGridSize?: [number, number, number];
  clusteredForwardMaxViewNumber?: number;
  clusteredForwardMaxLightIndexNumber?: number;
  maxLightListLength?: number;
  lightAutoRangeThreshold?: number;
};

/**
 * Where the light clusters of Clustered Forward rendering are built.
 * - `'auto'`: WebGPU builds them with compute shaders, WebGL2 builds them on the CPU.
 * - `'cpu'`: Both backends build them on the CPU.
 */
export type ClusteredForwardBuildMode = 'auto' | 'cpu';

/**
 * Config is a configuration class that contains the configuration for the library.
 */
export class Config {
  /**　The number of scenegraph components per buffer view */
  scenegraphComponentCountPerBufferView = 1000;
  /**　The number of skeletal components per buffer view */
  skeletalComponentCountPerBufferView = 100;
  /**　The number of camera components per buffer view */
  cameraComponentCountPerBufferView = 1;
  /**
   * The number of light components per buffer view.
   * Every new buffer view changes the generated shader getters and recompiles all shaders,
   * so this is large enough for scenes with many lights.
   */
  lightComponentCountPerBufferView = 64;
  /**
   * The maximum number of lights that can cast shadows at the same time.
   * This is also the length of the per-light arrays of the MToon 0.x shader.
   */
  maxLightNumber = 6;
  /**
   * Whether Clustered Forward rendering is enabled.
   * When enabled, each fragment evaluates only the lights whose range reaches the cluster (froxel) of the fragment.
   * Lights without a range limit and directional lights are always evaluated.
   */
  isClusteredForwardEnabled = true;
  /** Where the light clusters are built. See {@link ClusteredForwardBuildMode}. */
  clusteredForwardBuildMode: ClusteredForwardBuildMode = 'auto';
  /** The number of clusters along the screen X, screen Y and view depth axes. */
  clusteredForwardGridSize: [number, number, number] = [16, 9, 24];
  /**
   * The maximum number of cameras whose light clusters are built in one frame.
   * The other cameras evaluate all lights.
   */
  clusteredForwardMaxViewNumber = 4;
  /**
   * The capacity of the light index list of each camera, in light entries. The list of each cluster is padded to
   * a multiple of 4 entries, so the capacity has to cover the sum of the padded light counts of all clusters.
   * When the capacity is exceeded, the camera evaluates all lights in that frame.
   */
  clusteredForwardMaxLightIndexNumber = 32768;
  /** The maximum number of enabled lights that are shaded. The other lights are ignored. (max: 65535) */
  maxLightListLength = 1024;
  /**
   * When greater than 0, point and spot lights without a range get an effective range where their intensity
   * (the maximum of color * intensity, divided by the squared distance) falls to this value.
   * This makes those lights fade out smoothly at that distance and lets Clustered Forward rendering cull them.
   */
  lightAutoRangeThreshold = 0;
  /**
   * Number of instances of each material type to be placed consecutively in memory.
   * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
   * If this limit is exceeded, the material type is internally treated as a separate material type.
   */
  materialCountPerBufferView = 100;
  /**
   * Forces the bone data type of all SkeletalComponents.
   * When undefined (default), each SkeletalComponent uses its own bone data type
   * (see SkeletalComponent.setBoneDataType). Importers choose Vec4x1 or Vec4x2 automatically,
   * and other SkeletalComponents default to Vec4x2.
   */
  boneDataType: BoneDataTypeEnum | undefined = undefined;
  /**　Whether the UBO is enabled */
  isUboEnabled = false;
  /**　The event target DOM for mouse operation */
  eventTargetDom: HTMLElement | undefined;
  /**　Whether to cache the WebGPU render bundles */
  cacheWebGpuRenderBundles = true;
  /**　Whether to output the CG API debug console */
  cgApiDebugConsoleOutput = false;
  /**　Whether to enable multi-view extension for WebVR */
  multiViewForWebVR = false;
  /**　The scale of the physics time interval */
  physicsTimeIntervalScale = 1;
  /**　Whether the device is a mobile device */
  isMobile = false;
  /** The buffer size division ratios for GPU instance data usage */
  bufferSizeDivisionRatiosForGPUInstanceDataUsage = [1 / 32, 5 / 32, 6 / 32, 12 / 32];
  /** The minimum log level that will be output. Messages below this level are ignored. */
  logLevel: LogLevel = LogLevel.Warn;
  /**
   * Whether to enable WebGL multi-draw rendering.
   * When enabled (and supported), primitives sharing a source Buffer are merged into shared
   * vertex/index buffers and consecutive draws with the same state are issued with WEBGL_multi_draw.
   */
  isMultiDrawEnabled = true;

  constructor(initDescription: ConfigInitDescription = {}) {
    if (initDescription.scenegraphComponentCountPerBufferView !== undefined) {
      this.scenegraphComponentCountPerBufferView = initDescription.scenegraphComponentCountPerBufferView;
    }
    if (initDescription.skeletalComponentCountPerBufferView !== undefined) {
      this.skeletalComponentCountPerBufferView = initDescription.skeletalComponentCountPerBufferView;
    }
    if (initDescription.cameraComponentCountPerBufferView !== undefined) {
      this.cameraComponentCountPerBufferView = initDescription.cameraComponentCountPerBufferView;
    }
    if (initDescription.lightComponentCountPerBufferView !== undefined) {
      this.lightComponentCountPerBufferView = initDescription.lightComponentCountPerBufferView;
    }
    if (initDescription.maxLightNumber !== undefined) {
      this.maxLightNumber = initDescription.maxLightNumber;
    }
    if (initDescription.materialCountPerBufferView !== undefined) {
      this.materialCountPerBufferView = initDescription.materialCountPerBufferView;
    }
    if (initDescription.boneDataType !== undefined) {
      this.boneDataType = initDescription.boneDataType;
    }
    if (initDescription.isUboEnabled !== undefined) {
      this.isUboEnabled = initDescription.isUboEnabled;
    }
    if (initDescription.eventTargetDom !== undefined) {
      this.eventTargetDom = initDescription.eventTargetDom;
    }
    if (initDescription.cacheWebGpuRenderBundles !== undefined) {
      this.cacheWebGpuRenderBundles = initDescription.cacheWebGpuRenderBundles;
    }
    if (initDescription.cgApiDebugConsoleOutput !== undefined) {
      this.cgApiDebugConsoleOutput = initDescription.cgApiDebugConsoleOutput;
    }
    if (initDescription.multiViewForWebVR !== undefined) {
      this.multiViewForWebVR = initDescription.multiViewForWebVR;
    }
    if (initDescription.physicsTimeIntervalScale !== undefined) {
      this.physicsTimeIntervalScale = initDescription.physicsTimeIntervalScale;
    }
    if (initDescription.isMobile !== undefined) {
      this.isMobile = initDescription.isMobile;
    }
    if (initDescription.bufferSizeDivisionRatiosForGPUInstanceDataUsage !== undefined) {
      this.bufferSizeDivisionRatiosForGPUInstanceDataUsage =
        initDescription.bufferSizeDivisionRatiosForGPUInstanceDataUsage;
    }
    if (initDescription.logLevel !== undefined) {
      this.logLevel = initDescription.logLevel;
    }
    if (initDescription.isMultiDrawEnabled !== undefined) {
      this.isMultiDrawEnabled = initDescription.isMultiDrawEnabled;
    }
    if (initDescription.isClusteredForwardEnabled !== undefined) {
      this.isClusteredForwardEnabled = initDescription.isClusteredForwardEnabled;
    }
    if (initDescription.clusteredForwardBuildMode !== undefined) {
      this.clusteredForwardBuildMode = initDescription.clusteredForwardBuildMode;
    }
    if (initDescription.clusteredForwardGridSize !== undefined) {
      this.clusteredForwardGridSize = [...initDescription.clusteredForwardGridSize];
    }
    if (initDescription.clusteredForwardMaxViewNumber !== undefined) {
      this.clusteredForwardMaxViewNumber = initDescription.clusteredForwardMaxViewNumber;
    }
    if (initDescription.clusteredForwardMaxLightIndexNumber !== undefined) {
      this.clusteredForwardMaxLightIndexNumber = initDescription.clusteredForwardMaxLightIndexNumber;
    }
    if (initDescription.maxLightListLength !== undefined) {
      this.maxLightListLength = initDescription.maxLightListLength;
    }
    if (initDescription.lightAutoRangeThreshold !== undefined) {
      this.lightAutoRangeThreshold = initDescription.lightAutoRangeThreshold;
    }
  }
}
