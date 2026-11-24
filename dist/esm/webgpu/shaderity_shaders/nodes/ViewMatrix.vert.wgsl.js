var r=`
fn viewMatrix(outValue: ptr<function, mat4x4<f32>>) {
  *outValue = get_viewMatrix(uniformDrawParameters.cameraSID);
}
`,t="vertex",n=!1,i={code:r,shaderStage:t,isFragmentShader:n};export{r as code,i as default,n as isFragmentShader,t as shaderStage};
