fn vector3AndScalarToVector4(xyz: vec3<f32>, w: f32, outValue: ptr<function, vec4<f32>>) {
  (*outValue).x = xyz.x;
  (*outValue).y = xyz.y;
  (*outValue).z = xyz.z;
  (*outValue).w = w;
}
