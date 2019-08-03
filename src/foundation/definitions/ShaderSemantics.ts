import { EnumClass, EnumIO, _from, _fromString } from "../misc/EnumIO";
import { CompositionType } from "./CompositionType";
import { CompositionTypeEnum, ComponentTypeEnum } from "../main";
import { ShaderVariableUpdateIntervalEnum } from "./ShaderVariableUpdateInterval";
import { ShaderTypeEnum } from "./ShaderType";
import Material from "../materials/Material";
import { Count, Index } from "../../types/CommonTypes";

export type ShaderSemanticsIndex = number;

export interface ShaderSemanticsEnum extends EnumIO {
  str: string;
}

export class ShaderSemanticsClass extends EnumClass implements ShaderSemanticsEnum {
  private static __indexCount = -1;
  static readonly _scale = 10000;
  private static __classes: ShaderSemanticsClass[] = [];
  constructor({ str }: { index?: number, str: string }) {
    super({ index: ++ShaderSemanticsClass.__indexCount * ShaderSemanticsClass._scale, str, noCheckStrUnique: true});
    ShaderSemanticsClass.__classes[this.index] = this;
  }

  static getShaderSemanticByIndex(index: Index) {
    return this.__classes[Math.abs(index) - Math.abs(index) % this._scale];
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
const MetallicRoughnessTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'metallicRoughnessTexture' });
const OcclusionTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'occlusionTexture' });
const EmissiveTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'emissiveTexture' });
const LightNumber: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'lightNumber' });
const LightPosition: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'lightPosition' });
const LightDirection: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'lightDirection' });
const LightIntensity: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'lightIntensity' });
const MetallicRoughnessFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'metallicRoughnessFactor' });
const BrdfLutTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'brdfLutTexture' });
const DiffuseEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'diffuseEnvTexture' });
const SpecularEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'specularEnvTexture' });
const IBLParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'iblParameter' });
const ViewPosition: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'viewPosition' });
const Wireframe: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'wireframe' });
const DiffuseColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'diffuseColorFactor' });
const DiffuseColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'diffuseColorTexture' });
const SpecularColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'specularColorFactor' });
const SpecularColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'specularColorTexture' });
const Shininess: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'shininess' });
const ShadingModel: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'shadingModel' });
const SkinningMode: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'skinningMode' });
const GeneralTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'generalTexture' });
const VertexAttributesExistenceArray: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'vertexAttributesExistenceArray' });
const BoneCompressedChank: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'boneCompressedChank' });
const BoneCompressedInfo: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'boneCompressedInfo' });
const PointSize: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'pointSize' });
const ColorEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'colorEnvTexture' });
const PointDistanceAttenuation: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'pointDistanceAttenuation' });
const HDRIFormat: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'hdriFormat' });
const ScreenInfo: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'screenInfo' });
const DepthTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'depthTexture' });
const LightViewProjectionMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'lightViewProjectionMatrix' });
const Anisotropy: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'anisotropy' });
const ClearCoatParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'clearcoatParameter' });
const SheenParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'sheenParameter' });
const SpecularGlossinessFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'specularGlossinessFactor' });
const SpecularGlossinessTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'specularGlossinessTexture' });
const EntityUID: ShaderSemanticsEnum = new ShaderSemanticsClass({ str: 'entityUID' });

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
  semantic: ShaderSemanticsEnum, prefix?: string, index?: Count, maxIndex?: Count, setEach?: boolean
  compositionType: CompositionTypeEnum, componentType: ComponentTypeEnum, min: number, max: number, valueStep?: number,
  isSystem: boolean, initialValue?: any, updateFunc?: UpdateFunc, updateInteval?: ShaderVariableUpdateIntervalEnum, stage: ShaderTypeEnum,
  xName?: string, yName?: string, zName?: string, wName?: string, soloDatum?: boolean
};


function fullSemanticStr(info: ShaderSemanticsInfo) {
  let prefix = '';
  if (info.prefix != null) {
    prefix = info.prefix;
  }
  return prefix + info.semantic.str;
}

const getShaderProperty = (materialTypeName: string, info: ShaderSemanticsInfo, propertyIndex: Index) => {
  const returnType = info.compositionType.getGlslStr(info.componentType);
  if (info.compositionType === CompositionType.Texture2D || info.compositionType === CompositionType.TextureCube) {
    return '';
  }

  let str = '';
  let variableName = ShaderSemantics.fullSemanticStr(info);
  if (propertyIndex < 0 || CompositionType.isArray(info.compositionType)) {
    if (Math.abs(propertyIndex) % ShaderSemanticsClass._scale !== 0 && !CompositionType.isArray(info.compositionType)) {
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
  ${returnType} get_${info.semantic.str}(float instanceId, int index) {
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
  from, fromString, fullSemanticStr, getShaderProperty, EntityUID
});
