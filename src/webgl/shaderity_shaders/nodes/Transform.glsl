void transform(in mat2 lfs, in vec2 rhs, out vec2 outValue) {
  outValue = lfs * rhs;
}
void transform(in mat3 lfs, in vec3 rhs, out vec3 outValue) {
  outValue = lfs * rhs;
}
void transform(in mat4 lfs, in vec4 rhs, out vec4 outValue) {
  outValue = lfs * rhs;
}
