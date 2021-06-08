bool wireframe(
  in vec4 existingFragColor,
  in vec4 wireframeColor,
  out vec4 outColor
) {
  vec3 wireframeInfo = get_wireframe(a_instanceID);

  // Wireframe
  float threshold = 0.001;
  float wireframeWidthInner = wireframeInfo.z;
  float wireframeWidthRelativeScale = 1.0;
  if (wireframeInfo.x > 0.5 && wireframeInfo.y < 0.5) {
    outColor.a = 0.0;
  }
  vec4 wireframeResult = existingFragColor;
  float edgeRatio = edge_ratio(v_baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  float edgeRatioModified = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  wireframeResult.rgb = wireframeColor.rgb * edgeRatioModified + existingFragColor.rgb * (1.0 - edgeRatioModified);
  wireframeResult.a = max(existingFragColor.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

  if (wireframeInfo.x > 0.5) {
    outColor = wireframeResult;
    if (wireframeInfo.y < 0.5 && existingFragColor.a == 0.0) {
      discard;
    }
  }
}
