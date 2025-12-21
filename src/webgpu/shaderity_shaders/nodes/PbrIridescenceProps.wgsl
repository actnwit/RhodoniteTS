fn pbrIridescenceProps(
  iridescenceFactor: f32,
  iridescenceTexture: vec4<f32>,
  iridescenceThicknessMinimum: f32,
  iridescenceThicknessMaximum: f32,
  iridescenceThicknessTexture: vec4<f32>,
  iridescenceIor: f32,
  outIridescenceProps: ptr<function, IridescenceProps>) {

#ifdef RN_USE_IRIDESCENCE
  (*outIridescenceProps).iridescence = iridescenceFactor * iridescenceTexture.r;
  let thicknessRatio = iridescenceThicknessTexture.g;
  let iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);

  if (iridescenceThickness == 0.0) {
    (*outIridescenceProps).iridescence = 0.0;
  }

  (*outIridescenceProps).iridescenceIor = iridescenceIor;
  (*outIridescenceProps).iridescenceThickness = iridescenceThickness;
#else
  (*outIridescenceProps).iridescence = 0.0;
  (*outIridescenceProps).iridescenceIor = 0.0;
  (*outIridescenceProps).iridescenceThickness = 0.0;
#endif // RN_USE_IRIDESCENCE
}
