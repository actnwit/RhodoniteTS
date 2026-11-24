var e=`
void dotProduct(in vec2 lfs, in vec2 rhs, out float outValue) {
  outValue = dot(lfs, rhs);
}
void dotProduct(in vec3 lfs, in vec3 rhs, out float outValue) {
  outValue = dot(lfs, rhs);
}
void dotProduct(in vec4 lfs, in vec4 rhs, out float outValue) {
  outValue = dot(lfs, rhs);
}
`,u="fragment",n=!0,d={code:e,shaderStage:u,isFragmentShader:n};export{e as code,d as default,n as isFragmentShader,u as shaderStage};
