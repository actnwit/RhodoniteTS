/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */

/* eslint-disable prefer-const */
import { BoneDataType } from '../definitions/BoneDataType';

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

  public setUpAsMemoryBoostMode() {
    this.bufferSizeDivisionRatiosForGPUInstanceDataUsage = [1 / 4, 1 / 4, 1 / 4, 1 / 4];
    this.skeletalComponentCountPerBufferView = 100;
    this.scenegraphComponentCountPerBufferView = 1000;
    this.materialCountPerBufferView = 1000;
  }
}
