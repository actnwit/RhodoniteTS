void pbrEmissiveProps(in vec3 emissiveFactor, in vec4 emissiveTexture, in float emissiveStrength, out EmissiveProps emissiveProps) {
  emissiveProps.emissive = emissiveFactor * emissiveTexture.rgb;
  emissiveProps.emissiveStrength = emissiveStrength;
}
