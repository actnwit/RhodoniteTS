import { VertexAttributeEnum, VertexAttribute } from "../../foundation/definitions/VertexAttribute";
import GLSLShader from "./GLSLShader";
import Config from "../../foundation/core/Config";
import { ShaderNode } from "../../foundation/definitions/ShaderNode";
import { CompositionTypeEnum } from "../../foundation/main";
import { CompositionType } from "../../foundation/definitions/CompositionType";

export type AttributeNames = Array<string>;

export default class PBRShader extends GLSLShader {
  static __instance: PBRShader;
  public static readonly materialElement = ShaderNode.PBRShading;
  private constructor() {
    super();
  }

  static getInstance(): PBRShader {
    if (!this.__instance) {
      this.__instance = new PBRShader();
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
${_in} vec3 a_faceNormal;
${_in} vec3 a_tangent;
${_in} float a_instanceID;
${_in} vec2 a_texcoord;
${_in} vec4 a_joint;
${_in} vec4 a_weight;
${_in} vec3 a_baryCentricCoord;
${_out} vec3 v_color;
${_out} vec3 v_normal_inWorld;
${_out} vec3 v_faceNormal_inWorld;
${_out} vec3 v_tangent_inWorld;
${_out} vec3 v_binormal_inWorld;
${_out} vec4 v_position_inWorld;
${_out} vec2 v_texcoord;
${_out} vec3 v_baryCentricCoord;
uniform vec3 u_viewPosition;

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

  v_color = a_color;

  // Skeletal
  bool isSkinning;
  skinning(isSkinning, normalMatrix, normalMatrix);

  v_faceNormal_inWorld = normalMatrix * a_faceNormal;
  v_texcoord = a_texcoord;

  if (abs(length(a_normal)) > 0.01) {
    // if normal exist
    vec3 tangent_inWorld;
    if (!isSkinning) {
      tangent_inWorld = normalMatrix * a_tangent;
      v_position_inWorld = worldMatrix * vec4(a_position, 1.0);
    }

    v_binormal_inWorld = cross(v_normal_inWorld, tangent_inWorld);
    v_tangent_inWorld = cross(v_binormal_inWorld, v_normal_inWorld);
  }
  v_baryCentricCoord = a_baryCentricCoord;

  vec4 position_inWorld = worldMatrix * vec4(a_position, 1.0);
  float distanceFromCamera = length(position_inWorld.xyz - u_viewPosition);
  vec3 pointDistanceAttenuation = getPointDistanceAttenuation(a_instanceID);
  float distanceAttenuationFactor = sqrt(1.0/(pointDistanceAttenuation.x + pointDistanceAttenuation.y * distanceFromCamera + pointDistanceAttenuation.z * distanceFromCamera * distanceFromCamera));
  float maxPointSize = getPointSize(a_instanceID);
  gl_PointSize = clamp(distanceAttenuationFactor * maxPointSize, 0.0, maxPointSize);

//  v_color = vec3(u_boneMatrices[int(a_joint.x)][1].xyz);

  `;

  get fragmentShaderSimple() {
    const _version = this.glsl_versionText;
    const _in = this.glsl_fragment_in;
    const _def_rt0 = this.glsl_rt0;
    const _def_fragColor = this.glsl_fragColor;
    const _texture = this.glsl_texture;
    const _textureCube = this.glsl_textureCube;

    let accessSpecularIBLTexture: string;
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.webgl1ExtSTL) {
      accessSpecularIBLTexture = `vec4 specularTexel = ${_textureCube}LodEXT(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z), lod);`;
    } else {
      accessSpecularIBLTexture = `vec4 specularTexel = ${_textureCube}(u_specularEnvTexture, vec3(-reflection.x, reflection.y, reflection.z));`;
    }

    return `${_version}
${this.glsl1ShaderTextureLodExt}
${this.glsl1ShaderDerivativeExt}
precision highp float;

struct Material {
  vec4 baseColorFactor;
  vec2 metallicRoughnessFactor;
};


uniform sampler2D u_baseColorTexture;
uniform sampler2D u_normalTexture;
uniform sampler2D u_occlusionTexture;
uniform sampler2D u_emissiveTexture;
uniform sampler2D u_metallicRoughnessTexture;

uniform Material u_material;

struct Light {
  vec4 lightPosition;
  vec4 lightDirection;
  vec4 lightIntensity;
};
uniform Light u_lights[${Config.maxLightNumberInShader}];
uniform int u_lightNumber;

uniform vec3 u_viewPosition;

uniform samplerCube u_diffuseEnvTexture;
uniform samplerCube u_specularEnvTexture;
uniform vec4 u_iblParameter;

uniform vec3 u_wireframe;

${_in} vec3 v_color;
${_in} vec3 v_normal_inWorld;
${_in} vec3 v_faceNormal_inWorld;
${_in} vec3 v_tangent_inWorld;
${_in} vec3 v_binormal_inWorld;
${_in} vec4 v_position_inWorld;
${_in} vec2 v_texcoord;
${_in} vec3 v_baryCentricCoord;
${_def_rt0}

${this.pbrUniformDefinition}

${this.pbrMethodDefinition}

vec3 IBLContribution(vec3 n, float NV, vec3 reflection, vec3 albedo, vec3 F0, float userRoughness, vec3 F)
{
  float mipCount = u_iblParameter.x;
  float lod = (userRoughness * mipCount);

  vec3 brdf = ${_texture}(u_brdfLutTexture, vec2(NV, 1.0 - userRoughness)).rgb;
  vec4 diffuseTexel = ${_textureCube}(u_diffuseEnvTexture, vec3(-n.x, n.y, n.z));
  vec3 diffuseLight;
  diffuseLight = srgbToLinear(diffuseTexel.rgb);

  ${accessSpecularIBLTexture}

  vec3 specularLight;
  specularLight = srgbToLinear(specularTexel.rgb);

  vec3 kS = fresnelSchlickRoughness(F0, NV, userRoughness);
  vec3 kD = 1.0 - kS;
  vec3 diffuse = diffuseLight * albedo * kD;
  vec3 specular = specularLight * (F0 * brdf.x + brdf.y);

  float IBLDiffuseContribution = u_iblParameter.y;
  float IBLSpecularContribution = u_iblParameter.z;
  diffuse *= IBLDiffuseContribution;
  specular *= IBLSpecularContribution;
  return diffuse + specular;
}

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

void main ()
{

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  float rot = u_iblParameter.w + 3.1415;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;

  if (abs(length(v_tangent_inWorld)) > 0.01) {
    vec3 normal = ${_texture}(u_normalTexture, v_texcoord).xyz*2.0 - 1.0;
      vec3 tangent_inWorld = normalize(v_tangent_inWorld);
      vec3 binormal_inWorld = normalize(v_binormal_inWorld);
      normal_inWorld = normalize(normal_inWorld);

      mat3 tbnMat_tangent_to_world = mat3(
        tangent_inWorld.x, tangent_inWorld.y, tangent_inWorld.z,
        binormal_inWorld.x, binormal_inWorld.y, binormal_inWorld.z,
        normal_inWorld.x, normal_inWorld.y, normal_inWorld.z
      );

      normal = normalize(tbnMat_tangent_to_world * normal);
      normal_inWorld = normal;
  }



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
  vec4 textureColor = ${_texture}(u_baseColorTexture, v_texcoord);
  // if (length(textureColor) > 0.01) {
    baseColor *= srgbToLinear(textureColor.rgb);
    alpha *= textureColor.a;
  // }

  // Metallic & Roughness
  float userRoughness = u_material.metallicRoughnessFactor.y;
  float metallic = u_material.metallicRoughnessFactor.x;

  vec4 ormTexel = ${_texture}(u_metallicRoughnessTexture, v_texcoord);
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
  vec3 viewDirection = normalize(u_viewPosition - v_position_inWorld.xyz);

  // NV
  float NV = clamp(abs(dot(normal_inWorld, viewDirection)), 0.0, 1.0);

  rt0 = vec4(0.0, 0.0, 0.0, alpha);

  // Lighting
  if (length(normal_inWorld) > 0.02) {
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
      float VH = clamp(dot(viewDirection, halfVector), 0.0, 1.0);
      vec3 F = fresnel(F0, VH);

      // Diffuse
      vec3 diffuseContrib = (vec3(1.0) - F) * diffuse_brdf(albedo);

      // Specular
      float NL = clamp(dot(normal_inWorld, lightDirection), 0.0, 1.0);
      float NH = clamp(dot(normal_inWorld, halfVector), 0.0, 1.0);
      vec3 specularContrib = cook_torrance_specular_brdf(NH, NL, NV, F, alphaRoughness);
      vec3 diffuseAndSpecular = (diffuseContrib + specularContrib) * vec3(NL) * incidentLight.rgb;

      rt0.xyz += diffuseAndSpecular;
//      rt0.xyz += specularContrib * vec3(NL) * incidentLight.rgb;
  //    rt0.xyz += diffuseContrib * vec3(NL) * incidentLight.rgb;
  //    rt0.xyz += (vec3(1.0) - F) * diffuse_brdf(albedo);//diffuseContrib;//vec3(NL) * incidentLight.rgb;
    }

    vec3 reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);

    vec3 F = fresnel(F0, NV);
    vec3 ibl = IBLContribution(normal_forEnv, NV, reflection, albedo, F0, userRoughness, F);
    float occlusion = ${_texture}(u_occlusionTexture, v_texcoord).r;

    // Occlution to Indirect Lights
    rt0.xyz += ibl * occlusion;

  } else {
    rt0 = vec4(baseColor, alpha);
  }

