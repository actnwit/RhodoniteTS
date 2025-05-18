/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{processGeometry} */

@vertex
fn main(
#pragma shaderity: require(../common/vertexInput.wgsl)
) -> VertexOutput {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)
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

  let instanceId = u32(instance_ids.x);
  let worldMatrix = get_worldMatrix(u32(instance_ids.x));
  let normalMatrix = get_normalMatrix(instanceId);
  let isBillboard = get_isBillboard(instanceId);
  let viewMatrix = get_viewMatrix(cameraSID, 0u);
  let skeletalComponentSID = i32(instance_ids.y);
  let blendShapeComponentSID = u32(instance_ids.z);

  let geom = processGeometry(
    skeletalComponentSID,
    blendShapeComponentSID,
    worldMatrix,
    viewMatrix,
    isBillboard,
    normalMatrix,
    position,
    normal,
    baryCentricCoord,
    joint,
    weight
  );

  let projectionMatrix = get_projectionMatrix(cameraSID, 0u);

  output.position = projectionMatrix * viewMatrix * geom.position_inWorld;

  return output;
}
