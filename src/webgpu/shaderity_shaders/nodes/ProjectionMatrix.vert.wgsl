
fn projectionMatrix(outValue: ptr<function, mat4x4<f32>>) {
  *outValue = get_projectionMatrix(a_instanceIds.x);
}