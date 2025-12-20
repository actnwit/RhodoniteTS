void pbrIridescenceProps(
  in float iridescenceFactor,
  in vec4 iridescenceTexture,
  in float iridescenceThicknessMinimum,
  in float iridescenceThicknessMaximum,
  in vec4 iridescenceThicknessTexture,
  in float iridescenceIor,
  out IridescenceProps outIridescenceProps) {

  outIridescenceProps.iridescence = iridescenceFactor * iridescenceTexture.r;
  float thicknessRatio = iridescenceThicknessTexture.g;
  float iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);

  if (iridescenceThickness == 0.0) {
    outIridescenceProps.iridescence = 0.0;
  }

  outIridescenceProps.iridescenceIor = iridescenceIor;
  outIridescenceProps.iridescenceThickness = iridescenceThickness;
}
