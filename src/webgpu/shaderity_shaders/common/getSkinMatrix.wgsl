
#ifdef RN_IS_SKINNING

fn createMatrixFromQuaternionTranslationScale( quaternion: vec4<f32>, translation: vec3<f32>, scale: vec3<f32> ) -> mat4x3<f32> {
  let q = quaternion;
  let t = translation;

  let sx = q.x * q.x;
  let sy = q.y * q.y;
  let sz = q.z * q.z;
  let cx = q.y * q.z;
  let cy = q.x * q.z;
  let cz = q.x * q.y;
  let wx = q.w * q.x;
  let wy = q.w * q.y;
  let wz = q.w * q.z;

  let mat = mat4x4(
    1.0 - 2.0 * (sy + sz), 2.0 * (cz + wz), 2.0 * (cy - wy), 0.0,
    2.0 * (cz - wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx + wx), 0.0,
    2.0 * (cy + wy), 2.0 * (cx - wx), 1.0 - 2.0 * (sx + sy), 0.0,
    t.x, t.y, t.z, 1.0
  );

  let uniformScaleMat = mat4x4(
    scale.x, 0.0, 0.0, 0.0,
    0.0, scale.y, 0.0, 0.0,
    0.0, 0.0, scale.z, 0.0,
    0.0, 0.0, 0.0, 1.0
  );

  let mat44 = mat*uniformScaleMat;
  return mat4x3<f32>(
    vec3<f32>(mat44[0].x, mat44[0].y, mat44[0].z),
    vec3<f32>(mat44[1].x, mat44[1].y, mat44[1].z),
    vec3<f32>(mat44[2].x, mat44[2].y, mat44[2].z),
    vec3<f32>(mat44[3].x, mat44[3].y, mat44[3].z)
  );

}

fn unpackedVec2ToNormalizedVec4(vec_xy: vec2<f32>, criteria: f32) -> vec4<f32> {

  var r: f32;
  var g: f32;
  var b: f32;
  var a: f32;

  let ix = floor(vec_xy.x * criteria);
  let v1x = ix / criteria;
  let v1y = ix - floor(v1x) * criteria;

  r = ( v1x + 1.0 ) / (criteria-1.0);
  g = ( v1y + 1.0 ) / (criteria-1.0);

  let iy = floor( vec_xy.y * criteria);
  let v2x = iy / criteria;
  let v2y = iy - floor(v2x) * criteria;

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

  return vec4<f32>(r, g, b, a);
}

fn getSkinMatrix(skeletalComponentSID: u32, joint: vec4<u32>, weight: vec4<f32>) -> mat4x3<f32> {

#ifdef RN_BONE_DATA_TYPE_Mat43x1
  var skinMat: mat4x3<f32> = weight.x * get_boneMatrix(skeletalComponentSID, joint.x);
  skinMat += weight.y * get_boneMatrix(skeletalComponentSID, joint.y);
  skinMat += weight.z * get_boneMatrix(skeletalComponentSID, joint.z);
  skinMat += weight.w * get_boneMatrix(skeletalComponentSID, joint.w);

#elif defined(RN_BONE_DATA_TYPE_VEC4X2)
  let criteria = vec2<f32>(4096.0, 4096.0);

  let tq_x = get_boneTranslatePackedQuat(skeletalComponentSID, joint.x);
  let sq_x = get_boneScalePackedQuat(skeletalComponentSID, joint.x);
  var quat = unpackedVec2ToNormalizedVec4(vec2(tq_x.w, sq_x.w), criteria.x);
  var skinMat: mat4x3<f32> = weight.x * createMatrixFromQuaternionTranslationScale(quat, tq_x.xyz, sq_x.xyz);

  let tq_y = get_boneTranslatePackedQuat(skeletalComponentSID, joint.y);
  let sq_y = get_boneScalePackedQuat(skeletalComponentSID, joint.y);
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_y.w, sq_y.w), criteria.x);
  skinMat += weight.y * createMatrixFromQuaternionTranslationScale(quat, tq_y.xyz, sq_y.xyz);

  let tq_z = get_boneTranslatePackedQuat(skeletalComponentSID, joint.z);
  let sq_z = get_boneScalePackedQuat(skeletalComponentSID, joint.z);
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_z.w, sq_z.w), criteria.x);
  skinMat += weight.z * createMatrixFromQuaternionTranslationScale(quat, tq_z.xyz, sq_z.xyz);

  let tq_w = get_boneTranslatePackedQuat(skeletalComponentSID, joint.w);
  let sq_w = get_boneScalePackedQuat(skeletalComponentSID, joint.w);
  quat = unpackedVec2ToNormalizedVec4(vec2(tq_w.w, sq_w.w), criteria.x);
  skinMat += weight.w * createMatrixFromQuaternionTranslationScale(quat, tq_w.xyz, sq_w.xyz);

#elif defined(RN_BONE_DATA_TYPE_VEC4X2_OLD)
  let ts_x = get_boneTranslateScale(skeletalComponentSID, joint.x);
  var skinMat: mat4x3<f32> = weight.x * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, joint.x), ts_x.xyz, vec3(ts_x.w));
  let ts_y = get_boneTranslateScale(skeletalComponentSID, joint.y);
  skinMat += weight.y * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, joint.y), ts_y.xyz, vec3(ts_y.w));
  let ts_z = get_boneTranslateScale(skeletalComponentSID, joint.z);
  skinMat += weight.z * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, joint.z), ts_z.xyz, vec3(ts_z.w));
  let ts_w = get_boneTranslateScale(skeletalComponentSID, joint.w);
  skinMat += weight.w * createMatrixFromQuaternionTranslationScale(
    get_boneQuaternion(skeletalComponentSID, joint.w), ts_w.xyz, vec3(ts_w.w));

#elif defined(RN_BONE_DATA_TYPE_VEC4X1)
  let boneCompressedChunksX = get_boneCompressedChunk(skeletalComponentSID, joint.x);
  let boneCompressedChunksY = get_boneCompressedChunk(skeletalComponentSID, joint.y);
  let boneCompressedChunksZ = get_boneCompressedChunk(skeletalComponentSID, joint.z);
  let boneCompressedChunksW = get_boneCompressedChunk(skeletalComponentSID, joint.w);

  let criteria = vec2<f32>(4096.0, 4096.0);
  let boneCompressedInfo = get_boneCompressedInfo(0.0, 0);

  let ts_x = unpackedVec2ToNormalizedVec4(boneCompressedChunksX.zw, criteria.y)*boneCompressedInfo;
  var skinMat: mat4x3<f32> = weight.x * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksX.xy, criteria.x), ts_x.xyz, vec3(ts_x.w));
  let ts_y = unpackedVec2ToNormalizedVec4(boneCompressedChunksY.zw, criteria.y)*boneCompressedInfo;
  skinMat += weight.y * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksY.xy, criteria.x), ts_y.xyz, vec3(ts_y.w));
  let ts_z = unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.zw, criteria.y)*boneCompressedInfo;
  skinMat += weight.z * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksZ.xy, criteria.x), ts_z.xyz, vec3(ts_z.w));
  let ts_w = unpackedVec2ToNormalizedVec4(boneCompressedChunksW.zw, criteria.y)*boneCompressedInfo;
  skinMat += weight.w * createMatrixFromQuaternionTranslationScale(
    unpackedVec2ToNormalizedVec4(boneCompressedChunksW.xy, criteria.x), ts_w.xyz, vec3(ts_w.w));
#endif
  return skinMat;
}
#endif
