var i=`void sdBarX(in vec3 position, in float width, out float outDistance) {
  outDistance = length(max(abs(position.yz)-width,0.));
}
`,n="fragment",e=!0,o={code:i,shaderStage:n,isFragmentShader:e};export{i as code,o as default,e as isFragmentShader,n as shaderStage};