  // Emissive
  vec3 emissive = srgbToLinear(${_texture}(u_emissiveTexture, v_texcoord).xyz);

  rt0.xyz += emissive;


  // Wireframe
  float threshold = 0.001;
  float wireframeWidthInner = u_wireframe.z;
  float wireframeWidthRelativeScale = 1.0;
  if (u_wireframe.x > 0.5 && u_wireframe.y < 0.5) {
    rt0.a = 0.0;
  }
  vec4 wireframeResult = rt0;
  vec4 wireframeColor = vec4(0.2, 0.75, 0.0, 1.0);
  float edgeRatio = edge_ratio(v_baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  float edgeRatioModified = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  wireframeResult.rgb = wireframeColor.rgb * edgeRatioModified + rt0.rgb * (1.0 - edgeRatioModified);
  wireframeResult.a = max(rt0.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

  if (u_wireframe.x > 0.5) {
    rt0 = wireframeResult;
    if (u_wireframe.y < 0.5 && rt0.a == 0.0) {
      discard;
    }
  }

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

  attributeNames: AttributeNames = ['a_position', 'a_color', 'a_normal', 'a_faceNormal', 'a_texcoord', 'a_tangent', 'a_joint', 'a_weight', 'a_baryCentricCoord', 'a_instanceID'];
  attributeSemantics: Array<VertexAttributeEnum> = [VertexAttribute.Position, VertexAttribute.Color0,
  VertexAttribute.Normal, VertexAttribute.FaceNormal, VertexAttribute.Texcoord0, VertexAttribute.Tangent, VertexAttribute.Joints0, VertexAttribute.Weights0, VertexAttribute.BaryCentricCoord, VertexAttribute.Instance];

  get attributeCompositions(): Array<CompositionTypeEnum> {
    return [CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec3, CompositionType.Vec2, CompositionType.Vec3, CompositionType.Vec4, CompositionType.Vec4, CompositionType.Vec3, CompositionType.Scalar];
  }
}