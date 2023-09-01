#pragma shaderity: require(./FlatSingleVertexOutput.wgsl)

@vertex
fn main(
  @location(0) position: vec4<f32>,
) -> VertexOutput {

  var output : VertexOutput;
  output.Position = position;

  return output;
}
