#pragma shaderity: require(./FlatSingleVertexOutput.wgsl)

struct StorageData {
  data: array<vec4<f32>>,
}
@binding(0) @group(0) var<storage> storageData : StorageData;

@vertex
fn main(
#ifdef RN_USE_POSITION
  @location(0) position: vec3<f32>,
#endif
#ifdef RN_USE_NORMAL
  @location(1) normal: vec3<f32>,
#endif
#ifdef RN_USE_TANGENT
  @location(2) tangent: vec3<f32>,
#endif
) -> VertexOutput {

  var output : VertexOutput;
  output.Position = vec4<f32>(position, 1.0);

  return output;
}
