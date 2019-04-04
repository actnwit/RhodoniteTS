import { VertexAttributeEnum, VertexAttribute, VertexAttributeClass } from "../../foundation/definitions/VertexAttribute";
import WebGLResourceRepository from "../WebGLResourceRepository";
import { ShaderAttributeOrSemanticsOrString } from "../../foundation/materials/AbstractMaterialNode";
import { ShaderSemantics, ShaderSemanticsClass } from "../../foundation/definitions/ShaderSemantics";
import { ComponentTypeEnum, CompositionTypeEnum } from "../../foundation/main";

export type AttributeNames = Array<string>;

export default abstract class GLSLShader {
  static __instance: GLSLShader;
  __webglResourceRepository?: WebGLResourceRepository = WebGLResourceRepository.getInstance();
  constructor() {}

  get glsl_rt0() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'layout(location = 0) out vec4 rt0;\n';
    } else {
      return 'vec4 rt0;\n';
    }
  }

  get glsl_fragColor() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper != null && repo.currentWebGLContextWrapper!.isWebGL2) {
      return '';
    } else {
      return 'gl_FragColor = rt0;\n';
    }
  }

  get glsl_vertex_in() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'in';
    } else {
      return 'attribute';
    }
  }

  get glsl_fragment_in() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'in';
    } else {
      return 'varying';
    }
  }

  get glsl_vertex_out() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'out';
    } else {
      return 'varying';
    }
  }

  get glsl_texture() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.isWebGL2) {
      return 'texture';
    } else {
      return 'texture2D';
    }
  }

  get glsl_versionText() {
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper != null && repo.currentWebGLContextWrapper!.isWebGL2) {
      return '#version 300 es\n'
    } else {
      return '';
    }
  }

  get glslBegin() {
    const _version = this.glsl_versionText;
    return `${_version}
    precision highp float;
    `
  }

  get glslMainBegin() {
    return `
    void main() {
    `
  }

  get glslMainEnd() {
    return `
    }
    `
  }

  get glsl1ShaderTextureLodExt() {
    const ext = WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.webgl1ExtSTL;
    return (ext != null) ? '#extension GL_EXT_shader_texture_lod : require' : '';
  }

  get glsl1ShaderDerivativeExt() {
    const ext = WebGLResourceRepository.getInstance().currentWebGLContextWrapper!.webgl1ExtDRV;
    return (ext != null) ? '#extension GL_OES_standard_derivatives : require' : '';
  }

  get toNormalMatrix() {
    return `
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
  }

  get getSkinMatrix() {
    return `

    mat4 getSkinMatrix() {
      mat4 skinMat = a_weight.x * u_boneMatrices[int(a_joint.x)];
      skinMat += a_weight.y * u_boneMatrices[int(a_joint.y)];
      skinMat += a_weight.z * u_boneMatrices[int(a_joint.z)];
      skinMat += a_weight.w * u_boneMatrices[int(a_joint.w)];

      return skinMat;
    }
    `;
  }

  get processSkinning() {

    return `
    bool skinning(
      out bool isSkinning,
      in mat3 inNormalMatrix,
      out mat3 outNormalMatrix
      )
    {
      mat4 worldMatrix = getMatrix(a_instanceID);
      mat4 viewMatrix = getViewMatrix(a_instanceID);
      mat4 projectionMatrix = getProjectionMatrix(a_instanceID);

      // Skeletal
      isSkinning = false;
      if (u_skinningMode == 1) {
        mat4 skinMat = getSkinMatrix();
        v_position_inWorld = skinMat * vec4(a_position, 1.0);
        outNormalMatrix = toNormalMatrix(skinMat);
        v_normal_inWorld = normalize(outNormalMatrix * a_normal);
        gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
        isSkinning = true;
      } else {
        v_position_inWorld = worldMatrix * vec4(a_position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
        outNormalMatrix = inNormalMatrix;
        v_normal_inWorld = normalize(inNormalMatrix * a_normal);
      }

      return isSkinning;
    }
`;
  }

  get pbrUniformDefinition() {
    let shaderText = '';
    shaderText += 'uniform vec2 uMetallicRoughnessFactors;\n';
    shaderText += 'uniform vec3 uBaseColorFactor;\n';
    shaderText += 'uniform vec2 uOcclusionFactors;'
    shaderText += 'uniform vec3 uEmissiveFactor;'
    shaderText += 'uniform sampler2D uMetallicRoughnessTexture;\n';

    const occlusionTexture = true;//material.getTextureFromPurpose(GLBoost.TEXTURE_PURPOSE_OCCLUSION);
    if (occlusionTexture) {
      shaderText += 'uniform sampler2D uOcclusionTexture;\n';
    }

    const emissiveTexture = true;//material.getTextureFromPurpose(GLBoost.TEXTURE_PURPOSE_EMISSIVE);
    if (emissiveTexture) {
      shaderText += 'uniform sampler2D uEmissiveTexture;\n';
    }

    const diffuseEnvCubeTexture = true;//material.getTextureFromPurpose(GLBoost.TEXTURE_PURPOSE_IBL_DIFFUSE_ENV_CUBE);
    if (diffuseEnvCubeTexture) {
      shaderText += 'uniform sampler2D u_brdfLutTexture;\n';
      shaderText += 'uniform samplerCube uDiffuseEnvTexture;\n';
      shaderText += 'uniform samplerCube uSpecularEnvTexture;\n';
      shaderText += 'uniform vec3 uIBLParameters;\n'; // Ka * amount of ambient lights
    }

    shaderText += 'uniform vec4 ambient;\n'; // Ka * amount of ambient lights

    return shaderText;
  }

  get pbrMethodDefinition() {
    let accessSpecularIBLTexture: string;
    const repo = this.__webglResourceRepository!;
    if (repo.currentWebGLContextWrapper!.webgl1ExtSTL) {
      accessSpecularIBLTexture = `vec3 specularLight = srgbToLinear(textureCubeLodEXT(u_specularEnvTexture, reflection, lod).rgb);`;
    } else {
      accessSpecularIBLTexture = `vec3 specularLight = srgbToLinear(textureCube(u_specularEnvTexture, reflection).rgb);`;
    }

    return `
    const float M_PI = 3.141592653589793;
    const float c_MinRoughness = 0.04;

    float angular_n_h(float NH) {
      return acos(NH);
    }

    float sqr(float x) {
      return x*x;
    }

    float d_phong(float NH, float c1) {
      return pow(
        cos(acos(NH))
        , c1
      );
    }

    // GGX NDF
    float d_ggx(float NH, float alphaRoughness) {
      float roughnessSqr = alphaRoughness * alphaRoughness;
      float f = (roughnessSqr - 1.0) * NH * NH + 1.0;
      return roughnessSqr / (M_PI * f * f);
    }

    float d_torrance_reiz(float NH, float c3) {
      float CosSquared = NH*NH;
      float TanSquared = (1.0 - CosSquared)/CosSquared;
      //return (1.0/M_PI) * sqr(c3/(CosSquared * (c3*c3 + TanSquared)));  // gamma = 2, aka GGX
      return (1.0/sqrt(M_PI)) * (sqr(c3)/(CosSquared * (c3*c3 + TanSquared))); // gamma = 1, D_Berry
    }

    float d_beckmann(float NH, float m) {
      float co = 1.0 / (4.0 * m * m * NH * NH * NH * NH);
      float expx = exp((NH * NH - 1.0) / (m * m * NH * NH));
      return co * expx;
    }

    // the same as glTF WebGL sample
    // https://github.com/KhronosGroup/glTF-WebGL-PBR/blob/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1/shaders/pbr-frag.glsl#L188
    // That is, Unreal Engine based approach, but modified to use alphaRoughness (squared artist's roughness parameter),
    // and based on 'Separable Masking and Shadowing' approximation (propesed by Christophe Schlick)
    // https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf
    float g_shielding(float NL, float NV, float alphaRoughness) {
      float r = alphaRoughness;

      // Local Shadowing using "Schlick-Smith" Masking Function
      float localShadowing = 2.0 * NL / (NL + sqrt(r * r + (1.0 - r * r) * (NL * NL)));

      // Local Masking using "Schlick-Smith" Masking Function
      float localMasking = 2.0 * NV / (NV + sqrt(r * r + (1.0 - r * r) * (NV * NV)));

      return localShadowing * localMasking;
    }

    // The Schlick Approximation to Fresnel
    vec3 fresnel(vec3 f0, float LH) {
      return vec3(f0) + (vec3(1.0) - f0) * pow(1.0 - LH, 5.0);
    }

    vec3 cook_torrance_specular_brdf(float NH, float NL, float NV, vec3 F, float alphaRoughness) {
      float D = d_ggx(NH, alphaRoughness);
      float G = g_shielding(NL, NV, alphaRoughness);
      return vec3(D)*vec3(G)*F/vec3(4.0*NL*NV);
    }

    vec3 diffuse_brdf(vec3 albedo)
    {
      return albedo / M_PI;
    }

    vec3 srgbToLinear(vec3 srgbColor) {
      return pow(srgbColor, vec3(2.2));
    }

    float srgbToLinear(float value) {
      return pow(value, 2.2);
    }

    vec3 linearToSrgb(vec3 linearColor) {
      return pow(linearColor, vec3(1.0/2.2));
    }

    float linearToSrgb(float value) {
      return pow(value, 1.0/2.2);
    }

    vec3 IBLContribution(vec3 n, float NV, vec3 reflection, vec3 albedo, vec3 F0, float userRoughness)
    {
      float mipCount = u_iblParameter.x;
      float lod = (userRoughness * mipCount);

      vec3 brdf = srgbToLinear(texture2D(u_brdfLutTexture, vec2(NV, 1.0 - userRoughness)).rgb);
      vec3 diffuseLight = srgbToLinear(textureCube(u_diffuseEnvTexture, n).rgb);
      ${accessSpecularIBLTexture}

      vec3 diffuse = diffuseLight * albedo;
      vec3 specular = specularLight * (F0 * brdf.x + brdf.y);

      float IBLDiffuseContribution = u_iblParameter.y;
      float IBLSpecularContribution = u_iblParameter.z;
      diffuse *= IBLDiffuseContribution;
      specular *= IBLSpecularContribution;
      return diffuse + specular;
    }
    `;
  }

  static getStringFromShaderAnyDataType(data: ShaderAttributeOrSemanticsOrString): string {
    if (data instanceof ShaderSemanticsClass) {
      return 'u_' + data.singularStr;
    } else if (data instanceof VertexAttributeClass) {
      return data.shaderStr;
    } else {
      return data as string;
    }
  }
  abstract get vertexShaderDefinitions(): string;
  abstract get pixelShaderDefinitions(): string;
  abstract get vertexShaderBody(): string;
  abstract get pixelShaderBody(): string;
  abstract get attributeNames(): AttributeNames;
  abstract get attributeSemantics(): Array<VertexAttributeEnum>;
  abstract get attributeCompositions(): Array<CompositionTypeEnum>;
}
