var r=`fn raymarchViewDirection(outValue: ptr<function, vec3f>) {
  *outValue = normalize(get_viewPosition(uniformDrawParameters.cameraSID) - g_hitPosition);
}
`,t="fragment",i=!0,n={code:r,shaderStage:t,isFragmentShader:i};export{r as code,n as default,i as isFragmentShader,t as shaderStage};
