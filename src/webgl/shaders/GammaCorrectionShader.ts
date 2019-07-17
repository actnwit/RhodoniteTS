import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";

export type AttributeNames = Array<string>;

export default class GammaCorrectionShader extends GLSLShader implements ISingleShader {
  static __instance: GammaCorrectionShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): GammaCorrectionShader {
    if (!this.__instance) {
      this.__instance = new GammaCorrectionShader();
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
${_out} vec3 v_color;
${_out} vec2 v_texcoord;

${this.toNormalMatrix}

`;

  };

  vertexShaderBody: string = `
  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat4 viewMatrix = get_viewMatrix(a_instanceID);
  mat4 projectionMatrix = get_projectionMatrix(a_instanceID);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);

  gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);

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

uniform sampler2D u_baseColorTexture;

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

${_in} vec2 v_texcoord;
${_def_rt0}
void main ()
{

  vec4 baseColor = ${_texture}(u_baseColorTexture, v_texcoord);

  baseColor.rgb = linearToSrgb(baseColor.rgb);

  rt0 = vec4(baseColor.rgb, 1.0);

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
