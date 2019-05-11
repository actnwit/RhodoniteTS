import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";

export type AttributeNames = Array<string>;

export default class FurnaceTestShader extends GLSLShader {
  static __instance: FurnaceTestShader;
  public static readonly materialElement = ShaderNode.ClassicShading;

  private constructor() {
    super();
  }

  static getInstance(): FurnaceTestShader {
    if (!this.__instance) {
      this.__instance = new FurnaceTestShader();
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
${_out} vec3 v_normal_inWorld;
${_out} vec4 v_position_inWorld;
${_out} vec2 v_texcoord;

${this.toNormalMatrix}

${this.getSkinMatrix}

${this.processSkinning}

${this.pointSize}

${this.pointDistanceAttenuation}
`;

  };

  vertexShaderBody: string = `
  mat4 worldMatrix = getMatrix(a_instanceID);
  mat4 viewMatrix = getViewMatrix(a_instanceID);
  mat4 projectionMatrix = getProjectionMatrix(a_instanceID);
  mat3 normalMatrix = getNormalMatrix(a_instanceID);

  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord = a_texcoord;

  gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);
  v_position_inWorld = worldMatrix * vec4(a_position, 1.0);
  `;

  get fragmentShaderSimple() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;

    return `${_version}
precision highp float;

uniform vec2 u_screenInfo;

${_in} vec3 v_normal_inWorld;
${_in} vec4 v_position_inWorld;
${_in} vec2 v_texcoord;
${_def_rt0}

#define MATH_PI 3.141592

// These codes are referenced from https://github.com/knarkowicz/FurnaceTest
float roughnessRemap(float userRoughness) {
  return userRoughness * userRoughness;
}

float smithG1(float roughness, float NoV)
{
	float a = roughnessRemap( roughness );
	float a2 = a * a;
	float NoV2 = NoV * NoV;
	float lambda = (-1.0 + sqrt(1.0 + a2 * (1.0 - NoV2) / NoV2)) * 0.5;
	return 1.0 / (1.0 + lambda);
}

float smithG(float roughness, float NoV, float NoL)
{
	float a = roughnessRemap( roughness );
	float a2 = a * a;
	float NoV2 = NoV * NoV;
	float NoL2 = NoL * NoL;
	float lambdaV = (-1.0 + sqrt(1.0 + a2 * (1.0 - NoV2) / NoV2)) * 0.5;
	float lambdaL = (-1.0 + sqrt(1.0 + a2 * (1.0 - NoL2) / NoL2)) * 0.5;
	return 1.0 / (1.0 + lambdaV + lambdaL);
}

float vanDerCorpus(int n, int base)
{
    float invBase = 1.0 / float(base);
    float denom   = 1.0;
    float result  = 0.0;

    for(int i = 0; i < 32; ++i)
    {
        if(n > 0)
        {
            denom   = mod(float(n), 2.0);
            result += denom * invBase;
            invBase = invBase / 2.0;
            n       = int(float(n) / 2.0);
        }
    }

    return result;
}

// this is from https://learnopengl.com/PBR/IBL/Specular-IBL
vec2 hammersleyNoBitOps(int i, int N)
{
  return vec2(float(i)/float(N), vanDerCorpus(i, 2));
}

float weakWhiteFurnaceTest(float roughness, float NoV)
{
	float a = roughnessRemap(roughness);
	float a2 = a * a;

	float vx = sqrt(1.0 - NoV * NoV);
	float vy = 0.0;
	float vz = NoV;

	float integral = 0.0;
	const int sampleNum = 2048;
	for (int i = 0; i < sampleNum; ++i)
	{
    vec2 Xi = hammersleyNoBitOps(i, sampleNum);

		float phi = 2.0 * MATH_PI * Xi.x;
		float cosPhi = cos(phi);
		float sinPhi = sin(phi);
		float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a2 - 1.0) * Xi.y)); // GGX
		float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

		float hx = sinTheta * cos(phi);
		float hy = sinTheta * sin(phi);
		float hz = cosTheta;

		float VoHUnsat = vx * hx + vy * hy + vz * hz;

		float NoH = max(hz, 0.0);
		float VoH = max(VoHUnsat, 0.0);

