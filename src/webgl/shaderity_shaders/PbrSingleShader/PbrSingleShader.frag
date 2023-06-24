#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in vec2 v_texcoord_0;
in vec2 v_texcoord_1;
in vec2 v_texcoord_2;
in vec3 v_baryCentricCoord;
in float v_instanceInfo;

#ifdef RN_USE_TANGENT_ATTRIBUTE
  in vec3 v_tangent_inWorld;
  in vec3 v_binormal_inWorld;
#endif

#ifdef RN_USE_SHADOW_MAPPING
in vec4 v_shadowCoord;
#endif

uniform vec4 u_baseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_baseColorTexture; // initialValue=(0,white)
uniform vec2 u_metallicRoughnessFactor; // initialValue=(1,1)
uniform sampler2D u_metallicRoughnessTexture; // initialValue=(1,white)
uniform sampler2D u_occlusionTexture; // initialValue=(3,white)
uniform vec3 u_emissiveFactor; // initialValue=(0,0,0)
uniform sampler2D u_emissiveTexture; // initialValue=(4,white)
uniform vec3 u_wireframe; // initialValue=(0,0,1)
uniform bool u_isOutputHDR; // initialValue=0
uniform bool u_makeOutputSrgb; // initialValue=1
uniform vec4 u_iblParameter; // initialValue=(1,1,1,1), isCustomSetting=true
uniform ivec2 u_hdriFormat; // initialValue=(0,0), isCustomSetting=true
uniform samplerCube u_diffuseEnvTexture; // initialValue=(5,white), isCustomSetting=true
uniform samplerCube u_specularEnvTexture; // initialValue=(6,white), isCustomSetting=true
uniform vec4 u_baseColorTextureTransform; // initialValue=(1,1,0,0)
uniform float u_baseColorTextureRotation; // initialValue=0
uniform vec4 u_metallicRoughnessTextureTransform; // initialValue=(1,1,0,0)
uniform float u_metallicRoughnessTextureRotation; // initialValue=0
uniform int u_baseColorTexcoordIndex; // initialValue=0
uniform int u_metallicRoughnessTexcoordIndex; // initialValue=0
uniform int u_occlusionTexcoordIndex; // initialValue=0
uniform vec4 u_occlusionTextureTransform; // initialValue=(1,1,0,0)
uniform float u_occlusionTextureRotation; // initialValue=0
uniform int u_emissiveTexcoordIndex; // initialValue=0
uniform vec4 u_emissiveTextureTransform; // initialValue=(1,1,0,0)
uniform float u_emissiveTextureRotation; // initialValue=0
uniform float u_occlusionStrength; // initialValue=1
uniform bool u_inverseEnvironment; // initialValue=true
uniform float u_ior; // initialValue=1.5

#ifdef RN_USE_NORMAL_TEXTURE
  uniform sampler2D u_normalTexture; // initialValue=(2,black)
  uniform vec4 u_normalTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_normalTextureRotation; // initialValue=(0)
  uniform int u_normalTexcoordIndex; // initialValue=(0)
  uniform float u_normalScale; // initialValue=(1)
#endif

#ifdef RN_USE_CLEARCOAT
  uniform float u_clearCoatFactor; // initialValue=0
  uniform float u_clearCoatRoughnessFactor; // initialValue=0
  uniform vec4 u_clearCoatTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_clearCoatTextureRotation; // initialValue=0
  uniform vec4 u_clearCoatRoughnessTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_clearCoatRoughnessTextureRotation; // initialValue=0
  uniform vec4 u_clearCoatNormalTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_clearCoatNormalTextureRotation; // initialValue=0
  uniform int u_clearCoatTexcoordIndex; // initialValue=(0)
  uniform int u_clearCoatRoughnessTexcoordIndex; // initialValue=(0)
  uniform int u_clearCoatNormalTexcoordIndex; // initialValue=(0)
#endif

#ifdef RN_USE_TRANSMISSION
  uniform float u_transmissionFactor; // initialValue=(0)
#endif

#ifdef RN_USE_VOLUME
  uniform float u_thicknessFactor; // initialValue=(0)
  uniform float u_attenuationDistance; // initialValue=(0.000001)
  uniform vec3 u_attenuationColor; // initialValue=(1,1,1)
#endif

#ifdef RN_USE_SHEEN
  uniform vec3 u_sheenColorFactor; // initialValue=(0,0,0)
  uniform float u_sheenRoughnessFactor; // initialValue=(0)
#endif

#ifdef RN_USE_SPECULAR
  uniform float u_specularFactor; // initialValue=1.0
  uniform vec3 u_specularColorFactor; // initialValue=(1,1,1)
#endif

#ifdef RN_USE_IRIDESCENCE
  uniform float u_iridescenceFactor; // initialValue=0
  uniform float u_iridescenceIor; // initialValue=1.3
  uniform float u_iridescenceThicknessMinimum; // initialValue=100
  uniform float u_iridescenceThicknessMaximum; // initialValue=400
#endif

