fn pbrMetallicRoughnessProps(metallicFactor: f32, roughnessFactor: f32, metallicRoughnessTexture: vec4<f32>, normalInWorld: vec3<f32>, outMetallic: ptr<function, f32>, outRoughness: ptr<function, f32>) {
  var perceptualRoughness = metallicRoughnessTexture.g * roughnessFactor;
  var metallic = metallicRoughnessTexture.b * metallicFactor;
  metallic = clamp(metallic, 0.0, 1.0);
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);

#ifdef RN_IS_PIXEL_SHADER
  let alphaRoughness = perceptualRoughness * perceptualRoughness;
  let alphaRoughness2 = alphaRoughness * alphaRoughness;
  // filter NDF for specular AA --- https://jcgt.org/published/0010/02/02/
  let filteredRoughness2 = IsotropicNDFFiltering(normalInWorld, alphaRoughness2);
  perceptualRoughness = sqrt(sqrt(filteredRoughness2));
#endif

  *outMetallic = metallic;
  *outRoughness = perceptualRoughness;
}
