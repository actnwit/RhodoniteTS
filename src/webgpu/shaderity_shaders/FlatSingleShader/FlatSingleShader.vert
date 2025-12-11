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

  let instanceId = u32(instance_ids.x);

  let worldMatrix = get_worldMatrix(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID);
  let projectionMatrix = get_projectionMatrix(cameraSID);
  var normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);

  let skeletalComponentSID = i32(instance_ids.y);
  let blendShapeComponentSID = u32(instance_ids.z);

#ifdef RN_USE_NORMAL
#else
  let normal = vec3<f32>(0.0, 0.0, 0.0);
#endif

#ifdef RN_USE_JOINTS_0
  let joint = a_joint;
#else
  let joint = vec4<u32>(0, 0, 0, 0);
#endif
#ifdef RN_USE_WEIGHTS_0
  let weight = a_weight;
#else
  let weight = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif
#ifdef RN_USE_BARY_CENTRIC_COORD
#else
  let baryCentricCoord = vec4<f32>(0.0, 0.0, 0.0, 0.0);
#endif

  // Process Geometry
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

  output.position = projectionMatrix * viewMatrix * position_inWorld;
  output.position_inWorld = position_inWorld;
  output.normal_inWorld = normal_inWorld;

  output.color_0 = vec4f(a_color_0);

#ifdef RN_USE_TEXCOORD_0
  output.texcoord_0 = a_texcoord_0;
#endif

  return output;
}
