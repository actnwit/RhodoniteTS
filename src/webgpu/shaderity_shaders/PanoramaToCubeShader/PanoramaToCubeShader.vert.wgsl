/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

@vertex
fn main(
  @builtin(vertex_index) vertexIdx : u32,
) -> VertexOutput {
  var output : VertexOutput;
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

#pragma shaderity: require(../common/fullscreen.wgsl)

  return output;

}

