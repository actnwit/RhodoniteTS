fn pbrClearcoatProps(
  clearcoatFactor: f32,
  clearcoatTexture: vec4<f32>,
  clearcoatRoughnessFactor: f32,
  clearcoatRoughnessTexture: vec4<f32>,
  clearcoatNormalTexture: vec4<f32>,
  TBN: mat3x3<f32>,
  positionInWorld: vec4<f32>,
  ior: f32,
  outClearcoatProps: ptr<function, ClearcoatProps>) {


  let cameraSID = uniformDrawParameters.cameraSID;
  let viewPosition = get_viewPosition(cameraSID);
  let viewDirection = normalize(viewPosition - positionInWorld.xyz);

  (*outClearcoatProps).clearcoat = clearcoatFactor * clearcoatTexture.r;
  (*outClearcoatProps).clearcoatRoughness = clearcoatRoughnessFactor * clearcoatRoughnessTexture.g;
  let textureNormal_tangent = clearcoatNormalTexture.xyz * vec3f(2.0) - vec3f(1.0);
  (*outClearcoatProps).clearcoatNormal_inWorld = normalize(TBN * textureNormal_tangent);
  (*outClearcoatProps).VdotNc = saturate(dot(viewDirection, (*outClearcoatProps).clearcoatNormal_inWorld));
  (*outClearcoatProps).clearcoatF0 = vec3f(pow((ior - 1.0) / (ior + 1.0), 2.0));
  (*outClearcoatProps).clearcoatF90 = vec3f(1.0);
  (*outClearcoatProps).clearcoatFresnel = fresnelSchlick((*outClearcoatProps).clearcoatF0, (*outClearcoatProps).clearcoatF90, (*outClearcoatProps).VdotNc);
}
