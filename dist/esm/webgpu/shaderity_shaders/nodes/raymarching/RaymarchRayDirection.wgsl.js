var r=`fn raymarchRayDirection(outValue: ptr<function, vec3f>) {
  let cameraPosition = get_viewPosition(uniformDrawParameters.cameraSID);
  *outValue = normalize(g_hitPosition - cameraPosition);
}
`,t="fragment",i=!0,n={code:r,shaderStage:t,isFragmentShader:i};export{r as code,n as default,i as isFragmentShader,t as shaderStage};
