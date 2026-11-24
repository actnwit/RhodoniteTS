var o=`void sdRepeatZX(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.xz = (fract(position.xz / interval) - 0.5) * interval;
  outPosition.y = position.y;
}
`,n="fragment",e=!0,a={code:o,shaderStage:n,isFragmentShader:e};export{o as code,a as default,e as isFragmentShader,n as shaderStage};
