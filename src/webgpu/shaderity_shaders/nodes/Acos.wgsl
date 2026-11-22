fn _acosF32(value: f32, outValue: ptr<function, f32>) {
  *outValue = acos(value);
}
fn _acosVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = acos(value);
}
fn _acosVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = acos(value);
}
fn _acosVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = acos(value);
}
