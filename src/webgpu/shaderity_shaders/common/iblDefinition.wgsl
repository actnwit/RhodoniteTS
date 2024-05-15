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

fn getNormalForEnv(rotEnvMatrix: mat3x3<f32>, normal_inWorld: vec3f, materialSID: u32) -> vec3f {
  var normal_forEnv = rotEnvMatrix * normal_inWorld;
  if (get_inverseEnvironment(materialSID, 0)) {
    normal_forEnv.x *= -1.0;
  }
  return normal_forEnv;
}

fn getReflection(rotEnvMatrix: mat3x3<f32>, viewDirection: vec3f, normal_inWorld: vec3f,
  materialSID: u32, perceptualRoughness: f32) -> vec3f {
  var reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);
  if (get_inverseEnvironment(materialSID, 0)) {
    reflection.x *= -1.0;
  }
  return reflection;
}

struct IblResult
{
  specular: vec3f,
  diffuse: vec3f,
  FssEss: vec3f,
};

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

fn IBLContribution(materialSID: u32, normal_inWorld: vec3f, NdotV: f32, viewDirection: vec3f,
  albedo: vec3f, F0: vec3f, perceptualRoughness: f32,
  clearcoatRoughness: f32, clearcoatNormal_inWorld: vec3f, clearcoat: f32, VdotNc: f32, geomNormal_inWorld: vec3f
  ) -> vec3f
{
  let iblParameter: vec4f = get_iblParameter(materialSID, 0);
  let rot = iblParameter.w + 3.1415;
  let rotEnvMatrix = mat3x3<f32>(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  let hdriFormat: vec2<i32> = get_hdriFormat(materialSID, 0);

  let normal_forEnv: vec3f = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  let reflection: vec3f = getReflection(rotEnvMatrix, viewDirection, normal_inWorld, materialSID, perceptualRoughness);

  // IBL
  let baseRadianceResult: IblResult = getIBLRadianceGGX(materialSID, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection);
  let baseLambertianResult: IblResult = getIBLRadianceLambertian(materialSID, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection);

  let base: vec3f = baseLambertianResult.diffuse + baseRadianceResult.specular;

  let color = base;

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

