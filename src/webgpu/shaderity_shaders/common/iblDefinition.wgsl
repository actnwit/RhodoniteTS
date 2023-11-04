fn IBLContribution(materialSID: u32, normal_inWorld: vec3f, NdotV: f32, viewDirection: vec3f,
  albedo: vec3f, F0: vec3f, perceptualRoughness: f32) -> vec3f
{
  let iblParameter: vec4f = get_iblParameter(materialSID, 0);
  let rot = iblParameter.w + 3.1415;
  let rotEnvMatrix = mat3x3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  let hdriFormat: vec2<i32> = get_hdriFormat(materialSID, 0);

  let normal_forEnv: vec3f = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  let reflection: vec3f = getReflection(rotEnvMatrix, viewDirection, normal_inWorld, materialSID, perceptualRoughness, anisotropy, anisotropyDirection);

  // IBL
  let baseRadianceResult: IblResult = getIBLRadianceGGX(materialSID, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection);
  let baseLambertianResult: IblResult = getIBLRadianceLambertian(materialSID, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix, normal_forEnv, reflection);

  let base: vec3f = baseLambertianResult.diffuse + baseRadianceResult.specular;

  let color = base;

  return color;
}

