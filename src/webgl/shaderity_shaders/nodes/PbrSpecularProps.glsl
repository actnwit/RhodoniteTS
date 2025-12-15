void pbrSpecularProps(
  in float specularFactor,
  in vec4 specularTexture,
  in vec3 specularColorFactor,
  in vec4 specularColorTexture,
  out SpecularProps outSpecularProps) {
  outSpecularProps.specularWeight = specularFactor * specularTexture.a;
  outSpecularProps.specularColor = specularColorFactor * specularColorTexture.rgb;
}
