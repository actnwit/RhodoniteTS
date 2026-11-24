var t=`void _atan2(in float y, in float x, out float outValue) {
  outValue = atan(y, x);
}
void _atan2(in vec2 y, in vec2 x, out vec2 outValue) {
  outValue = atan(y, x);
}
void _atan2(in vec3 y, in vec3 x, out vec3 outValue) {
  outValue = atan(y, x);
}
void _atan2(in vec4 y, in vec4 x, out vec4 outValue) {
  outValue = atan(y, x);
}
`,e="fragment",u=!0,o={code:t,shaderStage:e,isFragmentShader:u};export{t as code,o as default,u as isFragmentShader,e as shaderStage};
