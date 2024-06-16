
fn worldMatrix(outValue: ptr<function, mat4x4<f32>>) {
  *outValue = get_worldMatrix(a_instanceIds.x);
}
