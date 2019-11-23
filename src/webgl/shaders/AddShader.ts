import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/definitions/CompositionType";

export type AttributeNames = Array<string>;

export default class AddShader extends GLSLShader {
  static __instance: AddShader;
  public static readonly materialElement = ShaderNode.PBRShading;
  private constructor() {
    super();
  }

  static getInstance(): AddShader {
    if (!this.__instance) {
      this.__instance = new AddShader();
    }
    return this.__instance;
  }

  get vertexShaderDefinitions() {

    return `
    void add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
      outValue = lfs + rhs;
    }
    `;
  };

  get vertexShaderBody() {
    return '';
  }

  get pixelShaderDefinitions() {
    return `
    void add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
      outValue = lfs + rhs;
    }
    `;
  }

  get pixelShaderBody() {
    return `
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
