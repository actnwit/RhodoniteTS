import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";

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
    function end(in vec4 inPosition) {
      gl_Position = inPosition;
    }
    `;
  };

  get vertexShaderBody() {
    return `

    `;
  }


  get pixelShaderDefinitions() {
    const _def_fragColor = this.glsl_fragColor;
    return `
    function end(in vec4 inColor) {
      rt0 = inColor;
      ${_def_fragColor}
    }
    `;
  }

  get pixelShaderBody() {
    return '';
  }

  get attributeNames(): AttributeNames {
    return [];
  }
  get attributeSemantics(): Array<VertexAttributeEnum> {
    return [];
  }
}
