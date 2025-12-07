fn _lengthVec2f(value: vec2<f32>, outValue: ptr<function, f32>) {
  *outValue = length(value);
}
fn _lengthVec3f(value: vec3<f32>, outValue: ptr<function, f32>) {
  *outValue = length(value);
}
fn _lengthVec4f(value: vec4<f32>, outValue: ptr<function, f32>) {
  *outValue = length(value);
}
fn _lengthVec2u(value: vec2<u32>, outValue: ptr<function, f32>) {
  *outValue = length(vec2<f32>(value));
}
fn _lengthVec3u(value: vec3<u32>, outValue: ptr<function, f32>) {
  *outValue = length(vec3<f32>(value));
}
fn _lengthVec4u(value: vec4<u32>, outValue: ptr<function, f32>) {
  *outValue = length(vec4<f32>(value));
}

