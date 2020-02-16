
void vector3AndScalarToVector4(in vec3 xyz, in float w, out vec4 outValue) {
  outValue.x = xyz.x;
  outValue.y = xyz.y;
  outValue.z = xyz.z;
  outValue.w = w;
}
