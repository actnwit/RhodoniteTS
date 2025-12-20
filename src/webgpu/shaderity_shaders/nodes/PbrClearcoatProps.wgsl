fn pbrClearcoatProps(
  clearcoatFactor: f32,
  clearcoatTexture: vec4<f32>,
  clearcoatRoughnessFactor: f32,
  clearcoatRoughnessTexture: vec4<f32>,
  clearcoatNormalTexture: vec4<f32>,
  outClearcoatProps: ptr<function, ClearcoatProps>) {

  (*outClearcoatProps).clearcoat = clearcoatFactor * clearcoatTexture.r;
  (*outClearcoatProps).clearcoatRoughness = clearcoatRoughnessFactor * clearcoatRoughnessTexture.g;
  let textureNormal_tangent = clearcoatNormalTexture.xyz * vec3f(2.0) - vec3f(1.0);
  (*outClearcoatProps).clearcoatNormal_inTangent = textureNormal_tangent;
}
