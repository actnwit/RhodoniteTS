import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";
import { CompositionType } from "./CompositionType";
import { CompositionTypeEnum, ComponentTypeEnum } from "../main";
import { ShaderVariableUpdateIntervalEnum } from "./ShaderVariableUpdateInterval";
import { ShaderTypeEnum } from "./ShaderType";
import Material from "../materials/Material";
import { Count } from "../../types/CommonTypes";

export interface ShaderSemanticsEnum extends EnumIO {
  str: string;
}

export class ShaderSemanticsClass extends EnumClass implements ShaderSemanticsEnum {
  private static __indexCount: -1;
  constructor({ str }: { index?: number, str: string }) {
    super({ index: ++ShaderSemanticsClass.__indexCount, str });
  }

}

const WorldMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'worldMatrix' });
const ViewMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'viewMatrix' });
const ProjectionMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'projectionMatrix' });
const NormalMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'normalMatrix' });
const BoneMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'boneMatrix' });
const BaseColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'baseColorFactor' });
const BaseColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'baseColorTexture' });
const NormalTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'normalTexture' });
const MetallicRoughnessTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 8, str: 'metallicRoughnessTexture' });
const OcclusionTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 9, str: 'occlusionTexture' });
const EmissiveTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 10, str: 'emissiveTexture' });
const LightNumber: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 11, str: 'lightNumber' });
const LightPosition: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 12, str: 'lightPosition' });
const LightDirection: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 13, str: 'lightDirection' });
const LightIntensity: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 14, str: 'lightIntensity' });
const MetallicRoughnessFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 15, str: 'metallicRoughnessFactor' });
const BrdfLutTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 16, str: 'brdfLutTexture' });
const DiffuseEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 17, str: 'diffuseEnvTexture' });
const SpecularEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 18, str: 'specularEnvTexture' });
const IBLParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 19, str: 'iblParameter' });
const ViewPosition: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 20, str: 'viewPosition' });
const Wireframe: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 21, str: 'wireframe' });
const DiffuseColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 22, str: 'diffuseColorFactor' });
const DiffuseColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 23, str: 'diffuseColorTexture' });
const SpecularColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 24, str: 'specularColorFactor' });
const SpecularColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 25, str: 'specularColorTexture' });
const Shininess: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 26, str: 'shininess' });
const ShadingModel: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 27, str: 'shadingModel' });
const SkinningMode: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 28, str: 'skinningMode' });
const GeneralTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 29, str: 'generalTexture' });
const VertexAttributesExistenceArray: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 30, str: 'vertexAttributesExistenceArray' });
const BoneCompressedChank: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 31, str: 'boneCompressedChank' });
const BoneCompressedInfo: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 32, str: 'boneCompressedInfo' });
const PointSize: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 33, str: 'pointSizee' });
const ColorEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 34, str: 'colorEnvTexture' });
const PointDistanceAttenuation: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 35, str: 'pointDistanceAttenuation' });
const HDRIFormat: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 36, str: 'hdriFormat' });
const ScreenInfo: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 37, str: 'screenInfo' });
const DepthTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 38, str: 'depthTexture' });
const LightViewProjectionMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 39, str: 'lightViewProjectionMatrix' });
const Anisotropy: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 40, str: 'anisotropy' });
const ClearCoatParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 41, str: 'clearcoatParameter' });
const SheenParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 42, str: 'sheenParameter' });
const SpecularGlossinessFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 43, str: 'specularGlossinessFactor' });
const SpecularGlossinessTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 44, str: 'specularGlossinessTexture' });
const EntityUID: ShaderSemanticsEnum = new ShaderSemanticsClass({ index: 45, str: 'entityUID' });

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
  { material, shaderProgram, firstTime, propertyName, value, args }:
    { material: Material, shaderProgram: WebGLProgram, firstTime: boolean, propertyName: string, value: any, args?: Object })
  => void;

export type ShaderSemanticsInfo = {
  semantic?: ShaderSemanticsEnum, prefix?: string, semanticStr?: string, index?: Count, maxIndex?: Count, setEach?: boolean
  compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, min: number, max: number, valueStep?: number,
  isSystem: boolean, initialValue?: any, updateFunc?: UpdateFunc, updateInteval?: ShaderVariableUpdateIntervalEnum, stage: ShaderTypeEnum,
  xName?: string, yName?: string, zName?: string, wName?: string, soloDatum?: boolean
};


function infoToString(semanticInfo: ShaderSemanticsInfo): string|undefined {
  return (semanticInfo.semantic != null) ? semanticInfo.semantic.str : semanticInfo.semanticStr;
}

function fullSemanticStr(info: ShaderSemanticsInfo) {
  let prefix = '';
  if (info.prefix != null) {
    prefix = info.prefix;
  }
  return prefix+infoToString(info);
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
  if (memberName.indexOf('___') !== -1 || CompositionType.isArray(info.compositionType)) {
    if (memberName.indexOf('___0') === -1 && !CompositionType.isArray(info.compositionType)) {
      return '';
    }
    if (variableName.match(/\[.+?\]/)) {
      variableName = variableName.replace(/\[.+?\]/g, `[i]`);
    } else {
      variableName += '[i]';
    }
    str += `
    ${returnType} val;
    for (int i=0; i<${info.maxIndex}; i++) {
      if (i == index) {
        val = u_${variableName};
        break;
      }
    }
    return val;
    `;
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
  from, fromString, infoToString, fullSemanticStr, getShaderProperty, EntityUID
});
