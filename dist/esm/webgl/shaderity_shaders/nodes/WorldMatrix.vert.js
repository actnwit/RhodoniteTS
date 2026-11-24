var t=`
void worldMatrix(out mat4 outValue) {
  outValue = get_worldMatrix(uint(a_instanceIds.x));
}
`,n="vertex",r=!1,d={code:t,shaderStage:n,isFragmentShader:r};export{t as code,d as default,r as isFragmentShader,n as shaderStage};
