fn pbrSpecularProps(
  specularFactor: f32,
  specularTexture: vec4<f32>,
  specularColorFactor: vec3<f32>,
  specularColorTexture: vec4<f32>,
  outSpecularProps: ptr<function, SpecularProps>) {
  (*outSpecularProps).specularWeight = specularFactor * specularTexture.a;
  (*outSpecularProps).specularColor = specularColorFactor * specularColorTexture.rgb;
}
