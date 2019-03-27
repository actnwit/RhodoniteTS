import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";

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
    function add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
      outValue = lfs + rhs;
    }
    `;
  };

  get vertexShaderBody() {
    return '';
  }

  get fragmentShaderDefinitions() {
    return `
    function add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
      outValue = lfs + rhs;
    }
    `;
  }

  get fragmentShaderBody() {
    return `
    `;
  }

  static attributeNames: AttributeNames = ['a_position', 'a_color', 'a_normal', 'a_faceNormal', 'a_texcoord', 'a_tangent', 'a_joint', 'a_weight', 'a_baryCentricCoord', 'a_instanceID'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0,
    VertexAttribute.Normal, VertexAttribute.FaceNormal, VertexAttribute.Texcoord0, VertexAttribute.Tangent, VertexAttribute.Joints0, VertexAttribute.Weights0, VertexAttribute.BaryCentricCoord, VertexAttribute.Instance];
}
