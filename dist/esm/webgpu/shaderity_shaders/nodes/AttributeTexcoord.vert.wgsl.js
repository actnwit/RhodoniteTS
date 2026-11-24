var t=`fn attributeTexcoord(texcoordIndex: u32, outValue: ptr<function, vec2<f32>>) {
  if(texcoordIndex == 0u) {
    *outValue = a_texcoord_0;
  } else if(texcoordIndex == 1u) {
    *outValue = a_texcoord_1;
  } else {
    *outValue = a_texcoord_2;
  }
}
`,n="vertex",a=!1,d={code:t,shaderStage:n,isFragmentShader:a};export{t as code,d as default,a as isFragmentShader,n as shaderStage};
