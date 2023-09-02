struct StorageData {
  data: array<vec4<f32>>,
}
@binding(0) @group(0) var<storage> storageData : StorageData;

@fragment
fn main(
) -> @location(0) vec4<f32> {
  return vec4<f32>(1, 0, 0, 1);
}
