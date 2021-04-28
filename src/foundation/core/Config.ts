import {BoneDataType} from '../definitions/BoneDataType';

const byteAlignOfBuffer = 16;
const maxEntityNumber = 5000;
const maxLightNumberInShader = 4;
const maxVertexMorphNumberInShader = 41;
const maxMaterialInstanceForEachType = 500;
const maxSkeletonNumber = 33;
const maxCameraNumber = 15;
const maxSizeLimitOfNonCompressedTexture = 512;
const maxSkeletalBoneNumber = 250;
const dataTextureWidth = Math.pow(2, 12);
const dataTextureHeight = Math.pow(2, 12);
const boneDataType = BoneDataType.Vec4x2;
const noWebGLTex2DStateCache = false;
const maxMorphTargetNumber = 4;
const totalSizeOfGPUShaderDataStorageExceptMorphData = 0;
const isUboEnabled = true;

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
  dataTextureWidth,
  dataTextureHeight,
  noWebGLTex2DStateCache,
  maxMorphTargetNumber,
  totalSizeOfGPUShaderDataStorageExceptMorphData,
  isUboEnabled,
};
