var t=`fn raymarchHitDistance(outValue: ptr<function, f32>) {
  let cameraPosition = get_viewPosition(uniformDrawParameters.cameraSID);
  *outValue = length(g_hitPosition - cameraPosition);
}
`,n="fragment",i=!0,r={code:t,shaderStage:n,isFragmentShader:i};export{t as code,r as default,i as isFragmentShader,n as shaderStage};
