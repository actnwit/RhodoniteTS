#ifdef RN_USE_WIREFRAME
  let threshold: f32 = 0.001;
  let wireframe: vec3<f32> = get_wireframe(materialSID, 0);
  let wireframeWidthInner: f32 = wireframe.z;
  let wireframeWidthRelativeScale: f32 = 1.0;
  if (wireframe.x > 0.5 && wireframe.y < 0.5) {
    rt0.a = 0.0;
  }
  let wireframeColor: vec4<f32> = vec4<f32>(0.2, 0.75, 0.0, 1.0);
  let edgeRatio: f32 = edge_ratio(input.baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  let edgeRatioModified: f32 = mix(step(threshold, edgeRatio), clamp(edgeRatio * 4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale / 4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  let wireframeResult = vec4<f32>(wireframeColor.rgb * edgeRatioModified + rt0.rgb * (1.0 - edgeRatioModified), max(rt0.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale / 1.0)));

  if (wireframe.x > 0.5) {
    rt0 = wireframeResult;
    if (wireframe.y < 0.5 && rt0.a == 0.0) {
      discard;
    }
  }
#endif // RN_USE_WIREFRAME
