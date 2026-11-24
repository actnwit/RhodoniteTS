var e=`void sdRepeat(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition = (fract(position / interval) - 0.5) * interval;
}
`,n="fragment",o=!0,a={code:e,shaderStage:n,isFragmentShader:o};export{e as code,a as default,o as isFragmentShader,n as shaderStage};
