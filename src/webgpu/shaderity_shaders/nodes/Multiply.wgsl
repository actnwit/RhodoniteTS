fn multiplyF32F32(lfs: f32, rhs: f32, outValue: ptr<function, f32>) {
  *outValue = lfs * rhs;
}
fn multiplyI32I32(lfs: i32, rhs: i32, outValue: ptr<function, i32>) {
  *outValue = lfs * rhs;
}
fn multiplyMat2x2fMat2x2f(lfs: mat2x2<f32>, rhs: mat2x2<f32>, outValue: ptr<function, mat2x2<f32>>) {
  *outValue = lfs * rhs;
}
fn multiplyMat3x3fMat3x3f(lfs: mat3x3<f32>, rhs: mat3x3<f32>, outValue: ptr<function, mat3x3<f32>>) {
  *outValue = lfs * rhs;
}
fn multiplyMat4x4fMat4x4f(lfs: mat4x4<f32>, rhs: mat4x4<f32>, outValue: ptr<function, mat4x4<f32>>) {
  *outValue = lfs * rhs;
}
fn multiplyMat3x3fVec3f(lfs: mat3x3<f32>, rhs: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = lfs * rhs;
}
fn multiplyMat4x4fVec4f(lfs: mat4x4<f32>, rhs: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = lfs * rhs;
}
