fn _atan2F32(y: f32, x: f32, outValue: ptr<function, f32>) {
  *outValue = atan2(y, x);
}
fn _atan2Vec2f(y: vec2<f32>, x: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = atan2(y, x);
}
fn _atan2Vec3f(y: vec3<f32>, x: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = atan2(y, x);
}
fn _atan2Vec4f(y: vec4<f32>, x: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = atan2(y, x);
}
