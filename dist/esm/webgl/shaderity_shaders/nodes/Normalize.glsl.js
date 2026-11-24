var n=`
void _normalize(in vec2 value, out vec2 outValue) {
  outValue = normalize(value);
}

void _normalize(in vec3 value, out vec3 outValue) {
  outValue = normalize(value);
}

void _normalize(in vec4 value, out vec4 outValue) {
  outValue = normalize(value);
}
`,u="fragment",o=!0,l={code:n,shaderStage:u,isFragmentShader:o};export{n as code,l as default,o as isFragmentShader,u as shaderStage};
