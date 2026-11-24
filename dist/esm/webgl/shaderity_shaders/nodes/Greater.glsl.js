var e=`
void greater(in float lhs, in float rhs, out bool outValue) {
  outValue = lhs > rhs;
}

void greater(in int lhs, in int rhs, out bool outValue) {
  outValue = lhs > rhs;
}
`,o="fragment",a=!0,r={code:e,shaderStage:o,isFragmentShader:a};export{e as code,r as default,a as isFragmentShader,o as shaderStage};