uniform float u_alphaCutoff; // initialValue=(0.01)

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/pbrDefinition.glsl)
#ifdef RN_USE_SHEEN
  #pragma shaderity: require(../common/pbrSheen.glsl)
#endif
#ifdef RN_USE_IRIDESCENCE
  #pragma shaderity: require(../common/pbrIridescence.glsl)
#endif

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/shadow.glsl)

#pragma shaderity: require(../common/opticalDefinition.glsl)

vec3 get_irradiance(vec3 normal_forEnv, float materialSID, ivec2 hdriFormat) {
  vec4 diffuseTexel = texture(u_diffuseEnvTexture, normal_forEnv);

  vec3 irradiance;
  if (hdriFormat.x == 0) {
    // LDR_SRGB
    irradiance = srgbToLinear(diffuseTexel.rgb);
  }
  else if (hdriFormat.x == 3) {
    // RGBE
    irradiance = diffuseTexel.rgb * pow(2.0, diffuseTexel.a*255.0-128.0);
  }
  else {
    irradiance = diffuseTexel.rgb;
  }

  return irradiance;
}

float scaleForLod(float perceptualRoughness, float ior)
{
  // Scale roughness to the range [0, 1],
  // ior=1.0 will be scale 0,
  // ior=1.5 will be scale 1.0,
  // ior=2 will be scale 1.0 (clamped)
  //

  float scale = clamp(ior * 2.0 - 2.0, 0.0, 1.0);
  return perceptualRoughness * scale;
}

#ifdef RN_USE_TRANSMISSION
vec3 get_sample_from_backbuffer(float materialSID, vec2 sampleCoord, float perceptualRoughness, float ior) {
  ivec2 vrState = get_vrState(0.0, 0);
  vec2 backBufferTextureSize = get_backBufferTextureSize(materialSID, 0);
  float backBufferTextureLength = max(backBufferTextureSize.x, backBufferTextureSize.y);
  if (vrState.x == 1) { // For VR
    backBufferTextureLength = max(backBufferTextureSize.x / 2.0, backBufferTextureSize.y);
    sampleCoord.x = sampleCoord.x * 0.5;
    if (vrState.y == 1) { // For right eye
      sampleCoord.x += 0.5;
    }
  }
  float framebufferLod = log2(backBufferTextureLength) * scaleForLod(perceptualRoughness, ior);

  #ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
    vec3 transmittedLight = texture2DLodEXT(u_backBufferTexture, sampleCoord, framebufferLod).rgb;
  #elif defined(GLSL_ES3)
    vec3 transmittedLight = textureLod(u_backBufferTexture, sampleCoord, framebufferLod).rgb;
  #else
    vec3 transmittedLight = texture(u_backBufferTexture, sampleCoord).rgb;
  #endif

  return transmittedLight;
}
#endif

vec3 get_radiance(vec3 reflection, float lod, ivec2 hdriFormat) {
  #ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
    vec4 specularTexel = textureCubeLodEXT(u_specularEnvTexture, reflection, lod);
  #elif defined(GLSL_ES3)
    vec4 specularTexel = textureLod(u_specularEnvTexture, reflection, lod);
  #else
    vec4 specularTexel = texture(u_specularEnvTexture, reflection);
  #endif

// #pragma shaderity: require(./../common/fetchCubeTexture.glsl)

  vec3 radiance;
  if (hdriFormat.y == 0) {
    // LDR_SRGB
    radiance = srgbToLinear(specularTexel.rgb);
  }
  else if (hdriFormat.y == 3) {
    // RGBE
    radiance = specularTexel.rgb * pow(2.0, specularTexel.a*255.0-128.0);
  }
  else {
    radiance = specularTexel.rgb;
  }

  return radiance;
}

// from glTF Sample Viewer: https://github.com/KhronosGroup/glTF-Sample-Viewer
vec3 getVolumeTransmissionRay(vec3 n, vec3 v, float thickness, float ior)
{
  vec3 refractionVector = refract(-v, normalize(n), 1.0 / ior);
  mat4 worldMatrix = get_worldMatrix(v_instanceInfo);

  vec3 modelScale;
  modelScale.x = length(vec3(worldMatrix[0].xyz));
  modelScale.y = length(vec3(worldMatrix[1].xyz));
  modelScale.z = length(vec3(worldMatrix[2].xyz));

  return normalize(refractionVector) * thickness * modelScale;
}

struct IblResult
{
  vec3 specular;
  vec3 diffuse;
  vec3 FssEss;
};

IblResult getIBLRadianceGGX(float materialSID, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix,
  vec3 normal_forEnv, vec3 reflection)
{
  // get radiance
  float mipCount = iblParameter.x;
  float lod = (perceptualRoughness * (mipCount - 1.0));
  vec3 radiance = get_radiance(reflection, lod, hdriFormat);

  // Roughness dependent fresnel
  vec3 kS = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  vec2 f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  vec3 FssEss = kS * f_ab.x + f_ab.y;
  IblResult result;
  result.FssEss = FssEss;

  // Specular IBL
  vec3 specular = FssEss * radiance;

  // scale with user parameters
  float IBLSpecularContribution = iblParameter.z;
  specular *= IBLSpecularContribution;

  result.specular = specular;

  return result;
}

