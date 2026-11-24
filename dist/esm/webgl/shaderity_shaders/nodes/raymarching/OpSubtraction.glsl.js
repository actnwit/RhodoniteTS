var o=`void opSubtraction(in float base, in float subtractor, out float outValue) {
  outValue = max(base, -subtractor);
}

`,e="fragment",r=!0,n={code:o,shaderStage:e,isFragmentShader:r};export{o as code,n as default,r as isFragmentShader,e as shaderStage};
