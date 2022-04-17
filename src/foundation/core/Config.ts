/* eslint-disable prefer-const */
import {BoneDataType} from '../definitions/BoneDataType';
import {MiscUtil} from '../misc';

let maxEntityNumber = 5000;
let maxLightNumberInShader = 4;
let maxVertexMorphNumberInShader = 41;
let maxMaterialInstanceForEachType = 500;
let maxSkeletonNumber = 33;
let maxCameraNumber = 20;
let maxSizeLimitOfNonCompressedTexture = 512;

/// ShaderGlobalStorageSize ///
let maxSkeletalBoneNumber = 300;
let maxSkeletalBoneNumberForUniformMode = 50; // For Uniform Mode
let dataTextureWidth = Math.pow(2, 12);
let dataTextureHeight = Math.pow(2, 12);
let boneDataType = BoneDataType.Vec4x2;
let noWebGLTex2DStateCache = false;
let maxMorphTargetNumber = 4;
let totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
let isUboEnabled = false;
let eventTargetDom: HTMLElement | undefined;

if (typeof navigator !== 'undefined') {
  if (MiscUtil.isMobile() || MiscUtil.isMobileVr()) {
    maxMaterialInstanceForEachType = 28;
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
  maxMaterialInstanceForEachType,
  boneDataType,
  maxSkeletonNumber,
  maxCameraNumber,
  maxSizeLimitOfNonCompressedTexture,
  maxSkeletalBoneNumber,
  maxSkeletalBoneNumberForUniformMode,
  dataTextureWidth,
  dataTextureHeight,
  noWebGLTex2DStateCache,
  maxMorphTargetNumber,
  totalSizeOfGPUShaderDataStorageExceptMorphData,
  isUboEnabled,
  eventTargetDom,
};
