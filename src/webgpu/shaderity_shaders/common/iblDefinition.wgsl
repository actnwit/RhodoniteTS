fn get_irradiance(normal_forEnv: vec3f, hdriFormat: vec2<i32>) -> vec3f {
  let diffuseTexel: vec4f = textureSample(diffuseEnvTexture, diffuseEnvSampler, normal_forEnv);

  var irradiance: vec3f;
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

fn get_radiance(reflection: vec3f, lod: f32, hdriFormat: vec2<i32>) -> vec3f {
  let specularTexel = textureSampleLevel(specularEnvTexture, specularEnvSampler, reflection, lod);

  var radiance: vec3f;
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

#ifdef RN_USE_SHEEN
fn sheenIBL(NdotV: f32, sheenPerceptualRoughness: f32, sheenColor: vec3f, iblParameter: vec4f, reflection: vec3f, hdriFormat: vec2i) -> vec3f
{
  let mipCount = iblParameter.x;
  let lod = (sheenPerceptualRoughness * (mipCount - 1.0));

  let sheenLutUV = vec2f(NdotV, sheenPerceptualRoughness);
  let brdf = textureSample(sheenLutTexture, sheenLutSampler, sheenLutUV).b;
  var sheenLight = get_radiance(reflection, lod, hdriFormat);
  let IBLSpecularContribution = iblParameter.z;
  sheenLight *= IBLSpecularContribution;

  return sheenLight * sheenColor * brdf;
}
#endif

fn getNormalForEnv(rotEnvMatrix: mat3x3<f32>, normal_inWorld: vec3f, materialSID: u32) -> vec3f {
  var normal_forEnv = rotEnvMatrix * normal_inWorld;
  if (get_inverseEnvironment(materialSID, 0)) {
    normal_forEnv.x *= -1.0;
  }
  return normal_forEnv;
}

fn getReflection(rotEnvMatrix: mat3x3<f32>, viewDirection: vec3f, normal_inWorld: vec3f,
  materialSID: u32, perceptualRoughness: f32,
  anisotropy: f32, anisotropyDirection: vec3f
  ) -> vec3f {
#ifdef RN_USE_ANISOTROPY
  let tangentRoughness = mix(perceptualRoughness, 1.0, anisotropy * anisotropy);
  let anisotropicTangent  = cross(anisotropyDirection, viewDirection);
  let anisotropicNormal   = cross(anisotropicTangent, anisotropyDirection);
  let bendFactor          = 1.0 - anisotropy * (1.0 - perceptualRoughness);
  let bendFactorPow4      = bendFactor * bendFactor * bendFactor * bendFactor;
  let bentNormal          = normalize(mix(anisotropicNormal, normal_inWorld, bendFactorPow4));
  var reflection = rotEnvMatrix * reflect(-viewDirection, bentNormal);
#else
  var reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);
#endif
  if (get_inverseEnvironment(materialSID, 0)) {
    reflection.x *= -1.0;
  }
  return reflection;
}

fn scaleForLod(perceptualRoughness: f32, ior: f32) -> f32
{
  // Scale roughness to the range [0, 1],
  // ior=1.0 will be scale 0,
  // ior=1.5 will be scale 1.0,
  // ior=2 will be scale 1.0 (clamped)
  //

  let scale = clamp(ior * 2.0 - 2.0, 0.0, 1.0);
  return perceptualRoughness * scale;
}

#ifdef RN_USE_TRANSMISSION
fn get_sample_from_backbuffer(materialSID: u32, sampleCoord: vec2f, perceptualRoughness: f32, ior: f32) -> vec3f {
  let vrState: vec2<i32> = get_vrState(0, 0);
  let backBufferTextureSize = get_backBufferTextureSize(0, 0);
  var backBufferTextureLength = max(backBufferTextureSize.x, backBufferTextureSize.y);
  var newSampleCoord = sampleCoord;
  newSampleCoord.y = 1.0 - newSampleCoord.y;
  if (vrState.x == 1) { // For VR
    backBufferTextureLength = max(backBufferTextureSize.x / 2.0, backBufferTextureSize.y);
    newSampleCoord.x = sampleCoord.x * 0.5;
    if (vrState.y == 1) { // For right eye
      newSampleCoord.x += 0.5;
    }
  }
  let framebufferLod = log2(backBufferTextureLength) * scaleForLod(perceptualRoughness, ior);

  let transmittedLight = textureSampleLevel(backBufferTexture, backBufferSampler, newSampleCoord, framebufferLod).rgb;

  return transmittedLight;
}

// from glTF Sample Viewer: https://github.com/KhronosGroup/glTF-Sample-Viewer
fn getVolumeTransmissionRay(n: vec3f, v: vec3f, thickness: f32, ior: f32, instanceInfo: u32) -> vec3f
{
  let refractionVector = refract(-v, normalize(n), 1.0 / ior);
  let worldMatrix = get_worldMatrix(instanceInfo);

  var modelScale: vec3f;
  modelScale.x = length(vec3f(worldMatrix[0].xyz));
  modelScale.y = length(vec3f(worldMatrix[1].xyz));
  modelScale.z = length(vec3f(worldMatrix[2].xyz));

  return normalize(refractionVector) * thickness * modelScale;
}
#endif // RN_USE_TRANSMISSION

struct IblResult
{
  specular: vec3f,
  diffuse: vec3f,
  FssEss: vec3f,
};


#ifdef RN_USE_IRIDESCENCE
fn getIBLRadianceGGXWithIridescence(materialSID: u32, NdotV: f32, viewDirection: vec3f, albedo: vec3f, F0: vec3f,
  perceptualRoughness: f32, iblParameter: vec4f, hdriFormat: vec2i, rotEnvMatrix: mat3x3<f32>,
  normal_forEnv: vec3f, reflection: vec3f, iridescenceFresnel: vec3f, iridescence: f32) -> IblResult
{
  // get radiance
  let mipCount = iblParameter.x;
  let lod = (perceptualRoughness * (mipCount - 1.0));
  let radiance = get_radiance(reflection, lod, hdriFormat);

  // Roughness dependent fresnel
  let kS = fresnelSchlickRoughnessWithIridescence(F0, NdotV, perceptualRoughness, iridescenceFresnel, iridescence);
  let f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  let FssEss = kS * f_ab.x + f_ab.y;
  var result: IblResult;
  result.FssEss = FssEss;

  // Specular IBL
  var specular = FssEss * radiance;

  // scale with user parameters
  let IBLSpecularContribution = iblParameter.z;
  specular *= IBLSpecularContribution;

  result.specular = specular;

  return result;
}

fn getIBLRadianceLambertianWithIridescence(materialSID: u32, NdotV: f32, viewDirection: vec3f, albedo: vec3f, F0: vec3f,
  perceptualRoughness: f32, iblParameter: vec4f, hdriFormat: vec2i, rotEnvMatrix: mat3x3<f32>,
  normal_forEnv: vec3f, reflection: vec3f, iridescenceF0: vec3f, iridescence: f32) -> IblResult
{
  // get irradiance
  let irradiance = get_irradiance(normal_forEnv, hdriFormat);

  // Use the maximum component of the iridescence Fresnel color
  // Maximum is used instead of the RGB value to not get inverse colors for the diffuse BRDF
  let iridescenceF0Max = vec3f(max(max(iridescenceF0.r, iridescenceF0.g), iridescenceF0.b));

  // Blend between base F0 and iridescence F0
  let mixedF0 = mix(F0, iridescenceF0Max, iridescence);

  // Roughness dependent fresnel
  let kS = fresnelSchlickRoughness(mixedF0, NdotV, perceptualRoughness);
  let f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  let FssEss = kS * f_ab.x + f_ab.y;
  var result: IblResult;
  result.FssEss = FssEss;

  // Multiple scattering, Fdez-Aguera's approach
  let Ems = (1.0 - (f_ab.x + f_ab.y));
  let F_avg = mixedF0 + (1.0 - mixedF0) / 21.0;
  let FmsEms = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);
  let k_D = albedo * (1.0 - FssEss - FmsEms);

  // Diffuse IBL
  var diffuse = (FmsEms + k_D) * irradiance;

  // scale with user parameters
  let IBLDiffuseContribution = iblParameter.y;
  diffuse *= IBLDiffuseContribution;

  result.diffuse = diffuse;

  return result;
}
#endif // RN_USE_IRIDESCENCE

