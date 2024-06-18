
fn addF32F32(lfs: f32, rhs: f32, outValue: ptr<function, f32>) {
  *outValue = lfs + rhs;
}
fn addI32I32(lfs: i32, rhs: i32, outValue: ptr<function, i32>) {
  *outValue = lfs + rhs;
}
fn addVec2fVec2f(lfs: vec2<f32>, rhs: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = lfs + rhs;
}
fn addVec3fVec3f(lfs: vec3<f32>, rhs: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = lfs + rhs;
}
fn addVec4fVec4f(lfs: vec4<f32>, rhs: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = lfs + rhs;
}
