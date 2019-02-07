import { VertexAttributeEnum, VertexAttribute } from "../foundation/definitions/VertexAttribute";
import WebGLResourceRepository from "./WebGLResourceRepository";
import GLSLShader from "./GLSLShader";
import Config from "../foundation/core/Config";

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

${this.toNormalMatrix}

${this.getSkinMatrix}

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
  ${this.processSkinningIfNeed}

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
${this.glsl1ShaderTextureLodExt}
precision highp float;

struct Material {
  vec4 baseColorFactor;
  sampler2D baseColorTexture;
  vec2 metallicRoughnessFactor;
  sampler2D metallicRoughnessTexture;
};
uniform Material u_material;

struct Light {
  vec4 lightPosition;
  vec4 lightDirection;
  vec4 lightIntensity;
};
uniform Light u_lights[${Config.maxLightNumberInShader}];
uniform int u_lightNumber;

uniform vec3 viewPosition_inWorld;

${_in} vec3 v_color;
${_in} vec3 v_normal_inWorld;
${_in} vec4 v_position_inWorld;
${_in} vec3 v_lightDirection;
${_in} vec2 v_texcoord;
${_def_rt0}

${this.pbrUniformDefinition}

${this.pbrMethodDefinition}

void main ()
{

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);

  // BaseColorFactor
  vec3 baseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  if (v_color != baseColor && u_material.baseColorFactor.rgb != baseColor) {
    baseColor = v_color * u_material.baseColorFactor.rgb;
    alpha = u_material.baseColorFactor.a;
  } else if (v_color == baseColor) {
    baseColor = u_material.baseColorFactor.rgb;
    alpha = u_material.baseColorFactor.a;
  } else if (u_material.baseColorFactor.rgb == baseColor) {
    baseColor = v_color;
  } else {
    baseColor = vec3(1.0, 1.0, 1.0);
  }


  // BaseColor (take account for BaseColorTexture)
  vec4 textureColor = ${_texture}(u_material.baseColorTexture, v_texcoord);
  if (textureColor.r > 0.05) {
    baseColor *= srgbToLinear(textureColor.rgb);
    alpha *= srgbToLinear(textureColor.a);
  }

  // Metallic & Roughness
  float userRoughness = u_material.metallicRoughnessFactor.y;
  float metallic = u_material.metallicRoughnessFactor.x;

  vec4 ormTexel = texture2D(u_material.metallicRoughnessTexture, v_texcoord);
  userRoughness = ormTexel.g * userRoughness;
  metallic = ormTexel.b * metallic;

  userRoughness = clamp(userRoughness, c_MinRoughness, 1.0);
  metallic = clamp(metallic, 0.0, 1.0);
  float alphaRoughness = userRoughness * userRoughness;

  // F0
  vec3 diffuseMatAverageF0 = vec3(0.04);
  vec3 F0 = mix(diffuseMatAverageF0, baseColor.rgb, metallic);

  // Albedo
  vec3 albedo = baseColor.rgb * (vec3(1.0) - diffuseMatAverageF0);
  albedo.rgb *= (1.0 - metallic);

  // ViewDirection
  vec3 viewDirection = normalize(viewPosition_inWorld - v_position_inWorld.xyz);

  // NV
  float NV = clamp(dot(normal_inWorld, viewDirection), 0.001, 1.0);

  rt0 = vec4(0.0, 0.0, 0.0, alpha);

  // Lighting
  if (length(v_normal_inWorld) > 0.02) {
    vec3 diffuse = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < ${Config.maxLightNumberInShader}; i++) {
      if (i >= u_lightNumber) {
        break;
      }

      // Light
      vec3 lightDirection = u_lights[i].lightDirection.xyz;
      float lightType = u_lights[i].lightPosition.w;
      float spotCosCutoff = u_lights[i].lightDirection.w;
      float spotExponent = u_lights[i].lightIntensity.w;

      if (0.75 < lightType) { // is pointlight or spotlight
        lightDirection = normalize(u_lights[i].lightPosition.xyz - v_position_inWorld.xyz);
      }
      float spotEffect = 1.0;
      if (lightType > 1.75) { // is spotlight
        spotEffect = dot(u_lights[i].lightDirection.xyz, lightDirection);
        if (spotEffect > spotCosCutoff) {
          spotEffect = pow(spotEffect, spotExponent);
        } else {
          spotEffect = 0.0;
        }
      }
      //diffuse += 1.0 * max(0.0, dot(normal_inWorld, lightDirection)) * spotEffect * u_lights[i].lightIntensity.xyz;

      // IncidentLight
      vec3 incidentLight = spotEffect * u_lights[i].lightIntensity.xyz;
      incidentLight *= M_PI;

      // Fresnel
      vec3 halfVector = normalize(lightDirection + viewDirection);
      float LH = clamp(dot(lightDirection, halfVector), 0.0, 1.0);
      vec3 F = fresnel(F0, LH);

      // Diffuse
      vec3 diffuseContrib = (vec3(1.0) - F) * diffuse_brdf(albedo);

      // Specular
      float NL = clamp(dot(normal_inWorld, lightDirection), 0.001, 1.0);
      float NH = clamp(dot(normal_inWorld, halfVector), 0.0, 1.0);
      float VH = clamp(dot(viewDirection, halfVector), 0.0, 1.0);
      vec3 specularContrib = cook_torrance_specular_brdf(NH, NL, NV, F, alphaRoughness);
      vec3 diffuseAndSpecular = (diffuseContrib + specularContrib) * vec3(NL) * incidentLight.rgb;

      rt0.xyz += diffuseAndSpecular;
    }

  }

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