IblResult getIBLRadianceGGXWithIridescence(float materialSID, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix,
  vec3 normal_forEnv, vec3 reflection, vec3 iridescenceFresnel, float iridescence)
{
  // get radiance
  float mipCount = iblParameter.x;
  float lod = (perceptualRoughness * (mipCount - 1.0));
  vec3 radiance = get_radiance(reflection, lod, hdriFormat);

  // Roughness dependent fresnel
  vec3 kS = fresnelSchlickRoughnessWithIridescence(F0, NdotV, perceptualRoughness, iridescenceFresnel, iridescence);
  vec2 f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  vec3 FssEss = kS * f_ab.x + f_ab.y;
  IblResult result;
  result.FssEss = FssEss;

  // Specular IBL
  vec3 specular = FssEss * radiance;

  // scale with user parameters
  float IBLSpecularContribution = iblParameter.z;
  specular *= IBLSpecularContribution;

  result.specular = specular;

  return result;
}

IblResult getIBLRadianceLambertian(float materialSID, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix,
  vec3 normal_forEnv, vec3 reflection)
{
  // get irradiance
  vec3 irradiance = get_irradiance(normal_forEnv, materialSID, hdriFormat);

  // Roughness dependent fresnel
  vec3 kS = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  vec2 f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  vec3 FssEss = kS * f_ab.x + f_ab.y;
  IblResult result;
  result.FssEss = FssEss;

  // Multiple scattering, Fdez-Aguera's approach
  float Ems = (1.0 - (f_ab.x + f_ab.y));
  vec3 F_avg = F0 + (1.0 - F0) / 21.0;
  vec3 FmsEms = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);
  vec3 k_D = albedo * (1.0 - FssEss - FmsEms);

  // Diffuse IBL
  vec3 diffuse = (FmsEms + k_D) * irradiance;

  // scale with user parameters
  float IBLDiffuseContribution = iblParameter.y;
  diffuse *= IBLDiffuseContribution;

  result.diffuse = diffuse;

  return result;
}

IblResult getIBLRadianceLambertianWithIridescence(float materialSID, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix,
  vec3 normal_forEnv, vec3 reflection, vec3 iridescenceF0, float iridescence)
{
  // get irradiance
  vec3 irradiance = get_irradiance(normal_forEnv, materialSID, hdriFormat);

  // Use the maximum component of the iridescence Fresnel color
  // Maximum is used instead of the RGB value to not get inverse colors for the diffuse BRDF
  vec3 iridescenceF0Max = vec3(max(max(iridescenceF0.r, iridescenceF0.g), iridescenceF0.b));

  // Blend between base F0 and iridescence F0
  vec3 mixedF0 = mix(F0, iridescenceF0Max, iridescence);

  // Roughness dependent fresnel
  vec3 kS = fresnelSchlickRoughness(mixedF0, NdotV, perceptualRoughness);
  vec2 f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  vec3 FssEss = kS * f_ab.x + f_ab.y;
  IblResult result;
  result.FssEss = FssEss;

  // Multiple scattering, Fdez-Aguera's approach
  float Ems = (1.0 - (f_ab.x + f_ab.y));
  vec3 F_avg = mixedF0 + (1.0 - mixedF0) / 21.0;
  vec3 FmsEms = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);
  vec3 k_D = albedo * (1.0 - FssEss - FmsEms);

  // Diffuse IBL
  vec3 diffuse = (FmsEms + k_D) * irradiance;

  // scale with user parameters
  float IBLDiffuseContribution = iblParameter.y;
  diffuse *= IBLDiffuseContribution;

  result.diffuse = diffuse;

  return result;
}

#ifdef RN_USE_SHEEN
vec3 sheenIBL(float NdotV, float sheenPerceptualRoughness, vec3 sheenColor, vec4 iblParameter, vec3 reflection, ivec2 hdriFormat)
{
  float mipCount = iblParameter.x;
  float lod = (sheenPerceptualRoughness * (mipCount - 1.0));

  vec2 sheenLutUV = vec2(NdotV, sheenPerceptualRoughness);
  float brdf = texture(u_sheenLutTexture, sheenLutUV).b;
  vec3 sheenLight = get_radiance(reflection, lod, hdriFormat);
  float IBLSpecularContribution = iblParameter.z;
  sheenLight *= IBLSpecularContribution;

  return sheenLight * sheenColor * brdf;
}
#endif

vec3 getNormalForEnv(mat3 rotEnvMatrix, vec3 normal_inWorld, float materialSID) {
  vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;
  if (get_inverseEnvironment(materialSID, 0)) {
    normal_forEnv.x *= -1.0;
  }
  return normal_forEnv;
}

vec3 getReflection(mat3 rotEnvMatrix, vec3 viewDirection, vec3 normal_inWorld, float materialSID) {
  vec3 reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);
  if (get_inverseEnvironment(materialSID, 0)) {
    reflection.x *= -1.0;
  }
  return reflection;
}

