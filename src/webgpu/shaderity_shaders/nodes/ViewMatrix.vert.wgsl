
fn viewMatrix(outValue: ptr<function, mat4x4<f32>>) {
  *outValue = get_viewMatrix(a_instanceIds.x);
}