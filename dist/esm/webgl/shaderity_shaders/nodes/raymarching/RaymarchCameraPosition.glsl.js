var a=`void raymarchCameraPosition(out vec3 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  outValue = get_viewPosition(cameraSID);
}
`,t="fragment",o=!0,r={code:a,shaderStage:t,isFragmentShader:o};export{a as code,r as default,o as isFragmentShader,t as shaderStage};
