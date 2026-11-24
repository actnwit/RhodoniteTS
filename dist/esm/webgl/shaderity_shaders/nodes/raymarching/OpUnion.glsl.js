var o=`void opUnion(in float lhs, in float rhs, out float outValue) {
  outValue = min(lhs, rhs);
}

`,t="fragment",e=!0,l={code:o,shaderStage:t,isFragmentShader:e};export{o as code,l as default,e as isFragmentShader,t as shaderStage};
