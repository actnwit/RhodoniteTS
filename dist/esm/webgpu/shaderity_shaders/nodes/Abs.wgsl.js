var u=`fn _absF32(value: f32, outValue: ptr<function, f32>) {
  *outValue = abs(value);
}
fn _absVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = abs(value);
}
fn _absVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = abs(value);
}
fn _absVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = abs(value);
}
`,n="fragment",f=!0,t={code:u,shaderStage:n,isFragmentShader:f};export{u as code,t as default,f as isFragmentShader,n as shaderStage};
