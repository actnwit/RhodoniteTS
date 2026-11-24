var t=`void raymarchRayDirection(out vec3 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  outValue = normalize(g_hitPosition - get_viewPosition(cameraSID));
}
`,a="fragment",o=!0,r={code:t,shaderStage:a,isFragmentShader:o};export{t as code,r as default,o as isFragmentShader,a as shaderStage};
