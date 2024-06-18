fn transformMat2x2fVec2f(lfs: mat2x2<f32>, rhs: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = lfs * rhs;
}
fn transformMat3x3fVec3f(lfs: mat3x3<f32>, rhs: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = lfs * rhs;
}
fn transformMat4x4fVec4f(lfs: mat4x4<f32>, rhs: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = lfs * rhs;
}
