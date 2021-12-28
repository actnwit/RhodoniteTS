import {BoneDataType} from '../definitions/BoneDataType';
import {ProcessApproachEnum} from '../definitions/ProcessApproach';
import {ProcessApproach} from '../definitions/ProcessApproach';

const byteAlignOfBuffer = 16;
const maxEntityNumber = 5000;
const maxLightNumberInShader = 4;
const maxVertexMorphNumberInShader = 41;
const maxMaterialInstanceForEachType = 500;
const maxSkeletonNumber = 33;
const maxCameraNumber = 15;
const maxSizeLimitOfNonCompressedTexture = 512;

/// ShaderGlobalStorageSize ///
const maxSkeletalBoneNumber = 250;
const maxSkeletalBoneNumberForUniformMode = 50; // For Uniform Mode
const dataTextureWidth = Math.pow(2, 12);
const dataTextureHeight = Math.pow(2, 12);
const boneDataType = BoneDataType.Vec4x2;
const noWebGLTex2DStateCache = false;
const maxMorphTargetNumber = 4;
const totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
const isUboEnabled = true;
const getMaxSkeletalBoneNumber = (approach: ProcessApproachEnum) => {
  return ProcessApproach.isUniformApproach(approach)
    ? maxSkeletalBoneNumberForUniformMode
    : maxSkeletalBoneNumber;
};

export default {
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
  getMaxSkeletalBoneNumber,
};
