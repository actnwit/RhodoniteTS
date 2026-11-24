var n=`void raymarchTBN(out mat3 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  vec3 viewVector = get_viewPosition(cameraSID) - g_hitPosition;
  outValue = getTBN(g_hitNormal, vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), viewVector, vec2(0.0));
}
`,o="fragment",a=!0,r={code:n,shaderStage:o,isFragmentShader:a};export{n as code,r as default,a as isFragmentShader,o as shaderStage};
