import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { getTextureAndSamplerNames } from '../../../foundation/helpers/ShaderHelper';
import type { Engine } from '../../../foundation/system/Engine';
import type { AttributeNames } from '../../types/CommonTypes';
import { CommonShaderPart } from '../CommonShaderPart';

export class TextureShader extends CommonShaderPart {
  private __variableName = '';
  private __valueStr = '';
  constructor(
    private __functionName: string,
    private __compositionType: CompositionTypeEnum
  ) {
    super();
  }

  setVariableName(name: any) {
    this.__variableName = name;
  }

  setDefaultValue(value: any) {
    this.__valueStr = value.toString();
  }

  getVertexShaderDefinitions(engine: Engine) {
    if (!CompositionType.isTexture(this.__compositionType)) {
      throw new Error(`UniformTextureShader: ${this.__compositionType} is not a texture`);
    }

    // WebGPU
    // Note: In vertex shaders, we must use textureSampleLevel instead of textureSample
    // because textureSample requires implicit derivatives which are only available in fragment shaders
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let uvStr = '';
      if (this.__compositionType === CompositionType.Texture2D) {
        uvStr = 'uv: vec2f';
      } else if (this.__compositionType === CompositionType.TextureCube) {
        uvStr = 'uv: vec3f';
      } else if (this.__compositionType === CompositionType.Texture2DArray) {
        uvStr = 'uv: vec2f';
      } else {
        throw new Error(`UniformTextureShader: ${this.__compositionType} is not a texture`);
      }

      const { textureName, samplerName } = getTextureAndSamplerNames(this.__variableName);
      return `
// #param ${textureName}TransformScale: vec2<f32>; // initialValue=(1,1)
// #param ${textureName}TransformOffset: vec2<f32>; // initialValue=(0,0)
// #param ${textureName}TransformRotation: f32; // initialValue=0
fn ${this.__functionName}(${uvStr}, outValue: ptr<function, vec4<f32>>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${textureName}TransformScale: vec2f = get_${textureName}TransformScale(materialSID, 0);
  let ${textureName}TransformOffset: vec2f = get_${textureName}TransformOffset(materialSID, 0);
  let ${textureName}TransformRotation: f32 = get_${textureName}TransformRotation(materialSID, 0);
  let ${textureName}TexUv = uvTransform(${textureName}TransformScale, ${textureName}TransformOffset, ${textureName}TransformRotation, uv);
  *outValue = textureSampleLevel(${textureName}, ${samplerName}, ${textureName}TexUv, 0.0);
}
`;
    }

    // WebGL
    let uvStr = '';
    if (this.__compositionType === CompositionType.Texture2D) {
      uvStr = 'vec2 uv';
    } else if (this.__compositionType === CompositionType.TextureCube) {
      uvStr = 'vec3 uv';
    } else if (this.__compositionType === CompositionType.Texture2DArray) {
      uvStr = 'vec2 uv';
    } else {
      throw new Error(`UniformTextureShader: ${this.__compositionType} is not a texture`);
    }

    return `
uniform vec2 u_${this.__variableName}TransformScale; // initialValue=(1,1)
uniform vec2 u_${this.__variableName}TransformOffset; // initialValue=(0,0)
uniform float u_${this.__variableName}TransformRotation; // initialValue=0
void ${this.__functionName}(${uvStr}, out vec4 outValue) {
  ${CommonShaderPart.getMaterialSIDForWebGL()}
  vec2 ${this.__variableName}TransformScale = get_${this.__variableName}TransformScale(materialSID, 0);
  vec2 ${this.__variableName}TransformOffset = get_${this.__variableName}TransformOffset(materialSID, 0);
  float ${this.__variableName}TransformRotation = get_${this.__variableName}TransformRotation(materialSID, 0);
  vec2 ${this.__variableName}TexUv = uvTransform(${this.__variableName}TransformScale, ${this.__variableName}TransformOffset, ${this.__variableName}TransformRotation, uv);
  outValue = texture(u_${this.__variableName}, ${this.__variableName}TexUv);
  outValue = texture(u_${this.__variableName}, uv);
}
`;
  }

  getPixelShaderDefinitions(engine: Engine) {
    if (!CompositionType.isTexture(this.__compositionType)) {
      throw new Error(`UniformTextureShader: ${this.__compositionType} is not a texture`);
    }

    // WebGPU
    if (engine.engineState.currentProcessApproach === ProcessApproach.WebGPU) {
      let uvStr = '';
      if (this.__compositionType === CompositionType.Texture2D) {
        uvStr = 'uv: vec2f';
      } else if (this.__compositionType === CompositionType.TextureCube) {
        uvStr = 'uv: vec3f';
      } else if (this.__compositionType === CompositionType.Texture2DArray) {
        uvStr = 'uv: vec2f';
      } else {
        throw new Error(`UniformTextureShader: ${this.__compositionType} is not a texture`);
      }

      const { textureName, samplerName } = getTextureAndSamplerNames(this.__variableName);
      return `
// #param ${textureName}TransformScale: vec2<f32>; // initialValue=(1,1)
// #param ${textureName}TransformOffset: vec2<f32>; // initialValue=(0,0)
// #param ${textureName}TransformRotation: f32; // initialValue=0
fn ${this.__functionName}(${uvStr}, outValue: ptr<function, vec4<f32>>) {
  let materialSID = uniformDrawParameters.materialSid;
  let ${textureName}TransformScale: vec2f = get_${textureName}TransformScale(materialSID, 0);
  let ${textureName}TransformOffset: vec2f = get_${textureName}TransformOffset(materialSID, 0);
  let ${textureName}TransformRotation: f32 = get_${textureName}TransformRotation(materialSID, 0);
  let ${textureName}TexUv = uvTransform(${textureName}TransformScale, ${textureName}TransformOffset, ${textureName}TransformRotation, uv);
  *outValue = textureSample(${textureName}, ${samplerName}, ${textureName}TexUv);
}
`;
    }

    // WebGL
    let uvStr = '';
    if (this.__compositionType === CompositionType.Texture2D) {
      uvStr = 'vec2 uv';
    } else if (this.__compositionType === CompositionType.TextureCube) {
      uvStr = 'vec3 uv';
    } else if (this.__compositionType === CompositionType.Texture2DArray) {
      uvStr = 'vec2 uv';
    } else {
      throw new Error(`UniformTextureShader: ${this.__compositionType} is not a texture`);
    }

    return `
uniform vec2 u_${this.__variableName}TransformScale; // initialValue=(1,1)
uniform vec2 u_${this.__variableName}TransformOffset; // initialValue=(0,0)
uniform float u_${this.__variableName}TransformRotation; // initialValue=0
void ${this.__functionName}(${uvStr}, out vec4 outValue) {
  ${CommonShaderPart.getMaterialSIDForWebGL()}
  vec2 ${this.__variableName}TransformScale = get_${this.__variableName}TransformScale(materialSID, 0);
  vec2 ${this.__variableName}TransformOffset = get_${this.__variableName}TransformOffset(materialSID, 0);
  float ${this.__variableName}TransformRotation = get_${this.__variableName}TransformRotation(materialSID, 0);
  vec2 ${this.__variableName}TexUv = uvTransform(${this.__variableName}TransformScale, ${this.__variableName}TransformOffset, ${this.__variableName}TransformRotation, uv);
  outValue = texture(u_${this.__variableName}, ${this.__variableName}TexUv);
}
`;
  }

  get attributeNames(): AttributeNames {
    return [];
  }

  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [];
  }
}
