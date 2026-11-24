var r=`
fn projectionMatrix(outValue: ptr<function, mat4x4<f32>>) {
  *outValue = get_projectionMatrix(uniformDrawParameters.cameraSID);
}
`,t="vertex",n=!1,o={code:r,shaderStage:t,isFragmentShader:n};export{r as code,o as default,n as isFragmentShader,t as shaderStage};
