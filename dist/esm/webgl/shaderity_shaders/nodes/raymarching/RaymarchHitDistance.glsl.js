var n=`void raymarchHitDistance(out float outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  outValue = length(g_hitPosition - get_viewPosition(cameraSID));
}
`,a="fragment",o=!0,i={code:n,shaderStage:a,isFragmentShader:o};export{n as code,i as default,o as isFragmentShader,a as shaderStage};
