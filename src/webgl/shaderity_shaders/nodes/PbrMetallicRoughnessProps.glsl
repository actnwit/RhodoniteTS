void pbrMetallicRoughnessProps(in float metallicFactor, in float roughnessFactor, in vec4 metallicRoughnessTexture, in vec3 normalInWorld, out float outMetallic, out float outRoughness) {
  float perceptualRoughness = metallicRoughnessTexture.g * roughnessFactor;
  float metallic = metallicRoughnessTexture.b * metallicFactor;
  metallic = clamp(metallic, 0.0, 1.0);
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);

#ifdef RN_IS_PIXEL_SHADER
  float alphaRoughness = perceptualRoughness * perceptualRoughness;
  float alphaRoughness2 = alphaRoughness * alphaRoughness;
  // filter NDF for specular AA --- https://jcgt.org/published/0010/02/02/
  float filteredRoughness2 = IsotropicNDFFiltering(normalInWorld, alphaRoughness2);
  perceptualRoughness = sqrt(sqrt(filteredRoughness2));
#endif

  outMetallic = metallic;
  outRoughness = perceptualRoughness;
}
