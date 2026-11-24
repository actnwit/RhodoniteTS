var u=`
void _equal(in float lhs, in float rhs, out bool outValue) {
  outValue = lhs == rhs;
}

void _equal(in int lhs, in int rhs, out bool outValue) {
  outValue = lhs == rhs;
}

void _equal(in uint lhs, in uint rhs, out bool outValue) {
  outValue = lhs == rhs;
}

`,l="fragment",t=!0,a={code:u,shaderStage:l,isFragmentShader:t};export{u as code,a as default,t as isFragmentShader,l as shaderStage};
