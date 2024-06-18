
fn worldMatrix(outValue: ptr<function, mat4x4<f32>>) {
  *outValue = get_worldMatrix(u32(a_instanceIds.x));
}
