fn pbrOcclusionProps(occlusionTexture: vec4<f32>, occlusionStrength: f32, outOcclusionProps: ptr<function, OcclusionProps>) {
  (*outOcclusionProps).occlusionTexture = occlusionTexture;
  (*outOcclusionProps).occlusionStrength = occlusionStrength;
}
