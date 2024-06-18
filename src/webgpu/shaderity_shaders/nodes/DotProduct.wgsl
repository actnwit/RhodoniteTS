fn dotProductVec2f(lfs: vec2<f32>, rhs: vec2<f32>, outValue: ptr<function, f32>) {
  *outValue = dot(lfs, rhs);
}
fn dotProductVec3f(lfs: vec3<f32>, rhs: vec3<f32>, outValue: ptr<function, f32>) {
  *outValue = dot(lfs, rhs);
}
fn dotProductVec4f(lfs: vec4<f32>, rhs: vec4<f32>, outValue: ptr<function, f32>) {
  *outValue = dot(lfs, rhs);
}
