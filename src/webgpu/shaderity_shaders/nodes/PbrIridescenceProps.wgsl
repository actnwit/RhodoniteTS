fn pbrIridescenceProps(
  iridescenceFactor: f32,
  iridescenceTexture: vec4<f32>,
  iridescenceThicknessMinimum: f32,
  iridescenceThicknessMaximum: f32,
  iridescenceThicknessTexture: vec4<f32>,
  iridescenceIor: f32,
  outIridescenceProps: ptr<function, IridescenceProps>) {

  (*outIridescenceProps).iridescence = iridescenceFactor * iridescenceTexture.r;
  let thicknessRatio = iridescenceThicknessTexture.g;
  let iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);

  if (iridescenceThickness == 0.0) {
    (*outIridescenceProps).iridescence = 0.0;
  }

  (*outIridescenceProps).iridescenceIor = iridescenceIor;
  (*outIridescenceProps).iridescenceThickness = iridescenceThickness;
}
