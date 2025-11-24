/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */

/* eslint-disable prefer-const */
import { BoneDataType } from '../definitions/BoneDataType';
import { MiscUtil } from '../misc';

/**　The number of scenegraph components per buffer view */
let scenegraphComponentCountPerBufferView = 10;

/**　The number of camera components per buffer view */
let cameraComponentCountPerBufferView = 1;

/**　The number of light components per buffer view */
let lightComponentCountPerBufferView = 1;

/**　The maximum number of lights that Rhodonite can handle */
let maxLightNumber = 6;

/**
 * The number of materials per buffer view
 */
let materialCountPerBufferView = 3;

/**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
let maxSkeletalBoneNumberForUniformMode = 50;

/**　The data type of the bone */
let boneDataType = BoneDataType.Mat43x1;

/**　Whether the UBO is enabled */
let isUboEnabled = false;

/**　The event target DOM for mouse operation */
let eventTargetDom: HTMLElement | undefined;

/**　Whether to cache the WebGPU render bundles */
let cacheWebGpuRenderBundles = true;

/**　Whether to output the CG API debug console */
let cgApiDebugConsoleOutput = false;

/**　Whether to enable multi-view extension for WebVR */
let multiViewForWebVR = false;

/**　The scale of the physics time interval */
let physicsTimeIntervalScale = 1;

/**　Whether the device is a mobile device */
let isMobile = false;

/**
 * Config is a configuration object that contains the configuration for the library.
 */
export const Config = {
  /**　The number of scenegraph components per buffer view */
  scenegraphComponentCountPerBufferView,
  /**　The number of camera components per buffer view */
  cameraComponentCountPerBufferView,
  /**　The number of light components per buffer view */
  lightComponentCountPerBufferView,
  /**　The maximum number of lights that Rhodonite can handle */
  maxLightNumber,
  /**
   * Number of instances of each material type to be placed consecutively in memory.
   * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
   * If this limit is exceeded, the material type is internally treated as a separate material type.
   */
  materialCountPerBufferView,
  /**　The data type of the bone */
  boneDataType,
  /**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
  maxSkeletalBoneNumberForUniformMode,
  /**　Whether the UBO is enabled */
  isUboEnabled,
  /**　The event target DOM for mouse operation */
  eventTargetDom,
  /**　Whether to cache the WebGPU render bundles */
  cacheWebGpuRenderBundles,
  /**　Whether to output the CG API debug console */
  cgApiDebugConsoleOutput,
  /**　Whether to enable multi-view extension for WebVR */
  multiViewForWebVR,
  /**　The scale of the physics time interval */
  physicsTimeIntervalScale,
  /**　Whether the device is a mobile device */
  isMobile,
};
