
#ifdef RN_IS_SKINNING
bool skinning(
  float skeletalComponentSID,
  in mat3 inNormalMatrix,
  out mat3 outNormalMatrix,
  in vec3 inPosition_inLocal,
  out vec4 outPosition_inWorld,
  in vec3 inNormal_inLocal,
  out vec3 outNormal_inWorld
  )
{
  mat4 skinMat = getSkinMatrix(skeletalComponentSID);
  outPosition_inWorld = skinMat * vec4(inPosition_inLocal, 1.0);
  outNormalMatrix = toNormalMatrix(skinMat);
  outNormal_inWorld = normalize(outNormalMatrix * inNormal_inLocal);

  return true;
}
#endif

bool processGeometryWithMorphingAndSkinning(
  float skeletalComponentSID,
  in mat4 worldMatrix,
  in mat3 inNormalMatrix,
  out mat3 outNormalMatrix,
  in vec3 inPosition_inLocal,
  out vec4 outPosition_inWorld,
  in vec3 inNormal_inLocal,
  out vec3 outNormal_inWorld
) {
  bool isSkinning = false;

  vec3 position_inLocal;
#ifdef RN_IS_MORPHING
  if (u_morphTargetNumber == 0) {
#endif
    position_inLocal = inPosition_inLocal;
#ifdef RN_IS_MORPHING
  } else {
    float vertexIdx = a_baryCentricCoord.w;
    position_inLocal = get_position(vertexIdx, inPosition_inLocal);
  }
#endif


#ifdef RN_IS_SKINNING
  if (skeletalComponentSID >= 0.0) {
    isSkinning = skinning(skeletalComponentSID, inNormalMatrix, outNormalMatrix, position_inLocal, outPosition_inWorld, inNormal_inLocal, outNormal_inWorld);
  } else {
#endif
    outNormalMatrix = inNormalMatrix;
    outPosition_inWorld = worldMatrix * vec4(position_inLocal, 1.0);
    outNormal_inWorld = normalize(inNormalMatrix * inNormal_inLocal);
#ifdef RN_IS_SKINNING
  }
#endif

  return isSkinning;
}
