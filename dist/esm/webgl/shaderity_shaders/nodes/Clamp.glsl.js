var n=`void _clamp(in float value, in float min, in float max, out float outValue) {
  outValue = clamp(value, min, max);
}
void _clamp(in vec2 value, in vec2 min, in vec2 max, out vec2 outValue) {
  outValue = clamp(value, min, max);
}
void _clamp(in vec3 value, in vec3 min, in vec3 max, out vec3 outValue) {
  outValue = clamp(value, min, max);
}
void _clamp(in vec4 value, in vec4 min, in vec4 max, out vec4 outValue) {
  outValue = clamp(value, min, max);
}
`,u="fragment",l=!0,m={code:n,shaderStage:u,isFragmentShader:l};export{n as code,m as default,l as isFragmentShader,u as shaderStage};
