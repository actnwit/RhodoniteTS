var n=`
void viewMatrix(out mat4 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID}*/]);
  outValue = get_viewMatrix(cameraSID);
}
`,t="vertex",o=!1,r={code:n,shaderStage:t,isFragmentShader:o};export{n as code,r as default,o as isFragmentShader,t as shaderStage};
