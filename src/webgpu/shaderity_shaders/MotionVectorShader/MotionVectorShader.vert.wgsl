
/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{processGeometry} */

fn isSameMatrix(a: mat4x4<f32>, b: mat4x4<f32>) -> bool {
  return all(a[0] == b[0]) && all(a[1] == b[1]) && all(a[2] == b[2]) && all(a[3] == b[3]);
}

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
  let worldMatrix = get_worldMatrix(instanceId);
  let previousWorldMatrix = get_previousWorldMatrix(instanceId);
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

  // The same (jittered) position as the color pass, so that the motion vectors cover the same pixels.
  let position_inClip = projectionMatrix * viewMatrix * position_inWorld;
  output.position = position_inClip;

  // VertexOutput is shared by all shaders, so its position_inWorld and color_0 slots carry the clip space
  // positions of this frame (without the jitter) and of the previous frame to the fragment shader.
  // The jitter moves the NDC position by currentJitter, i.e. the clip position by currentJitter * w.
  let currentJitter = get_currentJitter(materialSID, 0);
  output.position_inWorld = position_inClip - vec4<f32>(currentJitter * position_inClip.w, 0.0, 0.0);

  // The previous world position applies the world matrix of the previous frame to the current local
  // (skinned or morphed) position. Deformation by skinning or blend shapes alone does not move it.
  var previousPosition_inWorld = position_inWorld;
  if (!isSameMatrix(previousWorldMatrix, worldMatrix)) {
    previousPosition_inWorld = previousWorldMatrix * (inverse4x4(worldMatrix) * position_inWorld);
  }
  output.color_0 = get_previousViewProjectionMatrix(materialSID, 0) * previousPosition_inWorld;

  return output;
}
