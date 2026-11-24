var i=`void sdSphere(in vec3 position, in float radius, out float outDistance) {
  outDistance = length(position) - radius;
}
`,n="fragment",a=!0,o={code:i,shaderStage:n,isFragmentShader:a};export{i as code,o as default,a as isFragmentShader,n as shaderStage};
