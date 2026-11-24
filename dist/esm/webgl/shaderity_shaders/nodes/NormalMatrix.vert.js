var t=`
void normalMatrix(out mat3 outValue) {
  outValue = get_normalMatrix(uint(a_instanceIds.x));
}
`,n="vertex",r=!1,o={code:t,shaderStage:n,isFragmentShader:r};export{t as code,o as default,r as isFragmentShader,n as shaderStage};
