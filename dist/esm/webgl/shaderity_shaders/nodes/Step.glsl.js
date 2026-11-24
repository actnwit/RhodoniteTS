var t=`void _step(in float value, in float edge, out float outValue) {
  outValue = step(edge, value);
}
void _step(in vec2 value, in vec2 edge, out vec2 outValue) {
  outValue = step(edge, value);
}
void _step(in vec3 value, in vec3 edge, out vec3 outValue) {
  outValue = step(edge, value);
}
void _step(in vec4 value, in vec4 edge, out vec4 outValue) {
  outValue = step(edge, value);
}
`,a="fragment",n=!0,v={code:t,shaderStage:a,isFragmentShader:n};export{t as code,v as default,n as isFragmentShader,a as shaderStage};
