
#ifdef RN_IS_SKINNING

highp mat4 createMatrixFromQuaternionTranslationScale( highp vec4 quaternion, highp vec3 translation, highp vec3 scale ) {
  highp vec4 q = quaternion;
  highp vec3 t = translation;

  highp float sx = q.x * q.x;
  highp float sy = q.y * q.y;
  highp float sz = q.z * q.z;
  highp float cx = q.y * q.z;
  highp float cy = q.x * q.z;
  highp float cz = q.x * q.y;
  highp float wx = q.w * q.x;
  highp float wy = q.w * q.y;
  highp float wz = q.w * q.z;

  highp mat4 mat = mat4(
    1.0 - 2.0 * (sy + sz), 2.0 * (cz + wz), 2.0 * (cy - wy), 0.0,
    2.0 * (cz - wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx + wx), 0.0,
    2.0 * (cy + wy), 2.0 * (cx - wx), 1.0 - 2.0 * (sx + sy), 0.0,
    t.x, t.y, t.z, 1.0
  );

  highp mat4 uniformScaleMat = mat4(
    scale.x, 0.0, 0.0, 0.0,
    0.0, scale.y, 0.0, 0.0,
    0.0, 0.0, scale.z, 0.0,
    0.0, 0.0, 0.0, 1.0
  );

  return mat*uniformScaleMat;
}

highp vec4 unpackedVec2ToNormalizedVec4(highp vec2 vec_xy, highp float criteria){

  highp float r;
  highp float g;
  highp float b;
  highp float a;

  highp float ix = floor(vec_xy.x * criteria);
  highp float v1x = ix / criteria;
  highp float v1y = ix - floor(v1x) * criteria;

  r = ( v1x + 1.0 ) / (criteria-1.0);
  g = ( v1y + 1.0 ) / (criteria-1.0);

  highp float iy = floor( vec_xy.y * criteria);
  highp float v2x = iy / criteria;
  highp float v2y = iy - floor(v2x) * criteria;

  b = ( v2x + 1.0 ) / (criteria-1.0);
  a = ( v2y + 1.0 ) / (criteria-1.0);

  r -= 1.0/criteria;
  g -= 1.0/criteria;
  b -= 1.0/criteria;
  a -= 1.0/criteria;

  r = r*2.0-1.0;
  g = g*2.0-1.0;
  b = b*2.0-1.0;
  a = a*2.0-1.0;

  return vec4(r, g, b, a);
}

mat4 getSkinMatrix(uint skeletalComponentSID, uvec4 joint, vec4 weight) {

#ifdef RN_BONE_DATA_TYPE_Mat43x1
  mat4 skinMat = weight.x * mat4(get_boneMatrix(skeletalComponentSID, joint.x));
  skinMat += weight.y * mat4(get_boneMatrix(skeletalComponentSID, joint.y));
  skinMat += weight.z * mat4(get_boneMatrix(skeletalComponentSID, joint.z));
  skinMat += weight.w * mat4(get_boneMatrix(skeletalComponentSID, joint.w));

#elif defined(RN_BONE_DATA_TYPE_VEC4X2)
  vec2 criteria = vec2(4096.0, 4096.0);

  vec4 tq_x = get_boneTranslatePackedQuat(skeletalComponentSID, joint.x);
  vec4 sq_x = get_boneScalePackedQuat(skeletalComponentSID, joint.x);
  vec4 quat = unpackedVec2ToNormalizedVec4(vec2(tq_x.w, sq_x.w), criteria.x);
  mat4 skinMat = weight.x * createMatrixFromQuaternionTranslationScale(quat, tq_x.xyz, sq_x.xyz);

  vec4 tq_y = get_boneTranslatePackedQuat(skeletalComponentSID, joint.y);
  vec4 sq_y = get_boneScalePackedQuat(skeletalComponentSID, joint.y);
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_y.w, sq_y.w), criteria.x);
  skinMat += weight.y * createMatrixFromQuaternionTranslationScale(quat, tq_y.xyz, sq_y.xyz);

  vec4 tq_z = get_boneTranslatePackedQuat(skeletalComponentSID, joint.z);
  vec4 sq_z = get_boneScalePackedQuat(skeletalComponentSID, joint.z);
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_z.w, sq_z.w), criteria.x);
  skinMat += weight.z * createMatrixFromQuaternionTranslationScale(quat, tq_z.xyz, sq_z.xyz);

  vec4 tq_w = get_boneTranslatePackedQuat(skeletalComponentSID, joint.w);
  vec4 sq_w = get_boneScalePackedQuat(skeletalComponentSID, joint.w);
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_w.w, sq_w.w), criteria.x);
  skinMat += weight.w * createMatrixFromQuaternionTranslationScale(quat, tq_w.xyz, sq_w.xyz);

