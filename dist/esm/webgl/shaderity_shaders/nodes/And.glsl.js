var e=`
void _and(in bool lhs, in bool rhs, out bool outValue) {
  outValue = lhs && rhs;
}


`,a="fragment",l=!0,r={code:e,shaderStage:a,isFragmentShader:l};export{e as code,r as default,l as isFragmentShader,a as shaderStage};
