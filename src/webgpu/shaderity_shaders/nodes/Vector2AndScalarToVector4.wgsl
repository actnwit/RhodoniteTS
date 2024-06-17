
fn vector2AndScalarToVector4(xy: vec2<f32>, z: f32, w: f32, outValue: ptr<function, vec4<f32>>) {
  (*outValue).x = xy.x;
  (*outValue).y = xy.y;
  (*outValue).z = z;
  (*outValue).w = w;
}