vec3 IBLContribution(float materialSID, vec3 normal_inWorld, float NdotV, vec3 viewDirection,
  vec3 albedo, vec3 F0, float perceptualRoughness, float clearcoatRoughness, vec3 clearcoatNormal_inWorld,
  float clearcoat, float VdotNc, vec3 geomNormal_inWorld, float cameraSID, float transmission, vec3 v_position_inWorld,
  float thickness, vec3 sheenColor, float sheenRoughness, float albedoSheenScalingNdotV, float ior,
  vec3 iridescenceFresnel, vec3 iridescenceF0, float iridescence)
{
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float rot = iblParameter.w + 3.1415;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  ivec2 hdriFormat = get_hdriFormat(materialSID, 0);

  vec3 normal_forEnv = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  vec3 reflection = getReflection(rotEnvMatrix, viewDirection, normal_inWorld, materialSID);

  // IBL
  #ifdef RN_USE_IRIDESCENCE
    IblResult baseRadianceResult = getIBLRadianceGGXWithIridescence(materialSID, NdotV, viewDirection, albedo, F0,
      perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection, iridescenceFresnel, iridescence);
    IblResult baseLambertianResult = getIBLRadianceLambertianWithIridescence(materialSID, NdotV, viewDirection, albedo, F0,
      perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection, iridescenceF0, iridescence);
  #else
    IblResult baseRadianceResult = getIBLRadianceGGX(materialSID, NdotV, viewDirection, albedo, F0,
      perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection);
    IblResult baseLambertianResult = getIBLRadianceLambertian(materialSID, NdotV, viewDirection, albedo, F0,
      perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection);
  #endif

#ifdef RN_USE_TRANSMISSION
  vec3 refractedRay = getVolumeTransmissionRay(geomNormal_inWorld, viewDirection, thickness, ior);
  vec3 refractedRayFromVPosition = v_position_inWorld + refractedRay;
  vec4 ndcPoint = get_projectionMatrix(cameraSID, 0) * get_viewMatrix(cameraSID, 0) * vec4(refractedRayFromVPosition, 1.0);
  vec2 refractionCoords = ndcPoint.xy / ndcPoint.w;
  refractionCoords += 1.0;
  refractionCoords /= 2.0;
  vec3 transmittedLight = get_sample_from_backbuffer(materialSID, refractionCoords, perceptualRoughness, ior);

#ifdef RN_USE_VOLUME
  vec3 attenuationColor = get_attenuationColor(materialSID, 0);
  float attenuationDistance = get_attenuationDistance(materialSID, 0);
  transmittedLight = volumeAttenuation(attenuationColor, attenuationDistance, transmittedLight, length(refractedRay));
#endif

  vec3 transmissionComp = (vec3(1.0) - baseRadianceResult.FssEss) * transmittedLight * albedo;
  vec3 diffuse = mix(baseLambertianResult.diffuse, transmissionComp, transmission);
  vec3 base = diffuse + baseRadianceResult.specular;
#else
  vec3 base = baseLambertianResult.diffuse + baseRadianceResult.specular;
#endif

#ifdef RN_USE_SHEEN
  vec3 sheen = sheenIBL(NdotV, sheenRoughness, sheenColor, iblParameter, reflection, hdriFormat);
  vec3 color = sheen + base * albedoSheenScalingNdotV;
#else
  vec3 color = base;
#endif

#ifdef RN_USE_CLEARCOAT
  float VdotNg = dot(geomNormal_inWorld, viewDirection);
  vec3 clearcoatNormal_forEnv = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  vec3 clearcoatReflection = getReflection(rotEnvMatrix, viewDirection, normal_inWorld, materialSID);
  IblResult coatResult = getIBLRadianceGGX(materialSID, VdotNc, viewDirection, vec3(0.0), F0,
    clearcoatRoughness, iblParameter, hdriFormat, rotEnvMatrix, clearcoatNormal_forEnv, clearcoatReflection);
  vec3 coatLayer = coatResult.specular;

  float clearcoatFresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - abs(VdotNc), 5.0);
  vec3 coated = color * vec3(1.0 - clearcoat * clearcoatFresnel) + vec3(coatLayer * clearcoat);
  return coated;
#else
  return color;
#endif

}

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

vec2 getTexcoord(int texcoordIndex) {
  vec2 texcoord;
  if(texcoordIndex == 2){
    texcoord = v_texcoord_2;
  } else if(texcoordIndex == 1){
    texcoord = v_texcoord_1;
  }else{
    texcoord = v_texcoord_0;
  }
  return texcoord;
}

#pragma shaderity: require(../common/perturbedNormal.glsl)

