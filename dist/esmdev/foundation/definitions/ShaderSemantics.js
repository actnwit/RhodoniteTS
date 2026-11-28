// src/foundation/definitions/ShaderSemantics.ts
import { _from, _fromString, _fromStringCaseSensitively, EnumClass } from "../misc/EnumIO.js";
import { CompositionType } from "./CompositionType.js";
var _ShaderSemanticsClass = class _ShaderSemanticsClass extends EnumClass {
  constructor({ str }) {
    super({
      index: ++_ShaderSemanticsClass.Ej * _ShaderSemanticsClass._scale,
      str,
      noCheckStrUnique: true
    });
    _ShaderSemanticsClass.Fj[this.index] = this;
  }
  static getShaderSemanticByIndex(index) {
    return this.Fj[Math.abs(index) - Math.abs(index) % this._scale];
  }
  static isNonArrayShaderSemanticIndex(index) {
    if (index >= this._scale) {
      return true;
    }
    return false;
  }
  static isArrayAndZeroIndexShaderSemanticIndex(index) {
    if (index < 0 && Math.abs(index) % _ShaderSemanticsClass._scale === 0) {
      return true;
    }
    return false;
  }
  static isArrayAndNonZeroIndexShaderSemanticIndex(index) {
    if (index < 0 && Math.abs(index) % _ShaderSemanticsClass._scale !== 0) {
      return true;
    }
    return false;
  }
  static getIndexCount() {
    return _ShaderSemanticsClass.Ej;
  }
};
_ShaderSemanticsClass.Ej = -1;
_ShaderSemanticsClass._scale = 1e4;
_ShaderSemanticsClass.Fj = [];
var ShaderSemanticsClass = _ShaderSemanticsClass;
var WorldMatrix = new ShaderSemanticsClass({
  str: "worldMatrix"
});
var ViewMatrix = new ShaderSemanticsClass({
  str: "viewMatrix"
});
var IsBillboard = new ShaderSemanticsClass({
  str: "isBillboard"
});
var EnableViewMatrix = new ShaderSemanticsClass({
  str: "enableViewMatrix"
});
var ProjectionMatrix = new ShaderSemanticsClass({
  str: "projectionMatrix"
});
var NormalMatrix = new ShaderSemanticsClass({
  str: "normalMatrix"
});
var BoneMatrix = new ShaderSemanticsClass({
  str: "boneMatrix"
});
var BaseColorFactor = new ShaderSemanticsClass({
  str: "baseColorFactor"
});
var BaseColorTexture = new ShaderSemanticsClass({
  str: "baseColorTexture"
});
var NormalTexture = new ShaderSemanticsClass({
  str: "normalTexture"
});
var MetallicRoughnessTexture = new ShaderSemanticsClass({
  str: "metallicRoughnessTexture"
});
var OcclusionTexture = new ShaderSemanticsClass({
  str: "occlusionTexture"
});
var EmissiveFactor = new ShaderSemanticsClass({
  str: "emissiveFactor"
});
var EmissiveTexture = new ShaderSemanticsClass({
  str: "emissiveTexture"
});
var LightNumber = new ShaderSemanticsClass({
  str: "lightNumber"
});
var LightPosition = new ShaderSemanticsClass({
  str: "lightPosition"
});
var LightDirection = new ShaderSemanticsClass({
  str: "lightDirection"
});
var LightIntensity = new ShaderSemanticsClass({
  str: "lightIntensity"
});
var LightProperty = new ShaderSemanticsClass({
  str: "lightProperty"
});
var MetallicRoughnessFactor = new ShaderSemanticsClass({
  str: "metallicRoughnessFactor"
});
var BrdfLutTexture = new ShaderSemanticsClass({
  str: "brdfLutTexture"
});
var DiffuseEnvTexture = new ShaderSemanticsClass({
  str: "diffuseEnvTexture"
});
var SpecularEnvTexture = new ShaderSemanticsClass({
  str: "specularEnvTexture"
});
var SheenEnvTexture = new ShaderSemanticsClass({
  str: "sheenEnvTexture"
});
var InverseEnvironment = new ShaderSemanticsClass({
  str: "inverseEnvironment"
});
var IBLParameter = new ShaderSemanticsClass({
  str: "iblParameter"
});
var ViewPosition = new ShaderSemanticsClass({
  str: "viewPosition"
});
var Wireframe = new ShaderSemanticsClass({
  str: "wireframe"
});
var DiffuseColorFactor = new ShaderSemanticsClass({
  str: "diffuseColorFactor"
});
var DiffuseColorTexture = new ShaderSemanticsClass({
  str: "diffuseColorTexture"
});
var Shininess = new ShaderSemanticsClass({
  str: "shininess"
});
var ShadingModel = new ShaderSemanticsClass({
  str: "shadingModel"
});
var SkinningMode = new ShaderSemanticsClass({
  str: "skinningMode"
});
var GeneralTexture = new ShaderSemanticsClass({
  str: "generalTexture"
});
var BoneQuaternion = new ShaderSemanticsClass({
  str: "boneQuaternion"
});
var BoneTranslateScale = new ShaderSemanticsClass({
  str: "boneTranslateScale"
});
var BoneTranslatePackedQuat = new ShaderSemanticsClass({
  str: "boneTranslatePackedQuat"
});
var BoneScalePackedQuat = new ShaderSemanticsClass({
  str: "boneScalePackedQuat"
});
var BoneCompressedChunk = new ShaderSemanticsClass({
  str: "boneCompressedChunk"
});
var BoneCompressedInfo = new ShaderSemanticsClass({
  str: "boneCompressedInfo"
});
var PointSize = new ShaderSemanticsClass({
  str: "pointSize"
});
var ColorEnvTexture = new ShaderSemanticsClass({
  str: "colorEnvTexture"
});
var PointDistanceAttenuation = new ShaderSemanticsClass({
  str: "pointDistanceAttenuation"
});
var HDRIFormat = new ShaderSemanticsClass({
  str: "hdriFormat"
});
var ScreenInfo = new ShaderSemanticsClass({
  str: "screenInfo"
});
var DepthTexture = new ShaderSemanticsClass({
  str: "depthTexture"
});
var LightViewProjectionMatrix = new ShaderSemanticsClass({
  str: "lightViewProjectionMatrix"
});
var Anisotropy = new ShaderSemanticsClass({
  str: "anisotropy"
});
var ClearCoatParameter = new ShaderSemanticsClass({
  str: "clearcoatParameter"
});
var SheenColorFactor = new ShaderSemanticsClass({
  str: "sheenColorFactor"
});
var SheenColorTexture = new ShaderSemanticsClass({
  str: "sheenColorTexture"
});
var SheenRoughnessFactor = new ShaderSemanticsClass({
  str: "sheenRoughnessFactor"
});
var SheenRoughnessTexture = new ShaderSemanticsClass({
  str: "sheenRoughnessTexture"
});
var SheenLutTexture = new ShaderSemanticsClass({
  str: "sheenLutTexture"
});
var SpecularGlossinessFactor = new ShaderSemanticsClass({
  str: "specularGlossinessFactor"
});
var SpecularGlossinessTexture = new ShaderSemanticsClass({
  str: "specularGlossinessTexture"
});
var EntityUID = new ShaderSemanticsClass({
  str: "entityUID"
});
var MorphTargetNumber = new ShaderSemanticsClass({
  str: "morphTargetNumber"
});
var DataTextureMorphOffsetPosition = new ShaderSemanticsClass({
  str: "dataTextureMorphOffsetPosition"
});
var MorphWeights = new ShaderSemanticsClass({
  str: "morphWeights"
});
var CurrentComponentSIDs = new ShaderSemanticsClass({
  str: "currentComponentSIDs"
});
var AlphaCutoff = new ShaderSemanticsClass({
  str: "alphaCutoff"
});
var AlphaTexture = new ShaderSemanticsClass({
  str: "alphaTexture"
});
var MakeOutputSrgb = new ShaderSemanticsClass({
  str: "makeOutputSrgb"
});
var FramebufferSize = new ShaderSemanticsClass({
  str: "framebufferSize"
});
var ClearCoatFactor = new ShaderSemanticsClass({
  str: "clearCoatFactor"
});
var ClearCoatTexture = new ShaderSemanticsClass({
  str: "clearCoatTexture"
});
var ClearCoatRoughnessFactor = new ShaderSemanticsClass({
  str: "clearCoatRoughnessFactor"
});
var ClearCoatRoughnessTexture = new ShaderSemanticsClass({
  str: "clearCoatRoughnessTexture"
});
var ClearCoatNormalTexture = new ShaderSemanticsClass({
  str: "clearCoatNormalTexture"
});
var TransmissionFactor = new ShaderSemanticsClass({
  str: "transmissionFactor"
});
var TransmissionTexture = new ShaderSemanticsClass({
  str: "transmissionTexture"
});
var BackBufferTexture = new ShaderSemanticsClass({
  str: "backBufferTexture"
});
var BackBufferTextureSize = new ShaderSemanticsClass({
  str: "backBufferTextureSize"
});
var ThicknessFactor = new ShaderSemanticsClass({
  str: "thicknessFactor"
});
var ThicknessTexture = new ShaderSemanticsClass({
  str: "thicknessTexture"
});
var AttenuationDistance = new ShaderSemanticsClass({
  str: "attenuationDistance"
});
var AttenuationColor = new ShaderSemanticsClass({
  str: "attenuationColor"
});
var IsOutputHDR = new ShaderSemanticsClass({
  str: "isOutputHDR"
});
var BaseColorTextureTransform = new ShaderSemanticsClass({
  str: "baseColorTextureTransform"
});
var BaseColorTextureRotation = new ShaderSemanticsClass({
  str: "baseColorTextureRotation"
});
var NormalTextureTransform = new ShaderSemanticsClass({
  str: "normalTextureTransform"
});
var NormalTextureRotation = new ShaderSemanticsClass({
  str: "normalTextureRotation"
});
var MetallicRoughnessTextureTransform = new ShaderSemanticsClass({
  str: "metallicRoughnessTextureTransform"
});
var MetallicRoughnessTextureRotation = new ShaderSemanticsClass({
  str: "metallicRoughnessTextureRotation"
});
var NormalTexcoordIndex = new ShaderSemanticsClass({
  str: "normalTexcoordIndex"
});
var BaseColorTexcoordIndex = new ShaderSemanticsClass({
  str: "baseColorTexcoordIndex"
});
var MetallicRoughnessTexcoordIndex = new ShaderSemanticsClass({
  str: "metallicRoughnessTexcoordIndex"
});
var OcclusionTexcoordIndex = new ShaderSemanticsClass({
  str: "occlusionTexcoordIndex"
});
var OcclusionTextureTransform = new ShaderSemanticsClass({
  str: "occlusionTextureTransform"
});
var OcclusionTextureRotation = new ShaderSemanticsClass({
  str: "occlusionTextureRotation"
});
var EmissiveTexcoordIndex = new ShaderSemanticsClass({
  str: "emissiveTexcoordIndex"
});
var EmissiveTextureTransform = new ShaderSemanticsClass({
  str: "emissiveTextureTransform"
});
var EmissiveTextureRotation = new ShaderSemanticsClass({
  str: "emissiveTextureRotation"
});
var NormalScale = new ShaderSemanticsClass({ str: "normalScale" });
var OcclusionStrength = new ShaderSemanticsClass({
  str: "occlusionStrength"
});
var envRotation = new ShaderSemanticsClass({ str: "envRotation" });
var EnvHdriFormat = new ShaderSemanticsClass({ str: "envHdriFormat" });
var VrState = new ShaderSemanticsClass({ str: "vrState" });
var EnableLinearToSrgb = new ShaderSemanticsClass({
  str: "enableLinearToSrgb"
});
var SpecularFactor = new ShaderSemanticsClass({ str: "specularFactor" });
var SpecularTexture = new ShaderSemanticsClass({ str: "specularTexture" });
var SpecularColorFactor = new ShaderSemanticsClass({
  str: "specularColorFactor"
});
var SpecularColorTexture = new ShaderSemanticsClass({
  str: "specularColorTexture"
});
var Ior = new ShaderSemanticsClass({ str: "ior" });
var DepthBiasPV = new ShaderSemanticsClass({ str: "depthBiasPV" });
var ClearCoatTextureTransform = new ShaderSemanticsClass({
  str: "clearCoatTextureTransform"
});
var ClearCoatTextureRotation = new ShaderSemanticsClass({
  str: "clearCoatTextureRotation"
});
var ClearCoatRoughnessTextureTransform = new ShaderSemanticsClass({
  str: "clearCoatRoughnessTextureTransform"
});
var ClearCoatRoughnessTextureRotation = new ShaderSemanticsClass({
  str: "clearCoatRoughnessTextureRotation"
});
var ClearCoatNormalTextureTransform = new ShaderSemanticsClass({
  str: "clearCoatNormalTextureTransform"
});
var ClearCoatNormalTextureRotation = new ShaderSemanticsClass({
  str: "clearCoatNormalTextureRotation"
});
var ClearCoatTexcoordIndex = new ShaderSemanticsClass({
  str: "clearCoatTexcoordIndex"
});
var ClearCoatRoughnessTexcoordIndex = new ShaderSemanticsClass({
  str: "clearCoatRoughnessTexcoordIndex"
});
var ClearCoatNormalTexcoordIndex = new ShaderSemanticsClass({
  str: "clearCoatNormalTexcoordIndex"
});
var IridescenceFactor = new ShaderSemanticsClass({
  str: "iridescenceFactor"
});
var IridescenceTexture = new ShaderSemanticsClass({
  str: "iridescenceTexture"
});
var IridescenceIor = new ShaderSemanticsClass({
  str: "iridescenceIor"
});
var IridescenceThicknessMinimum = new ShaderSemanticsClass({
  str: "iridescenceThicknessMinimum"
});
var IridescenceThicknessMaximum = new ShaderSemanticsClass({
  str: "iridescenceThicknessMaximum"
});
var IridescenceThicknessTexture = new ShaderSemanticsClass({
  str: "iridescenceThicknessTexture"
});
var GaussianKernelSize = new ShaderSemanticsClass({
  str: "gaussianKernelSize"
});
var GaussianRatio = new ShaderSemanticsClass({ str: "gaussianRatio" });
var IsHorizontal = new ShaderSemanticsClass({ str: "isHorizontal" });
var AnisotropyStrength = new ShaderSemanticsClass({
  str: "anisotropyStrength"
});
var AnisotropyRotation = new ShaderSemanticsClass({
  str: "anisotropyRotation"
});
var AnisotropyTexture = new ShaderSemanticsClass({
  str: "anisotropyTexture"
});
var EmissiveStrength = new ShaderSemanticsClass({
  str: "emissiveStrength"
});
var Time = new ShaderSemanticsClass({
  str: "time"
});
var CubeMapFaceId = new ShaderSemanticsClass({
  str: "cubeMapFaceId"
});
var Roughness = new ShaderSemanticsClass({
  str: "roughness"
});
var DistributionType = new ShaderSemanticsClass({
  str: "distributionType"
});
var typeList = [
  WorldMatrix,
  ViewMatrix,
  IsBillboard,
  EnableViewMatrix,
  ProjectionMatrix,
  NormalMatrix,
  BoneMatrix,
  BaseColorFactor,
  BaseColorTexture,
  NormalTexture,
  MetallicRoughnessTexture,
  OcclusionTexture,
  EmissiveFactor,
  EmissiveTexture,
  LightNumber,
  LightPosition,
  LightDirection,
  LightIntensity,
  LightProperty,
  MetallicRoughnessFactor,
  BrdfLutTexture,
  DiffuseEnvTexture,
  SpecularEnvTexture,
  SheenEnvTexture,
  InverseEnvironment,
  IBLParameter,
  ViewPosition,
  Wireframe,
  DiffuseColorFactor,
  DiffuseColorTexture,
  Shininess,
  ShadingModel,
  SkinningMode,
  GeneralTexture,
  BoneQuaternion,
  BoneTranslateScale,
  BoneTranslatePackedQuat,
  BoneScalePackedQuat,
  BoneCompressedChunk,
  BoneCompressedInfo,
  PointSize,
  ColorEnvTexture,
  PointDistanceAttenuation,
  HDRIFormat,
  ScreenInfo,
  DepthTexture,
  LightViewProjectionMatrix,
  Anisotropy,
  ClearCoatParameter,
  SheenColorFactor,
  SheenColorTexture,
  SheenRoughnessFactor,
  SheenRoughnessTexture,
  SheenLutTexture,
  SpecularGlossinessFactor,
  SpecularGlossinessTexture,
  EntityUID,
  MorphTargetNumber,
  DataTextureMorphOffsetPosition,
  MorphWeights,
  CurrentComponentSIDs,
  AlphaCutoff,
  AlphaTexture,
  MakeOutputSrgb,
  ClearCoatFactor,
  ClearCoatTexture,
  ClearCoatRoughnessFactor,
  ClearCoatRoughnessTexture,
  ClearCoatNormalTexture,
  TransmissionFactor,
  TransmissionTexture,
  BackBufferTexture,
  BackBufferTextureSize,
  ThicknessFactor,
  ThicknessTexture,
  AttenuationDistance,
  AttenuationColor,
  IsOutputHDR,
  BaseColorTextureTransform,
  BaseColorTextureRotation,
  NormalTextureTransform,
  NormalTextureRotation,
  MetallicRoughnessTextureTransform,
  MetallicRoughnessTextureRotation,
  NormalTexcoordIndex,
  BaseColorTexcoordIndex,
  MetallicRoughnessTexcoordIndex,
  OcclusionTexcoordIndex,
  OcclusionTextureTransform,
  OcclusionTextureRotation,
  EmissiveTexcoordIndex,
  EmissiveTextureTransform,
  EmissiveTextureRotation,
  NormalScale,
  OcclusionStrength,
  envRotation,
  EnvHdriFormat,
  VrState,
  EnableLinearToSrgb,
  SpecularFactor,
  SpecularTexture,
  SpecularColorFactor,
  SpecularColorTexture,
  Ior,
  DepthBiasPV,
  ClearCoatTextureTransform,
  ClearCoatTextureRotation,
  ClearCoatRoughnessTextureTransform,
  ClearCoatRoughnessTextureRotation,
  ClearCoatNormalTextureTransform,
  ClearCoatNormalTextureRotation,
  ClearCoatTexcoordIndex,
  ClearCoatRoughnessTexcoordIndex,
  ClearCoatNormalTexcoordIndex,
  IridescenceFactor,
  IridescenceTexture,
  IridescenceIor,
  IridescenceThicknessMinimum,
  IridescenceThicknessMaximum,
  IridescenceThicknessTexture,
  GaussianKernelSize,
  GaussianRatio,
  IsHorizontal,
  AnisotropyStrength,
  AnisotropyRotation,
  AnisotropyTexture,
  EmissiveStrength,
  Time,
  CubeMapFaceId,
  Roughness,
  DistributionType
];
function from(index) {
  return _from({ typeList, index });
}
function fromString(str) {
  return _fromString({ typeList, str });
}
function fromStringCaseSensitively(str) {
  return _fromStringCaseSensitively({ typeList, str });
}
function _getPropertyIndex2(shaderSemantic) {
  const propertyIndex = shaderSemantic.index;
  return propertyIndex;
}
function getShaderPropertyOfMaterial(engine, _materialTypeName, info) {
  return getShaderPropertyOfGlobalDataRepository(engine, info);
}
function getShaderPropertyOfGlobalDataRepository(_engine, info) {
  const returnType = info.compositionType.getGlslStr(info.componentType);
  let variableName = info.semantic;
  const varType = info.compositionType.getGlslStr(info.componentType);
  let varIndexStr = "";
  if (info.arrayLength) {
    varIndexStr = `[${info.arrayLength}]`;
  }
  const varDef = `  uniform ${varType} u_${variableName}${varIndexStr};
`;
  let str = "";
  if (CompositionType.isArray(info.compositionType)) {
    if (variableName.match(/\[.+?\]/)) {
      variableName = variableName.replace(/\[.+?\]/g, "[i]");
    } else {
      variableName += "[i]";
    }
    str += `
        ${returnType} val;
          int i = int(index);
          return u_${variableName};
        `;
  } else {
    str += `return u_${variableName};`;
  }
  let funcDef = "";
  const isTexture = CompositionType.isTexture(info.compositionType);
  if (!isTexture) {
    funcDef = `
  ${returnType} get_${info.semantic}(uint instanceId, uint index) {
    ${str}
  }
`;
  }
  return `${varDef}${funcDef}`;
}
var ShaderSemantics = Object.freeze({
  from,
  fromString,
  fromStringCaseSensitively,
  getShaderPropertyOfMaterial,
  getShaderPropertyOfGlobalDataRepository,
  WorldMatrix,
  ViewMatrix,
  IsBillboard,
  EnableViewMatrix,
  ProjectionMatrix,
  NormalMatrix,
  BoneMatrix,
  BaseColorFactor,
  BaseColorTexture,
  NormalTexture,
  MetallicRoughnessTexture,
  OcclusionTexture,
  EmissiveFactor,
  EmissiveTexture,
  LightNumber,
  LightPosition,
  LightDirection,
  LightIntensity,
  LightProperty,
  MetallicRoughnessFactor,
  BrdfLutTexture,
  DiffuseEnvTexture,
  SpecularEnvTexture,
  SheenEnvTexture,
  InverseEnvironment,
  IBLParameter,
  ViewPosition,
  Wireframe,
  DiffuseColorFactor,
  DiffuseColorTexture,
  Shininess,
  ShadingModel,
  SkinningMode,
  GeneralTexture,
  BoneQuaternion,
  BoneTranslateScale,
  BoneTranslatePackedQuat,
  BoneScalePackedQuat,
  BoneCompressedChunk,
  BoneCompressedInfo,
  PointSize,
  ColorEnvTexture,
  PointDistanceAttenuation,
  HDRIFormat,
  ScreenInfo,
  DepthTexture,
  LightViewProjectionMatrix,
  Anisotropy,
  ClearCoatParameter,
  SheenColorFactor,
  SheenColorTexture,
  SheenRoughnessFactor,
  SheenRoughnessTexture,
  SheenLutTexture,
  SpecularGlossinessFactor,
  SpecularGlossinessTexture,
  ClearCoatFactor,
  ClearCoatTexture,
  ClearCoatRoughnessFactor,
  ClearCoatRoughnessTexture,
  ClearCoatNormalTexture,
  TransmissionFactor,
  TransmissionTexture,
  BackBufferTexture,
  BackBufferTextureSize,
  ThicknessFactor,
  ThicknessTexture,
  AttenuationDistance,
  AttenuationColor,
  EntityUID,
  MorphTargetNumber,
  DataTextureMorphOffsetPosition,
  MorphWeights,
  CurrentComponentSIDs,
  AlphaCutoff,
  AlphaTexture,
  MakeOutputSrgb,
  FramebufferSize,
  IsOutputHDR,
  BaseColorTextureTransform,
  BaseColorTextureRotation,
  NormalTextureTransform,
  NormalTextureRotation,
  MetallicRoughnessTextureTransform,
  MetallicRoughnessTextureRotation,
  NormalTexcoordIndex,
  BaseColorTexcoordIndex,
  MetallicRoughnessTexcoordIndex,
  OcclusionTexcoordIndex,
  OcclusionTextureTransform,
  OcclusionTextureRotation,
  EmissiveTexcoordIndex,
  EmissiveTextureTransform,
  EmissiveTextureRotation,
  NormalScale,
  OcclusionStrength,
  envRotation,
  EnvHdriFormat,
  VrState,
  EnableLinearToSrgb,
  SpecularFactor,
  SpecularTexture,
  SpecularColorFactor,
  SpecularColorTexture,
  Ior,
  DepthBiasPV,
  ClearCoatTextureTransform,
  ClearCoatTextureRotation,
  ClearCoatRoughnessTextureTransform,
  ClearCoatRoughnessTextureRotation,
  ClearCoatNormalTextureTransform,
  ClearCoatNormalTextureRotation,
  ClearCoatTexcoordIndex,
  ClearCoatRoughnessTexcoordIndex,
  ClearCoatNormalTexcoordIndex,
  IridescenceFactor,
  IridescenceTexture,
  IridescenceIor,
  IridescenceThicknessMinimum,
  IridescenceThicknessMaximum,
  IridescenceThicknessTexture,
  GaussianKernelSize,
  GaussianRatio,
  IsHorizontal,
  AnisotropyStrength,
  AnisotropyRotation,
  AnisotropyTexture,
  EmissiveStrength,
  Time,
  CubeMapFaceId,
  Roughness,
  DistributionType
});
export {
  ShaderSemantics,
  ShaderSemanticsClass,
  _getPropertyIndex2
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vZGVmaW5pdGlvbnMvU2hhZGVyU2VtYW50aWNzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IE1hdGVyaWFsIH0gZnJvbSAnLi4vbWF0ZXJpYWxzL2NvcmUvTWF0ZXJpYWwnO1xuaW1wb3J0IHsgX2Zyb20sIF9mcm9tU3RyaW5nLCBfZnJvbVN0cmluZ0Nhc2VTZW5zaXRpdmVseSwgRW51bUNsYXNzLCB0eXBlIEVudW1JTyB9IGZyb20gJy4uL21pc2MvRW51bUlPJztcbmltcG9ydCB0eXBlIHsgRW5naW5lIH0gZnJvbSAnLi4vc3lzdGVtL0VuZ2luZSc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgdHlwZSB7IFNoYWRlclNlbWFudGljc0luZm8gfSBmcm9tICcuL1NoYWRlclNlbWFudGljc0luZm8nO1xuXG5leHBvcnQgdHlwZSBTaGFkZXJTZW1hbnRpY3NJbmRleCA9IG51bWJlcjtcbmV4cG9ydCB0eXBlIFNoYWRlclNlbWFudGljc05hbWUgPSBzdHJpbmc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2hhZGVyU2VtYW50aWNzRW51bSBleHRlbmRzIEVudW1JTyB7XG4gIHN0cjogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU2hhZGVyU2VtYW50aWNzQ2xhc3MgZXh0ZW5kcyBFbnVtQ2xhc3MgaW1wbGVtZW50cyBTaGFkZXJTZW1hbnRpY3NFbnVtIHtcbiAgcHJpdmF0ZSBzdGF0aWMgX19pbmRleENvdW50ID0gLTE7XG4gIHN0YXRpYyByZWFkb25seSBfc2NhbGUgPSAxMDAwMDtcbiAgcHJpdmF0ZSBzdGF0aWMgX19jbGFzc2VzOiBTaGFkZXJTZW1hbnRpY3NDbGFzc1tdID0gW107XG4gIGNvbnN0cnVjdG9yKHsgc3RyIH06IHsgaW5kZXg/OiBudW1iZXI7IHN0cjogc3RyaW5nIH0pIHtcbiAgICBzdXBlcih7XG4gICAgICBpbmRleDogKytTaGFkZXJTZW1hbnRpY3NDbGFzcy5fX2luZGV4Q291bnQgKiBTaGFkZXJTZW1hbnRpY3NDbGFzcy5fc2NhbGUsXG4gICAgICBzdHIsXG4gICAgICBub0NoZWNrU3RyVW5pcXVlOiB0cnVlLFxuICAgIH0pO1xuICAgIFNoYWRlclNlbWFudGljc0NsYXNzLl9fY2xhc3Nlc1t0aGlzLmluZGV4XSA9IHRoaXM7XG4gIH1cblxuICBzdGF0aWMgZ2V0U2hhZGVyU2VtYW50aWNCeUluZGV4KGluZGV4OiBTaGFkZXJTZW1hbnRpY3NJbmRleCkge1xuICAgIHJldHVybiB0aGlzLl9fY2xhc3Nlc1tNYXRoLmFicyhpbmRleCkgLSAoTWF0aC5hYnMoaW5kZXgpICUgdGhpcy5fc2NhbGUpXTtcbiAgfVxuXG4gIHN0YXRpYyBpc05vbkFycmF5U2hhZGVyU2VtYW50aWNJbmRleChpbmRleDogU2hhZGVyU2VtYW50aWNzSW5kZXgpIHtcbiAgICBpZiAoaW5kZXggPj0gdGhpcy5fc2NhbGUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgaXNBcnJheUFuZFplcm9JbmRleFNoYWRlclNlbWFudGljSW5kZXgoaW5kZXg6IFNoYWRlclNlbWFudGljc0luZGV4KSB7XG4gICAgaWYgKGluZGV4IDwgMCAmJiBNYXRoLmFicyhpbmRleCkgJSBTaGFkZXJTZW1hbnRpY3NDbGFzcy5fc2NhbGUgPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0aWMgaXNBcnJheUFuZE5vblplcm9JbmRleFNoYWRlclNlbWFudGljSW5kZXgoaW5kZXg6IFNoYWRlclNlbWFudGljc0luZGV4KSB7XG4gICAgaWYgKGluZGV4IDwgMCAmJiBNYXRoLmFicyhpbmRleCkgJSBTaGFkZXJTZW1hbnRpY3NDbGFzcy5fc2NhbGUgIT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgc3RhdGljIGdldEluZGV4Q291bnQoKSB7XG4gICAgcmV0dXJuIFNoYWRlclNlbWFudGljc0NsYXNzLl9faW5kZXhDb3VudDtcbiAgfVxufVxuXG5jb25zdCBXb3JsZE1hdHJpeDogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ3dvcmxkTWF0cml4Jyxcbn0pO1xuY29uc3QgVmlld01hdHJpeDogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ3ZpZXdNYXRyaXgnLFxufSk7XG5jb25zdCBJc0JpbGxib2FyZDogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2lzQmlsbGJvYXJkJyxcbn0pO1xuY29uc3QgRW5hYmxlVmlld01hdHJpeDogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2VuYWJsZVZpZXdNYXRyaXgnLFxufSk7XG5jb25zdCBQcm9qZWN0aW9uTWF0cml4OiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAncHJvamVjdGlvbk1hdHJpeCcsXG59KTtcbmNvbnN0IE5vcm1hbE1hdHJpeDogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ25vcm1hbE1hdHJpeCcsXG59KTtcbmNvbnN0IEJvbmVNYXRyaXg6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdib25lTWF0cml4Jyxcbn0pO1xuY29uc3QgQmFzZUNvbG9yRmFjdG9yOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnYmFzZUNvbG9yRmFjdG9yJyxcbn0pO1xuY29uc3QgQmFzZUNvbG9yVGV4dHVyZTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2Jhc2VDb2xvclRleHR1cmUnLFxufSk7XG5jb25zdCBOb3JtYWxUZXh0dXJlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnbm9ybWFsVGV4dHVyZScsXG59KTtcbmNvbnN0IE1ldGFsbGljUm91Z2huZXNzVGV4dHVyZTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ21ldGFsbGljUm91Z2huZXNzVGV4dHVyZScsXG59KTtcbmNvbnN0IE9jY2x1c2lvblRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdvY2NsdXNpb25UZXh0dXJlJyxcbn0pO1xuY29uc3QgRW1pc3NpdmVGYWN0b3I6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdlbWlzc2l2ZUZhY3RvcicsXG59KTtcbmNvbnN0IEVtaXNzaXZlVGV4dHVyZTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2VtaXNzaXZlVGV4dHVyZScsXG59KTtcbmNvbnN0IExpZ2h0TnVtYmVyOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnbGlnaHROdW1iZXInLFxufSk7XG5jb25zdCBMaWdodFBvc2l0aW9uOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnbGlnaHRQb3NpdGlvbicsXG59KTtcbmNvbnN0IExpZ2h0RGlyZWN0aW9uOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnbGlnaHREaXJlY3Rpb24nLFxufSk7XG5jb25zdCBMaWdodEludGVuc2l0eTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2xpZ2h0SW50ZW5zaXR5Jyxcbn0pO1xuY29uc3QgTGlnaHRQcm9wZXJ0eTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2xpZ2h0UHJvcGVydHknLFxufSk7XG5jb25zdCBNZXRhbGxpY1JvdWdobmVzc0ZhY3RvcjogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ21ldGFsbGljUm91Z2huZXNzRmFjdG9yJyxcbn0pO1xuY29uc3QgQnJkZkx1dFRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdicmRmTHV0VGV4dHVyZScsXG59KTtcbmNvbnN0IERpZmZ1c2VFbnZUZXh0dXJlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnZGlmZnVzZUVudlRleHR1cmUnLFxufSk7XG5jb25zdCBTcGVjdWxhckVudlRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdzcGVjdWxhckVudlRleHR1cmUnLFxufSk7XG5jb25zdCBTaGVlbkVudlRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdzaGVlbkVudlRleHR1cmUnLFxufSk7XG5jb25zdCBJbnZlcnNlRW52aXJvbm1lbnQ6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdpbnZlcnNlRW52aXJvbm1lbnQnLFxufSk7XG5jb25zdCBJQkxQYXJhbWV0ZXI6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdpYmxQYXJhbWV0ZXInLFxufSk7XG5jb25zdCBWaWV3UG9zaXRpb246IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICd2aWV3UG9zaXRpb24nLFxufSk7XG5jb25zdCBXaXJlZnJhbWU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICd3aXJlZnJhbWUnLFxufSk7XG5jb25zdCBEaWZmdXNlQ29sb3JGYWN0b3I6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdkaWZmdXNlQ29sb3JGYWN0b3InLFxufSk7XG5jb25zdCBEaWZmdXNlQ29sb3JUZXh0dXJlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnZGlmZnVzZUNvbG9yVGV4dHVyZScsXG59KTtcbmNvbnN0IFNoaW5pbmVzczogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ3NoaW5pbmVzcycsXG59KTtcbmNvbnN0IFNoYWRpbmdNb2RlbDogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ3NoYWRpbmdNb2RlbCcsXG59KTtcbmNvbnN0IFNraW5uaW5nTW9kZTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ3NraW5uaW5nTW9kZScsXG59KTtcbmNvbnN0IEdlbmVyYWxUZXh0dXJlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnZ2VuZXJhbFRleHR1cmUnLFxufSk7XG5jb25zdCBCb25lUXVhdGVybmlvbjogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2JvbmVRdWF0ZXJuaW9uJyxcbn0pO1xuY29uc3QgQm9uZVRyYW5zbGF0ZVNjYWxlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnYm9uZVRyYW5zbGF0ZVNjYWxlJyxcbn0pO1xuY29uc3QgQm9uZVRyYW5zbGF0ZVBhY2tlZFF1YXQ6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdib25lVHJhbnNsYXRlUGFja2VkUXVhdCcsXG59KTtcbmNvbnN0IEJvbmVTY2FsZVBhY2tlZFF1YXQ6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdib25lU2NhbGVQYWNrZWRRdWF0Jyxcbn0pO1xuY29uc3QgQm9uZUNvbXByZXNzZWRDaHVuazogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2JvbmVDb21wcmVzc2VkQ2h1bmsnLFxufSk7XG5jb25zdCBCb25lQ29tcHJlc3NlZEluZm86IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdib25lQ29tcHJlc3NlZEluZm8nLFxufSk7XG5jb25zdCBQb2ludFNpemU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdwb2ludFNpemUnLFxufSk7XG5jb25zdCBDb2xvckVudlRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdjb2xvckVudlRleHR1cmUnLFxufSk7XG5jb25zdCBQb2ludERpc3RhbmNlQXR0ZW51YXRpb246IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdwb2ludERpc3RhbmNlQXR0ZW51YXRpb24nLFxufSk7XG5jb25zdCBIRFJJRm9ybWF0OiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnaGRyaUZvcm1hdCcsXG59KTtcbmNvbnN0IFNjcmVlbkluZm86IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdzY3JlZW5JbmZvJyxcbn0pO1xuY29uc3QgRGVwdGhUZXh0dXJlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnZGVwdGhUZXh0dXJlJyxcbn0pO1xuY29uc3QgTGlnaHRWaWV3UHJvamVjdGlvbk1hdHJpeDogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2xpZ2h0Vmlld1Byb2plY3Rpb25NYXRyaXgnLFxufSk7XG5jb25zdCBBbmlzb3Ryb3B5OiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnYW5pc290cm9weScsXG59KTtcbmNvbnN0IENsZWFyQ29hdFBhcmFtZXRlcjogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2NsZWFyY29hdFBhcmFtZXRlcicsXG59KTtcbmNvbnN0IFNoZWVuQ29sb3JGYWN0b3I6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdzaGVlbkNvbG9yRmFjdG9yJyxcbn0pO1xuY29uc3QgU2hlZW5Db2xvclRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdzaGVlbkNvbG9yVGV4dHVyZScsXG59KTtcbmNvbnN0IFNoZWVuUm91Z2huZXNzRmFjdG9yOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnc2hlZW5Sb3VnaG5lc3NGYWN0b3InLFxufSk7XG5jb25zdCBTaGVlblJvdWdobmVzc1RleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdzaGVlblJvdWdobmVzc1RleHR1cmUnLFxufSk7XG5jb25zdCBTaGVlbkx1dFRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdzaGVlbkx1dFRleHR1cmUnLFxufSk7XG5jb25zdCBTcGVjdWxhckdsb3NzaW5lc3NGYWN0b3I6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdzcGVjdWxhckdsb3NzaW5lc3NGYWN0b3InLFxufSk7XG5jb25zdCBTcGVjdWxhckdsb3NzaW5lc3NUZXh0dXJlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnc3BlY3VsYXJHbG9zc2luZXNzVGV4dHVyZScsXG59KTtcbmNvbnN0IEVudGl0eVVJRDogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2VudGl0eVVJRCcsXG59KTtcbmNvbnN0IE1vcnBoVGFyZ2V0TnVtYmVyOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnbW9ycGhUYXJnZXROdW1iZXInLFxufSk7XG5cbi8vIHRoZSAxNmJ5dGVvZmZzZXQgKDE2Ynl0ZSB1bml0IG9mZnNldCkgb2YgTW9ycGhEYXRhIGluIERhdGFUZXh0dXJlXG5jb25zdCBEYXRhVGV4dHVyZU1vcnBoT2Zmc2V0UG9zaXRpb246IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdkYXRhVGV4dHVyZU1vcnBoT2Zmc2V0UG9zaXRpb24nLFxufSk7XG5cbmNvbnN0IE1vcnBoV2VpZ2h0czogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ21vcnBoV2VpZ2h0cycsXG59KTtcbmNvbnN0IEN1cnJlbnRDb21wb25lbnRTSURzOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnY3VycmVudENvbXBvbmVudFNJRHMnLFxufSk7XG5jb25zdCBBbHBoYUN1dG9mZjogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2FscGhhQ3V0b2ZmJyxcbn0pO1xuY29uc3QgQWxwaGFUZXh0dXJlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnYWxwaGFUZXh0dXJlJyxcbn0pO1xuY29uc3QgTWFrZU91dHB1dFNyZ2I6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdtYWtlT3V0cHV0U3JnYicsXG59KTtcbmNvbnN0IEZyYW1lYnVmZmVyU2l6ZTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2ZyYW1lYnVmZmVyU2l6ZScsXG59KTtcbmNvbnN0IENsZWFyQ29hdEZhY3RvcjogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2NsZWFyQ29hdEZhY3RvcicsXG59KTtcbmNvbnN0IENsZWFyQ29hdFRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdjbGVhckNvYXRUZXh0dXJlJyxcbn0pO1xuY29uc3QgQ2xlYXJDb2F0Um91Z2huZXNzRmFjdG9yOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnY2xlYXJDb2F0Um91Z2huZXNzRmFjdG9yJyxcbn0pO1xuY29uc3QgQ2xlYXJDb2F0Um91Z2huZXNzVGV4dHVyZTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2NsZWFyQ29hdFJvdWdobmVzc1RleHR1cmUnLFxufSk7XG5jb25zdCBDbGVhckNvYXROb3JtYWxUZXh0dXJlOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnY2xlYXJDb2F0Tm9ybWFsVGV4dHVyZScsXG59KTtcbmNvbnN0IFRyYW5zbWlzc2lvbkZhY3RvcjogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ3RyYW5zbWlzc2lvbkZhY3RvcicsXG59KTtcbmNvbnN0IFRyYW5zbWlzc2lvblRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICd0cmFuc21pc3Npb25UZXh0dXJlJyxcbn0pO1xuY29uc3QgQmFja0J1ZmZlclRleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdiYWNrQnVmZmVyVGV4dHVyZScsXG59KTtcbmNvbnN0IEJhY2tCdWZmZXJUZXh0dXJlU2l6ZTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2JhY2tCdWZmZXJUZXh0dXJlU2l6ZScsXG59KTtcbmNvbnN0IFRoaWNrbmVzc0ZhY3RvcjogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ3RoaWNrbmVzc0ZhY3RvcicsXG59KTtcbmNvbnN0IFRoaWNrbmVzc1RleHR1cmU6IFNoYWRlclNlbWFudGljc0VudW0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICd0aGlja25lc3NUZXh0dXJlJyxcbn0pO1xuY29uc3QgQXR0ZW51YXRpb25EaXN0YW5jZTogU2hhZGVyU2VtYW50aWNzRW51bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2F0dGVudWF0aW9uRGlzdGFuY2UnLFxufSk7XG5jb25zdCBBdHRlbnVhdGlvbkNvbG9yOiBTaGFkZXJTZW1hbnRpY3NFbnVtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnYXR0ZW51YXRpb25Db2xvcicsXG59KTtcblxuY29uc3QgSXNPdXRwdXRIRFIgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdpc091dHB1dEhEUicsXG59KTtcbmNvbnN0IEJhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdiYXNlQ29sb3JUZXh0dXJlVHJhbnNmb3JtJyxcbn0pO1xuY29uc3QgQmFzZUNvbG9yVGV4dHVyZVJvdGF0aW9uID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnYmFzZUNvbG9yVGV4dHVyZVJvdGF0aW9uJyxcbn0pO1xuY29uc3QgTm9ybWFsVGV4dHVyZVRyYW5zZm9ybSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ25vcm1hbFRleHR1cmVUcmFuc2Zvcm0nLFxufSk7XG5jb25zdCBOb3JtYWxUZXh0dXJlUm90YXRpb24gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdub3JtYWxUZXh0dXJlUm90YXRpb24nLFxufSk7XG5jb25zdCBNZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdtZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm0nLFxufSk7XG5jb25zdCBNZXRhbGxpY1JvdWdobmVzc1RleHR1cmVSb3RhdGlvbiA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ21ldGFsbGljUm91Z2huZXNzVGV4dHVyZVJvdGF0aW9uJyxcbn0pO1xuY29uc3QgTm9ybWFsVGV4Y29vcmRJbmRleCA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ25vcm1hbFRleGNvb3JkSW5kZXgnLFxufSk7XG5jb25zdCBCYXNlQ29sb3JUZXhjb29yZEluZGV4ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnYmFzZUNvbG9yVGV4Y29vcmRJbmRleCcsXG59KTtcbmNvbnN0IE1ldGFsbGljUm91Z2huZXNzVGV4Y29vcmRJbmRleCA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ21ldGFsbGljUm91Z2huZXNzVGV4Y29vcmRJbmRleCcsXG59KTtcbmNvbnN0IE9jY2x1c2lvblRleGNvb3JkSW5kZXggPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdvY2NsdXNpb25UZXhjb29yZEluZGV4Jyxcbn0pO1xuY29uc3QgT2NjbHVzaW9uVGV4dHVyZVRyYW5zZm9ybSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ29jY2x1c2lvblRleHR1cmVUcmFuc2Zvcm0nLFxufSk7XG5jb25zdCBPY2NsdXNpb25UZXh0dXJlUm90YXRpb24gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdvY2NsdXNpb25UZXh0dXJlUm90YXRpb24nLFxufSk7XG5jb25zdCBFbWlzc2l2ZVRleGNvb3JkSW5kZXggPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdlbWlzc2l2ZVRleGNvb3JkSW5kZXgnLFxufSk7XG5jb25zdCBFbWlzc2l2ZVRleHR1cmVUcmFuc2Zvcm0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdlbWlzc2l2ZVRleHR1cmVUcmFuc2Zvcm0nLFxufSk7XG5jb25zdCBFbWlzc2l2ZVRleHR1cmVSb3RhdGlvbiA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2VtaXNzaXZlVGV4dHVyZVJvdGF0aW9uJyxcbn0pO1xuY29uc3QgTm9ybWFsU2NhbGUgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICdub3JtYWxTY2FsZScgfSk7XG5jb25zdCBPY2NsdXNpb25TdHJlbmd0aCA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ29jY2x1c2lvblN0cmVuZ3RoJyxcbn0pO1xuY29uc3QgZW52Um90YXRpb24gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICdlbnZSb3RhdGlvbicgfSk7XG5jb25zdCBFbnZIZHJpRm9ybWF0ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAnZW52SGRyaUZvcm1hdCcgfSk7XG5jb25zdCBWclN0YXRlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHsgc3RyOiAndnJTdGF0ZScgfSk7XG5jb25zdCBFbmFibGVMaW5lYXJUb1NyZ2IgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdlbmFibGVMaW5lYXJUb1NyZ2InLFxufSk7XG5jb25zdCBTcGVjdWxhckZhY3RvciA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ3NwZWN1bGFyRmFjdG9yJyB9KTtcbmNvbnN0IFNwZWN1bGFyVGV4dHVyZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ3NwZWN1bGFyVGV4dHVyZScgfSk7XG5jb25zdCBTcGVjdWxhckNvbG9yRmFjdG9yID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnc3BlY3VsYXJDb2xvckZhY3RvcicsXG59KTtcbmNvbnN0IFNwZWN1bGFyQ29sb3JUZXh0dXJlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnc3BlY3VsYXJDb2xvclRleHR1cmUnLFxufSk7XG5jb25zdCBJb3IgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICdpb3InIH0pO1xuY29uc3QgRGVwdGhCaWFzUFYgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICdkZXB0aEJpYXNQVicgfSk7XG5jb25zdCBDbGVhckNvYXRUZXh0dXJlVHJhbnNmb3JtID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnY2xlYXJDb2F0VGV4dHVyZVRyYW5zZm9ybScsXG59KTtcbmNvbnN0IENsZWFyQ29hdFRleHR1cmVSb3RhdGlvbiA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2NsZWFyQ29hdFRleHR1cmVSb3RhdGlvbicsXG59KTtcbmNvbnN0IENsZWFyQ29hdFJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm0gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdjbGVhckNvYXRSb3VnaG5lc3NUZXh0dXJlVHJhbnNmb3JtJyxcbn0pO1xuY29uc3QgQ2xlYXJDb2F0Um91Z2huZXNzVGV4dHVyZVJvdGF0aW9uID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnY2xlYXJDb2F0Um91Z2huZXNzVGV4dHVyZVJvdGF0aW9uJyxcbn0pO1xuY29uc3QgQ2xlYXJDb2F0Tm9ybWFsVGV4dHVyZVRyYW5zZm9ybSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2NsZWFyQ29hdE5vcm1hbFRleHR1cmVUcmFuc2Zvcm0nLFxufSk7XG5jb25zdCBDbGVhckNvYXROb3JtYWxUZXh0dXJlUm90YXRpb24gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdjbGVhckNvYXROb3JtYWxUZXh0dXJlUm90YXRpb24nLFxufSk7XG5jb25zdCBDbGVhckNvYXRUZXhjb29yZEluZGV4ID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnY2xlYXJDb2F0VGV4Y29vcmRJbmRleCcsXG59KTtcbmNvbnN0IENsZWFyQ29hdFJvdWdobmVzc1RleGNvb3JkSW5kZXggPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdjbGVhckNvYXRSb3VnaG5lc3NUZXhjb29yZEluZGV4Jyxcbn0pO1xuY29uc3QgQ2xlYXJDb2F0Tm9ybWFsVGV4Y29vcmRJbmRleCA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2NsZWFyQ29hdE5vcm1hbFRleGNvb3JkSW5kZXgnLFxufSk7XG5jb25zdCBJcmlkZXNjZW5jZUZhY3RvciA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2lyaWRlc2NlbmNlRmFjdG9yJyxcbn0pO1xuY29uc3QgSXJpZGVzY2VuY2VUZXh0dXJlID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAnaXJpZGVzY2VuY2VUZXh0dXJlJyxcbn0pO1xuY29uc3QgSXJpZGVzY2VuY2VJb3IgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdpcmlkZXNjZW5jZUlvcicsXG59KTtcbmNvbnN0IElyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2lyaWRlc2NlbmNlVGhpY2tuZXNzTWluaW11bScsXG59KTtcbmNvbnN0IElyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2lyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bScsXG59KTtcbmNvbnN0IElyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2lyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZScsXG59KTtcbmNvbnN0IEdhdXNzaWFuS2VybmVsU2l6ZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2dhdXNzaWFuS2VybmVsU2l6ZScsXG59KTtcbmNvbnN0IEdhdXNzaWFuUmF0aW8gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3MoeyBzdHI6ICdnYXVzc2lhblJhdGlvJyB9KTtcbmNvbnN0IElzSG9yaXpvbnRhbCA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7IHN0cjogJ2lzSG9yaXpvbnRhbCcgfSk7XG5jb25zdCBBbmlzb3Ryb3B5U3RyZW5ndGggPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdhbmlzb3Ryb3B5U3RyZW5ndGgnLFxufSk7XG5jb25zdCBBbmlzb3Ryb3B5Um90YXRpb24gPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdhbmlzb3Ryb3B5Um90YXRpb24nLFxufSk7XG5jb25zdCBBbmlzb3Ryb3B5VGV4dHVyZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2FuaXNvdHJvcHlUZXh0dXJlJyxcbn0pO1xuY29uc3QgRW1pc3NpdmVTdHJlbmd0aCA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2VtaXNzaXZlU3RyZW5ndGgnLFxufSk7XG5jb25zdCBUaW1lID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAndGltZScsXG59KTtcbmNvbnN0IEN1YmVNYXBGYWNlSWQgPSBuZXcgU2hhZGVyU2VtYW50aWNzQ2xhc3Moe1xuICBzdHI6ICdjdWJlTWFwRmFjZUlkJyxcbn0pO1xuY29uc3QgUm91Z2huZXNzID0gbmV3IFNoYWRlclNlbWFudGljc0NsYXNzKHtcbiAgc3RyOiAncm91Z2huZXNzJyxcbn0pO1xuY29uc3QgRGlzdHJpYnV0aW9uVHlwZSA9IG5ldyBTaGFkZXJTZW1hbnRpY3NDbGFzcyh7XG4gIHN0cjogJ2Rpc3RyaWJ1dGlvblR5cGUnLFxufSk7XG5cbmNvbnN0IHR5cGVMaXN0ID0gW1xuICBXb3JsZE1hdHJpeCxcbiAgVmlld01hdHJpeCxcbiAgSXNCaWxsYm9hcmQsXG4gIEVuYWJsZVZpZXdNYXRyaXgsXG4gIFByb2plY3Rpb25NYXRyaXgsXG4gIE5vcm1hbE1hdHJpeCxcbiAgQm9uZU1hdHJpeCxcbiAgQmFzZUNvbG9yRmFjdG9yLFxuICBCYXNlQ29sb3JUZXh0dXJlLFxuICBOb3JtYWxUZXh0dXJlLFxuICBNZXRhbGxpY1JvdWdobmVzc1RleHR1cmUsXG4gIE9jY2x1c2lvblRleHR1cmUsXG4gIEVtaXNzaXZlRmFjdG9yLFxuICBFbWlzc2l2ZVRleHR1cmUsXG4gIExpZ2h0TnVtYmVyLFxuICBMaWdodFBvc2l0aW9uLFxuICBMaWdodERpcmVjdGlvbixcbiAgTGlnaHRJbnRlbnNpdHksXG4gIExpZ2h0UHJvcGVydHksXG4gIE1ldGFsbGljUm91Z2huZXNzRmFjdG9yLFxuICBCcmRmTHV0VGV4dHVyZSxcbiAgRGlmZnVzZUVudlRleHR1cmUsXG4gIFNwZWN1bGFyRW52VGV4dHVyZSxcbiAgU2hlZW5FbnZUZXh0dXJlLFxuICBJbnZlcnNlRW52aXJvbm1lbnQsXG4gIElCTFBhcmFtZXRlcixcbiAgVmlld1Bvc2l0aW9uLFxuICBXaXJlZnJhbWUsXG4gIERpZmZ1c2VDb2xvckZhY3RvcixcbiAgRGlmZnVzZUNvbG9yVGV4dHVyZSxcbiAgU2hpbmluZXNzLFxuICBTaGFkaW5nTW9kZWwsXG4gIFNraW5uaW5nTW9kZSxcbiAgR2VuZXJhbFRleHR1cmUsXG4gIEJvbmVRdWF0ZXJuaW9uLFxuICBCb25lVHJhbnNsYXRlU2NhbGUsXG4gIEJvbmVUcmFuc2xhdGVQYWNrZWRRdWF0LFxuICBCb25lU2NhbGVQYWNrZWRRdWF0LFxuICBCb25lQ29tcHJlc3NlZENodW5rLFxuICBCb25lQ29tcHJlc3NlZEluZm8sXG4gIFBvaW50U2l6ZSxcbiAgQ29sb3JFbnZUZXh0dXJlLFxuICBQb2ludERpc3RhbmNlQXR0ZW51YXRpb24sXG4gIEhEUklGb3JtYXQsXG4gIFNjcmVlbkluZm8sXG4gIERlcHRoVGV4dHVyZSxcbiAgTGlnaHRWaWV3UHJvamVjdGlvbk1hdHJpeCxcbiAgQW5pc290cm9weSxcbiAgQ2xlYXJDb2F0UGFyYW1ldGVyLFxuICBTaGVlbkNvbG9yRmFjdG9yLFxuICBTaGVlbkNvbG9yVGV4dHVyZSxcbiAgU2hlZW5Sb3VnaG5lc3NGYWN0b3IsXG4gIFNoZWVuUm91Z2huZXNzVGV4dHVyZSxcbiAgU2hlZW5MdXRUZXh0dXJlLFxuICBTcGVjdWxhckdsb3NzaW5lc3NGYWN0b3IsXG4gIFNwZWN1bGFyR2xvc3NpbmVzc1RleHR1cmUsXG4gIEVudGl0eVVJRCxcbiAgTW9ycGhUYXJnZXROdW1iZXIsXG4gIERhdGFUZXh0dXJlTW9ycGhPZmZzZXRQb3NpdGlvbixcbiAgTW9ycGhXZWlnaHRzLFxuICBDdXJyZW50Q29tcG9uZW50U0lEcyxcbiAgQWxwaGFDdXRvZmYsXG4gIEFscGhhVGV4dHVyZSxcbiAgTWFrZU91dHB1dFNyZ2IsXG4gIENsZWFyQ29hdEZhY3RvcixcbiAgQ2xlYXJDb2F0VGV4dHVyZSxcbiAgQ2xlYXJDb2F0Um91Z2huZXNzRmFjdG9yLFxuICBDbGVhckNvYXRSb3VnaG5lc3NUZXh0dXJlLFxuICBDbGVhckNvYXROb3JtYWxUZXh0dXJlLFxuICBUcmFuc21pc3Npb25GYWN0b3IsXG4gIFRyYW5zbWlzc2lvblRleHR1cmUsXG4gIEJhY2tCdWZmZXJUZXh0dXJlLFxuICBCYWNrQnVmZmVyVGV4dHVyZVNpemUsXG4gIFRoaWNrbmVzc0ZhY3RvcixcbiAgVGhpY2tuZXNzVGV4dHVyZSxcbiAgQXR0ZW51YXRpb25EaXN0YW5jZSxcbiAgQXR0ZW51YXRpb25Db2xvcixcbiAgSXNPdXRwdXRIRFIsXG4gIEJhc2VDb2xvclRleHR1cmVUcmFuc2Zvcm0sXG4gIEJhc2VDb2xvclRleHR1cmVSb3RhdGlvbixcbiAgTm9ybWFsVGV4dHVyZVRyYW5zZm9ybSxcbiAgTm9ybWFsVGV4dHVyZVJvdGF0aW9uLFxuICBNZXRhbGxpY1JvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm0sXG4gIE1ldGFsbGljUm91Z2huZXNzVGV4dHVyZVJvdGF0aW9uLFxuICBOb3JtYWxUZXhjb29yZEluZGV4LFxuICBCYXNlQ29sb3JUZXhjb29yZEluZGV4LFxuICBNZXRhbGxpY1JvdWdobmVzc1RleGNvb3JkSW5kZXgsXG4gIE9jY2x1c2lvblRleGNvb3JkSW5kZXgsXG4gIE9jY2x1c2lvblRleHR1cmVUcmFuc2Zvcm0sXG4gIE9jY2x1c2lvblRleHR1cmVSb3RhdGlvbixcbiAgRW1pc3NpdmVUZXhjb29yZEluZGV4LFxuICBFbWlzc2l2ZVRleHR1cmVUcmFuc2Zvcm0sXG4gIEVtaXNzaXZlVGV4dHVyZVJvdGF0aW9uLFxuICBOb3JtYWxTY2FsZSxcbiAgT2NjbHVzaW9uU3RyZW5ndGgsXG4gIGVudlJvdGF0aW9uLFxuICBFbnZIZHJpRm9ybWF0LFxuICBWclN0YXRlLFxuICBFbmFibGVMaW5lYXJUb1NyZ2IsXG4gIFNwZWN1bGFyRmFjdG9yLFxuICBTcGVjdWxhclRleHR1cmUsXG4gIFNwZWN1bGFyQ29sb3JGYWN0b3IsXG4gIFNwZWN1bGFyQ29sb3JUZXh0dXJlLFxuICBJb3IsXG4gIERlcHRoQmlhc1BWLFxuICBDbGVhckNvYXRUZXh0dXJlVHJhbnNmb3JtLFxuICBDbGVhckNvYXRUZXh0dXJlUm90YXRpb24sXG4gIENsZWFyQ29hdFJvdWdobmVzc1RleHR1cmVUcmFuc2Zvcm0sXG4gIENsZWFyQ29hdFJvdWdobmVzc1RleHR1cmVSb3RhdGlvbixcbiAgQ2xlYXJDb2F0Tm9ybWFsVGV4dHVyZVRyYW5zZm9ybSxcbiAgQ2xlYXJDb2F0Tm9ybWFsVGV4dHVyZVJvdGF0aW9uLFxuICBDbGVhckNvYXRUZXhjb29yZEluZGV4LFxuICBDbGVhckNvYXRSb3VnaG5lc3NUZXhjb29yZEluZGV4LFxuICBDbGVhckNvYXROb3JtYWxUZXhjb29yZEluZGV4LFxuICBJcmlkZXNjZW5jZUZhY3RvcixcbiAgSXJpZGVzY2VuY2VUZXh0dXJlLFxuICBJcmlkZXNjZW5jZUlvcixcbiAgSXJpZGVzY2VuY2VUaGlja25lc3NNaW5pbXVtLFxuICBJcmlkZXNjZW5jZVRoaWNrbmVzc01heGltdW0sXG4gIElyaWRlc2NlbmNlVGhpY2tuZXNzVGV4dHVyZSxcbiAgR2F1c3NpYW5LZXJuZWxTaXplLFxuICBHYXVzc2lhblJhdGlvLFxuICBJc0hvcml6b250YWwsXG4gIEFuaXNvdHJvcHlTdHJlbmd0aCxcbiAgQW5pc290cm9weVJvdGF0aW9uLFxuICBBbmlzb3Ryb3B5VGV4dHVyZSxcbiAgRW1pc3NpdmVTdHJlbmd0aCxcbiAgVGltZSxcbiAgQ3ViZU1hcEZhY2VJZCxcbiAgUm91Z2huZXNzLFxuICBEaXN0cmlidXRpb25UeXBlLFxuXTtcblxuZnVuY3Rpb24gZnJvbShpbmRleDogU2hhZGVyU2VtYW50aWNzSW5kZXgpOiBTaGFkZXJTZW1hbnRpY3NFbnVtIHtcbiAgcmV0dXJuIF9mcm9tKHsgdHlwZUxpc3QsIGluZGV4IH0pIGFzIFNoYWRlclNlbWFudGljc0VudW07XG59XG5cbmZ1bmN0aW9uIGZyb21TdHJpbmcoc3RyOiBzdHJpbmcpOiBTaGFkZXJTZW1hbnRpY3NFbnVtIHtcbiAgcmV0dXJuIF9mcm9tU3RyaW5nKHsgdHlwZUxpc3QsIHN0ciB9KSBhcyBTaGFkZXJTZW1hbnRpY3NFbnVtO1xufVxuZnVuY3Rpb24gZnJvbVN0cmluZ0Nhc2VTZW5zaXRpdmVseShzdHI6IHN0cmluZyk6IFNoYWRlclNlbWFudGljc0VudW0ge1xuICByZXR1cm4gX2Zyb21TdHJpbmdDYXNlU2Vuc2l0aXZlbHkoeyB0eXBlTGlzdCwgc3RyIH0pIGFzIFNoYWRlclNlbWFudGljc0VudW07XG59XG5cbnR5cGUgX1VwZGF0ZUZ1bmMgPSAoe1xuICBtYXRlcmlhbCxcbiAgc2hhZGVyUHJvZ3JhbSxcbiAgZmlyc3RUaW1lLFxuICBwcm9wZXJ0eU5hbWUsXG4gIHZhbHVlLFxuICBhcmdzLFxufToge1xuICBtYXRlcmlhbDogTWF0ZXJpYWw7XG4gIHNoYWRlclByb2dyYW06IFdlYkdMUHJvZ3JhbTtcbiAgZmlyc3RUaW1lOiBib29sZWFuO1xuICBwcm9wZXJ0eU5hbWU6IHN0cmluZztcbiAgdmFsdWU6IGFueTtcbiAgYXJncz86IG9iamVjdDtcbn0pID0+IHZvaWQ7XG5cbmV4cG9ydCB0eXBlIGdldFNoYWRlclByb3BlcnR5RnVuY09mR2xvYmFsRGF0YVJlcG9zaXRvcnkgPSAoZW5naW5lOiBFbmdpbmUsIGluZm86IFNoYWRlclNlbWFudGljc0luZm8pID0+IHN0cmluZztcblxuZXhwb3J0IHR5cGUgZ2V0U2hhZGVyUHJvcGVydHlGdW5jT2ZNYXRlcmlhbCA9IChcbiAgZW5naW5lOiBFbmdpbmUsXG4gIG1hdGVyaWFsVHlwZU5hbWU6IHN0cmluZyxcbiAgaW5mbzogU2hhZGVyU2VtYW50aWNzSW5mb1xuKSA9PiBzdHJpbmc7XG5cbi8qKlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0UHJvcGVydHlJbmRleDIoc2hhZGVyU2VtYW50aWM6IFNoYWRlclNlbWFudGljc0VudW0pIHtcbiAgY29uc3QgcHJvcGVydHlJbmRleCA9IHNoYWRlclNlbWFudGljLmluZGV4O1xuICByZXR1cm4gcHJvcGVydHlJbmRleDtcbn1cblxuZnVuY3Rpb24gZ2V0U2hhZGVyUHJvcGVydHlPZk1hdGVyaWFsKGVuZ2luZTogRW5naW5lLCBfbWF0ZXJpYWxUeXBlTmFtZTogc3RyaW5nLCBpbmZvOiBTaGFkZXJTZW1hbnRpY3NJbmZvKSB7XG4gIHJldHVybiBnZXRTaGFkZXJQcm9wZXJ0eU9mR2xvYmFsRGF0YVJlcG9zaXRvcnkoZW5naW5lLCBpbmZvKTtcbn1cblxuZnVuY3Rpb24gZ2V0U2hhZGVyUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5KF9lbmdpbmU6IEVuZ2luZSwgaW5mbzogU2hhZGVyU2VtYW50aWNzSW5mbykge1xuICBjb25zdCByZXR1cm5UeXBlID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0R2xzbFN0cihpbmZvLmNvbXBvbmVudFR5cGUpO1xuXG4gIGxldCB2YXJpYWJsZU5hbWUgPSBpbmZvLnNlbWFudGljO1xuXG4gIC8vIGRlZmluaXRpb24gb2YgdW5pZm9ybSB2YXJpYWJsZVxuICBjb25zdCB2YXJUeXBlID0gaW5mby5jb21wb3NpdGlvblR5cGUuZ2V0R2xzbFN0cihpbmZvLmNvbXBvbmVudFR5cGUpO1xuICBsZXQgdmFySW5kZXhTdHIgPSAnJztcbiAgaWYgKGluZm8uYXJyYXlMZW5ndGgpIHtcbiAgICB2YXJJbmRleFN0ciA9IGBbJHtpbmZvLmFycmF5TGVuZ3RofV1gO1xuICB9XG4gIGNvbnN0IHZhckRlZiA9IGAgIHVuaWZvcm0gJHt2YXJUeXBlfSB1XyR7dmFyaWFibGVOYW1lfSR7dmFySW5kZXhTdHJ9O1xcbmA7XG5cbiAgLy8gaW5uZXIgY29udGVudHMgb2YgJ2dldF8nIHNoYWRlciBmdW5jdGlvblxuICBsZXQgc3RyID0gJyc7XG4gIGlmIChDb21wb3NpdGlvblR5cGUuaXNBcnJheShpbmZvLmNvbXBvc2l0aW9uVHlwZSkpIHtcbiAgICBpZiAodmFyaWFibGVOYW1lLm1hdGNoKC9cXFsuKz9cXF0vKSkge1xuICAgICAgdmFyaWFibGVOYW1lID0gdmFyaWFibGVOYW1lLnJlcGxhY2UoL1xcWy4rP1xcXS9nLCAnW2ldJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhcmlhYmxlTmFtZSArPSAnW2ldJztcbiAgICB9XG4gICAgc3RyICs9IGBcbiAgICAgICAgJHtyZXR1cm5UeXBlfSB2YWw7XG4gICAgICAgICAgaW50IGkgPSBpbnQoaW5kZXgpO1xuICAgICAgICAgIHJldHVybiB1XyR7dmFyaWFibGVOYW1lfTtcbiAgICAgICAgYDtcbiAgfSBlbHNlIHtcbiAgICAvLyBpcyBOb3QgQXJyYXlcbiAgICBzdHIgKz0gYHJldHVybiB1XyR7dmFyaWFibGVOYW1lfTtgO1xuICB9XG5cbiAgbGV0IGZ1bmNEZWYgPSAnJztcblxuICBjb25zdCBpc1RleHR1cmUgPSBDb21wb3NpdGlvblR5cGUuaXNUZXh0dXJlKGluZm8uY29tcG9zaXRpb25UeXBlKTtcblxuICBpZiAoIWlzVGV4dHVyZSkge1xuICAgIGZ1bmNEZWYgPSBgXG4gICR7cmV0dXJuVHlwZX0gZ2V0XyR7aW5mby5zZW1hbnRpY30odWludCBpbnN0YW5jZUlkLCB1aW50IGluZGV4KSB7XG4gICAgJHtzdHJ9XG4gIH1cbmA7XG4gIH1cblxuICByZXR1cm4gYCR7dmFyRGVmfSR7ZnVuY0RlZn1gO1xufVxuXG5leHBvcnQgY29uc3QgU2hhZGVyU2VtYW50aWNzID0gT2JqZWN0LmZyZWV6ZSh7XG4gIGZyb20sXG4gIGZyb21TdHJpbmcsXG4gIGZyb21TdHJpbmdDYXNlU2Vuc2l0aXZlbHksXG4gIGdldFNoYWRlclByb3BlcnR5T2ZNYXRlcmlhbCxcbiAgZ2V0U2hhZGVyUHJvcGVydHlPZkdsb2JhbERhdGFSZXBvc2l0b3J5LFxuICBXb3JsZE1hdHJpeCxcbiAgVmlld01hdHJpeCxcbiAgSXNCaWxsYm9hcmQsXG4gIEVuYWJsZVZpZXdNYXRyaXgsXG4gIFByb2plY3Rpb25NYXRyaXgsXG4gIE5vcm1hbE1hdHJpeCxcbiAgQm9uZU1hdHJpeCxcbiAgQmFzZUNvbG9yRmFjdG9yLFxuICBCYXNlQ29sb3JUZXh0dXJlLFxuICBOb3JtYWxUZXh0dXJlLFxuICBNZXRhbGxpY1JvdWdobmVzc1RleHR1cmUsXG4gIE9jY2x1c2lvblRleHR1cmUsXG4gIEVtaXNzaXZlRmFjdG9yLFxuICBFbWlzc2l2ZVRleHR1cmUsXG4gIExpZ2h0TnVtYmVyLFxuICBMaWdodFBvc2l0aW9uLFxuICBMaWdodERpcmVjdGlvbixcbiAgTGlnaHRJbnRlbnNpdHksXG4gIExpZ2h0UHJvcGVydHksXG4gIE1ldGFsbGljUm91Z2huZXNzRmFjdG9yLFxuICBCcmRmTHV0VGV4dHVyZSxcbiAgRGlmZnVzZUVudlRleHR1cmUsXG4gIFNwZWN1bGFyRW52VGV4dHVyZSxcbiAgU2hlZW5FbnZUZXh0dXJlLFxuICBJbnZlcnNlRW52aXJvbm1lbnQsXG4gIElCTFBhcmFtZXRlcixcbiAgVmlld1Bvc2l0aW9uLFxuICBXaXJlZnJhbWUsXG4gIERpZmZ1c2VDb2xvckZhY3RvcixcbiAgRGlmZnVzZUNvbG9yVGV4dHVyZSxcbiAgU2hpbmluZXNzLFxuICBTaGFkaW5nTW9kZWwsXG4gIFNraW5uaW5nTW9kZSxcbiAgR2VuZXJhbFRleHR1cmUsXG4gIEJvbmVRdWF0ZXJuaW9uLFxuICBCb25lVHJhbnNsYXRlU2NhbGUsXG4gIEJvbmVUcmFuc2xhdGVQYWNrZWRRdWF0LFxuICBCb25lU2NhbGVQYWNrZWRRdWF0LFxuICBCb25lQ29tcHJlc3NlZENodW5rLFxuICBCb25lQ29tcHJlc3NlZEluZm8sXG4gIFBvaW50U2l6ZSxcbiAgQ29sb3JFbnZUZXh0dXJlLFxuICBQb2ludERpc3RhbmNlQXR0ZW51YXRpb24sXG4gIEhEUklGb3JtYXQsXG4gIFNjcmVlbkluZm8sXG4gIERlcHRoVGV4dHVyZSxcbiAgTGlnaHRWaWV3UHJvamVjdGlvbk1hdHJpeCxcbiAgQW5pc290cm9weSxcbiAgQ2xlYXJDb2F0UGFyYW1ldGVyLFxuICBTaGVlbkNvbG9yRmFjdG9yLFxuICBTaGVlbkNvbG9yVGV4dHVyZSxcbiAgU2hlZW5Sb3VnaG5lc3NGYWN0b3IsXG4gIFNoZWVuUm91Z2huZXNzVGV4dHVyZSxcbiAgU2hlZW5MdXRUZXh0dXJlLFxuICBTcGVjdWxhckdsb3NzaW5lc3NGYWN0b3IsXG4gIFNwZWN1bGFyR2xvc3NpbmVzc1RleHR1cmUsXG4gIENsZWFyQ29hdEZhY3RvcixcbiAgQ2xlYXJDb2F0VGV4dHVyZSxcbiAgQ2xlYXJDb2F0Um91Z2huZXNzRmFjdG9yLFxuICBDbGVhckNvYXRSb3VnaG5lc3NUZXh0dXJlLFxuICBDbGVhckNvYXROb3JtYWxUZXh0dXJlLFxuICBUcmFuc21pc3Npb25GYWN0b3IsXG4gIFRyYW5zbWlzc2lvblRleHR1cmUsXG4gIEJhY2tCdWZmZXJUZXh0dXJlLFxuICBCYWNrQnVmZmVyVGV4dHVyZVNpemUsXG4gIFRoaWNrbmVzc0ZhY3RvcixcbiAgVGhpY2tuZXNzVGV4dHVyZSxcbiAgQXR0ZW51YXRpb25EaXN0YW5jZSxcbiAgQXR0ZW51YXRpb25Db2xvcixcbiAgRW50aXR5VUlELFxuICBNb3JwaFRhcmdldE51bWJlcixcbiAgRGF0YVRleHR1cmVNb3JwaE9mZnNldFBvc2l0aW9uLFxuICBNb3JwaFdlaWdodHMsXG4gIEN1cnJlbnRDb21wb25lbnRTSURzLFxuICBBbHBoYUN1dG9mZixcbiAgQWxwaGFUZXh0dXJlLFxuICBNYWtlT3V0cHV0U3JnYixcbiAgRnJhbWVidWZmZXJTaXplLFxuICBJc091dHB1dEhEUixcbiAgQmFzZUNvbG9yVGV4dHVyZVRyYW5zZm9ybSxcbiAgQmFzZUNvbG9yVGV4dHVyZVJvdGF0aW9uLFxuICBOb3JtYWxUZXh0dXJlVHJhbnNmb3JtLFxuICBOb3JtYWxUZXh0dXJlUm90YXRpb24sXG4gIE1ldGFsbGljUm91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybSxcbiAgTWV0YWxsaWNSb3VnaG5lc3NUZXh0dXJlUm90YXRpb24sXG4gIE5vcm1hbFRleGNvb3JkSW5kZXgsXG4gIEJhc2VDb2xvclRleGNvb3JkSW5kZXgsXG4gIE1ldGFsbGljUm91Z2huZXNzVGV4Y29vcmRJbmRleCxcbiAgT2NjbHVzaW9uVGV4Y29vcmRJbmRleCxcbiAgT2NjbHVzaW9uVGV4dHVyZVRyYW5zZm9ybSxcbiAgT2NjbHVzaW9uVGV4dHVyZVJvdGF0aW9uLFxuICBFbWlzc2l2ZVRleGNvb3JkSW5kZXgsXG4gIEVtaXNzaXZlVGV4dHVyZVRyYW5zZm9ybSxcbiAgRW1pc3NpdmVUZXh0dXJlUm90YXRpb24sXG4gIE5vcm1hbFNjYWxlLFxuICBPY2NsdXNpb25TdHJlbmd0aCxcbiAgZW52Um90YXRpb24sXG4gIEVudkhkcmlGb3JtYXQsXG4gIFZyU3RhdGUsXG4gIEVuYWJsZUxpbmVhclRvU3JnYixcbiAgU3BlY3VsYXJGYWN0b3IsXG4gIFNwZWN1bGFyVGV4dHVyZSxcbiAgU3BlY3VsYXJDb2xvckZhY3RvcixcbiAgU3BlY3VsYXJDb2xvclRleHR1cmUsXG4gIElvcixcbiAgRGVwdGhCaWFzUFYsXG4gIENsZWFyQ29hdFRleHR1cmVUcmFuc2Zvcm0sXG4gIENsZWFyQ29hdFRleHR1cmVSb3RhdGlvbixcbiAgQ2xlYXJDb2F0Um91Z2huZXNzVGV4dHVyZVRyYW5zZm9ybSxcbiAgQ2xlYXJDb2F0Um91Z2huZXNzVGV4dHVyZVJvdGF0aW9uLFxuICBDbGVhckNvYXROb3JtYWxUZXh0dXJlVHJhbnNmb3JtLFxuICBDbGVhckNvYXROb3JtYWxUZXh0dXJlUm90YXRpb24sXG4gIENsZWFyQ29hdFRleGNvb3JkSW5kZXgsXG4gIENsZWFyQ29hdFJvdWdobmVzc1RleGNvb3JkSW5kZXgsXG4gIENsZWFyQ29hdE5vcm1hbFRleGNvb3JkSW5kZXgsXG4gIElyaWRlc2NlbmNlRmFjdG9yLFxuICBJcmlkZXNjZW5jZVRleHR1cmUsXG4gIElyaWRlc2NlbmNlSW9yLFxuICBJcmlkZXNjZW5jZVRoaWNrbmVzc01pbmltdW0sXG4gIElyaWRlc2NlbmNlVGhpY2tuZXNzTWF4aW11bSxcbiAgSXJpZGVzY2VuY2VUaGlja25lc3NUZXh0dXJlLFxuICBHYXVzc2lhbktlcm5lbFNpemUsXG4gIEdhdXNzaWFuUmF0aW8sXG4gIElzSG9yaXpvbnRhbCxcbiAgQW5pc290cm9weVN0cmVuZ3RoLFxuICBBbmlzb3Ryb3B5Um90YXRpb24sXG4gIEFuaXNvdHJvcHlUZXh0dXJlLFxuICBFbWlzc2l2ZVN0cmVuZ3RoLFxuICBUaW1lLFxuICBDdWJlTWFwRmFjZUlkLFxuICBSb3VnaG5lc3MsXG4gIERpc3RyaWJ1dGlvblR5cGUsXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLE9BQU8sYUFBYSw0QkFBNEIsaUJBQThCO0FBRXZGLFNBQVMsdUJBQXVCO0FBVXpCLElBQU0sd0JBQU4sTUFBTSw4QkFBNkIsVUFBeUM7QUFBQSxFQUlqRixZQUFZLEVBQUUsSUFBSSxHQUFvQztBQUNwRCxVQUFNO0FBQUEsTUFDSixPQUFPLEVBQUUsc0JBQXFCQSxLQUFlLHNCQUFxQjtBQUFBLE1BQ2xFO0FBQUEsTUFDQSxrQkFBa0I7QUFBQSxJQUNwQixDQUFDO0FBQ0QsMEJBQXFCQyxHQUFVLEtBQUssS0FBSyxJQUFJO0FBQUEsRUFDL0M7QUFBQSxFQUVBLE9BQU8seUJBQXlCLE9BQTZCO0FBQzNELFdBQU8sS0FBS0EsR0FBVSxLQUFLLElBQUksS0FBSyxJQUFLLEtBQUssSUFBSSxLQUFLLElBQUksS0FBSyxNQUFPO0FBQUEsRUFDekU7QUFBQSxFQUVBLE9BQU8sOEJBQThCLE9BQTZCO0FBQ2hFLFFBQUksU0FBUyxLQUFLLFFBQVE7QUFDeEIsYUFBTztBQUFBLElBQ1Q7QUFDQSxXQUFPO0FBQUEsRUFDVDtBQUFBLEVBRUEsT0FBTyx1Q0FBdUMsT0FBNkI7QUFDekUsUUFBSSxRQUFRLEtBQUssS0FBSyxJQUFJLEtBQUssSUFBSSxzQkFBcUIsV0FBVyxHQUFHO0FBQ3BFLGFBQU87QUFBQSxJQUNUO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFBQSxFQUVBLE9BQU8sMENBQTBDLE9BQTZCO0FBQzVFLFFBQUksUUFBUSxLQUFLLEtBQUssSUFBSSxLQUFLLElBQUksc0JBQXFCLFdBQVcsR0FBRztBQUNwRSxhQUFPO0FBQUEsSUFDVDtBQUNBLFdBQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxPQUFPLGdCQUFnQjtBQUNyQixXQUFPLHNCQUFxQkQ7QUFBQSxFQUM5QjtBQUNGO0FBeENhLHNCQUNJQSxLQUFlO0FBRG5CLHNCQUVLLFNBQVM7QUFGZCxzQkFHSUMsS0FBb0MsQ0FBQztBQUgvQyxJQUFNLHVCQUFOO0FBMENQLElBQU0sY0FBbUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNoRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sYUFBa0MsSUFBSSxxQkFBcUI7QUFBQSxFQUMvRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sY0FBbUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNoRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sbUJBQXdDLElBQUkscUJBQXFCO0FBQUEsRUFDckUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLG1CQUF3QyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3JFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxlQUFvQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ2pFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxhQUFrQyxJQUFJLHFCQUFxQjtBQUFBLEVBQy9ELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxrQkFBdUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNwRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sbUJBQXdDLElBQUkscUJBQXFCO0FBQUEsRUFDckUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGdCQUFxQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ2xFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSwyQkFBZ0QsSUFBSSxxQkFBcUI7QUFBQSxFQUM3RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sbUJBQXdDLElBQUkscUJBQXFCO0FBQUEsRUFDckUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGlCQUFzQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ25FLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxrQkFBdUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNwRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sY0FBbUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNoRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sZ0JBQXFDLElBQUkscUJBQXFCO0FBQUEsRUFDbEUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGlCQUFzQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ25FLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxpQkFBc0MsSUFBSSxxQkFBcUI7QUFBQSxFQUNuRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sZ0JBQXFDLElBQUkscUJBQXFCO0FBQUEsRUFDbEUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLDBCQUErQyxJQUFJLHFCQUFxQjtBQUFBLEVBQzVFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxpQkFBc0MsSUFBSSxxQkFBcUI7QUFBQSxFQUNuRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sb0JBQXlDLElBQUkscUJBQXFCO0FBQUEsRUFDdEUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHFCQUEwQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3ZFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxrQkFBdUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNwRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0scUJBQTBDLElBQUkscUJBQXFCO0FBQUEsRUFDdkUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGVBQW9DLElBQUkscUJBQXFCO0FBQUEsRUFDakUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGVBQW9DLElBQUkscUJBQXFCO0FBQUEsRUFDakUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLFlBQWlDLElBQUkscUJBQXFCO0FBQUEsRUFDOUQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHFCQUEwQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3ZFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxzQkFBMkMsSUFBSSxxQkFBcUI7QUFBQSxFQUN4RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sWUFBaUMsSUFBSSxxQkFBcUI7QUFBQSxFQUM5RCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sZUFBb0MsSUFBSSxxQkFBcUI7QUFBQSxFQUNqRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sZUFBb0MsSUFBSSxxQkFBcUI7QUFBQSxFQUNqRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0saUJBQXNDLElBQUkscUJBQXFCO0FBQUEsRUFDbkUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGlCQUFzQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ25FLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxxQkFBMEMsSUFBSSxxQkFBcUI7QUFBQSxFQUN2RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sMEJBQStDLElBQUkscUJBQXFCO0FBQUEsRUFDNUUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHNCQUEyQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3hFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxzQkFBMkMsSUFBSSxxQkFBcUI7QUFBQSxFQUN4RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0scUJBQTBDLElBQUkscUJBQXFCO0FBQUEsRUFDdkUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLFlBQWlDLElBQUkscUJBQXFCO0FBQUEsRUFDOUQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGtCQUF1QyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3BFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSwyQkFBZ0QsSUFBSSxxQkFBcUI7QUFBQSxFQUM3RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sYUFBa0MsSUFBSSxxQkFBcUI7QUFBQSxFQUMvRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sYUFBa0MsSUFBSSxxQkFBcUI7QUFBQSxFQUMvRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sZUFBb0MsSUFBSSxxQkFBcUI7QUFBQSxFQUNqRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sNEJBQWlELElBQUkscUJBQXFCO0FBQUEsRUFDOUUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGFBQWtDLElBQUkscUJBQXFCO0FBQUEsRUFDL0QsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHFCQUEwQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3ZFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxtQkFBd0MsSUFBSSxxQkFBcUI7QUFBQSxFQUNyRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sb0JBQXlDLElBQUkscUJBQXFCO0FBQUEsRUFDdEUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHVCQUE0QyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3pFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSx3QkFBNkMsSUFBSSxxQkFBcUI7QUFBQSxFQUMxRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sa0JBQXVDLElBQUkscUJBQXFCO0FBQUEsRUFDcEUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLDJCQUFnRCxJQUFJLHFCQUFxQjtBQUFBLEVBQzdFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSw0QkFBaUQsSUFBSSxxQkFBcUI7QUFBQSxFQUM5RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sWUFBaUMsSUFBSSxxQkFBcUI7QUFBQSxFQUM5RCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sb0JBQXlDLElBQUkscUJBQXFCO0FBQUEsRUFDdEUsS0FBSztBQUNQLENBQUM7QUFHRCxJQUFNLGlDQUFzRCxJQUFJLHFCQUFxQjtBQUFBLEVBQ25GLEtBQUs7QUFDUCxDQUFDO0FBRUQsSUFBTSxlQUFvQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ2pFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSx1QkFBNEMsSUFBSSxxQkFBcUI7QUFBQSxFQUN6RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sY0FBbUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNoRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sZUFBb0MsSUFBSSxxQkFBcUI7QUFBQSxFQUNqRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0saUJBQXNDLElBQUkscUJBQXFCO0FBQUEsRUFDbkUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGtCQUF1QyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3BFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxrQkFBdUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNwRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sbUJBQXdDLElBQUkscUJBQXFCO0FBQUEsRUFDckUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLDJCQUFnRCxJQUFJLHFCQUFxQjtBQUFBLEVBQzdFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSw0QkFBaUQsSUFBSSxxQkFBcUI7QUFBQSxFQUM5RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0seUJBQThDLElBQUkscUJBQXFCO0FBQUEsRUFDM0UsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHFCQUEwQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3ZFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxzQkFBMkMsSUFBSSxxQkFBcUI7QUFBQSxFQUN4RSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sb0JBQXlDLElBQUkscUJBQXFCO0FBQUEsRUFDdEUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHdCQUE2QyxJQUFJLHFCQUFxQjtBQUFBLEVBQzFFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxrQkFBdUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNwRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sbUJBQXdDLElBQUkscUJBQXFCO0FBQUEsRUFDckUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHNCQUEyQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3hFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxtQkFBd0MsSUFBSSxxQkFBcUI7QUFBQSxFQUNyRSxLQUFLO0FBQ1AsQ0FBQztBQUVELElBQU0sY0FBYyxJQUFJLHFCQUFxQjtBQUFBLEVBQzNDLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSw0QkFBNEIsSUFBSSxxQkFBcUI7QUFBQSxFQUN6RCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sMkJBQTJCLElBQUkscUJBQXFCO0FBQUEsRUFDeEQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHlCQUF5QixJQUFJLHFCQUFxQjtBQUFBLEVBQ3RELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSx3QkFBd0IsSUFBSSxxQkFBcUI7QUFBQSxFQUNyRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sb0NBQW9DLElBQUkscUJBQXFCO0FBQUEsRUFDakUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLG1DQUFtQyxJQUFJLHFCQUFxQjtBQUFBLEVBQ2hFLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxzQkFBc0IsSUFBSSxxQkFBcUI7QUFBQSxFQUNuRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0seUJBQXlCLElBQUkscUJBQXFCO0FBQUEsRUFDdEQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGlDQUFpQyxJQUFJLHFCQUFxQjtBQUFBLEVBQzlELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSx5QkFBeUIsSUFBSSxxQkFBcUI7QUFBQSxFQUN0RCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sNEJBQTRCLElBQUkscUJBQXFCO0FBQUEsRUFDekQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLDJCQUEyQixJQUFJLHFCQUFxQjtBQUFBLEVBQ3hELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSx3QkFBd0IsSUFBSSxxQkFBcUI7QUFBQSxFQUNyRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sMkJBQTJCLElBQUkscUJBQXFCO0FBQUEsRUFDeEQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLDBCQUEwQixJQUFJLHFCQUFxQjtBQUFBLEVBQ3ZELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxjQUFjLElBQUkscUJBQXFCLEVBQUUsS0FBSyxjQUFjLENBQUM7QUFDbkUsSUFBTSxvQkFBb0IsSUFBSSxxQkFBcUI7QUFBQSxFQUNqRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sY0FBYyxJQUFJLHFCQUFxQixFQUFFLEtBQUssY0FBYyxDQUFDO0FBQ25FLElBQU0sZ0JBQWdCLElBQUkscUJBQXFCLEVBQUUsS0FBSyxnQkFBZ0IsQ0FBQztBQUN2RSxJQUFNLFVBQVUsSUFBSSxxQkFBcUIsRUFBRSxLQUFLLFVBQVUsQ0FBQztBQUMzRCxJQUFNLHFCQUFxQixJQUFJLHFCQUFxQjtBQUFBLEVBQ2xELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxpQkFBaUIsSUFBSSxxQkFBcUIsRUFBRSxLQUFLLGlCQUFpQixDQUFDO0FBQ3pFLElBQU0sa0JBQWtCLElBQUkscUJBQXFCLEVBQUUsS0FBSyxrQkFBa0IsQ0FBQztBQUMzRSxJQUFNLHNCQUFzQixJQUFJLHFCQUFxQjtBQUFBLEVBQ25ELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSx1QkFBdUIsSUFBSSxxQkFBcUI7QUFBQSxFQUNwRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sTUFBTSxJQUFJLHFCQUFxQixFQUFFLEtBQUssTUFBTSxDQUFDO0FBQ25ELElBQU0sY0FBYyxJQUFJLHFCQUFxQixFQUFFLEtBQUssY0FBYyxDQUFDO0FBQ25FLElBQU0sNEJBQTRCLElBQUkscUJBQXFCO0FBQUEsRUFDekQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLDJCQUEyQixJQUFJLHFCQUFxQjtBQUFBLEVBQ3hELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxxQ0FBcUMsSUFBSSxxQkFBcUI7QUFBQSxFQUNsRSxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sb0NBQW9DLElBQUkscUJBQXFCO0FBQUEsRUFDakUsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGtDQUFrQyxJQUFJLHFCQUFxQjtBQUFBLEVBQy9ELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxpQ0FBaUMsSUFBSSxxQkFBcUI7QUFBQSxFQUM5RCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0seUJBQXlCLElBQUkscUJBQXFCO0FBQUEsRUFDdEQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGtDQUFrQyxJQUFJLHFCQUFxQjtBQUFBLEVBQy9ELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSwrQkFBK0IsSUFBSSxxQkFBcUI7QUFBQSxFQUM1RCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sb0JBQW9CLElBQUkscUJBQXFCO0FBQUEsRUFDakQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLHFCQUFxQixJQUFJLHFCQUFxQjtBQUFBLEVBQ2xELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxpQkFBaUIsSUFBSSxxQkFBcUI7QUFBQSxFQUM5QyxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sOEJBQThCLElBQUkscUJBQXFCO0FBQUEsRUFDM0QsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLDhCQUE4QixJQUFJLHFCQUFxQjtBQUFBLEVBQzNELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSw4QkFBOEIsSUFBSSxxQkFBcUI7QUFBQSxFQUMzRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0scUJBQXFCLElBQUkscUJBQXFCO0FBQUEsRUFDbEQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLGdCQUFnQixJQUFJLHFCQUFxQixFQUFFLEtBQUssZ0JBQWdCLENBQUM7QUFDdkUsSUFBTSxlQUFlLElBQUkscUJBQXFCLEVBQUUsS0FBSyxlQUFlLENBQUM7QUFDckUsSUFBTSxxQkFBcUIsSUFBSSxxQkFBcUI7QUFBQSxFQUNsRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0scUJBQXFCLElBQUkscUJBQXFCO0FBQUEsRUFDbEQsS0FBSztBQUNQLENBQUM7QUFDRCxJQUFNLG9CQUFvQixJQUFJLHFCQUFxQjtBQUFBLEVBQ2pELEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxtQkFBbUIsSUFBSSxxQkFBcUI7QUFBQSxFQUNoRCxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sT0FBTyxJQUFJLHFCQUFxQjtBQUFBLEVBQ3BDLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxnQkFBZ0IsSUFBSSxxQkFBcUI7QUFBQSxFQUM3QyxLQUFLO0FBQ1AsQ0FBQztBQUNELElBQU0sWUFBWSxJQUFJLHFCQUFxQjtBQUFBLEVBQ3pDLEtBQUs7QUFDUCxDQUFDO0FBQ0QsSUFBTSxtQkFBbUIsSUFBSSxxQkFBcUI7QUFBQSxFQUNoRCxLQUFLO0FBQ1AsQ0FBQztBQUVELElBQU0sV0FBVztBQUFBLEVBQ2Y7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7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QUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFBQSxFQUNBO0FBQUEsRUFDQTtBQUFBLEVBQ0E7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJfX2luZGV4Q291bnQiLCAiX19jbGFzc2VzIl0KfQo=
