import type { ComponentTypeEnum } from '../../../foundation/definitions/ComponentType';
import { CompositionType, type CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import type { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
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

      return `
fn ${this.__functionName}(${uvStr}, outValue: ptr<function, vec4<f32>>) {
  *outValue = textureSampleLevel(${this.__variableName}Texture, ${this.__variableName}Sampler, uv, 0.0);
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
void ${this.__functionName}(${uvStr}, out vec4 outValue) {
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

      return `
fn ${this.__functionName}(${uvStr}, outValue: ptr<function, vec4<f32>>) {
  *outValue = textureSample(${this.__variableName}Texture, ${this.__variableName}Sampler, uv);
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
void ${this.__functionName}(${uvStr}, out vec4 outValue) {
  outValue = texture(u_${this.__variableName}, uv);
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
