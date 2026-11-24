var u=`void _abs(in float value, out float outValue) {
  outValue = abs(value);
}
void _abs(in vec2 value, out vec2 outValue) {
  outValue = abs(value);
}
void _abs(in vec3 value, out vec3 outValue) {
  outValue = abs(value);
}
void _abs(in vec4 value, out vec4 outValue) {
  outValue = abs(value);
}
`,o="fragment",l=!0,n={code:u,shaderStage:o,isFragmentShader:l};export{u as code,n as default,l as isFragmentShader,o as shaderStage};