void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  // View vector
  vec3 viewPosition = get_viewPosition(cameraSID, 0);
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  vec3 geomNormal_inWorld = normal_inWorld;
  vec4 normalTextureTransform = get_normalTextureTransform(materialSID, 0);
  float normalTextureRotation = get_normalTextureRotation(materialSID, 0);
  int normalTexcoordIndex = get_normalTexcoordIndex(materialSID, 0);
  vec2 normalTexcoord = getTexcoord(normalTexcoordIndex);
  vec2 normalTexUv = uvTransform(normalTextureTransform.xy, normalTextureTransform.zw, normalTextureRotation, normalTexcoord);
  #ifdef RN_USE_NORMAL_TEXTURE
    vec3 normalTexValue = texture(u_normalTexture, normalTexUv).xyz;
    if(normalTexValue.b >= 128.0 / 255.0) {
      // normal texture is existence
      vec3 normalTex = normalTexValue * 2.0 - 1.0;
      float normalScale = get_normalScale(materialSID, 0);
      vec3 scaledNormal = normalize(normalTex * vec3(normalScale, normalScale, 1.0));
      normal_inWorld = perturb_normal(normal_inWorld, viewVector, normalTexUv, scaledNormal);
    }
  #endif

  // BaseColorFactor
  vec3 baseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  vec4 baseColorFactor = get_baseColorFactor(materialSID, 0);
  if (v_color != baseColor && baseColorFactor.rgb != baseColor) {
    baseColor = v_color * baseColorFactor.rgb;
    alpha = baseColorFactor.a;
  } else if (v_color == baseColor) {
    baseColor = baseColorFactor.rgb;
    alpha = baseColorFactor.a;
  } else if (baseColorFactor.rgb == baseColor) {
    baseColor = v_color;
  } else {
    baseColor = vec3(1.0, 1.0, 1.0);
  }

  // BaseColor (take account for BaseColorTexture)
  vec4 baseColorTextureTransform = get_baseColorTextureTransform(materialSID, 0);
  float baseColorTextureRotation = get_baseColorTextureRotation(materialSID, 0);
  int baseColorTexcoordIndex = get_baseColorTexcoordIndex(materialSID, 0);
  vec2 baseColorTexcoord = getTexcoord(baseColorTexcoordIndex);
  vec2 baseColorTexUv = uvTransform(baseColorTextureTransform.xy, baseColorTextureTransform.zw, baseColorTextureRotation, baseColorTexcoord);
  vec4 textureColor = texture(u_baseColorTexture, baseColorTexUv);
  baseColor *= srgbToLinear(textureColor.rgb);
  alpha *= textureColor.a;

#pragma shaderity: require(../common/alphaMask.glsl)

  // NdotV
  vec3 viewDirection = normalize(viewVector);
  float NdotV = saturateEpsilonToOne(dot(normal_inWorld, viewDirection));

  // Clearcoat
#ifdef RN_USE_CLEARCOAT
  float clearcoatFactor = get_clearCoatFactor(materialSID, 0);
  vec4 clearcoatTextureTransform = get_clearCoatTextureTransform(materialSID, 0);
  float clearcoatTextureRotation = get_clearCoatTextureRotation(materialSID, 0);
  int clearCoatTexcoordIndex = get_clearCoatTexcoordIndex(materialSID, 0);
  vec2 clearCoatTexcoord = getTexcoord(clearCoatTexcoordIndex);
  vec2 clearcoatTexUv = uvTransform(clearcoatTextureTransform.xy, clearcoatTextureTransform.zw, clearcoatTextureRotation, clearCoatTexcoord);
  float clearcoatTexture = texture(u_clearCoatTexture, clearcoatTexUv).r;
  float clearcoat = clearcoatFactor * clearcoatTexture;
#else
  float clearcoat = 0.0;
#endif // RN_USE_CLEARCOAT

  // Transmission
#ifdef RN_USE_TRANSMISSION
  float transmissionFactor = get_transmissionFactor(materialSID, 0);
  float transmissionTexture = texture(u_transmissionTexture, baseColorTexUv).r;
  float transmission = transmissionFactor * transmissionTexture;
  // alpha *= transmission;
#else
  float transmission = 0.0;
#endif // RN_USE_TRANSMISSION

#ifdef RN_IS_LIGHTING
  // Metallic & Roughness
  vec2 metallicRoughnessFactor = get_metallicRoughnessFactor(materialSID, 0);
  float perceptualRoughness = metallicRoughnessFactor.y;
  float metallic = metallicRoughnessFactor.x;

  vec4 metallicRoughnessTextureTransform = get_metallicRoughnessTextureTransform(materialSID, 0);
  float metallicRoughnessTextureRotation = get_metallicRoughnessTextureRotation(materialSID, 0);
  int metallicRoughnessTexcoordIndex = get_metallicRoughnessTexcoordIndex(materialSID, 0);
  vec2 metallicRoughnessTexcoord = getTexcoord(metallicRoughnessTexcoordIndex);
  vec2 metallicRoughnessTexUv = uvTransform(metallicRoughnessTextureTransform.xy, metallicRoughnessTextureTransform.zw, metallicRoughnessTextureRotation, metallicRoughnessTexcoord);
  vec4 ormTexel = texture(u_metallicRoughnessTexture, metallicRoughnessTexUv);
  perceptualRoughness = ormTexel.g * perceptualRoughness;
  metallic = ormTexel.b * metallic;

  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
  metallic = clamp(metallic, 0.0, 1.0);
  float alphaRoughness = perceptualRoughness * perceptualRoughness;

