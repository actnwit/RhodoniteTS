var u=`void _acos(in float value, out float outValue) {
  outValue = acos(value);
}
void _acos(in vec2 value, out vec2 outValue) {
  outValue = acos(value);
}
void _acos(in vec3 value, out vec3 outValue) {
  outValue = acos(value);
}
void _acos(in vec4 value, out vec4 outValue) {
  outValue = acos(value);
}
`,o="fragment",l=!0,n={code:u,shaderStage:o,isFragmentShader:l};export{u as code,n as default,l as isFragmentShader,o as shaderStage};
