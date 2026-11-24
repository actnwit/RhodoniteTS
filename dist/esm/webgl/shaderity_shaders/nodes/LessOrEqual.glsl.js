var o=`
void _lessOrEqual(in float lhs, in float rhs, out bool outValue) {
  outValue = lhs <= rhs;
}

void _lessOrEqual(in int lhs, in int rhs, out bool outValue) {
  outValue = lhs <= rhs;
}

void _lessOrEqual(in uint lhs, in uint rhs, out bool outValue) {
  outValue = lhs <= rhs;
}

`,u="fragment",s=!0,t={code:o,shaderStage:u,isFragmentShader:s};export{o as code,t as default,s as isFragmentShader,u as shaderStage};
