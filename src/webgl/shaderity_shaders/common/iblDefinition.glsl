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
  vec2 backBufferTextureSize = vec2(textureSize(u_backBufferTexture, 0));
  float backBufferTextureLength = max(backBufferTextureSize.x, backBufferTextureSize.y);

#ifdef WEBGL2_MULTI_VIEW
  // For VR
  backBufferTextureLength = max(backBufferTextureSize.x / 2.0, backBufferTextureSize.y);
  sampleCoord.x = sampleCoord.x * 0.5;
  if (v_displayIdx == 1.0) { // For right eye
    sampleCoord.x += 0.5;
  }
#else
  if (vrState.x == 1) { // For VR
    backBufferTextureLength = max(backBufferTextureSize.x / 2.0, backBufferTextureSize.y);
    sampleCoord.x = sampleCoord.x * 0.5;
    if (vrState.y == 1) { // For right eye
      sampleCoord.x += 0.5;
    }
  }
#endif

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

#ifdef RN_USE_IRIDESCENCE
IblResult getIBLRadianceGGXWithIridescence(float materialSID, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix,
  vec3 normal_forEnv, vec3 reflection, vec3 iridescenceFresnel, float iridescence, float specularWeight)
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
  vec3 specular = FssEss * radiance * specularWeight;

  // scale with user parameters
  float IBLSpecularContribution = iblParameter.z;
  specular *= IBLSpecularContribution;

  result.specular = specular;

  return result;
}

IblResult getIBLRadianceLambertianWithIridescence(float materialSID, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix,
  vec3 normal_forEnv, vec3 reflection, vec3 iridescenceF0, float iridescence, float specularWeight)
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
  vec3 FssEss = specularWeight * kS * f_ab.x + f_ab.y;
  IblResult result;
  result.FssEss = FssEss;

  // Multiple scattering, Fdez-Aguera's approach
  float Ems = (1.0 - (f_ab.x + f_ab.y));
  vec3 F_avg = specularWeight * (mixedF0 + (1.0 - mixedF0) / 21.0);
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
#endif // RN_USE_IRIDESCENCE

IblResult getIBLRadianceLambertian(float materialSID, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix,
  vec3 normal_forEnv, vec3 reflection, float specularWeight)
{
  // get irradiance
  vec3 irradiance = get_irradiance(normal_forEnv, materialSID, hdriFormat);

  // Roughness dependent fresnel
  vec3 kS = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  vec2 f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  vec3 FssEss = specularWeight * kS * f_ab.x + f_ab.y;
  IblResult result;
  result.FssEss = FssEss;

  // Multiple scattering, Fdez-Aguera's approach
  float Ems = (1.0 - (f_ab.x + f_ab.y));
  vec3 F_avg = specularWeight * (F0 + (1.0 - F0) / 21.0);
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

IblResult getIBLRadianceGGX(float materialSID, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix,
  vec3 normal_forEnv, vec3 reflection, float specularWeight)
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
  vec3 specular = FssEss * radiance * specularWeight;

  // scale with user parameters
  float IBLSpecularContribution = iblParameter.z;
  specular *= IBLSpecularContribution;

  result.specular = specular;

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

vec3 getReflection(mat3 rotEnvMatrix, vec3 viewDirection, vec3 normal_inWorld, float materialSID, float perceptualRoughness, float anisotropy, vec3 anisotropyDirection) {
#ifdef RN_USE_ANISOTROPY

  float tangentRoughness = mix(perceptualRoughness, 1.0, anisotropy * anisotropy);
  vec3  anisotropicTangent  = cross(anisotropyDirection, viewDirection);
  vec3  anisotropicNormal   = cross(anisotropicTangent, anisotropyDirection);
  float bendFactor          = 1.0 - anisotropy * (1.0 - perceptualRoughness);
  float bendFactorPow4      = bendFactor * bendFactor * bendFactor * bendFactor;
  vec3  bentNormal          = normalize(mix(anisotropicNormal, normal_inWorld, bendFactorPow4));
  vec3 reflection = rotEnvMatrix * reflect(-viewDirection, bentNormal);
#else
  vec3 reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);
#endif
  if (get_inverseEnvironment(materialSID, 0)) {
    reflection.x *= -1.0;
  }
  return reflection;
}

vec3 IBLContribution(float materialSID, vec3 normal_inWorld, float NdotV, vec3 viewDirection,
  vec3 albedo, vec3 F0, float perceptualRoughness, float clearcoatRoughness, vec3 clearcoatNormal_inWorld,
  float clearcoat, float VdotNc, vec3 geomNormal_inWorld, float cameraSID, float transmission, vec3 v_position_inWorld,
  float thickness, vec3 sheenColor, float sheenRoughness, float albedoSheenScalingNdotV, float ior,
  vec3 iridescenceFresnel, vec3 iridescenceF0, float iridescence, float anisotropy, vec3 anisotropyDirection,
  float specularWeight)
{
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float rot = iblParameter.w;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  ivec2 hdriFormat = get_hdriFormat(materialSID, 0);

  vec3 normal_forEnv = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  vec3 reflection = getReflection(rotEnvMatrix, viewDirection, normal_inWorld, materialSID, perceptualRoughness, anisotropy, anisotropyDirection);

  // IBL
  #ifdef RN_USE_IRIDESCENCE
    IblResult baseRadianceResult = getIBLRadianceGGXWithIridescence(materialSID, NdotV, viewDirection, albedo, F0,
      perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection, iridescenceFresnel, iridescence, specularWeight);
    IblResult baseLambertianResult = getIBLRadianceLambertianWithIridescence(materialSID, NdotV, viewDirection, albedo, F0,
      perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection, iridescenceF0, iridescence, specularWeight);
  #else
    IblResult baseRadianceResult = getIBLRadianceGGX(materialSID, NdotV, viewDirection, albedo, F0,
      perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection, specularWeight);
    IblResult baseLambertianResult = getIBLRadianceLambertian(materialSID, NdotV, viewDirection, albedo, F0,
      perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection, specularWeight);
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
  IblResult coatResult = getIBLRadianceGGX(materialSID, VdotNc, viewDirection, vec3(0.0), F0,
    clearcoatRoughness, iblParameter, hdriFormat, rotEnvMatrix, clearcoatNormal_forEnv, reflection, specularWeight);
  vec3 coatLayer = coatResult.specular;

  float clearcoatFresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - abs(VdotNc), 5.0);
  vec3 coated = color * vec3(1.0 - clearcoat * clearcoatFresnel) + vec3(coatLayer * clearcoat);
  return coated;
#else
  return color;
#endif

}
