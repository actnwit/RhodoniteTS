import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";
import { CompositionType } from "./CompositionType";
import { CompositionTypeEnum, ComponentTypeEnum } from "../main";
import { ShaderVariableUpdateIntervalEnum } from "./ShaderVariableUpdateInterval";
import { ShaderTypeEnum } from "./ShaderType";
import Material from "../materials/Material";
import { Count } from "../../types/CommonTypes";

export interface ShaderSemanticsEnum extends EnumIO {
  singularStr: string;
  pluralStr: string;
}

export class ShaderSemanticsClass extends EnumClass implements ShaderSemanticsEnum {
  public readonly pluralStr: string;
  constructor({ index, singularStr, pluralStr }: { index: number, singularStr: string, pluralStr: string }) {
    super({ index: index, str: singularStr });
    this.pluralStr = pluralStr;
  }

  get singularStr() {
    return this.str;
  }

}

const WorldMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 0, singularStr: 'worldMatrix', pluralStr: 'worldMatrices' });
const ViewMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 1, singularStr: 'viewMatrix', pluralStr: 'viewMatrices' });
const ProjectionMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 2, singularStr: 'projectionMatrix', pluralStr: 'projectionMatrices' });
const NormalMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 3, singularStr: 'normalMatrix', pluralStr: 'normalMatrices' });
const BoneMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 4, singularStr: 'boneMatrix', pluralStr: 'boneMatrices' });
const BaseColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 5, singularStr: 'baseColorFactor', pluralStr: 'baseColorFactors' });
const BaseColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 6, singularStr: 'baseColorTexture', pluralStr: 'baseColorTextures' });
const NormalTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 7, singularStr: 'normalTexture', pluralStr: 'normalTextures' });
const MetallicRoughnessTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 8, singularStr: 'metallicRoughnessTexture', pluralStr: 'metallicRoughnessTextures' });
const OcclusionTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 9, singularStr: 'occlusionTexture', pluralStr: 'occlusionTextures' });
const EmissiveTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 10, singularStr: 'emissiveTexture', pluralStr: 'emissiveTextures' });
const LightNumber: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 11, singularStr: 'lightNumber', pluralStr: 'lightNumbers' });
const LightPosition: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 12, singularStr: 'lightPosition', pluralStr: 'lightPositions' });
const LightDirection: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 13, singularStr: 'lightDirection', pluralStr: 'lightDirections' });
const LightIntensity: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 14, singularStr: 'lightIntensity', pluralStr: 'intensityOfLights' });
const MetallicRoughnessFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 15, singularStr: 'metallicRoughnessFactor', pluralStr: 'metallicRoughnessFactors' });
const BrdfLutTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 16, singularStr: 'brdfLutTexture', pluralStr: 'brdfLutTexture' });
const DiffuseEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 17, singularStr: 'diffuseEnvTexture', pluralStr: 'diffuseEnvTextures' });
const SpecularEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 18, singularStr: 'specularEnvTexture', pluralStr: 'specularEnvTextures' });
const IBLParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 19, singularStr: 'iblParameter', pluralStr: 'iblParameter' });
const ViewPosition: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 20, singularStr: 'viewPosition', pluralStr: 'viewPositions' });
const Wireframe: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 21, singularStr: 'wireframe', pluralStr: 'wireframes' });
const DiffuseColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 22, singularStr: 'diffuseColorFactor', pluralStr: 'diffuseColorFactors' });
const DiffuseColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 23, singularStr: 'diffuseColorTexture', pluralStr: 'diffuseColorTextures' });
const SpecularColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 24, singularStr: 'specularColorFactor', pluralStr: 'specularColorFactors' });
const SpecularColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 25, singularStr: 'specularColorTexture', pluralStr: 'specularColorTextures' });
const Shininess: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 26, singularStr: 'shininess', pluralStr: 'shininesses' });
const ShadingModel: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 27, singularStr: 'shadingModel', pluralStr: 'shadingModels' });
const SkinningMode: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 28, singularStr: 'skinningMode', pluralStr: 'skinningModes' });
const GeneralTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 29, singularStr: 'generalTexture', pluralStr: 'generalTextures' });
const VertexAttributesExistenceArray: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 30, singularStr: 'vertexAttributesExistenceArray', pluralStr: 'vertexAttributesExistenceArrays' });
const BoneCompressedChank: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 31, singularStr: 'boneCompressedChank', pluralStr: 'boneCompressedChanks' });
const BoneCompressedInfo: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 32, singularStr: 'boneCompressedInfo', pluralStr: 'boneCompressedInfos' });
const PointSize: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 33, singularStr: 'pointSize', pluralStr: 'pointSize' });
const ColorEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 34, singularStr: 'colorEnvTexture', pluralStr: 'colorEnvTextures' });
const PointDistanceAttenuation: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 35, singularStr: 'pointDistanceAttenuation', pluralStr: 'pointDistanceAttenuation' });
const HDRIFormat: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 36, singularStr: 'hdriFormat', pluralStr: 'hdriFormats' });
const ScreenInfo: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 37, singularStr: 'screenInfo', pluralStr: 'screenInfos' });
const DepthTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 38, singularStr: 'depthTexture', pluralStr: 'depthTexture' });
const LightViewProjectionMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 39, singularStr: 'lightViewProjectionMatrix', pluralStr: 'lightViewProjectionMatrix' });
const Anisotropy: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 40, singularStr: 'anisotropy', pluralStr: 'anisotropy' });
const ClearCoatParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 41, singularStr: 'clearcoatParameter', pluralStr: 'clearcoatParameters' });
const SheenParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 42, singularStr: 'sheenParameter', pluralStr: 'sheenParameters' });
const SpecularGlossinessFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 43, singularStr: 'specularGlossinessFactor', pluralStr: 'specularGlossinessFactors' });
const SpecularGlossinessTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 44, singularStr: 'specularGlossinessTexture', pluralStr: 'specularGlossinessTextures' });
const EntityUID: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 45, singularStr: 'entityUID', pluralStr: 'entityUIDs' });

