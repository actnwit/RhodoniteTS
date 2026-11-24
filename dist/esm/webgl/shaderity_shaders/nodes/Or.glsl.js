var n=`
void _or(in bool lhs, in bool rhs, out bool outValue) {
  outValue = lhs || rhs;
}

`,r="fragment",a=!0,l={code:n,shaderStage:r,isFragmentShader:a};export{n as code,l as default,a as isFragmentShader,r as shaderStage};
