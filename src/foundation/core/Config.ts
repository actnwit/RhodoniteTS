/**
 * Config.ts is a configuration file that contains the configuration for the library.
 */

/* eslint-disable prefer-const */
import { BoneDataType } from '../definitions/BoneDataType';
import { MiscUtil } from '../misc';

/**　The maximum number of entities that Rhodonite can handle　*/
let maxEntityNumber = 5000;

/**　The maximum number of lights that Rhodonite can handle */
let maxLightNumber = 4;

/**　The maximum number of morph targets that Rhodonite can handle in the shader */
let maxMorphTargetNumber = 41;

/**　The maximum number of vertices that Rhodonite can handle in the shader */
let maxMorphPrimitiveNumberInWebGPU = 10;

let maxMaterialInstanceForEachType = 10;
let maxSkeletonNumber = 33;
let maxCameraNumber = 30;
let maxSizeLimitOfNonCompressedTexture = 512;

/// ShaderGlobalStorageSize ///
let maxSkeletalBoneNumber = 300;
let maxSkeletalBoneNumberForUniformMode = 50; // For Uniform Mode
let dataTextureWidth = Math.pow(2, 12);
let dataTextureHeight = Math.pow(2, 12);
let boneDataType = BoneDataType.Mat43x1;
let totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
let isUboEnabled = false;
let eventTargetDom: HTMLElement | undefined;
let cacheWebGpuRenderBundles = true; // For WebGPU debug, set false to disable cache
let cgApiDebugConsoleOutput = false;
let multiViewForWebVR = false;
let physicsTimeIntervalScale = 1;
let isMobile = false;
let shadowMapTextureArrayLength = 4;

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
  maxEntityNumber,
  maxLightNumber,
  maxMorphTargetNumber,
  maxMorphPrimitiveNumberInWebGPU,
  maxMaterialInstanceForEachType,
  boneDataType,
  maxSkeletonNumber,
  maxCameraNumber,
  maxSizeLimitOfNonCompressedTexture,
  maxSkeletalBoneNumber,
  maxSkeletalBoneNumberForUniformMode,
  dataTextureWidth,
  dataTextureHeight,
  totalSizeOfGPUShaderDataStorageExceptMorphData,
  isUboEnabled,
  eventTargetDom,
  cacheWebGpuRenderBundles,
  cgApiDebugConsoleOutput,
  multiViewForWebVR,
  physicsTimeIntervalScale,
  isMobile,
  shadowMapTextureArrayLength,
};
