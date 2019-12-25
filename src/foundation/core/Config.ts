import { BoneDataType } from "../definitions/BoneDataType";

let maxEntityNumber = 5000;
let maxLightNumberInShader = 4;
let maxVertexMorphNumberInShader = 41;
let maxMaterialInstanceForEachType = 500;
let maxSkeletonNumber = 33;
let maxCameraNumber = 15;
let maxSizeLimitOfNonCompressedTexture = 512;
let maxSkeletalBoneNumber = 250;
let dataTextureWidth = Math.pow(2, 12);
let dataTextureHeight = Math.pow(2, 12);
let boneDataType = BoneDataType.Vec4x2;

export default {
  maxEntityNumber, maxLightNumberInShader, maxVertexMorphNumberInShader, maxMaterialInstanceForEachType, boneDataType,
  maxSkeletonNumber, maxCameraNumber, maxSizeLimitOfNonCompressedTexture, maxSkeletalBoneNumber, dataTextureWidth, dataTextureHeight
};
