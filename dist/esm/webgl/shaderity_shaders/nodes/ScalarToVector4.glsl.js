var e=`
void scalarToVector4(in float x, in float y, in float z, in float w, out vec4 outValue) {
  outValue.x = x;
  outValue.y = y;
  outValue.z = z;
  outValue.w = w;
}
`,o="fragment",n=!0,u={code:e,shaderStage:o,isFragmentShader:n};export{e as code,u as default,n as isFragmentShader,o as shaderStage};
