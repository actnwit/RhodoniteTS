#pragma shaderity: require(./FlatSingleVertexOutput.wgsl)
struct StorageData {
  data: array<vec4<f32>>,
}
@binding(0) @group(0) var<storage> storageData : StorageData;

#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
  var Normal = input.Normal * 0.5 + 0.5;
  return vec4<f32>(Normal.x, Normal.y, Normal.z, 1);
}