const typeList = [WorldMatrix, ViewMatrix, ProjectionMatrix, NormalMatrix, BoneMatrix, BaseColorFactor, BaseColorTexture,
  NormalTexture, MetallicRoughnessTexture, OcclusionTexture, EmissiveTexture, LightNumber, LightPosition, LightDirection, LightIntensity,
  MetallicRoughnessFactor, BrdfLutTexture, DiffuseEnvTexture, SpecularEnvTexture, IBLParameter, ViewPosition, Wireframe,
  DiffuseColorFactor, DiffuseColorTexture, SpecularColorFactor, SpecularColorTexture, Shininess, ShadingModel, SkinningMode, GeneralTexture,
  VertexAttributesExistenceArray, BoneCompressedChank, BoneCompressedInfo, PointSize, ColorEnvTexture, PointDistanceAttenuation, HDRIFormat,
  ScreenInfo, DepthTexture, LightViewProjectionMatrix, Anisotropy, ClearCoatParameter, SheenParameter, SpecularGlossinessFactor, SpecularGlossinessTexture,
  EntityUID];

function from(index: number): ShaderSemanticsEnum {
  return _from({ typeList, index }) as ShaderSemanticsEnum;
}

function fromString(str: string): ShaderSemanticsEnum {
  return _fromString({ typeList, str }) as ShaderSemanticsEnum;
}


type UpdateFunc = (
  {shaderProgram, firstTime, propertyName, value, args}:
  {shaderProgram: WebGLProgram, firstTime: boolean, propertyName: string, value: any, args?: Object})
   => void;

export type ShaderSemanticsInfo = {
  semantic?: ShaderSemanticsEnum, isPlural?: boolean, prefix?: string, semanticStr?: string, index?: Count, maxIndex?: Count,
  compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, min: number, max: number, valueStep?: number,
  isSystem: boolean, initialValue?: any, updateFunc?: UpdateFunc, updateInteval?: ShaderVariableUpdateIntervalEnum, stage: ShaderTypeEnum,
  xName?: string, yName?: string, zName?: string, wName?: string, soloDatum?: boolean
};


function infoToString(semanticInfo: ShaderSemanticsInfo): string|undefined {
  return (semanticInfo.semantic != null) ? semanticInfo.semantic.str : semanticInfo.semanticStr;
}

function infoToPluralString(semanticInfo: ShaderSemanticsInfo): string|undefined {
  return (semanticInfo.semantic != null) ? semanticInfo.semantic.pluralStr : semanticInfo.semanticStr;
}


function fullSemanticStr(info: ShaderSemanticsInfo) {
  let prefix = '';
  if (info.prefix != null) {
    prefix = info.prefix;
  }
  return prefix+infoToString(info);
}

function fullSemanticPluralStr(info: ShaderSemanticsInfo) {
  let prefix = '';
  if (info.prefix != null) {
    prefix = info.prefix;
  }
  return prefix+infoToPluralString(info);
}

const getShaderProperty = (materialTypeName: string, info: ShaderSemanticsInfo, memberName: string) => {
  const returnType = info.compositionType.getGlslStr(info.componentType);
  if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
    return '';
  }

  let methodName = memberName.split('___')[0];
  methodName = methodName.replace('.', '_');
  let str = '';
  let variableName = ShaderSemantics.fullSemanticStr(info);
  if (memberName.indexOf('___') !== -1) {
    if (memberName.indexOf('___0') === -1) {
      return '';
    }
    variableName = variableName.replace(/\[.+?\]/g, `[i]`);
    str += `
    for (int i=0; i<${info.maxIndex}; i++) {
      if (i == index) {
        return u_${variableName};
      }
    }`;
  } else {
    str += `return u_${variableName};`;
  }

  return `
  ${returnType} get_${methodName}(float instanceId, int index) {
    ${str}
  }
  `;

};

export const ShaderSemantics = Object.freeze({
  WorldMatrix, ViewMatrix, ProjectionMatrix, NormalMatrix, BoneMatrix, BaseColorFactor, BaseColorTexture,
  NormalTexture, MetallicRoughnessTexture, OcclusionTexture, EmissiveTexture, LightNumber, LightPosition, LightDirection, LightIntensity,
  MetallicRoughnessFactor, BrdfLutTexture, DiffuseEnvTexture, SpecularEnvTexture, IBLParameter, ViewPosition, Wireframe,
  DiffuseColorFactor, DiffuseColorTexture, SpecularColorFactor, SpecularColorTexture, Shininess, ShadingModel, SkinningMode, GeneralTexture,
  VertexAttributesExistenceArray, BoneCompressedChank, BoneCompressedInfo, PointSize, ColorEnvTexture, PointDistanceAttenuation,
  HDRIFormat, ScreenInfo, DepthTexture, LightViewProjectionMatrix, Anisotropy, ClearCoatParameter, SheenParameter, SpecularGlossinessFactor, SpecularGlossinessTexture,
  from, fromString, infoToString, fullSemanticStr, fullSemanticPluralStr, getShaderProperty, EntityUID
});
