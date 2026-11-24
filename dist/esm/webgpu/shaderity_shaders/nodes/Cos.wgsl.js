var n=`fn _cosF32(value: f32, outValue: ptr<function, f32>) {
  *outValue = cos(value);
}
fn _cosVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = cos(value);
}
fn _cosVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = cos(value);
}
fn _cosVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = cos(value);
}

`,c="fragment",a=!0,o={code:n,shaderStage:c,isFragmentShader:a};export{n as code,o as default,a as isFragmentShader,c as shaderStage};
