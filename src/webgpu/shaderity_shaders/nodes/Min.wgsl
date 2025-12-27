
fn min_F32F32(lhs: f32, rhs: f32, outValue: ptr<function, f32>) {
  *outValue = min(lhs, rhs);
}
fn min_I32I32(lhs: i32, rhs: i32, outValue: ptr<function, i32>) {
  *outValue = min(lhs, rhs);
}
fn min_Vec2fVec2f(lhs: vec2<f32>, rhs: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = min(lhs, rhs);
}
fn min_Vec3fVec3f(lhs: vec3<f32>, rhs: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = min(lhs, rhs);
}
fn min_Vec4fVec4f(lhs: vec4<f32>, rhs: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = min(lhs, rhs);
}

