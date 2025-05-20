/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */

/* eslint-disable prefer-const */
import { BoneDataType } from '../definitions/BoneDataType';
import { MiscUtil } from '../misc';

/**　The maximum number of entities that Rhodonite can handle　*/
let maxEntityNumber = 5000;

/**　The maximum number of lights that Rhodonite can handle */
let maxLightNumber = 6;

/**　The maximum number of morph targets that Rhodonite can handle */
let maxMorphTargetNumber = 41;

/**　The maximum number of morph primitives that Rhodonite can handle in WebGPU */
let maxMorphPrimitiveNumberInWebGPU = 100;

/**
 * Number of instances of each material type to be placed consecutively in memory.
 * The number of material instances that can be generated is not limited by this setting,
 * as it is on the memory layout.
 * If this limit is exceeded, the material type is internally treated as a separate material type.
 */
let maxMaterialInstanceForEachType = 10;

/**　The maximum number of skeletons that Rhodonite can handle */
let maxSkeletonNumber = 33;

/**　The maximum number of cameras that Rhodonite can handle */
let maxCameraNumber = 30;

/**　The maximum size of non-compressed textures that Rhodonite can handle */
let maxSizeLimitOfNonCompressedTexture = 512;

/**　The maximum number of bones of each skeleton that Rhodonite can handle */
let maxSkeletalBoneNumber = 300;

/**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
let maxSkeletalBoneNumberForUniformMode = 50;

/**　The width of the data texture */
let dataTextureWidth = Math.pow(2, 12);

/**　The height of the data texture */
let dataTextureHeight = Math.pow(2, 12);

/**　The data type of the bone */
let boneDataType = BoneDataType.Mat43x1;

/**　The total size of the GPU shader data storage except for the morph data */
let totalSizeOfGPUShaderDataStorageExceptMorphData = 0;

/**　Whether the UBO is enabled */
let isUboEnabled = false;

/**　The event target DOM */
let eventTargetDom: HTMLElement | undefined;

/**　Whether to cache the WebGPU render bundles */
let cacheWebGpuRenderBundles = true;

/**　Whether to output the CG API debug console */
let cgApiDebugConsoleOutput = false;

/**　Whether to enable multi-view for WebVR */
let multiViewForWebVR = false;

/**　The scale of the physics time interval */
let physicsTimeIntervalScale = 1;

/**　Whether the device is a mobile device */
let isMobile = false;

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
  /**　The maximum number of entities that Rhodonite can handle　*/
  maxEntityNumber,
  /**　The maximum number of lights that Rhodonite can handle */
  maxLightNumber,
  /**　The maximum number of morph targets that Rhodonite can handle */
  maxMorphTargetNumber,
  /**　The maximum number of morph primitives that Rhodonite can handle in WebGPU */
  maxMorphPrimitiveNumberInWebGPU,
  /**
   * Number of instances of each material type to be placed consecutively in memory.
   * The number of material instances that can be generated is not limited by this setting,
   * as it is on the memory layout.
   * If this limit is exceeded, the material type is internally treated as a separate material type.
   */
  maxMaterialInstanceForEachType,
  /**　The data type of the bone */
  boneDataType,
  /**　The maximum number of skeletons that Rhodonite can handle */
  maxSkeletonNumber,
  /**　The maximum number of cameras that Rhodonite can handle */
  maxCameraNumber,
  /**　The maximum size of non-compressed textures that Rhodonite can handle */
  maxSizeLimitOfNonCompressedTexture,
  /**　The maximum number of bones of each skeleton that Rhodonite can handle */
  maxSkeletalBoneNumber,
  /**　The maximum number of bones of each skeleton that Rhodonite can handle for Uniform Mode */
  maxSkeletalBoneNumberForUniformMode,
  /**　The width of the data texture */
  dataTextureWidth,
  /**　The height of the data texture */
  dataTextureHeight,
  /**　The total size of the GPU shader data storage except for the morph data */
  totalSizeOfGPUShaderDataStorageExceptMorphData,
  /**　Whether the UBO is enabled */
  isUboEnabled,
  /**　The event target DOM */
  eventTargetDom,
  /**　Whether to cache the WebGPU render bundles */
  cacheWebGpuRenderBundles,
  /**　Whether to output the CG API debug console */
  cgApiDebugConsoleOutput,
  /**　Whether to enable multi-view for WebVR */
  multiViewForWebVR,
  /**　The scale of the physics time interval */
  physicsTimeIntervalScale,
  /**　Whether the device is a mobile device */
  isMobile,
};
