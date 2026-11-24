var t=`
void projectionMatrix(out mat4 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID}*/]);
  outValue = get_projectionMatrix(cameraSID);
}
`,a="vertex",o=!1,r={code:t,shaderStage:a,isFragmentShader:o};export{t as code,r as default,o as isFragmentShader,a as shaderStage};