#ifdef RN_USE_SPECULAR
  float specularTexture = texture(u_specularTexture, baseColorTexUv).a;
  float specular = get_specularFactor(materialSID, 0) * specularTexture;
  vec3 specularColorTexture = srgbToLinear(texture(u_specularTexture, baseColorTexUv).rgb);
  vec3 specularColor = get_specularColorFactor(materialSID, 0) * specularColorTexture;
#else
  float specular = 1.0;
  vec3 specularColor = vec3(1.0, 1.0, 1.0);
#endif // RN_USE_SPECULAR

  // F0, F90
  float ior = get_ior(materialSID, 0);
  float outsideIor = 1.0;
  vec3 dielectricSpecularF0 = min(
    ((ior - outsideIor) / (ior + outsideIor)) * ((ior - outsideIor) / (ior + outsideIor)) * specularColor,
    vec3(1.0)
    ) * specular;
  vec3 dielectricSpecularF90 = vec3(specular);
  vec3 F0 = mix(dielectricSpecularF0, baseColor.rgb, metallic);
  vec3 F90 = mix(dielectricSpecularF90, vec3(1.0), metallic);

  // Albedo
  vec3 black = vec3(0.0);
  vec3 albedo = mix(baseColor.rgb, black, metallic);

  rt0 = vec4(0.0, 0.0, 0.0, alpha);

// Iridescence
#ifdef RN_USE_IRIDESCENCE
  float iridescenceFactor = get_iridescenceFactor(materialSID, 0);
  float iridescenceTexture = texture(u_iridescenceTexture, baseColorTexUv).r;
  float iridescence = iridescenceFactor * iridescenceTexture;
  float iridescenceIor = get_iridescenceIor(materialSID, 0);
  float thicknessRatio = texture(u_iridescenceThicknessTexture, baseColorTexUv).r;
  float iridescenceThicknessMinimum = get_iridescenceThicknessMinimum(materialSID, 0);
  float iridescenceThicknessMaximum = get_iridescenceThicknessMaximum(materialSID, 0);
  float iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);

  vec3 iridescenceFresnel = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, F0);
  vec3 iridescenceF0 = Schlick_to_F0(iridescenceFresnel, NdotV);

#else
  float iridescence = 0.0;
  vec3 iridescenceFresnel = vec3(0.0);
  vec3 iridescenceF0 = F0;
#endif // RN_USE_IRIDESCENCE

#ifdef RN_USE_CLEARCOAT
  // Clearcoat
  float clearcoatRoughnessFactor = get_clearCoatRoughnessFactor(materialSID, 0);
  int clearCoatRoughnessTexcoordIndex = get_clearCoatRoughnessTexcoordIndex(materialSID, 0);
  vec2 clearCoatRoughnessTexcoord = getTexcoord(clearCoatRoughnessTexcoordIndex);
  vec4 clearcoatRoughnessTextureTransform = get_clearCoatRoughnessTextureTransform(materialSID, 0);
  float clearcoatRoughnessTextureRotation = get_clearCoatRoughnessTextureRotation(materialSID, 0);
  vec2 clearcoatRoughnessTexUv = uvTransform(clearcoatRoughnessTextureTransform.xy, clearcoatRoughnessTextureTransform.zw, clearcoatRoughnessTextureRotation, clearCoatRoughnessTexcoord);
  float textureRoughnessTexture = texture(u_clearCoatRoughnessTexture, clearcoatRoughnessTexUv).g;
  float clearcoatRoughness = clearcoatRoughnessFactor * textureRoughnessTexture;

  int clearCoatNormalTexcoordIndex = get_clearCoatNormalTexcoordIndex(materialSID, 0);
  vec2 clearCoatNormalTexcoord = getTexcoord(clearCoatNormalTexcoordIndex);
  vec4 clearcoatNormalTextureTransform = get_clearCoatNormalTextureTransform(materialSID, 0);
  float clearcoatNormalTextureRotation = get_clearCoatNormalTextureRotation(materialSID, 0);
  vec2 clearcoatNormalTexUv = uvTransform(clearcoatNormalTextureTransform.xy, clearcoatNormalTextureTransform.zw, clearcoatNormalTextureRotation, clearCoatNormalTexcoord);
  vec3 textureNormal_tangent = texture(u_clearCoatNormalTexture, clearcoatNormalTexUv).xyz * vec3(2.0) - vec3(1.0);
  vec3 clearcoatNormal_inWorld = perturb_normal(geomNormal_inWorld, viewVector, normalTexUv, textureNormal_tangent);
  float VdotNc = saturateEpsilonToOne(dot(viewDirection, clearcoatNormal_inWorld));
#else
  float clearcoatRoughness = 0.0;
  vec3 clearcoatNormal_inWorld = vec3(0.0);
  float VdotNc = 0.0;
#endif // RN_USE_CLEARCOAT

