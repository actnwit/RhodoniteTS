fn _sinF32(value: f32, outValue: ptr<function, f32>) {
  *outValue = sin(value);
}
fn _sinVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = sin(value);
}
fn _sinVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = sin(value);
}
fn _sinVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = sin(value);
}
