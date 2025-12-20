void pbrOcclusionProps(in vec4 occlusionTexture, in float occlusionStrength, out OcclusionProps outOcclusionProps) {
  outOcclusionProps.occlusionTexture = occlusionTexture;
  outOcclusionProps.occlusionStrength = occlusionStrength;
}
