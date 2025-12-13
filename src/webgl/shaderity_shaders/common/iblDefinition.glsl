// This file includes portions of code from the glTF-Sample-Renderer project by Khronos Group (Apache License 2.0).
// https://github.com/KhronosGroup/glTF-Sample-Renderer
// Modified by Yuki Shimada


vec3 getIBLIrradiance(vec3 normal_forEnv, vec4 iblParameter, ivec2 hdriFormat) {
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

  // scale with user parameters
  float IBLDiffuseContribution = iblParameter.y;
  irradiance *= IBLDiffuseContribution;

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
vec3 get_sample_from_backbuffer(vec2 sampleCoord, float perceptualRoughness, float ior) {
  ivec2 vrState = get_vrState(0u, 0u);
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
  vec3 transmittedLight = textureLod(u_backBufferTexture, sampleCoord, framebufferLod).rgb;

  return transmittedLight;
}

vec3 getIBLVolumeRefraction(vec3 baseColor, vec3 normal, vec3 view, uint cameraSID, uint materialSID, float thickness, float perceptualRoughness, float ior, vec3 attenuationColor, float attenuationDistance) {
#ifdef RN_USE_DISPERSION
  float dispersion = get_dispersion(materialSID, 0u);
  float halfSpread = (ior - 1.0) * 0.025 * dispersion;
  vec3 iors = vec3(ior - halfSpread, ior, ior + halfSpread);

  vec3 transmittedLight;
  float transmissionRayLength;
  for(int i=0;i<3;i++) {
    vec3 transmissionRay = getVolumeTransmissionRay(normal, view, thickness, iors[i]);
    transmissionRayLength = length(transmissionRay);
    vec3 refractedRayExit = v_position_inWorld.xyz + transmissionRay;

    vec4 ndcPos = get_projectionMatrix(cameraSID) * get_viewMatrix(cameraSID) * vec4(refractedRayExit, 1.0);
    vec2 refractionCoords = ndcPos.xy / ndcPos.w;
    refractionCoords += 1.0;
    refractionCoords /= 2.0;

    transmittedLight[i] = get_sample_from_backbuffer(refractionCoords, perceptualRoughness, iors[i])[i];
  }
#else
  vec3 transmissionRay = getVolumeTransmissionRay(normal, view, thickness, ior);
  float transmissionRayLength = length(transmissionRay);
  vec3 refractedRayExit = v_position_inWorld.xyz + transmissionRay;

  vec4 ndcPos = get_projectionMatrix(cameraSID) * get_viewMatrix(cameraSID) * vec4(refractedRayExit, 1.0);
  vec2 refractionCoords = ndcPos.xy / ndcPos.w;
  refractionCoords += 1.0;
  refractionCoords /= 2.0;

  vec3 transmittedLight = get_sample_from_backbuffer(refractionCoords, perceptualRoughness, ior);
#endif
  vec3 attenuatedColor = volumeAttenuation(attenuationColor, attenuationDistance, transmittedLight, transmissionRayLength);
  return attenuatedColor * baseColor;
}

#endif // RN_USE_TRANSMISSION

vec3 get_radiance(vec3 reflection, float lod, ivec2 hdriFormat) {
  vec4 specularTexel = textureLod(u_specularEnvTexture, reflection, lod);

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

struct IblResult
{
  vec3 specular;
  vec3 diffuse;
  vec3 FssEss;
};

vec3 getIBLRadianceGGX(float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, vec3 reflection)
{
  // get radiance
  float mipCount = iblParameter.x;
  float lod = (perceptualRoughness * (mipCount - 1.0));
  vec3 radiance = get_radiance(reflection, lod, hdriFormat);

  // scale with user parameters
  float IBLSpecularContribution = iblParameter.z;
  radiance *= IBLSpecularContribution;

  return radiance;
}

vec3 getIBLFresnelGGX(float perceptualRoughness, float NdotV, vec3 F0, float specularWeight) {
  // https://bruop.github.io/ibl/#single_scattering_results

  // Roughness dependent fresnel
  vec3 kS = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  vec2 f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  vec3 FssEss = vec3(specularWeight) * (kS * f_ab.x + f_ab.y);

  // Multiple scattering
  float Ems = (1.0 - (f_ab.x + f_ab.y));
  vec3 F_avg = vec3(specularWeight) * (F0 + (1.0 - F0) / 21.0);
  vec3 FmsEms = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);

  return FssEss + FmsEms;
}

#ifdef RN_USE_SHEEN

vec3 get_radiance_sheen(vec3 reflection, float lod, ivec2 hdriFormat) {
  vec4 specularTexel = textureLod(u_sheenEnvTexture, reflection, lod);

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

vec3 sheenIBL(float NdotV, float sheenPerceptualRoughness, vec3 sheenColor, vec4 iblParameter, vec3 reflection, ivec2 hdriFormat)
{
  float mipCount = iblParameter.x;
  float lod = (sheenPerceptualRoughness * (mipCount - 1.0));

  vec2 sheenLutUV = vec2(NdotV, sheenPerceptualRoughness);
  float brdf = texture(u_sheenLutTexture, sheenLutUV).b;
  vec3 sheenLight = get_radiance_sheen(reflection, lod, hdriFormat);
  float IBLSpecularContribution = iblParameter.z;
  sheenLight *= IBLSpecularContribution;

  return sheenLight * sheenColor * brdf;
}
#endif

vec3 getNormalForEnv(mat3 rotEnvMatrix, vec3 normal_inWorld, uint materialSID) {
  vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;
  if (get_inverseEnvironment(materialSID, 0u)) {
    normal_forEnv.x *= -1.0;
  }
  return normal_forEnv;
}

vec3 getReflection(mat3 rotEnvMatrix, vec3 viewDirection, vec3 normal_inWorld, uint materialSID, float perceptualRoughness, float anisotropy, vec3 anisotropyDirection) {
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
  if (get_inverseEnvironment(materialSID, 0u)) {
    reflection.x *= -1.0;
  }
  return reflection;
}

vec3 IBLContribution(uint materialSID, vec3 normal_inWorld, float NdotV, vec3 viewDirection,
  vec3 baseColor, float perceptualRoughness, ClearcoatProps clearcoatProps, vec3 geomNormal_inWorld, uint cameraSID, float transmission, vec3 v_position_inWorld,
  float thickness, SheenProps sheenProps, float ior,
  IridescenceProps iridescenceProps, AnisotropyProps anisotropyProps,
  float specularWeight, vec3 dielectricF0, float metallic, float diffuseTransmission, vec3 diffuseTransmissionColor, float diffuseTransmissionThickness)
{
  vec4 iblParameter = get_iblParameter(materialSID, 0u);
  float rot = iblParameter.w;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  ivec2 hdriFormat = get_hdriFormat(materialSID, 0u);

  vec3 normal_forEnv = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  vec3 reflection = getReflection(rotEnvMatrix, viewDirection, normal_inWorld, materialSID, perceptualRoughness, anisotropyProps.anisotropy, anisotropyProps.anisotropicB);

  // get irradiance
  vec3 irradiance = getIBLIrradiance(normal_forEnv, iblParameter, hdriFormat);
  vec3 diffuse = irradiance * baseColor;

#ifdef RN_USE_DIFFUSE_TRANSMISSION
  vec3 diffuseTransmissionIBL = getIBLIrradiance(-normal_forEnv, iblParameter, hdriFormat) * diffuseTransmissionColor;
#ifdef RN_USE_VOLUME
  diffuseTransmissionIBL = volumeAttenuation(attenuationColor, attenuationDistance, diffuseTransmissionIBL, diffuseTransmissionThickness);
#endif
  diffuse = mix(diffuse, diffuseTransmissionIBL, diffuseTransmission);
#endif

#ifdef RN_USE_TRANSMISSION
  vec3 attenuationColor = get_attenuationColor(materialSID, 0u);
  float attenuationDistance = get_attenuationDistance(materialSID, 0u);
  vec3 specularTransmission = getIBLVolumeRefraction(baseColor, normal_inWorld, viewDirection, cameraSID, materialSID, thickness, perceptualRoughness, ior, attenuationColor, attenuationDistance);
  diffuse = mix(diffuse, specularTransmission, transmission);
#endif

  // take account of anisotropy with reflection
  vec3 specularMetal = getIBLRadianceGGX(perceptualRoughness, iblParameter, hdriFormat, reflection);
  vec3 specularDielectric = specularMetal;

  // Calculate fresnel mix
  vec3 fresnelMetal = getIBLFresnelGGX(perceptualRoughness, NdotV, baseColor, 1.0);
  vec3 metalContrib = fresnelMetal * specularMetal;
  vec3 fresnelDielectric = getIBLFresnelGGX(perceptualRoughness, NdotV, dielectricF0, specularWeight);
  vec3 dielectricContrib = mix(diffuse, specularDielectric, fresnelDielectric);

#ifdef RN_USE_IRIDESCENCE
  metalContrib = mix(metalContrib, specularMetal * iridescenceProps.fresnelMetal, iridescenceProps.iridescence);
  dielectricContrib = mix(dielectricContrib, rgb_mix(diffuse, specularDielectric, iridescenceProps.fresnelDielectric), iridescenceProps.iridescence);
#endif

#ifdef RN_USE_CLEARCOAT
  vec3 clearcoatReflection = getReflection(rotEnvMatrix, viewDirection, clearcoatProps.clearcoatNormal_inWorld, materialSID, clearcoatProps.clearcoatRoughness, 0.0, vec3(0.0));
  vec3 clearcoatContrib = getIBLRadianceGGX(clearcoatProps.clearcoatRoughness, iblParameter, hdriFormat, clearcoatReflection);
#else
  vec3 clearcoatContrib = vec3(0.0);
#endif

#ifdef RN_USE_SHEEN
  vec3 sheenContrib = sheenIBL(NdotV, sheenProps.sheenRoughness, sheenProps.sheenColor, iblParameter, reflection, hdriFormat);
  float albedoSheenScaling = sheenProps.albedoSheenScalingNdotV;
#else
  vec3 sheenContrib = vec3(0.0);
  float albedoSheenScaling = 1.0;
#endif

  vec3 color = mix(dielectricContrib, metalContrib, metallic);
  color = sheenContrib + color * albedoSheenScaling;
  color = mix(color, clearcoatContrib, clearcoatProps.clearcoat * clearcoatProps.clearcoatFresnel);

  return color;
}
