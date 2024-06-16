
void multiplyF32F32(lfs: f32, rhs: f32, outValue: ptr<function, f32>) {
  *outValue = lfs * rhs;
}
void multiplyI32I32(lfs: i32, rhs: i32, outValue: ptr<function, i32>) {
  *outValue = lfs * rhs;
}
void multiplyMat2x2fMat2x2f(in mat2 lfs, in mat2 rhs, out mat2 outValue) {
  *outValue = lfs * rhs;
}
void multiplyMat3x3fMat3x3f(in mat3 lfs, in mat3 rhs, out mat3 outValue) {
  *outValue = lfs * rhs;
}
void multiplyMat4x4fMat4x4f(in mat4 lfs, in mat4 rhs, out mat4 outValue) {
  *outValue = lfs * rhs;
}
void multiplyMat3x3fVec3f(in mat3 lfs, in vec3 rhs, out vec3 outValue) {
  *outValue = lfs * rhs;
}
void multiplyMat4x4fVec4f(in mat4 lfs, in vec4 rhs, out vec4 outValue) {
  *outValue = lfs * rhs;
}
