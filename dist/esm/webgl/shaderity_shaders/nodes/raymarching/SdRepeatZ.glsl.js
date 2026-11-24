var o=`void sdRepeatZ(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.z = (fract(position.z / interval) - 0.5) * interval;
  outPosition.xy = position.xy;
}
`,n="fragment",e=!0,a={code:o,shaderStage:n,isFragmentShader:e};export{o as code,a as default,e as isFragmentShader,n as shaderStage};