		float g1 = smithG1(roughness, NoV);
		float pdf = 4.0 * VoH / NoH;
		integral += (g1 * pdf) / (4.0 * NoV);
	}
	integral /= float(sampleNum);
	return clamp(integral, 0.0, 1.0);
}

float whiteFurnaceTest(float roughness, float NoV)
{
	float a = roughnessRemap(roughness);
	float a2 = a * a;

	float vx = sqrt(1.0 - NoV * NoV);
	float vy = 0.0;
	float vz = NoV;

	float integral = 0.0;
	const int sampleNum = 4096;
	for (int i = 0; i < sampleNum; ++i)
	{

    vec2 Xi = hammersleyNoBitOps(i, sampleNum);

		float phi = 2.0 * MATH_PI * Xi.x;
		float cosPhi = cos(phi);
		float sinPhi = sin(phi);
		float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a2 - 1.0) * Xi.y)); // GGX
		float sinTheta = sqrt(1.0 - cosTheta * cosTheta);

		float hx = sinTheta * cos(phi);
		float hy = sinTheta * sin(phi);
		float hz = cosTheta;

		float VoHUnsat = vx * hx + vy * hy + vz * hz;
		float lx = 2.0 * VoHUnsat * hx - vx;
		float ly = 2.0 * VoHUnsat * hy - vy;
		float lz = 2.0 * VoHUnsat * hz - vz;

		float NoL = max(lz, 0.0);
		float NoH = max(hz, 0.0);
		float VoH = max(VoHUnsat, 0.0);

    float g = smithG(roughness, NoV, NoL);
    float pdf = 4.0 * VoH / NoH;
		integral += (g * pdf) / (4.0 * NoV);
	}
	integral /= float(sampleNum);
	return clamp(integral, 0.0, 1.0);
}

uniform vec3 u_viewPosition;
uniform int u_mode;
uniform vec2 u_metallicRoughnessFactor;
uniform sampler2D u_metallicRoughnessTexture;

void main ()
{

  vec2 quadSizeInPixel = u_screenInfo;
  float roughness = (gl_FragCoord.y) / quadSizeInPixel.y;
  float NoV = (gl_FragCoord.x) / quadSizeInPixel.x;

  // 2D mode
  if (u_mode == 0) {
    roughness = (gl_FragCoord.y) / quadSizeInPixel.y;
    NoV = (gl_FragCoord.x) / quadSizeInPixel.x;
  } else {
    // object mode
    // Roughness
    const float c_MinRoughness = 0.04;
    float userRoughness = u_metallicRoughnessFactor.y;
    float metallic = u_metallicRoughnessFactor.x;

    vec4 ormTexel = texture2D(u_metallicRoughnessTexture, v_texcoord);
    userRoughness = ormTexel.g * userRoughness;
    userRoughness = clamp(userRoughness, c_MinRoughness, 1.0);
    roughness = userRoughness;

    // vec3 viewVector = normalize(vec3(0.0, 0.0, 10.0) - v_position_inWorld.xyz);
    // vec3 viewVector = normalize(u_viewPosition - v_position_inWorld.xyz);
    vec3 viewVector = vec3(0.0, 0.0, 1.0);
    NoV = dot(v_normal_inWorld, viewVector);
  }

  float whiteFurnaceResult = whiteFurnaceTest(roughness, NoV);
  float weakWhiteFurnaceResult = weakWhiteFurnaceTest(roughness, NoV);

  // rt0 = vec4(whiteFurnaceResult, weakWhiteFurnaceResult, 0.0, 1.0);
  // rt0 = vec4(whiteFurnaceResult, whiteFurnaceResult, whiteFurnaceResult, 1.0);
  rt0 = vec4(weakWhiteFurnaceResult, weakWhiteFurnaceResult, weakWhiteFurnaceResult, 1.0);
  // float nn = NoV*0.5+0.5;
  // rt0 = vec4(nn, nn, nn, 1.0);
  // rt0 = vec4(v_normal_inWorld.xyz, 1.0);
  // rt0 = vec4(1.0, 1.0, 1.0, 1.0);
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

  attributeNames: AttributeNames = ['a_position', 'a_normal'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Normal];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3];
  }
}
