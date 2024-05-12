/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

@vertex
fn main(
#ifdef RN_USE_INSTANCE
  @location(8) instance_ids: vec4<f32>,
#endif
#ifdef RN_USE_POSITION
  @location(0) position: vec3<f32>,
#endif
#ifdef RN_USE_TEXCOORD_0
  @location(3) texcoord_0: vec2<f32>,
#endif
) -> VertexOutput {
  var output : VertexOutput;
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

#pragma shaderity: require(../common/simpleMVPPosition.wgsl)

  output.texcoord_0 = texcoord_0;
  output.texcoord_0.y = 1.0 - output.texcoord_0.y;

  return output;

}