#elif defined(RN_BONE_DATA_TYPE_VEC4X2_OLD)
  vec4 ts_x = get_boneTranslateScale(skeletalComponentSID, joint.x);
  mat4 skinMat = weight.x * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, joint.x), ts_x.xyz, vec3(ts_x.w));
  vec4 ts_y = get_boneTranslateScale(skeletalComponentSID, joint.y);
  skinMat += weight.y * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, joint.y), ts_y.xyz, vec3(ts_y.w));
  vec4 ts_z = get_boneTranslateScale(skeletalComponentSID, joint.z);
  skinMat += weight.z * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, joint.z), ts_z.xyz, vec3(ts_z.w));
  vec4 ts_w = get_boneTranslateScale(skeletalComponentSID, joint.w);
  skinMat += weight.w * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, joint.w), ts_w.xyz, vec3(ts_w.w));

#elif defined(RN_BONE_DATA_TYPE_VEC4X1)
  vec4 boneCompressedChunksX = get_boneCompressedChunk(skeletalComponentSID, joint.x);
  vec4 boneCompressedChunksY = get_boneCompressedChunk(skeletalComponentSID, joint.y);
  vec4 boneCompressedChunksZ = get_boneCompressedChunk(skeletalComponentSID, joint.z);
  vec4 boneCompressedChunksW = get_boneCompressedChunk(skeletalComponentSID, joint.w);

  vec2 criteria = vec2(4096.0, 4096.0);
  vec4 boneCompressedInfo = get_boneCompressedInfo(0u, 0u);

  vec4 ts_x = unpackedVec2ToNormalizedVec4(boneCompressedChunksX.zw, criteria.y)*boneCompressedInfo;
  mat4 skinMat = weight.x * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksX.xy, criteria.x), ts_x.xyz, vec3(ts_x.w));
  vec4 ts_y = unpackedVec2ToNormalizedVec4(boneCompressedChunksY.zw, criteria.y)*boneCompressedInfo;
  skinMat += weight.y * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksY.xy, criteria.x), ts_y.xyz, vec3(ts_y.w));
  vec4 ts_z = unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.zw, criteria.y)*boneCompressedInfo;
  skinMat += weight.z * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.xy, criteria.x), ts_z.xyz, vec3(ts_z.w));
  vec4 ts_w = unpackedVec2ToNormalizedVec4(boneCompressedChunksW.zw, criteria.y)*boneCompressedInfo;
  skinMat += weight.w * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksW.xy, criteria.x), ts_w.xyz, vec3(ts_w.w));
#endif
  return skinMat;
}

