
fn normalMatrix(outValue: ptr<function, mat3x3<f32>>) {
  *outValue = get_normalMatrix(u32(a_instanceIds.x));
}
