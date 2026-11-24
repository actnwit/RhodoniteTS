var n=`
fn normalMatrix(outValue: ptr<function, mat3x3<f32>>) {
  *outValue = get_normalMatrix(u32(a_instanceIds.x));
}
`,t="vertex",r=!1,o={code:n,shaderStage:t,isFragmentShader:r};export{n as code,o as default,r as isFragmentShader,t as shaderStage};
