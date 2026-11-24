var u=`
void add(in float lfs, in float rhs, out float outValue) {
  outValue = lfs + rhs;
}
void add(in int lfs, in int rhs, out int outValue) {
  outValue = lfs + rhs;
}
void add(in vec2 lfs, in vec2 rhs, out vec2 outValue) {
  outValue = lfs + rhs;
}
void add(in vec3 lfs, in vec3 rhs, out vec3 outValue) {
  outValue = lfs + rhs;
}
void add(in vec4 lfs, in vec4 rhs, out vec4 outValue) {
  outValue = lfs + rhs;
}
`,t="fragment",o=!0,a={code:u,shaderStage:t,isFragmentShader:o};export{u as code,a as default,o as isFragmentShader,t as shaderStage};
