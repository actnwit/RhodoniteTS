var u=`
fn _premultipliedAlphaVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = vec4<f32>(value.rgb * value.a, value.a);
}

`,n="fragment",l=!0,t={code:u,shaderStage:n,isFragmentShader:l};export{u as code,t as default,l as isFragmentShader,n as shaderStage};
