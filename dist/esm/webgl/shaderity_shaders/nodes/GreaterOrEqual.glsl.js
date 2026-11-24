var o=`
void _greaterOrEqual(in float lhs, in float rhs, out bool outValue) {
  outValue = lhs >= rhs;
}

void _greaterOrEqual(in int lhs, in int rhs, out bool outValue) {
  outValue = lhs >= rhs;
}

void _greaterOrEqual(in uint lhs, in uint rhs, out bool outValue) {
  outValue = lhs >= rhs;
}

`,u="fragment",l=!0,r={code:o,shaderStage:u,isFragmentShader:l};export{o as code,r as default,l as isFragmentShader,u as shaderStage};
