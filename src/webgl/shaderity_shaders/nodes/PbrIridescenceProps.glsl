void pbrIridescenceProps(
  in float iridescenceFactor,
  in vec4 iridescenceTexture,
  in float iridescenceThicknessMinimum,
  in float iridescenceThicknessMaximum,
  in vec4 iridescenceThicknessTexture,
  in float iridescenceIor,
  in float ior,
  in vec4 baseColor,
  in SpecularProps specularProps,
  in vec4 positionInWorld,
  in vec3 normalInWorld,
  out IridescenceProps outIridescenceProps) {

  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
    cameraSID += uint(gl_ViewID_OVR);
  #endif

  vec3 viewPosition = get_viewPosition(cameraSID);
  vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
  float NdotV = saturate(dot(normalInWorld, viewDirection));

  // F0
  float outsideIor = 1.0;
  vec3 dielectricF0 = vec3(sq((ior - outsideIor) / (ior + outsideIor)));
  dielectricF0 = min(dielectricF0 * specularProps.specularColor, vec3(1.0));

  outIridescenceProps.iridescence = iridescenceFactor * iridescenceTexture.r;
  float thicknessRatio = iridescenceThicknessTexture.g;
  float iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);
  outIridescenceProps.fresnelDielectric = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, dielectricF0);
  outIridescenceProps.fresnelMetal = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, baseColor.rgb);

  if (iridescenceThickness == 0.0) {
    outIridescenceProps.iridescence = 0.0;
  }
}
