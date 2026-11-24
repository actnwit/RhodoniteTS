var i=`void sdTubeX(in vec3 position, in float width, out float outDistance) {
  outDistance = length(position.yz) - width;
}
`,n="fragment",o=!0,a={code:i,shaderStage:n,isFragmentShader:o};export{i as code,a as default,o as isFragmentShader,n as shaderStage};
