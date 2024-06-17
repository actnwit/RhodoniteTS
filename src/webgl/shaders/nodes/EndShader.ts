import { CommonShaderPart } from '../CommonShaderPart';
import { ShaderNode } from '../../../foundation/definitions/ShaderNode';
import { ProcessApproach } from '../../../foundation/definitions/ProcessApproach';
import { SystemState } from '../../../foundation/system/SystemState';
import { AttributeNames } from '../../types/CommonTypes';
import { VertexAttributeEnum } from '../../../foundation/definitions/VertexAttribute';
import { CompositionTypeEnum } from '../../../foundation/definitions/CompositionType';

export class EndShader extends CommonShaderPart {
  static __instance: EndShader;
  public static readonly materialElement = ShaderNode.PBRShading;
  private constructor() {
    super();
  }

  static getInstance(): EndShader {
    if (!this.__instance) {
      this.__instance = new EndShader();
    }
    return this.__instance;
  }

  get vertexShaderDefinitions() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn outPosition(inPosition: vec4<f32>) {
        output.position = inPosition;
      }
      `;
    } else {
      return `
      void outPosition(in vec4 inPosition) {
        gl_Position = inPosition;
      }
      `;
    }
  }

  get vertexShaderBody() {
    return `

    `;
  }

  get pixelShaderDefinitions() {
    if (SystemState.currentProcessApproach === ProcessApproach.WebGPU) {
      return `
      fn outColor(inColor: vec4<f32>) {
        rt0 = inColor;
      }
      `;
    } else {
      return `
      void outColor(in vec4 inColor) {
        rt0 = inColor;
      }
      `;
    }
  }

  getPixelShaderBody() {
    return '';
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
