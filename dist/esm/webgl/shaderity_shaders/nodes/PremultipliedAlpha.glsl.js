var u=`
void _premultipliedAlpha(in vec4 value, out vec4 outValue) {
  outValue = vec4(value.rgb * value.a, value.a);
}

`,l="fragment",n=!0,t={code:u,shaderStage:l,isFragmentShader:n};export{u as code,t as default,n as isFragmentShader,l as shaderStage};
