fn scalarToVector4(x: f32, y: f32, z: f32, w: f32, outValue: ptr<function, vec4<f32>>) {
  (*outValue).x = x;
  (*outValue).y = y;
  (*outValue).z = z;
  (*outValue).w = w;
}
