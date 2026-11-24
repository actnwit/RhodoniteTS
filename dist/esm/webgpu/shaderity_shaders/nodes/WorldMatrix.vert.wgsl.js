var t=`
fn worldMatrix(outValue: ptr<function, mat4x4<f32>>) {
  *outValue = get_worldMatrix(u32(a_instanceIds.x));
}
`,n="vertex",r=!1,d={code:t,shaderStage:n,isFragmentShader:r};export{t as code,d as default,r as isFragmentShader,n as shaderStage};
