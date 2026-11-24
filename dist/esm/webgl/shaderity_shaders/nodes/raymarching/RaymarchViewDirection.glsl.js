var t=`void raymarchViewDirection(out vec3 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  outValue = normalize(get_viewPosition(cameraSID) - g_hitPosition);
}
`,o="fragment",a=!0,i={code:t,shaderStage:o,isFragmentShader:a};export{t as code,i as default,a as isFragmentShader,o as shaderStage};
