var o=`void sdRepeatY(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.y = (fract(position.y / interval) - 0.5) * interval;
  outPosition.xz = position.xz;
}
`,n="fragment",e=!0,a={code:o,shaderStage:n,isFragmentShader:e};export{o as code,a as default,e as isFragmentShader,n as shaderStage};
