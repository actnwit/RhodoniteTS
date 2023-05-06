struct VertexOutput {
  @builtin(position) Position : vec4<f32>,
}

@vertex
fn main(
  @location(0) position: vec4<f32>,
) -> VertexOutput {

  var output : VertexOutput;
  output.Position = position;

  return output;
}
