var o=`void sdRepeatXY(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.xy = (fract(position.xy / interval) - 0.5) * interval;
  outPosition.z = position.z;
}
`,n="fragment",e=!0,a={code:o,shaderStage:n,isFragmentShader:e};export{o as code,a as default,e as isFragmentShader,n as shaderStage};
