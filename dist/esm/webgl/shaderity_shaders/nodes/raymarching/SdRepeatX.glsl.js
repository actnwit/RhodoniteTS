var o=`void sdRepeatX(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.x = (fract(position.x / interval) - 0.5) * interval;
  outPosition.yz = position.yz;
}
`,n="fragment",e=!0,a={code:o,shaderStage:n,isFragmentShader:e};export{o as code,a as default,e as isFragmentShader,n as shaderStage};
