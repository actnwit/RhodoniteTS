var o=`void _cos(in float value, out float outValue) {
  outValue = cos(value);
}
void _cos(in vec2 value, out vec2 outValue) {
  outValue = cos(value);
}
void _cos(in vec3 value, out vec3 outValue) {
  outValue = cos(value);
}
void _cos(in vec4 value, out vec4 outValue) {
  outValue = cos(value);
}

`,a="fragment",n=!0,l={code:o,shaderStage:a,isFragmentShader:n};export{o as code,l as default,n as isFragmentShader,a as shaderStage};
