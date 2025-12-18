/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{processGeometry} */

@vertex
fn main(
/* shaderity: @{vertexInput} */
) -> VertexOutput {
/* shaderity: @{mainPrerequisites} */
  var output : VertexOutput;

#ifdef RN_USE_NORMAL
#else
  let normal = vec3<f32>(0.0, 0.0, 0.0);
#endif

#ifdef RN_USE_JOINTS_0
  let joint = joints_0;
#else
  let joint = vec4<u32>(0, 0, 0, 0);
#endif
#ifdef RN_USE_WEIGHTS_0
  let weight = weights_0;
#else
  let weight = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif
#ifdef RN_USE_BARY_CENTRIC_COORD
#else
  let baryCentricCoord = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif

  let instanceId = u32(instanceIds.x);
  let worldMatrix = get_worldMatrix(u32(instanceIds.x));
  var normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID);
  let skeletalComponentSID = i32(instanceIds.y);
  let blendShapeComponentSID = u32(instanceIds.z);

  var position_inWorld = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  var normal_inWorld = vec3<f32>(0.0, 0.0, 0.0);
  let isSkinning = processGeometry(
    worldMatrix,
    normalMatrix,
    viewMatrix,
    position,
    normal,
    joint,
    weight,
    isBillboard,
    &normalMatrix,
    &position_inWorld,
    &normal_inWorld
  );

  let projectionMatrix = get_projectionMatrix(cameraSID);

  output.position = projectionMatrix * viewMatrix * position_inWorld;
  output.normal_inWorld = normal_inWorld;
  output.position_inWorld = position_inWorld;

  return output;
}