mat3 toNormalMatrix(mat4 m) {
  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
  a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
  a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
  a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3];

  float b00 = a00 * a11 - a01 * a10,
  b01 = a00 * a12 - a02 * a10,
  b02 = a00 * a13 - a03 * a10,
  b03 = a01 * a12 - a02 * a11,
  b04 = a01 * a13 - a03 * a11,
  b05 = a02 * a13 - a03 * a12,
  b06 = a20 * a31 - a21 * a30,
  b07 = a20 * a32 - a22 * a30,
  b08 = a20 * a33 - a23 * a30,
  b09 = a21 * a32 - a22 * a31,
  b10 = a21 * a33 - a23 * a31,
  b11 = a22 * a33 - a23 * a32;

  float determinantVal = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat3(
    a11 * b11 - a12 * b10 + a13 * b09, a12 * b08 - a10 * b11 - a13 * b07, a10 * b10 - a11 * b08 + a13 * b06,
    a02 * b10 - a01 * b11 - a03 * b09, a00 * b11 - a02 * b08 + a03 * b07, a01 * b08 - a00 * b10 - a03 * b06,
    a31 * b05 - a32 * b04 + a33 * b03, a32 * b02 - a30 * b05 - a33 * b01, a30 * b04 - a31 * b02 + a33 * b00) / determinantVal;
}

bool skinning(
  in uint skeletalComponentSID,
  in uvec4 joint,
  in vec4 weight,
  in mat4 worldMatrix,
  in mat3 inNormalMatrix,
  out mat3 outNormalMatrix,
  in vec3 inPosition_inLocal,
  out vec4 outPosition_inWorld,
  in vec3 inNormal_inLocal,
  out vec3 outNormal_inWorld
  )
{
  mat4 skinMat = getSkinMatrix(skeletalComponentSID, joint, weight);
  outPosition_inWorld = worldMatrix * skinMat * vec4(inPosition_inLocal, 1.0);
  outNormalMatrix = toNormalMatrix(worldMatrix * skinMat);
  outNormal_inWorld = normalize(outNormalMatrix * inNormal_inLocal);

  return true;
}
#endif

bool processGeometry(
  in mat4 worldMatrix,
  in mat3 inNormalMatrix,
  in mat4 viewMatrix,
  in vec4 inPosition_inLocal,
  in vec3 inNormal_inLocal,
  in uvec4 joint,
  in vec4 weight,
  in bool isBillboard,
  out mat3 outNormalMatrix,
  out vec4 outPosition_inWorld,
  out vec3 outNormal_inWorld
) {
  bool isSkinning = false;

  vec3 position_inLocal;
#ifdef RN_IS_MORPHING
  int blendShapeComponentSID = int(a_instanceIds.z);
  if (blendShapeComponentSID == -1) {
#endif
    position_inLocal = inPosition_inLocal.xyz;
#ifdef RN_IS_MORPHING
  } else {
    uint vertexIdx = uint(a_baryCentricCoord.w);
    position_inLocal = get_position(vertexIdx, inPosition_inLocal.xyz, uint(blendShapeComponentSID));
  }
#endif

  mat4 worldMatrixInner = worldMatrix;
  if (isBillboard) {
    mat4 inverseViewMatrix = inverse(viewMatrix);
    inverseViewMatrix[3][0] = 0.0;//worldMatrix[3][0];
    inverseViewMatrix[3][1] = 0.0;//worldMatrix[3][1];
    inverseViewMatrix[3][2] = 0.0;//worldMatrix[3][2];
    worldMatrixInner = inverseViewMatrix * worldMatrix;
  }

#ifdef RN_IS_SKINNING
  #ifdef RN_IS_DATATEXTURE_MODE
    uint skeletalComponentSID = a_instanceIds.y;
  #else
    uint skeletalComponentSID = uint(get_skinningMode(0u, 0u));
  #endif
  if (skeletalComponentSID != INVALID_ID) {
    isSkinning = skinning(skeletalComponentSID, joint, weight, worldMatrixInner, inNormalMatrix, outNormalMatrix, position_inLocal, outPosition_inWorld, inNormal_inLocal, outNormal_inWorld);
  } else {
#endif
    outNormalMatrix = inNormalMatrix;
    outPosition_inWorld = worldMatrixInner * vec4(position_inLocal, 1.0);
    outNormal_inWorld = normalize(inNormalMatrix * inNormal_inLocal);
#ifdef RN_IS_SKINNING
  }
#endif

  return isSkinning;
}
