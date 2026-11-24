var t=`
void _notEqual(in float lhs, in float rhs, out bool outValue) {
  outValue = lhs != rhs;
}

void _notEqual(in int lhs, in int rhs, out bool outValue) {
  outValue = lhs != rhs;
}

void _notEqual(in uint lhs, in uint rhs, out bool outValue) {
  outValue = lhs != rhs;
}

`,u="fragment",l=!0,a={code:t,shaderStage:u,isFragmentShader:l};export{t as code,a as default,l as isFragmentShader,u as shaderStage};
