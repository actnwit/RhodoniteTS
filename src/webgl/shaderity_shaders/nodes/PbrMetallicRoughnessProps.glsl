void pbrMetallicRoughnessProps(in float metallicFactor, in float roughnessFactor, in vec4 metallicRoughnessTexture, out float outMetallic, out float outRoughness) {
  float perceptualRoughness = metallicRoughnessTexture.g * roughnessFactor;
  float metallic = metallicRoughnessTexture.b * metallicFactor;
  metallic = clamp(metallic, 0.0, 1.0);
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);

  outMetallic = metallic;
  outRoughness = perceptualRoughness;
}
