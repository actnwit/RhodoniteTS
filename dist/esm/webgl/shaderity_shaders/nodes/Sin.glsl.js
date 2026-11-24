var n=`void _sin(in float value, out float outValue) {
  outValue = sin(value);
}
void _sin(in vec2 value, out vec2 outValue) {
  outValue = sin(value);
}
void _sin(in vec3 value, out vec3 outValue) {
  outValue = sin(value);
}
void _sin(in vec4 value, out vec4 outValue) {
  outValue = sin(value);
}
`,a="fragment",o=!0,l={code:n,shaderStage:a,isFragmentShader:o};export{n as code,l as default,o as isFragmentShader,a as shaderStage};
