fn _lengthVec2f(value: vec2<f32>, outValue: ptr<function, f32>) {
  *outValue = length(value);
}
fn _lengthVec3f(value: vec3<f32>, outValue: ptr<function, f32>) {
  *outValue = length(value);
}
fn _lengthVec4f(value: vec4<f32>, outValue: ptr<function, f32>) {
  *outValue = length(value);
}

