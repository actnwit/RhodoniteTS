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
#ifdef RN_USE_NORMAL
  @location(1) normal: vec3<f32>,
#endif
#ifdef RN_USE_TANGENT
  @location(2) tangent: vec3<f32>,
#endif
#ifdef RN_USE_TEXCOORD_0
  @location(3) texcoord_0: vec2<f32>,
#endif
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
