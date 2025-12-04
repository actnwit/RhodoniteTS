/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */

/* eslint-disable prefer-const */
import { BoneDataType, type BoneDataTypeEnum } from '../definitions/BoneDataType';
import { LogLevel } from '../misc/Logger';

type ConfigInitDescription = {
  scenegraphComponentCountPerBufferView?: number;
  skeletalComponentCountPerBufferView?: number;
  cameraComponentCountPerBufferView?: number;
  lightComponentCountPerBufferView?: number;
  maxLightNumber?: number;
  maxBoneNumberForMemoryBoostMode?: number;
  materialCountPerBufferView?: number;
  boneDataType?: BoneDataTypeEnum;
  maxSkeletalBoneNumberForUniformMode?: number;
  isUboEnabled?: boolean;
  eventTargetDom?: HTMLElement;
  cacheWebGpuRenderBundles?: boolean;
  cgApiDebugConsoleOutput?: boolean;
  multiViewForWebVR?: boolean;
  physicsTimeIntervalScale?: number;
  isMobile?: boolean;
  bufferSizeDivisionRatiosForGPUInstanceDataUsage?: number[];
  logLevel?: LogLevel;
};

/**
 * Config is a configuration class that contains the configuration for the library.
 */
export class Config {
  /**　The number of scenegraph components per buffer view */
  scenegraphComponentCountPerBufferView = 10;
  /**　The number of skeletal components per buffer view */
  skeletalComponentCountPerBufferView = 1;
  /**　The number of camera components per buffer view */
  cameraComponentCountPerBufferView = 1;
  /**　The number of light components per buffer view */
  lightComponentCountPerBufferView = 1;
  /**　The maximum number of lights that Rhodonite can handle */
  maxLightNumber = 6;
  /**　The maximum number of bones that Rhodonite can handle for Memory Boost Mode */
  maxBoneNumberForMemoryBoostMode = 500;
  /**
   * Number of instances of each material type to be placed consecutively in memory.
   * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
   * If this limit is exceeded, the material type is internally treated as a separate material type.
   */
  materialCountPerBufferView = 3;
  /**　The data type of the bone */
  boneDataType = BoneDataType.Mat43x1;
  /**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
  maxSkeletalBoneNumberForUniformMode = 50;
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
    if (initDescription.maxBoneNumberForMemoryBoostMode !== undefined) {
      this.maxBoneNumberForMemoryBoostMode = initDescription.maxBoneNumberForMemoryBoostMode;
    }
    if (initDescription.materialCountPerBufferView !== undefined) {
      this.materialCountPerBufferView = initDescription.materialCountPerBufferView;
    }
    if (initDescription.boneDataType !== undefined) {
      this.boneDataType = initDescription.boneDataType;
    }
    if (initDescription.maxSkeletalBoneNumberForUniformMode !== undefined) {
      this.maxSkeletalBoneNumberForUniformMode = initDescription.maxSkeletalBoneNumberForUniformMode;
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
  }

  public setUpAsMemoryBoostMode() {
    this.bufferSizeDivisionRatiosForGPUInstanceDataUsage = [1 / 4, 1 / 4, 1 / 4, 1 / 4];
    this.skeletalComponentCountPerBufferView = 100;
    this.scenegraphComponentCountPerBufferView = 1000;
    this.materialCountPerBufferView = 1000;
  }
}
