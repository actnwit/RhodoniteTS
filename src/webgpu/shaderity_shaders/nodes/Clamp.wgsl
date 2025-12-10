fn _clampF32(value: f32, minVal: f32, maxVal: f32, outValue: ptr<function, f32>) {
  *outValue = clamp(value, minVal, maxVal);
}
fn _clampVec2f(value: vec2<f32>, minVal: vec2<f32>, maxVal: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = clamp(value, minVal, maxVal);
}
fn _clampVec3f(value: vec3<f32>, minVal: vec3<f32>, maxVal: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = clamp(value, minVal, maxVal);
}
fn _clampVec4f(value: vec4<f32>, minVal: vec4<f32>, maxVal: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = clamp(value, minVal, maxVal);
}
