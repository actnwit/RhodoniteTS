/* shaderity: @{definitions} */
#pragma shaderity: require(./PbrSingleVertexOutput.wgsl)
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
#ifdef RN_USE_COLOR_0
  @location(3) color_0: vec2<f32>,
#endif
) -> VertexOutput {

  var output : VertexOutput;

  let cameraSID = u32(get_currentComponentSIDs(0, /* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */));
  let worldMatrix = get_worldMatrix(u32(instance_ids.x));
  let viewMatrix = get_viewMatrix(cameraSID, 0);
  let projectionMatrix = get_projectionMatrix(cameraSID, 0);

  output.position = projectionMatrix * viewMatrix * worldMatrix * vec4<f32>(position, 1.0);

#ifdef RN_USE_NORMAL
  output.normal = normalize((worldMatrix * vec4<f32>(normal, 0.0)).xyz);
#endif

#ifdef RN_USE_TEXCOORD_0
  output.texcoord_0 = texcoord_0;
#endif

#ifdef RN_USE_COLOR_0
  output.color_0 = color_0;
#endif

  // output.Position = vec4<f32>(position, 1.0);

  return output;
}
