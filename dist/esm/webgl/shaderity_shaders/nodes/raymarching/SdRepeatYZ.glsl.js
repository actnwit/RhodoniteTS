var o=`void sdRepeatYZ(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.yz = (fract(position.yz / interval) - 0.5) * interval;
  outPosition.x = position.x;
}
`,n="fragment",e=!0,a={code:o,shaderStage:n,isFragmentShader:e};export{o as code,a as default,e as isFragmentShader,n as shaderStage};
