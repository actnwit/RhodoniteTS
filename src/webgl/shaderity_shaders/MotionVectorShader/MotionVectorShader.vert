
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */

uniform float u_pointSize; // initialValue=30, soloDatum=true
uniform vec3 u_pointDistanceAttenuation; // initialValue=(0.0, 0.1, 0.01), soloDatum=true

// Clip space positions of this frame (without the jitter) and of the previous frame.
out vec4 v_currentPosition_inClip;
out vec4 v_previousPosition_inClip;

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

#ifdef RN_IS_SKINNING
// The matrix of one joint decoded from the bone data of the previous frame (see getBoneMatrix in processGeometry)
mat4 getPreviousBoneMatrix(uint skeletalComponentSID, uint jointIdx, int boneDataType, vec4 boneDataInfo) {
  if (boneDataType == RN_BONE_DATA_TYPE_MAT43X1) {
    vec4 a = get_previousBoneData(skeletalComponentSID, jointIdx * 3u);
    vec4 b = get_previousBoneData(skeletalComponentSID, jointIdx * 3u + 1u);
    vec4 c = get_previousBoneData(skeletalComponentSID, jointIdx * 3u + 2u);
    return mat4(
      a.x, a.y, a.z, 0.0,
      a.w, b.x, b.y, 0.0,
      b.z, b.w, c.x, 0.0,
      c.y, c.z, c.w, 1.0
    );
  } else if (boneDataType == RN_BONE_DATA_TYPE_VEC4X2) {
    vec4 tq = get_previousBoneData(skeletalComponentSID, jointIdx * 2u);
    vec4 sq = get_previousBoneData(skeletalComponentSID, jointIdx * 2u + 1u);
    vec4 quat = decodeLogQuat(uvec2(floatBitsToUint(tq.w), floatBitsToUint(sq.w)));
    return createMatrixFromQuaternionTranslationScale(quat, tq.xyz, sq.xyz);
  } else {
    uvec4 chunk = floatBitsToUint(get_previousBoneData(skeletalComponentSID, jointIdx));
    vec4 ts = unpackVec4FromUvec2(chunk.zw);
    vec3 translation = ts.xyz * boneDataInfo.xyz;
    float scale = decodeVec4x1Scale(ts.w, chunk.y);
    return createMatrixFromQuaternionTranslationScale(decodeLogQuat(chunk.xy), translation, vec3(scale));
  }
}

// The skinning matrix of the previous frame. The previous bone data info has w = -1 until the skeleton has
// previous bone data; the current skinning matrix is used then.
mat4 getPreviousSkinMatrix(uint skeletalComponentSID, uvec4 joint, vec4 weight) {
  vec4 boneDataInfo = get_previousBoneDataInfo(skeletalComponentSID);
  if (boneDataInfo.w < 0.0) {
    return getSkinMatrix(skeletalComponentSID, joint, weight);
  }
  int boneDataType = int(boneDataInfo.w + 0.5);
  mat4 skinMat = weight.x * getPreviousBoneMatrix(skeletalComponentSID, joint.x, boneDataType, boneDataInfo);
  skinMat += weight.y * getPreviousBoneMatrix(skeletalComponentSID, joint.y, boneDataType, boneDataInfo);
  skinMat += weight.z * getPreviousBoneMatrix(skeletalComponentSID, joint.z, boneDataType, boneDataInfo);
  skinMat += weight.w * getPreviousBoneMatrix(skeletalComponentSID, joint.w, boneDataType, boneDataInfo);
  return skinMat;
}
#endif

void main()
{

/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(uint(a_instanceIds.x));
  mat4 previousWorldMatrix = get_previousWorldMatrix(uint(a_instanceIds.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  mat3 normalMatrix = get_normalMatrix(uint(a_instanceIds.x));
  bool isBillboard = get_isBillboard(uint(a_instanceIds.x));

  v_color = a_color;

  bool isSkinning = false;

  isSkinning = processGeometry(
    worldMatrix,
    normalMatrix,
    viewMatrix,
    a_position,
    a_normal,
    uvec4(a_joint),
    a_weight,
    isBillboard,
    normalMatrix,
    v_position_inWorld,
    v_normal_inWorld
  );

  // The same (jittered) position as the color pass, so that the motion vectors cover the same pixels.
  vec4 position_inClip = projectionMatrix * viewMatrix * v_position_inWorld;
  gl_Position = position_inClip;

  // The jitter moves the NDC position by currentJitter, i.e. the clip position by currentJitter * w.
  vec2 currentJitter = get_currentJitter(materialSID, 0u);
  v_currentPosition_inClip = position_inClip - vec4(currentJitter * position_inClip.w, 0.0, 0.0);

  // The previous world position: the vertex deformed by the blend shape weights and the bone data of the previous
  // frame, transformed by the world matrix of the previous frame.
  vec4 previousPosition_inWorld;
  if (isBillboard) {
    // A billboard faces the camera of each frame: only the motion of its world matrix is considered.
    previousPosition_inWorld = previousWorldMatrix * (inverse(worldMatrix) * v_position_inWorld);
  } else {
    vec3 previousPosition_inLocal = a_position.xyz;
#ifdef RN_IS_MORPHING
    int blendShapeComponentSID = int(a_instanceIds.z);
    if (blendShapeComponentSID != -1) {
      previousPosition_inLocal = get_previousMorphedPosition(uint(a_baryCentricCoord.w), a_position.xyz, uint(blendShapeComponentSID));
    }
#endif
    mat4 previousLocalToWorld = previousWorldMatrix;
#ifdef RN_IS_SKINNING
    if (skeletalComponentSID != INVALID_ID) {
      previousLocalToWorld = previousWorldMatrix * getPreviousSkinMatrix(skeletalComponentSID, uvec4(a_joint), a_weight);
    }
#endif
    previousPosition_inWorld = previousLocalToWorld * vec4(previousPosition_inLocal, 1.0);
  }
  v_previousPosition_inClip = get_previousViewProjectionMatrix(materialSID, 0u) * previousPosition_inWorld;

  bool visibility = get_isVisible(uint(a_instanceIds.x));
  if (!visibility)
  {
    gl_Position = vec4(0.0);
  }
}
