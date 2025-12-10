fn _remapF32(value: f32, sourceMin: f32, sourceMax: f32, targetMin: f32, targetMax: f32, outValue: ptr<function, f32>) {
  let t = (value - sourceMin) / (sourceMax - sourceMin);
  *outValue = targetMin + t * (targetMax - targetMin);
}
fn _remapVec2f(value: vec2<f32>, sourceMin: vec2<f32>, sourceMax: vec2<f32>, targetMin: vec2<f32>, targetMax: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  let t = (value - sourceMin) / (sourceMax - sourceMin);
  *outValue = targetMin + t * (targetMax - targetMin);
}
fn _remapVec3f(value: vec3<f32>, sourceMin: vec3<f32>, sourceMax: vec3<f32>, targetMin: vec3<f32>, targetMax: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  let t = (value - sourceMin) / (sourceMax - sourceMin);
  *outValue = targetMin + t * (targetMax - targetMin);
}
fn _remapVec4f(value: vec4<f32>, sourceMin: vec4<f32>, sourceMax: vec4<f32>, targetMin: vec4<f32>, targetMax: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  let t = (value - sourceMin) / (sourceMax - sourceMin);
  *outValue = targetMin + t * (targetMax - targetMin);
}
