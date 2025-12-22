fn _tanF32(value: f32, outValue: ptr<function, f32>) {
  *outValue = tan(value);
}
fn _tanVec2f(value: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = tan(value);
}
fn _tanVec3f(value: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = tan(value);
}
fn _tanVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = tan(value);
}

