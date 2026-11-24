var r=`fn raymarchCameraPosition(outValue: ptr<function, vec3f>) {
  *outValue = get_viewPosition(uniformDrawParameters.cameraSID);
}
`,t="fragment",n=!0,o={code:r,shaderStage:t,isFragmentShader:n};export{r as code,o as default,n as isFragmentShader,t as shaderStage};
