/* eslint-disable prefer-const */
import { BoneDataType } from '../definitions/BoneDataType';
import { MiscUtil } from '../misc';

let maxEntityNumber = 5000;
let maxLightNumberInShader = 4;
let maxVertexMorphNumberInShader = 100;
let maxVertexPrimitiveNumberInShader = 20;
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
let maxMorphTargetNumber = 4;
let totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
let isUboEnabled = false;
let eventTargetDom: HTMLElement | undefined;
let cacheWebGpuRenderBundles = true; // For WebGPU debug, set false to disable cache
let cgApiDebugConsoleOutput = false;
let multiViewForWebVR = false;

if (typeof navigator !== 'undefined') {
  if (MiscUtil.isMobile() || MiscUtil.isMobileVr()) {
    maxVertexMorphNumberInShader = 4;
    maxSkeletonNumber = 32;
    dataTextureWidth = 2 ** 9;
    dataTextureHeight = 2 ** 9;
  }
}

export const Config = {
  maxEntityNumber,
  maxLightNumberInShader,
  maxVertexMorphNumberInShader,
  maxVertexPrimitiveNumberInShader,
  maxMaterialInstanceForEachType,
  boneDataType,
  maxSkeletonNumber,
  maxCameraNumber,
  maxSizeLimitOfNonCompressedTexture,
  maxSkeletalBoneNumber,
  maxSkeletalBoneNumberForUniformMode,
  dataTextureWidth,
  dataTextureHeight,
  maxMorphTargetNumber,
  totalSizeOfGPUShaderDataStorageExceptMorphData,
  isUboEnabled,
  eventTargetDom,
  cacheWebGpuRenderBundles,
  cgApiDebugConsoleOutput,
  multiViewForWebVR,
};