fn getIBLRadianceLambertian(materialSID: u32, NdotV: f32, viewDirection: vec3f, albedo: vec3f, F0: vec3f,
  perceptualRoughness: f32, iblParameter: vec4f, hdriFormat: vec2<i32>, rotEnvMatrix: mat3x3<f32>,
  normal_forEnv: vec3f, reflection: vec3f) -> IblResult
{
  // get irradiance
  let irradiance: vec3f = get_irradiance(normal_forEnv, hdriFormat);

  // Roughness dependent fresnel
  let kS: vec3f = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  let f_ab: vec2f = envBRDFApprox(perceptualRoughness, NdotV);
  let FssEss: vec3f = kS * f_ab.x + f_ab.y;
  var result: IblResult;
  result.FssEss = FssEss;

  // Multiple scattering, Fdez-Aguera's approach
  let Ems = (1.0 - (f_ab.x + f_ab.y));
  let F_avg: vec3f = F0 + (1.0 - F0) / 21.0;
  let FmsEms: vec3f = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);
  let k_D: vec3f = albedo * (1.0 - FssEss - FmsEms);

  // Diffuse IBL
  var diffuse: vec3f = (FmsEms + k_D) * irradiance;

  // scale with user parameters
  let IBLDiffuseContribution = iblParameter.y;
  diffuse *= IBLDiffuseContribution;

  result.diffuse = diffuse;

  return result;
}

