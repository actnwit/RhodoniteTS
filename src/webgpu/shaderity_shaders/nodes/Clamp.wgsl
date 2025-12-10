fn _clampF32(value: f32, min: f32, max: f32, outValue: ptr<function, f32>) {
  *outValue = clamp(value, min, max);
}
fn _clampVec2f(value: vec2<f32>, min: vec2<f32>, max: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = clamp(value, min, max);
}
fn _clampVec3f(value: vec3<f32>, min: vec3<f32>, max: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = clamp(value, min, max);
}
fn _clampVec4f(value: vec4<f32>, min: vec4<f32>, max: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = clamp(value, min, max);
}