#ifdef RN_USE_VOLUME
  // Volume
  float thicknessFactor = get_thicknessFactor(materialSID, 0);
  float thicknessTexture = texture(u_thicknessTexture, baseColorTexUv).g;
  float attenuationDistance = get_attenuationDistance(materialSID, 0);
  vec3 attenuationColor = get_attenuationColor(materialSID, 0);
  float thickness = thicknessFactor * thicknessTexture;
#else
  float thickness = 0.0;
  vec3 attenuationColor = vec3(0.0);
  float attenuationDistance = 0.000001;
#endif // RN_USE_VOLUME

#ifdef RN_USE_SHEEN
  // Sheen
  vec3 sheenColorFactor = get_sheenColorFactor(materialSID, 0);
  vec3 sheenColorTexture = texture(u_sheenColorTexture, baseColorTexUv).rgb;
  float sheenRoughnessFactor = get_sheenRoughnessFactor(materialSID, 0);
  float sheenRoughnessTexture = texture(u_sheenRoughnessTexture, baseColorTexUv).a;
  vec3 sheenColor = sheenColorFactor * sheenColorTexture;
  float sheenRoughness = clamp(sheenRoughnessFactor * sheenRoughnessTexture, 0.000001, 1.0);
  float albedoSheenScalingNdotV = 1.0 - max3(sheenColor) * texture(u_sheenLutTexture, vec2(NdotV, sheenRoughness)).r;
#else
  vec3 sheenColor = vec3(0.0);
  float sheenRoughness = 0.000001;
  float albedoSheenScalingNdotV = 1.0;
#endif // RN_USE_SHEEN

  // Lighting
  vec3 diffuse = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Light
    Light light = getLight(i, v_position_inWorld.xyz);

    // Fresnel
    vec3 halfVector = normalize(light.direction + viewDirection);
    float VdotH = dot(viewDirection, halfVector);
    vec3 F = fresnel(F0, F90, VdotH);

    float NdotL = saturateEpsilonToOne(dot(normal_inWorld, light.direction));

    // Diffuse
    vec3 diffuseBrdf = diffuse_brdf(albedo);
    vec3 pureDiffuse = (vec3(1.0) - F) * diffuseBrdf * vec3(NdotL) * light.attenuatedIntensity;

#ifdef RN_USE_TRANSMISSION
    vec3 refractionVector = refract(-viewDirection, normal_inWorld, 1.0 / ior);
    Light transmittedLightFromUnderSurface = light;
    transmittedLightFromUnderSurface.pointToLight -= refractionVector;
    vec3 transmittedLightDirectionFromUnderSurface = normalize(transmittedLightFromUnderSurface.pointToLight);
    transmittedLightFromUnderSurface.direction = transmittedLightDirectionFromUnderSurface;

    vec3 Ht = normalize(viewDirection + transmittedLightFromUnderSurface.direction);
    float NdotHt = saturateEpsilonToOne(dot(normal_inWorld, Ht));
    float NdotLt = saturateEpsilonToOne(dot(normal_inWorld, transmittedLightFromUnderSurface.direction));

    vec3 transmittedContrib = (vec3(1.0) - F) * specular_btdf(alphaRoughness, NdotLt, NdotV, NdotHt) * albedo * transmittedLightFromUnderSurface.attenuatedIntensity;

#ifdef RN_USE_VOLUME
    vec3 attenuationColor = get_attenuationColor(materialSID, 0);
    float attenuationDistance = get_attenuationDistance(materialSID, 0);
    transmittedContrib = volumeAttenuation(attenuationColor, attenuationDistance, transmittedContrib, length(transmittedLightFromUnderSurface.pointToLight));
#endif // RN_USE_VOLUME

    vec3 diffuseContrib = mix(pureDiffuse, vec3(transmittedContrib), transmission);
#else
    vec3 diffuseContrib = pureDiffuse;
#endif // RN_USE_TRANSMISSION

    // Specular
    float NdotH = saturateEpsilonToOne(dot(normal_inWorld, halfVector));
    vec3 specularContrib = cook_torrance_specular_brdf(NdotH, NdotL, NdotV, F, alphaRoughness) * vec3(NdotL) * light.attenuatedIntensity;

    // Base Layer
    vec3 baseLayer = diffuseContrib + specularContrib;

#ifdef RN_USE_SHEEN
    // Sheen
    vec3 sheenContrib = sheen_brdf(sheenColor, sheenRoughness, NdotL, NdotV, NdotH) * NdotL * light.attenuatedIntensity;
    float albedoSheenScaling = min(
      albedoSheenScalingNdotV,
      1.0 - max3(sheenColor) * texture(u_sheenLutTexture, vec2(NdotL, sheenRoughness)).r);
    vec3 color = sheenContrib + baseLayer * albedoSheenScaling;
#else
    vec3 color = baseLayer;
    float albedoSheenScaling = 1.0;
#endif // RN_USE_SHEEN

