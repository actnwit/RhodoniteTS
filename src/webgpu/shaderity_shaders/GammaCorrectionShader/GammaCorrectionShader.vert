/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

@vertex
fn main(
#pragma shaderity: require(../common/vertexInput.wgsl)
) -> VertexOutput {
  var output : VertexOutput;
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

#pragma shaderity: require(../common/simpleMVPPosition.wgsl)

  output.texcoord_0 = texcoord_0;
  output.texcoord_0.y = 1.0 - output.texcoord_0.y;

  return output;

}
