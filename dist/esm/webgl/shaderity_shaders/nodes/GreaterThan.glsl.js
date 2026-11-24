var o=`
void _greaterThan(in float lhs, in float rhs, out bool outValue) {
  outValue = lhs > rhs;
}

void _greaterThan(in int lhs, in int rhs, out bool outValue) {
  outValue = lhs > rhs;
}

void _greaterThan(in uint lhs, in uint rhs, out bool outValue) {
  outValue = lhs > rhs;
}


`,a="fragment",e=!0,u={code:o,shaderStage:a,isFragmentShader:e};export{o as code,u as default,e as isFragmentShader,a as shaderStage};