#ifdef RN_USE_CLEARCOAT
    // Clear Coat Layer
    float NdotHc = saturateEpsilonToOne(dot(clearcoatNormal_inWorld, halfVector));
    float LdotNc = saturateEpsilonToOne(dot(light.direction, clearcoatNormal_inWorld));
    vec3 coated = coated_material_s(color, perceptualRoughness,
      clearcoatRoughness, clearcoat, VdotNc, LdotNc, NdotHc);
    rt0.xyz += coated;
#else
    rt0.xyz += color;
#endif // RN_USE_CLEARCOAT
  }

#ifdef RN_USE_SHADOW_MAPPING
  float bias = 0.001;
  vec2 shadowCoord = v_shadowCoord.xy / v_shadowCoord.w;
  float shadowContribusion = 1.0;
  if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
    shadowContribusion = varianceShadowContribution(shadowCoord, (v_shadowCoord.z - bias)/v_shadowCoord.w);
  }
  // rt0.rgb = rt0.rgb * (0.5 + shadowContribusion * 0.5);
  rt0.rgb = rt0.rgb * shadowContribusion;
#endif

  vec3 ibl = IBLContribution(materialSID, normal_inWorld, NdotV, viewDirection,
    albedo, F0, perceptualRoughness, clearcoatRoughness, clearcoatNormal_inWorld,
    clearcoat, VdotNc, geomNormal_inWorld, cameraSID, transmission, v_position_inWorld.xyz, thickness,
    sheenColor, sheenRoughness, albedoSheenScalingNdotV, ior, iridescenceFresnel, iridescenceF0, iridescence);

  int occlusionTexcoordIndex = get_occlusionTexcoordIndex(materialSID, 0);
  vec2 occlusionTexcoord = getTexcoord(occlusionTexcoordIndex);
  vec4 occlusionTextureTransform = get_occlusionTextureTransform(materialSID, 0);
  float occlusionTextureRotation = get_occlusionTextureRotation(materialSID, 0);
  vec2 occlusionTexUv = uvTransform(occlusionTextureTransform.xy, occlusionTextureTransform.zw, occlusionTextureRotation, occlusionTexcoord);
  float occlusion = texture(u_occlusionTexture, occlusionTexUv).r;
  float occlusionStrength = get_occlusionStrength(materialSID, 0);

  // Occlution to Indirect Lights
  rt0.xyz += mix(ibl, ibl * occlusion, occlusionStrength);
#else
  rt0 = vec4(baseColor, alpha);
#endif // RN_IS_LIGHTING

  // Emissive
  vec3 emissiveFactor = get_emissiveFactor(materialSID, 0);
  int emissiveTexcoordIndex = get_emissiveTexcoordIndex(materialSID, 0);
  vec2 emissiveTexcoord = getTexcoord(emissiveTexcoordIndex);
  vec4 emissiveTextureTransform = get_emissiveTextureTransform(materialSID, 0);
  float emissiveTextureRotation = get_emissiveTextureRotation(materialSID, 0);
  vec2 emissiveTexUv = uvTransform(emissiveTextureTransform.xy, emissiveTextureTransform.zw, emissiveTextureRotation, emissiveTexcoord);
  vec3 emissive = emissiveFactor * srgbToLinear(texture(u_emissiveTexture, emissiveTexUv).xyz);

#ifdef RN_USE_CLEARCOAT
  vec3 coated_emissive = emissive * mix(vec3(1.0), vec3(0.04 + (1.0 - 0.04) * pow(1.0 - NdotV, 5.0)), clearcoat);
  rt0.xyz += coated_emissive;
#else
  rt0.xyz += emissive;
#endif // RN_USE_CLEARCOAT

  bool isOutputHDR = get_isOutputHDR(materialSID, 0);
  if(isOutputHDR){
#pragma shaderity: require(../common/glFragColor.glsl)
    return;
  }

#pragma shaderity: require(../common/setAlphaIfNotInAlphaBlendMode.glsl)

  // Wireframe
  float threshold = 0.001;
  vec3 wireframe = get_wireframe(materialSID, 0);
  float wireframeWidthInner = wireframe.z;
  float wireframeWidthRelativeScale = 1.0;
  if (wireframe.x > 0.5 && wireframe.y < 0.5) {
    rt0.a = 0.0;
  }
  vec4 wireframeResult = rt0;
  vec4 wireframeColor = vec4(0.2, 0.75, 0.0, 1.0);
  float edgeRatio = edge_ratio(v_baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  float edgeRatioModified = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  wireframeResult.rgb = wireframeColor.rgb * edgeRatioModified + rt0.rgb * (1.0 - edgeRatioModified);
  wireframeResult.a = max(rt0.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

  if (wireframe.x > 0.5) {
    rt0 = wireframeResult;
    if (wireframe.y < 0.5 && rt0.a == 0.0) {
      discard;
    }
  }

  // rt0.rgb = vec3(texture(u_depthTexture, v_shadowCoord.xy/v_shadowCoord.w).r);

  // premultiplied alpha
  // rt0.rgb /= alpha;

#pragma shaderity: require(../common/outputSrgb.glsl)
rt1 = rt0;
rt2 = rt0;
rt3 = rt0;
#pragma shaderity: require(../common/glFragColor.glsl)

}
