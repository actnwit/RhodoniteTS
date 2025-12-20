fn pbrIridescenceProps(
  iridescenceFactor: f32,
  iridescenceTexture: vec4<f32>,
  iridescenceThicknessMinimum: f32,
  iridescenceThicknessMaximum: f32,
  iridescenceThicknessTexture: vec4<f32>,
  iridescenceIor: f32,
  ior: f32,
  baseColor: vec4<f32>,
  specularProps: SpecularProps,
  positionInWorld: vec4<f32>,
  normalInWorld: vec3<f32>,
  outIridescenceProps: ptr<function, IridescenceProps>) {

  let cameraSID = uniformDrawParameters.cameraSID;
  let viewPosition = get_viewPosition(cameraSID);
  let viewDirection = normalize(viewPosition - positionInWorld.xyz);
  let NdotV = saturate(dot(normalInWorld, viewDirection));

  // F0
  let outsideIor = 1.0;
  var dielectricF0 = vec3f(sqF32((ior - outsideIor) / (ior + outsideIor)));
  dielectricF0 = min(dielectricF0 * specularProps.specularColor, vec3f(1.0));

  (*outIridescenceProps).iridescence = iridescenceFactor * iridescenceTexture.r;
  let thicknessRatio = iridescenceThicknessTexture.g;
  let iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);
  (*outIridescenceProps).fresnelDielectric = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, dielectricF0);
  (*outIridescenceProps).fresnelMetal = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, baseColor.rgb);

  if (iridescenceThickness == 0.0) {
    (*outIridescenceProps).iridescence = 0.0;
  }
}
