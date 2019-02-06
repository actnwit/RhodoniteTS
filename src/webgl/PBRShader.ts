import { VertexAttributeEnum, VertexAttribute } from "../foundation/definitions/VertexAttribute";
import WebGLResourceRepository from "./WebGLResourceRepository";
import GLSLShader from "./GLSLShader";

export type AttributeNames = Array<string>;

export default class PBRShader extends GLSLShader {
  static __instance: PBRShader;
  private constructor() {
    super();
  }

  static getInstance(): PBRShader {
    if (!this.__instance) {
      this.__instance = new PBRShader();
    }
    return this.__instance;
  }

  get vertexShaderVariableDefinitions() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_vertex_in;
    const _out = this.glsl_vertex_out;

    return `${_version}
precision highp float;
${_in} vec3 a_position;
${_in} vec3 a_color;
${_in} vec3 a_normal;
${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_out} vec3 v_color;
${_out} vec3 v_normal_inWorld;
${_out} vec4 v_position_inWorld;
${_out} vec3 v_lightDirection;
${_out} vec2 v_texcoord;
uniform mat4 u_boneMatrices[100];

mat3 toNormalMatrix(mat4 m) {
  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
  a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
  a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
  a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3];

  float b00 = a00 * a11 - a01 * a10,
  b01 = a00 * a12 - a02 * a10,
  b02 = a00 * a13 - a03 * a10,
  b03 = a01 * a12 - a02 * a11,
  b04 = a01 * a13 - a03 * a11,
  b05 = a02 * a13 - a03 * a12,
  b06 = a20 * a31 - a21 * a30,
  b07 = a20 * a32 - a22 * a30,
  b08 = a20 * a33 - a23 * a30,
  b09 = a21 * a32 - a22 * a31,
  b10 = a21 * a33 - a23 * a31,
  b11 = a22 * a33 - a23 * a32;

  float determinantVal = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat3(
    a11 * b11 - a12 * b10 + a13 * b09, a12 * b08 - a10 * b11 - a13 * b07, a10 * b10 - a11 * b08 + a13 * b06,
    a02 * b10 - a01 * b11 - a03 * b09, a00 * b11 - a02 * b08 + a03 * b07, a01 * b08 - a00 * b10 - a03 * b06,
    a31 * b05 - a32 * b04 + a33 * b03, a32 * b02 - a30 * b05 - a33 * b01, a30 * b04 - a31 * b02 + a33 * b00) / determinantVal;
}

`;

  };

  vertexShaderBody:string = `

void main ()
{
  mat4 worldMatrix = getMatrix(a_instanceID);
  mat4 viewMatrix = getViewMatrix(a_instanceID);
  mat4 projectionMatrix = getProjectionMatrix(a_instanceID);
  mat3 normalMatrix = getNormalMatrix(a_instanceID);

  v_position_inWorld = worldMatrix * vec4(a_position, 1.0);

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord = a_texcoord;

  // Light
  vec3 lightPosition = vec3(10000.0, 100000.0, 100000.0);
  v_lightDirection = normalize(lightPosition - v_position_inWorld.xyz);

  // Skeletal

  if (length(a_weight.xyz) > 0.01) {
    mat4 skinMat = a_weight.x * u_boneMatrices[int(a_joint.x)];
    skinMat += a_weight.y * u_boneMatrices[int(a_joint.y)];
    skinMat += a_weight.z * u_boneMatrices[int(a_joint.z)];
    skinMat += a_weight.w * u_boneMatrices[int(a_joint.w)];
    v_position_inWorld = skinMat * vec4(a_position, 1.0);
    normalMatrix = toNormalMatrix(skinMat);
    v_normal_inWorld = normalize(normalMatrix * a_normal);
    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
  }

//  v_color = vec3(u_boneMatrices[int(a_joint.x)][1].xyz);
}
  `;

  get fragmentShaderSimple() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;

    return `${_version}
precision highp float;

struct Material {
  vec4 baseColorFactor;
  sampler2D baseColorTexture;
};

uniform Material u_material;

${_in} vec3 v_color;
${_in} vec3 v_normal_inWorld;
${_in} vec4 v_position_inWorld;
${_in} vec3 v_lightDirection;
${_in} vec2 v_texcoord;
${_def_rt0}
void main ()
{
  // Light
  //vec3 lightPosition = vec3(0.0, 0.0, 50000.0);

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  // baseColor
  vec3 color = vec3(0.0, 0.0, 0.0);
  if (v_color != color && u_material.baseColorFactor.rgb != color) {
    color = v_color * u_material.baseColorFactor.rgb;
  } else if (v_color == color) {
    color = u_material.baseColorFactor.rgb;
  } else if (u_material.baseColorFactor.rgb == color) {
    color = v_color;
  } else {
    color = vec3(1.0, 1.0, 1.0);
  }
  //color = v_color;

  // baseColorTexture
  vec4 textureColor = ${_texture}(u_material.baseColorTexture, v_texcoord);
  if (textureColor.r > 0.05) {
    color *= textureColor.rgb;
  }

  // Lighting
  if (length(v_normal_inWorld) > 0.02) {
    vec3 lightDirection = normalize(v_lightDirection);
    float diffuse = 1.0 * max(0.0, dot(normal_inWorld, lightDirection));
    color *= diffuse;
  }

  rt0 = vec4(color, 1.0);


  ${_def_fragColor}
}
`;
  }


  get fragmentShader() {
    return this.fragmentShaderSimple;
  }

  static attributeNames: AttributeNames = ['a_position', 'a_color', 'a_normal', 'a_texcoord', 'a_joint', 'a_weight', 'a_instanceID'];
  static attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0,
    VertexAttribute.Normal, VertexAttribute.Texcoord0, VertexAttribute.Joints0, VertexAttribute.Weights0, VertexAttribute.Instance];
}
