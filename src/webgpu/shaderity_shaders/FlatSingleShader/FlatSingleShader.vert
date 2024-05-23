/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

@vertex
fn main(
#pragma shaderity: require(../common/vertexInput.wgsl)
) -> VertexOutput {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var output : VertexOutput;

  let worldMatrix = get_worldMatrix(u32(instance_ids.x));
  let viewMatrix = get_viewMatrix(cameraSID, 0u);
  let projectionMatrix = get_projectionMatrix(cameraSID, 0u);

  output.position = projectionMatrix * viewMatrix * worldMatrix * vec4<f32>(position, 1.0);

#ifdef RN_USE_NORMAL
  output.normal_inWorld = normalize((worldMatrix * vec4<f32>(normal, 0.0)).xyz);
#endif

#ifdef RN_USE_TEXCOORD_0
  output.texcoord_0 = texcoord_0;
#endif

  // output.Position = vec4<f32>(position, 1.0);

  return output;
}
