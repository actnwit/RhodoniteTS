
/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */
/* shaderity: @{processGeometry} */

#ifdef RN_IS_SKINNING
// The matrix of one joint decoded from the bone data of the previous frame (see getBoneMatrix in processGeometry)
fn getPreviousBoneMatrix(skeletalComponentSID: u32, jointIdx: u32, boneDataType: i32, boneDataInfo: vec4<f32>) -> mat4x4<f32> {
  let chunkCount = boneDataChunkCountOfJoint(boneDataType);
  let base = jointIdx * chunkCount;
  let c0 = get_previousBoneData(skeletalComponentSID, base);
  var c1 = vec4<f32>(0.0);
  var c2 = vec4<f32>(0.0);
  if (chunkCount >= 2u) {
    c1 = get_previousBoneData(skeletalComponentSID, base + 1u);
  }
  if (chunkCount >= 3u) {
    c2 = get_previousBoneData(skeletalComponentSID, base + 2u);
  }
  return decodeBoneMatrix(boneDataType, c0, c1, c2, boneDataInfo);
}

// The skinning matrix of the previous frame. The previous bone data info has w = -1 until the skeleton has
// previous bone data; the current skinning matrix is used then.
fn getPreviousSkinMatrix(skeletalComponentSID: u32, joint: vec4<u32>, weight: vec4<f32>) -> mat4x4<f32> {
  let boneDataInfo = get_previousBoneDataInfo(skeletalComponentSID);
  if (boneDataInfo.w < 0.0) {
    return getSkinMatrix(skeletalComponentSID, joint, weight);
  }
  let boneDataType = i32(boneDataInfo.w + 0.5);
  var skinMat: mat4x4<f32> = weight.x * getPreviousBoneMatrix(skeletalComponentSID, joint.x, boneDataType, boneDataInfo);
  skinMat += weight.y * getPreviousBoneMatrix(skeletalComponentSID, joint.y, boneDataType, boneDataInfo);
  skinMat += weight.z * getPreviousBoneMatrix(skeletalComponentSID, joint.z, boneDataType, boneDataInfo);
  skinMat += weight.w * getPreviousBoneMatrix(skeletalComponentSID, joint.w, boneDataType, boneDataInfo);
  return skinMat;
}
#endif

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

  // The previous world position: the vertex deformed by the blend shape weights and the bone data of the previous
  // frame, transformed by the world matrix of the previous frame. It is computed from the vertex attributes even
  // when the current position comes from the vertices deformed by the compute shader of the GPU culling.
  var previousPosition_inWorld: vec4<f32>;
  if (isBillboard) {
    // A billboard faces the camera of each frame: only the motion of its world matrix is considered.
    previousPosition_inWorld = previousWorldMatrix * (inverse4x4(worldMatrix) * position_inWorld);
  } else {
    var previousPosition_inLocal = position.xyz;
#ifdef RN_IS_MORPHING
    if (uniformDrawParameters.morphTargetNumber != 0u) {
      previousPosition_inLocal = get_previousMorphedPosition(u32(a_baryCentricCoord.w), position.xyz, blendShapeComponentSID);
    }
#endif
    var previousLocalToWorld = previousWorldMatrix;
#ifdef RN_IS_SKINNING
    if (instanceIds.y != INVALID_ID) {
      previousLocalToWorld = previousWorldMatrix * getPreviousSkinMatrix(instanceIds.y, joint, weight);
    }
#endif
    previousPosition_inWorld = previousLocalToWorld * vec4<f32>(previousPosition_inLocal, 1.0);
  }
  output.color_0 = get_previousViewProjectionMatrix(materialSID, 0) * previousPosition_inWorld;

  return output;
}
