import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";

export type AttributeNames = Array<string>;

export default class EnvConstantShader extends GLSLShader {
  static __instance: EnvConstantShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): EnvConstantShader {
    if (!this.__instance) {
      this.__instance = new EnvConstantShader();
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

  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_position_inWorld = (worldMatrix * vec4(a_position, 1.0)).xyz;
  v_texcoord = a_texcoord;

  `;

  get fragmentShaderSimple() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureCube = this.glsl_textureCube;

    return `${_version}
precision highp float;

struct Material {
  vec4 diffuseColorFactor;
};
uniform samplerCube u_colorEnvTexture;
uniform Material u_material;

uniform int u_shadingModel;

uniform vec3 u_viewPosition;

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

${_in} vec3 v_color;
${_in} vec3 v_normal_inWorld;
${_in} vec3 v_position_inWorld;
${_in} vec2 v_texcoord;
${_def_rt0}
void main ()
{

  // diffuseColor
  vec3 diffuseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  if (v_color != diffuseColor && u_material.diffuseColorFactor.rgb != diffuseColor) {
    diffuseColor = v_color * u_material.diffuseColorFactor.rgb;
    alpha = u_material.diffuseColorFactor.a;
  } else if (v_color == diffuseColor) {
    diffuseColor = u_material.diffuseColorFactor.rgb;
    alpha = u_material.diffuseColorFactor.a;
  } else if (u_material.diffuseColorFactor.rgb == diffuseColor) {
    diffuseColor = v_color;
  } else {
    diffuseColor = vec3(1.0, 1.0, 1.0);
  }

  // diffuseColorTexture

  // adapt OpenGL (RenderMan) Cubemap convension
  float rot = 3.1415;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  vec3 envNormal = normalize(rotEnvMatrix * v_position_inWorld);
  envNormal.x *= -1.0;

  vec4 textureColor = ${_textureCube}(u_colorEnvTexture, envNormal);
  diffuseColor *= textureColor.rgb;

  diffuseColor = linearToSrgb(diffuseColor);

  rt0 = vec4(diffuseColor, alpha);

  ${_def_fragColor}
}
`;
  }

  get pixelShaderDefinitions() {
    return '';
  }

  get pixelShaderBody() {
    return this.fragmentShaderSimple;
  }

  attributeNames: AttributeNames = ['a_position', 'a_color', 'a_normal', 'a_texcoord', 'a_instanceID'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0,
  VertexAttribute.Normal, VertexAttribute.Texcoord0, VertexAttribute.Instance];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec2, CompositionType.Scalar];
  }
}
