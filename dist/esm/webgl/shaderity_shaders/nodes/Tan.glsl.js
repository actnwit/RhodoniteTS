var u=`void _tan(in float value, out float outValue) {
  outValue = tan(value);
}
void _tan(in vec2 value, out vec2 outValue) {
  outValue = tan(value);
}
void _tan(in vec3 value, out vec3 outValue) {
  outValue = tan(value);
}
void _tan(in vec4 value, out vec4 outValue) {
  outValue = tan(value);
}

`,n="fragment",t=!0,o={code:u,shaderStage:n,isFragmentShader:t};export{u as code,o as default,t as isFragmentShader,n as shaderStage};
