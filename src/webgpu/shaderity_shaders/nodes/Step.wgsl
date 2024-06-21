fn _stepF32(value: f32, edge: f32, outValue: ptr<function, f32>) {
  *outValue = step(edge, value);
}
fn _stepVec2f(value: vec2<f32>, edge: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = step(edge, value);
}
fn _stepVec3f(value: vec3<f32>, edge: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = step(edge, value);
}
fn _stepVec4f(value: vec4<f32>, edge: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = step(edge, value);
}
