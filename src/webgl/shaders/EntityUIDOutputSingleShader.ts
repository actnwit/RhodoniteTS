import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";

export type AttributeNames = Array<string>;

export default class EntityUIDOutputShader extends GLSLShader implements ISingleShader {
  static __instance: EntityUIDOutputShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): EntityUIDOutputShader {
    if (!this.__instance) {
      this.__instance = new EntityUIDOutputShader();
    }
    return this.__instance;
  }


  get vertexShaderDefinitions() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `
${_in} vec3 a_position;
${_in} vec3 a_color;
${_in} vec3 a_normal;
${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_out} vec3 v_color;
${_out} vec3 v_normal_inWorld;
${_out} vec3 v_position_inWorld;
${_out} vec2 v_texcoord;

${this.toNormalMatrix}

`;

  };

  vertexShaderBody: string = `
  mat4 worldMatrix = getMatrix(a_instanceID);
  mat4 viewMatrix = getViewMatrix(a_instanceID);
  mat4 projectionMatrix = getProjectionMatrix(a_instanceID);
  mat3 normalMatrix = getNormalMatrix(a_instanceID);

  gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);

  bool isSkinning;
  skinning(isSkinning, normalMatrix, normalMatrix);

  v_color = a_color;
  v_position_inWorld = (worldMatrix * vec4(a_position, 1.0)).xyz;
  v_texcoord = a_texcoord;

  `;

  getFragmentShader() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureCube = this.glsl_textureCube;

    return `${_version}
precision highp float;

uniform vec3 u_entityUID;

${_in} vec3 v_color;
${_in} vec3 v_normal_inWorld;
${_in} vec3 v_position_inWorld;
${_in} vec2 v_texcoord;
${_def_rt0}
void main ()
{

  rt0 = vec4(u_entityUID, 1.0);

  ${_def_fragColor}
}
`;
  }

  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody() {
    return this.getFragmentShader();
  }

  attributeNames: AttributeNames = ['a_position', 'a_color', 'a_normal', 'a_texcoord', 'a_instanceID'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0,
  VertexAttribute.Normal, VertexAttribute.Texcoord0, VertexAttribute.Instance];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec2, CompositionType.Scalar];
  }
}
