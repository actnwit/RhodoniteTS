import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";
import ISingleShader from "./ISingleShader";

export type AttributeNames = Array<string>;

export default class EnvConstantShader extends GLSLShader implements ISingleShader {
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
    return `
`;

  };

  vertexShaderBody: string = `
  `;


  getVertexShaderBody(args: any) {
const _version = this.glsl_versionText;
const _in = this.glsl_vertex_in;
const _out = this.glsl_vertex_out;

    return `${_version}
precision highp float;

${(typeof args.definitions !== 'undefined') ? args.definitions : ''}

${_in} vec3 a_position;
uniform int u_morphTargetNumber;
uniform float u_dataTextureMorphOffsetPosition[${Config.maxVertexMorphNumberInShader}];
uniform float u_morphWeights[${Config.maxVertexMorphNumberInShader}];
uniform sampler2D u_dataTexture;

${(typeof args.matricesGetters !== 'undefined') ? args.matricesGetters : ''}

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

void main() {

  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat4 viewMatrix = get_viewMatrix(a_instanceID);
  mat4 projectionMatrix = get_projectionMatrix(a_instanceID);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);

  gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);

  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_position_inWorld = (worldMatrix * vec4(a_position, 1.0)).xyz;
  v_texcoord = a_texcoord;
}
    `;
  }

  getFragmentShader(args: any) {
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

uniform float u_envRotation;
uniform float u_materialSID;
uniform sampler2D u_dataTexture;

${this.fetchElement}

${(typeof args.getters !== 'undefined') ? args.getters : '' }

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
  vec4 diffuseColorFactor = get_diffuseColorFactor(u_materialSID, 0);
  if (v_color != diffuseColor && diffuseColorFactor.rgb != diffuseColor) {
    diffuseColor = v_color * diffuseColorFactor.rgb;
    alpha = diffuseColorFactor.a;
  } else if (v_color == diffuseColor) {
    diffuseColor = diffuseColorFactor.rgb;
    alpha = diffuseColorFactor.a;
  } else if (diffuseColorFactor.rgb == diffuseColor) {
    diffuseColor = v_color;
  } else {
    diffuseColor = vec3(1.0, 1.0, 1.0);
  }

  // diffuseColorTexture

  // adapt OpenGL (RenderMan) Cubemap convension
  float envRotation = get_envRotation(u_materialSID, 0);
  float rot = envRotation + 3.1415;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  vec3 envNormal = normalize(rotEnvMatrix * v_position_inWorld);
  envNormal.x *= -1.0;

  vec4 textureColor = ${_textureCube}(u_colorEnvTexture, envNormal);
  diffuseColor *= textureColor.rgb;

  rt0 = vec4(diffuseColor, alpha);

  ${_def_fragColor}
}
`;
  }


  get pixelShaderDefinitions() {
    return '';
  }

  getPixelShaderBody(args: Object) {
    return this.getFragmentShader(args);
  }

  attributeNames: AttributeNames = ['a_position', 'a_color', 'a_normal', 'a_texcoord', 'a_instanceID'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0,
  VertexAttribute.Normal, VertexAttribute.Texcoord0, VertexAttribute.Instance];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec2, CompositionType.Scalar];
  }
}