fn getIBLRadianceGGX(materialSID: u32, NdotV: f32, viewDirection: vec3f, albedo: vec3f, F0: vec3f,
  perceptualRoughness: f32, iblParameter: vec4f, hdriFormat: vec2<i32>, rotEnvMatrix: mat3x3<f32>,
  normal_forEnv: vec3f, reflection: vec3f) -> IblResult
{
  // get radiance
  let mipCount = iblParameter.x;
  let lod = (perceptualRoughness * (mipCount - 1.0));
  let radiance: vec3f = get_radiance(reflection, lod, hdriFormat);

  // Roughness dependent fresnel
  let kS: vec3f = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  let f_ab: vec2f = envBRDFApprox(perceptualRoughness, NdotV);
  let FssEss: vec3f = kS * f_ab.x + f_ab.y;
  var result: IblResult;
  result.FssEss = FssEss;

  // Specular IBL
  var specular: vec3f = FssEss * radiance;

  // scale with user parameters
  let IBLSpecularContribution = iblParameter.z;
  specular *= IBLSpecularContribution;

  result.specular = specular;

  return result;
}

fn IBLContribution(materialSID: u32, cameraSID: u32, normal_inWorld: vec3f, NdotV: f32, viewDirection: vec3f,
  albedo: vec3f, F0: vec3f, perceptualRoughness: f32,
  clearcoatRoughness: f32, clearcoatNormal_inWorld: vec3f, clearcoat: f32, VdotNc: f32, geomNormal_inWorld: vec3f,
  transmission: f32, v_position_inWorld: vec3f, instanceInfo: u32, thickness: f32, ior: f32,
  sheenColor: vec3f, sheenRoughness: f32, albedoSheenScalingNdotV: f32,
  iridescenceFresnel: vec3f, iridescenceF0: vec3f, iridescence: f32,
  anisotropy: f32, anisotropyDirection: vec3f
  ) -> vec3f
{
  let iblParameter: vec4f = get_iblParameter(materialSID, 0);
  let rot = iblParameter.w + 3.1415;
  let rotEnvMatrix = mat3x3<f32>(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  let hdriFormat: vec2<i32> = get_hdriFormat(materialSID, 0);

  let normal_forEnv: vec3f = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  let reflection: vec3f = getReflection(rotEnvMatrix, viewDirection, normal_inWorld, materialSID, perceptualRoughness, anisotropy, anisotropyDirection);

  // IBL
#ifdef RN_USE_IRIDESCENCE
  let baseRadianceResult: IblResult = getIBLRadianceGGXWithIridescence(materialSID, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection, iridescenceFresnel, iridescence);
  let baseLambertianResult: IblResult = getIBLRadianceLambertianWithIridescence(materialSID, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection, iridescenceF0, iridescence);
#else
  let baseRadianceResult: IblResult = getIBLRadianceGGX(materialSID, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection);
  let baseLambertianResult: IblResult = getIBLRadianceLambertian(materialSID, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection);
#endif

#ifdef RN_USE_TRANSMISSION
  let refractedRay = getVolumeTransmissionRay(geomNormal_inWorld, viewDirection, thickness, ior, instanceInfo);
  let refractedRayFromVPosition = v_position_inWorld + refractedRay;
  let ndcPoint = get_projectionMatrix(cameraSID, 0) * get_viewMatrix(cameraSID, 0) * vec4f(refractedRayFromVPosition, 1.0);
  var refractionCoords = ndcPoint.xy / ndcPoint.w;
  refractionCoords += 1.0;
  refractionCoords /= 2.0;
  var transmittedLight = get_sample_from_backbuffer(materialSID, refractionCoords, perceptualRoughness, ior);

#ifdef RN_USE_VOLUME
  let attenuationColor = get_attenuationColor(materialSID, 0);
  let attenuationDistance = get_attenuationDistance(materialSID, 0);
  transmittedLight = volumeAttenuation(attenuationColor, attenuationDistance, transmittedLight, length(refractedRay));
#endif

  let transmissionComp = (vec3f(1.0) - baseRadianceResult.FssEss) * transmittedLight * albedo;
  let diffuse = mix(baseLambertianResult.diffuse, transmissionComp, transmission);
  let base = diffuse + baseRadianceResult.specular;
#else
  let base: vec3f = baseLambertianResult.diffuse + baseRadianceResult.specular;
#endif

#ifdef RN_USE_SHEEN
  let sheen = sheenIBL(NdotV, sheenRoughness, sheenColor, iblParameter, reflection, hdriFormat);
  let color = sheen + base * albedoSheenScalingNdotV;
#else
  let color = base;
#endif

#ifdef RN_USE_CLEARCOAT
  let VdotNg = dot(geomNormal_inWorld, viewDirection);
  let clearcoatNormal_forEnv = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  let coatResult: IblResult = getIBLRadianceGGX(materialSID, VdotNc, viewDirection, vec3f(0.0), F0,
    clearcoatRoughness, iblParameter, hdriFormat, rotEnvMatrix, clearcoatNormal_forEnv, reflection);
  let coatLayer = coatResult.specular;

  let clearcoatFresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - abs(VdotNc), 5.0);
  let coated = color * vec3f(1.0 - clearcoat * clearcoatFresnel) + vec3f(coatLayer * clearcoat);
  return coated;
#else
  return color;
#endif
}

