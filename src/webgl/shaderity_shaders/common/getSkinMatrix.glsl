
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

mat4 getSkinMatrix(float skeletalComponentSID) {

#ifdef RN_BONE_DATA_TYPE_MAT4X4
  mat4 skinMat = a_weight.x * get_boneMatrix(skeletalComponentSID, int(a_joint.x));
  skinMat += a_weight.y * get_boneMatrix(skeletalComponentSID, int(a_joint.y));
  skinMat += a_weight.z * get_boneMatrix(skeletalComponentSID, int(a_joint.z));
  skinMat += a_weight.w * get_boneMatrix(skeletalComponentSID, int(a_joint.w));

#elif defined(RN_BONE_DATA_TYPE_VEC4X2)
  vec2 criteria = vec2(4096.0, 4096.0);

  vec4 tq_x = get_boneTranslatePackedQuat(skeletalComponentSID, int(a_joint.x));
  vec4 sq_x = get_boneScalePackedQuat(skeletalComponentSID, int(a_joint.x));
  vec4 quat = unpackedVec2ToNormalizedVec4(vec2(tq_x.w, sq_x.w), criteria.x);
  mat4 skinMat = a_weight.x * createMatrixFromQuaternionTranslationScale(quat, tq_x.xyz, sq_x.xyz);

  vec4 tq_y = get_boneTranslatePackedQuat(skeletalComponentSID, int(a_joint.y));
  vec4 sq_y = get_boneScalePackedQuat(skeletalComponentSID, int(a_joint.y));
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_y.w, sq_y.w), criteria.x);
  skinMat += a_weight.y * createMatrixFromQuaternionTranslationScale(quat, tq_y.xyz, sq_y.xyz);

  vec4 tq_z = get_boneTranslatePackedQuat(skeletalComponentSID, int(a_joint.z));
  vec4 sq_z = get_boneScalePackedQuat(skeletalComponentSID, int(a_joint.z));
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_z.w, sq_z.w), criteria.x);
  skinMat += a_weight.z * createMatrixFromQuaternionTranslationScale(quat, tq_z.xyz, sq_z.xyz);

  vec4 tq_w = get_boneTranslatePackedQuat(skeletalComponentSID, int(a_joint.w));
  vec4 sq_w = get_boneScalePackedQuat(skeletalComponentSID, int(a_joint.w));
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_w.w, sq_w.w), criteria.x);
  skinMat += a_weight.w * createMatrixFromQuaternionTranslationScale(quat, tq_w.xyz, sq_w.xyz);

#elif defined(RN_BONE_DATA_TYPE_VEC4X2_OLD)
  vec4 ts_x = get_boneTranslateScale(skeletalComponentSID, int(a_joint.x));
  mat4 skinMat = a_weight.x * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, int(a_joint.x)), ts_x.xyz, vec3(ts_x.w));
  vec4 ts_y = get_boneTranslateScale(skeletalComponentSID, int(a_joint.y));
  skinMat += a_weight.y * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, int(a_joint.y)), ts_y.xyz, vec3(ts_y.w));
  vec4 ts_z = get_boneTranslateScale(skeletalComponentSID, int(a_joint.z));
  skinMat += a_weight.z * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, int(a_joint.z)), ts_z.xyz, vec3(ts_z.w));
  vec4 ts_w = get_boneTranslateScale(skeletalComponentSID, int(a_joint.w));
  skinMat += a_weight.w * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, int(a_joint.w)), ts_w.xyz, vec3(ts_w.w));

#elif defined(RN_BONE_DATA_TYPE_VEC4X1)
  vec4 boneCompressedChunksX = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.x));
  vec4 boneCompressedChunksY = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.y));
  vec4 boneCompressedChunksZ = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.z));
  vec4 boneCompressedChunksW = get_boneCompressedChunk(skeletalComponentSID, int(a_joint.w));

  vec2 criteria = vec2(4096.0, 4096.0);
  vec4 boneCompressedInfo = get_boneCompressedInfo(0.0, 0);

  vec4 ts_x = unpackedVec2ToNormalizedVec4(boneCompressedChunksX.zw, criteria.y)*boneCompressedInfo;
  mat4 skinMat = a_weight.x * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksX.xy, criteria.x), ts_x.xyz, vec3(ts_x.w));
  vec4 ts_y = unpackedVec2ToNormalizedVec4(boneCompressedChunksY.zw, criteria.y)*boneCompressedInfo;
  skinMat += a_weight.y * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksY.xy, criteria.x), ts_y.xyz, vec3(ts_y.w));
  vec4 ts_z = unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.zw, criteria.y)*boneCompressedInfo;
  skinMat += a_weight.z * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.xy, criteria.x), ts_z.xyz, vec3(ts_z.w));
  vec4 ts_w = unpackedVec2ToNormalizedVec4(boneCompressedChunksW.zw, criteria.y)*boneCompressedInfo;
  skinMat += a_weight.w * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksW.xy, criteria.x), ts_w.xyz, vec3(ts_w.w));
#endif
  return skinMat;
}
#endif
