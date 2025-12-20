fn pbrEmissiveProps(emissiveFactor: vec3<f32>, emissiveTexture: vec4<f32>, emissiveStrength: f32, outEmissiveProps: ptr<function, EmissiveProps>) {
  (*outEmissiveProps).emissive = emissiveFactor * emissiveTexture.rgb;
  (*outEmissiveProps).emissiveStrength = emissiveStrength;
}
