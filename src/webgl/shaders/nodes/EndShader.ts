import {VertexAttributeEnum} from '../../../foundation/definitions/VertexAttribute';
import GLSLShader from '../GLSLShader';
import {ShaderNode} from '../../../foundation/definitions/ShaderNode';
import {CompositionTypeEnum} from '../../../foundation/definitions/CompositionType';

export type AttributeNames = Array<string>;

export default class EndShader extends GLSLShader {
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
    return `
    void outPosition(in vec4 inPosition) {
      gl_Position = inPosition;
    }
    `;
  }

  get vertexShaderBody() {
    return `

    `;
  }

  get pixelShaderDefinitions() {
    const _def_fragColor = this.glsl_fragColor;
    let vec4StrOrNot = '';
    if (_def_fragColor !== '') {
      vec4StrOrNot = 'vec4';
    }
    return `
    void outColor(in vec4 inColor) {
      ${vec4StrOrNot} rt0 = inColor;
      ${_def_fragColor}
    }
    `;
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
