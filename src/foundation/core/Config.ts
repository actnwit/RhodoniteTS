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

/**　The number of skeletal components per buffer view */
let skeletalComponentCountPerBufferView = 1;

/**　The maximum number of lights that Rhodonite can handle */
let maxLightNumber = 6;

/**　The maximum number of morph targets that Rhodonite can handle */
let maxMorphTargetNumber = 41;

/**　The maximum number of morph primitives that Rhodonite can handle in WebGPU */
let maxMorphPrimitiveNumberInWebGPU = 100;

/**
 * Number of instances of each material type to be placed consecutively in memory.
 * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
 * If this limit is exceeded, the material type is internally treated as a separate material type.
 */
let maxMaterialInstanceForEachType = 10;

/**　The maximum number of skeletons that Rhodonite can handle */
let maxSkeletonNumber = 33;

/**　The maximum number of bones of each skeleton that Rhodonite can handle */
let maxSkeletalBoneNumber = 300;

/**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
let maxSkeletalBoneNumberForUniformMode = 50;

/**　The width of the data texture */
let dataTextureWidth = 2 ** 12;

/**　The height of the data texture */
let dataTextureHeight = 2 ** 12;

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

/**　The unit size of the GPU buffer. It must be multiple of 16 bytes. */
let gpuBufferUnitSize = 4096 ** 2 * 4 /* rgba */ * 4 /* byte */;

if (typeof navigator !== 'undefined') {
  if (MiscUtil.isMobile() || MiscUtil.isMobileVr()) {
    maxMorphTargetNumber = 4;
    maxSkeletonNumber = 32;
    dataTextureWidth = 2 ** 9;
    dataTextureHeight = 2 ** 9;
  }
}

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
  /**　The number of skeletal components per buffer view */
  skeletalComponentCountPerBufferView,
  /**　The maximum number of lights that Rhodonite can handle */
  maxLightNumber,
  /**　The maximum number of morph targets that Rhodonite can handle */
  maxMorphTargetNumber,
  /**　The maximum number of morph primitives that Rhodonite can handle in WebGPU */
  maxMorphPrimitiveNumberInWebGPU,
  /**
   * Number of instances of each material type to be placed consecutively in memory.
   * This is on the memory layout, and the number of material instances that can be generated is not limited by this setting.
   * If this limit is exceeded, the material type is internally treated as a separate material type.
   */
  maxMaterialInstanceForEachType,
  /**　The data type of the bone */
  boneDataType,
  /**　The maximum number of skeletons that Rhodonite can handle */
  maxSkeletonNumber,
  /**　The maximum number of bones of each skeleton that Rhodonite can handle */
  maxSkeletalBoneNumber,
  /**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
  maxSkeletalBoneNumberForUniformMode,
  /**　The width of the data texture */
  dataTextureWidth,
  /**　The height of the data texture */
  dataTextureHeight,
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
  /**　The unit size of the GPU buffer. It must be multiple of 16 bytes. */
  gpuBufferUnitSize,
};
