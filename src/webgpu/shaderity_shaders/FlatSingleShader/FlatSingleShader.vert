/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

@vertex
fn main(
/* shaderity: @{vertexInput} */
) -> VertexOutput {
/* shaderity: @{mainPrerequisites} */

  var output : VertexOutput;

  let worldMatrix = get_worldMatrix(u32(instance_ids.x));
  let viewMatrix = get_viewMatrix(cameraSID);
  let projectionMatrix = get_projectionMatrix(cameraSID);

  output.position = projectionMatrix * viewMatrix * worldMatrix * position;

#ifdef RN_USE_NORMAL
  output.normal_inWorld = normalize((worldMatrix * vec4<f32>(normal, 0.0)).xyz);
#endif

#ifdef RN_USE_TEXCOORD_0
  output.texcoord_0 = texcoord_0;
#endif

  output.color_0 = vec4f(a_color_0);

  return output;
}
