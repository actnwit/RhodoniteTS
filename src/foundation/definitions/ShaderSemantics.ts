import { EnumClass, EnumIO, _from } from "../misc/EnumIO";

export interface ShaderSemanticsEnum extends EnumIO {
  singularStr: string;
  pluralStr: string;
}

class ShaderSemanticsClass extends EnumClass implements ShaderSemanticsEnum {
  public readonly pluralStr: string;
  constructor({index, singularStr, pluralStr} : {index: number, singularStr: string, pluralStr: string}) {
    super({index:index, str:singularStr});
    this.pluralStr = pluralStr;
  }

  get singularStr() {
    return this.str;
  }

}

const WorldMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({index:0, singularStr:'worldMatrix', pluralStr: 'worldMatrices'});
const ViewMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({index:1, singularStr:'viewMatrix', pluralStr: 'viewMatrices'});
const ProjectionMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({index:2, singularStr:'projectionMatrix', pluralStr: 'projectionMatrices'});
const NormalMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({index:3, singularStr:'normalMatrix', pluralStr: 'normalMatrices'});
const BoneMatrix: ShaderSemanticsEnum = new ShaderSemanticsClass({index:4, singularStr:'boneMatrix', pluralStr: 'boneMatrices'});
const BaseColorFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({index:5, singularStr:'baseColorFactor', pluralStr: 'baseColorFactors'});
const BaseColorTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({index:6, singularStr:'baseColorTexture', pluralStr: 'baseColorTextures'});
const NormalTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({index:7, singularStr:'normalTexture', pluralStr: 'normalTextures'});
const MetallicRoughnessTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({index:8, singularStr:'metallicRoughnessTexture', pluralStr: 'metallicRoughnessTextures'});
const OcclusionTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({index:9, singularStr:'occlusionTexture', pluralStr: 'occlusionTextures'});
const LightNumber: ShaderSemanticsEnum = new ShaderSemanticsClass({index:10, singularStr:'lightNumber', pluralStr: 'lightNumbers'});
const LightPosition: ShaderSemanticsEnum = new ShaderSemanticsClass({index:11, singularStr:'lightPosition', pluralStr: 'lightPositions'});
const LightDirection: ShaderSemanticsEnum = new ShaderSemanticsClass({index:12, singularStr:'lightDirection', pluralStr: 'lightDirections'});
const LightIntensity: ShaderSemanticsEnum = new ShaderSemanticsClass({index:13, singularStr:'lightIntensity', pluralStr: 'intensityOfLights'});
const MetallicRoughnessFactor: ShaderSemanticsEnum = new ShaderSemanticsClass({index:14, singularStr:'metallicRoughnessFactor', pluralStr: 'metallicRoughnessFactors'});
const BrdfLutTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({index:15, singularStr:'brdfLutTexture', pluralStr: 'brdfLutTexture'});
const DiffuseEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({index:16, singularStr:'diffuseEnvTexture', pluralStr: 'diffuseEnvTextures'});
const SpecularEnvTexture: ShaderSemanticsEnum = new ShaderSemanticsClass({index:17, singularStr:'specularEnvTexture', pluralStr: 'specularEnvTextures'});
const IBLParameter: ShaderSemanticsEnum = new ShaderSemanticsClass({index:18, singularStr:'iblParameter', pluralStr: 'iblParameter'});
const ViewPosition: ShaderSemanticsEnum = new ShaderSemanticsClass({index:19, singularStr:'viewPosition', pluralStr: 'viewPositions'});

const typeList = [ WorldMatrix, ViewMatrix, ProjectionMatrix, NormalMatrix, BoneMatrix, BaseColorFactor, BaseColorTexture,
                  NormalTexture, MetallicRoughnessTexture, OcclusionTexture, LightNumber, LightPosition, LightDirection, LightIntensity,
                  MetallicRoughnessFactor, BrdfLutTexture, DiffuseEnvTexture, SpecularEnvTexture, IBLParameter, ViewPosition ];

function from( index : number ): ShaderSemanticsEnum {
  return _from({typeList, index}) as ShaderSemanticsEnum;
}

export const ShaderSemantics = Object.freeze({ WorldMatrix, ViewMatrix, ProjectionMatrix, NormalMatrix, BoneMatrix, BaseColorFactor, BaseColorTexture,
  NormalTexture, MetallicRoughnessTexture, OcclusionTexture, LightNumber, LightPosition, LightDirection, LightIntensity,
  MetallicRoughnessFactor, BrdfLutTexture, DiffuseEnvTexture, SpecularEnvTexture, IBLParameter, ViewPosition });
