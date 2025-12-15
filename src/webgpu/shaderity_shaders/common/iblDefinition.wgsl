// This file includes portions of code from the glTF-Sample-Renderer project by Khronos Group (Apache License 2.0).
// https://github.com/KhronosGroup/glTF-Sample-Renderer
// Modified by Yuki Shimada

#ifdef RN_USE_PBR

fn getIBLIrradiance(normal_forEnv: vec3f, iblParameter: vec4f, hdriFormat: vec2<i32>) -> vec3f {
  let diffuseTexel: vec4f = textureSampleLevel(diffuseEnvTexture, diffuseEnvSampler, normal_forEnv, 0.0);

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

  // scale with user parameters
  let IBLDiffuseContribution = iblParameter.y;
  irradiance *= IBLDiffuseContribution;

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

fn get_radiance_sheen(reflection: vec3f, lod: f32, hdriFormat: vec2<i32>) -> vec3f {
  let specularTexel = textureSampleLevel(sheenEnvTexture, sheenEnvSampler, reflection, lod);

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

fn sheenIBL(NdotV: f32, sheenPerceptualRoughness: f32, sheenColor: vec3f, iblParameter: vec4f, reflection: vec3f, hdriFormat: vec2i) -> vec3f
{
  let mipCount = iblParameter.x;
  let lod = (sheenPerceptualRoughness * (mipCount - 1.0));

  let sheenLutUV = vec2f(NdotV, sheenPerceptualRoughness);
  let brdf = textureSample(sheenLutTexture, sheenLutSampler, sheenLutUV).b;
  var sheenLight = get_radiance_sheen(reflection, lod, hdriFormat);
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
fn get_sample_from_backbuffer(sampleCoord: vec2f, perceptualRoughness: f32, ior: f32) -> vec3f {
  let vrState: vec2<i32> = get_vrState(0, 0);
  let backBufferTextureSize = vec2f(textureDimensions(backBufferTexture, 0));
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

fn getIBLVolumeRefraction(baseColor: vec3f, normal: vec3f, view: vec3f, cameraSID: u32, materialSID: u32, thickness: f32, perceptualRoughness: f32, ior: f32, attenuationColor: vec3f, attenuationDistance: f32, position_inWorld: vec3f, dispersion: f32, instanceIds: vec4<u32>) -> vec3f {
#ifdef RN_USE_DISPERSION
  let halfSpread = (ior - 1.0) * 0.025 * dispersion;
  let iors = vec3f(ior - halfSpread, ior, ior + halfSpread);

  var transmittedLight: vec3f;
  var transmissionRayLength: f32;
  for(var i=0; i<3; i++) {
    let transmissionRay = getVolumeTransmissionRay(normal, view, thickness, iors[i], instanceIds);
    transmissionRayLength = length(transmissionRay);
    let refractedRayExit = position_inWorld + transmissionRay;

    let ndcPos = get_projectionMatrix(cameraSID) * get_viewMatrix(cameraSID) * vec4f(refractedRayExit, 1.0);
    var refractionCoords = ndcPos.xy / ndcPos.w;
    refractionCoords += 1.0;
    refractionCoords /= 2.0;

    transmittedLight[i] = get_sample_from_backbuffer(refractionCoords, perceptualRoughness, iors[i])[i];
  }
#else
  let transmissionRay = getVolumeTransmissionRay(normal, view, thickness, ior, instanceIds);
  let transmissionRayLength = length(transmissionRay);
  let refractedRayExit = position_inWorld + transmissionRay;

  let ndcPos = get_projectionMatrix(cameraSID) * get_viewMatrix(cameraSID) * vec4f(refractedRayExit, 1.0);
  var refractionCoords = ndcPos.xy / ndcPos.w;
  refractionCoords += 1.0;
  refractionCoords /= 2.0;

  let transmittedLight = get_sample_from_backbuffer(refractionCoords, perceptualRoughness, ior);
#endif
  let attenuatedColor = volumeAttenuation(attenuationColor, attenuationDistance, transmittedLight, transmissionRayLength);

  return attenuatedColor * baseColor;
}

#endif // RN_USE_TRANSMISSION

struct IblResult
{
  specular: vec3f,
  diffuse: vec3f,
  FssEss: vec3f,
};

fn getIBLRadianceGGX(perceptualRoughness: f32, iblParameter: vec4f, hdriFormat: vec2<i32>, reflection: vec3f) -> vec3f
{
  // get radiance
  let mipCount = iblParameter.x;
  let lod = (perceptualRoughness * (mipCount - 1.0));
  var radiance: vec3f = get_radiance(reflection, lod, hdriFormat);

  let IBLSpecularContribution = iblParameter.z;
  radiance *= IBLSpecularContribution;

  return radiance;
}

fn getIBLFresnelGGX(perceptualRoughness: f32, NdotV: f32, F0: vec3f, specularWeight: f32) -> vec3f {
  // https://bruop.github.io/ibl/#single_scattering_results

  // Roughness dependent fresnel
  let kS: vec3f = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  let f_ab: vec2f = envBRDFApprox(perceptualRoughness, NdotV);
  let FssEss: vec3f = vec3f(specularWeight) * (kS * f_ab.x + f_ab.y);

  // Multiple scattering
  let Ems: f32 = (1.0 - (f_ab.x + f_ab.y));
  let F_avg: vec3f = vec3f(specularWeight) * (F0 + (1.0 - F0) / 21.0);
  let FmsEms: vec3f = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);

  return FssEss + FmsEms;
}

fn IBLContribution(instanceIds: vec4<u32>, materialSID: u32, cameraSID: u32,
  normal_inWorld: vec3f, NdotV: f32, viewDirection: vec3f, geomNormal_inWorld: vec3f, position_inWorld: vec3f,
  baseColor: vec3f, perceptualRoughness: f32, metallic: f32, specularWeight: f32, dielectricF0: vec3f, ior: f32,
  clearcoatProps: ClearcoatProps,
  transmission: f32,
  volumeProps: VolumeProps,
  sheenProps: SheenProps,
  iridescenceProps: IridescenceProps,
  anisotropyProps: AnisotropyProps,
  diffuseTransmissionProps: DiffuseTransmissionProps,
  dispersion: f32
  ) -> vec3f
{
  let iblParameter: vec4f = get_iblParameter(materialSID, 0);
  let rot = iblParameter.w;
  let rotEnvMatrix = mat3x3<f32>(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  let hdriFormat: vec2<i32> = get_hdriFormat(materialSID, 0);

  let normal_forEnv: vec3f = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  let reflection: vec3f = getReflection(rotEnvMatrix, viewDirection, normal_inWorld, materialSID, perceptualRoughness, anisotropyProps.anisotropy, anisotropyProps.anisotropicB);

  // get irradiance
  let irradiance: vec3f = getIBLIrradiance(normal_forEnv, iblParameter, hdriFormat);
  var diffuse: vec3f = irradiance * baseColor;

#ifdef RN_USE_DIFFUSE_TRANSMISSION
  var diffuseTransmissionIBL: vec3f = getIBLIrradiance(-normal_forEnv, iblParameter, hdriFormat) * diffuseTransmissionProps.diffuseTransmissionColor;
#ifdef RN_USE_VOLUME
  diffuseTransmissionIBL = volumeAttenuation(volumeProps.attenuationColor, volumeProps.attenuationDistance, diffuseTransmissionIBL, diffuseTransmissionProps.diffuseTransmissionThickness);
#endif
  diffuse = mix(diffuse, diffuseTransmissionIBL, diffuseTransmissionProps.diffuseTransmission);
#endif

#ifdef RN_USE_TRANSMISSION
  let specularTransmission: vec3f = getIBLVolumeRefraction(baseColor, normal_inWorld, viewDirection, cameraSID, materialSID, volumeProps.thickness, perceptualRoughness, ior, volumeProps.attenuationColor, volumeProps.attenuationDistance, position_inWorld, dispersion, instanceIds);
  diffuse = mix(diffuse, specularTransmission, transmission);
#endif

  // take account of anisotropy with reflection
  let specularMetal: vec3f = getIBLRadianceGGX(perceptualRoughness, iblParameter, hdriFormat, reflection);
  let specularDielectric: vec3f = specularMetal;

  // Calculate fresnel mix
  let fresnelMetal: vec3f = getIBLFresnelGGX(perceptualRoughness, NdotV, baseColor, 1.0);
  var metalContrib: vec3f = fresnelMetal * specularMetal;
  let fresnelDielectric: vec3f = getIBLFresnelGGX(perceptualRoughness, NdotV, dielectricF0, specularWeight);
  var dielectricContrib: vec3f = mix(diffuse, specularDielectric, fresnelDielectric);

#ifdef RN_USE_IRIDESCENCE
  metalContrib = mix(metalContrib, specularMetal * iridescenceProps.fresnelMetal, iridescenceProps.iridescence);
  dielectricContrib = mix(dielectricContrib, rgb_mix(diffuse, specularDielectric, iridescenceProps.fresnelDielectric), iridescenceProps.iridescence);
#endif

#ifdef RN_USE_CLEARCOAT
  let clearcoatReflection: vec3f = getReflection(rotEnvMatrix, viewDirection, clearcoatProps.clearcoatNormal_inWorld, materialSID, clearcoatProps.clearcoatRoughness, 0.0, vec3(0.0));
  let clearcoatContrib: vec3f = getIBLRadianceGGX(clearcoatProps.clearcoatRoughness, iblParameter, hdriFormat, clearcoatReflection);
#else
  let clearcoatContrib: vec3f = vec3(0.0);
#endif

#ifdef RN_USE_SHEEN
  let sheenContrib: vec3f = sheenIBL(NdotV, sheenProps.sheenRoughness, sheenProps.sheenColor, iblParameter, reflection, hdriFormat);
  let albedoSheenScaling: f32 = sheenProps.albedoSheenScalingNdotV;
#else
  let sheenContrib: vec3f = vec3(0.0);
  let albedoSheenScaling: f32 = 1.0;
#endif

  var color: vec3f = mix(dielectricContrib, metalContrib, metallic);
  color = sheenContrib + color * albedoSheenScaling;
  color = mix(color, clearcoatContrib, clearcoatProps.clearcoat * clearcoatProps.clearcoatFresnel);
  return color;
}

#endif // RN_USE_PBR
