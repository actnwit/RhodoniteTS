#ifdef RN_IS_SKINNING
fn createMatrixFromQuaternionTranslationScale( quaternion: vec4<f32>, translation: vec3<f32>, scale: vec3<f32> ) -> mat4x4<f32> {
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
  return mat44;

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

fn get_boneMatrixAsMat4x4(skeletalComponentSID: u32, joint: u32) -> mat4x4<f32> {
  let mat43: mat4x3<f32> = get_boneMatrix(skeletalComponentSID, joint);
  return mat4x4<f32>(
    vec4<f32>(mat43[0], 0.0),
    vec4<f32>(mat43[1], 0.0),
    vec4<f32>(mat43[2], 0.0),
    vec4<f32>(mat43[3], 1.0)
  );
}

fn getSkinMatrix(skeletalComponentSID: u32, joint: vec4<u32>, weight: vec4<f32>) -> mat4x4<f32> {

#ifdef RN_BONE_DATA_TYPE_Mat43x1
  var skinMat: mat4x4<f32> = weight.x * get_boneMatrixAsMat4x4(skeletalComponentSID, joint.x);
  skinMat += weight.y * get_boneMatrixAsMat4x4(skeletalComponentSID, joint.y);
  skinMat += weight.z * get_boneMatrixAsMat4x4(skeletalComponentSID, joint.z);
  skinMat += weight.w * get_boneMatrixAsMat4x4(skeletalComponentSID, joint.w);

#elif defined(RN_BONE_DATA_TYPE_VEC4X2)
  let criteria = vec2<f32>(4096.0, 4096.0);

  let tq_x = get_boneTranslatePackedQuat(skeletalComponentSID, joint.x);
  let sq_x = get_boneScalePackedQuat(skeletalComponentSID, joint.x);
  var quat = unpackedVec2ToNormalizedVec4(vec2(tq_x.w, sq_x.w), criteria.x);
  var skinMat: mat4x4<f32> = weight.x * createMatrixFromQuaternionTranslationScale(quat, tq_x.xyz, sq_x.xyz);

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
  var skinMat: mat4x4<f32> = weight.x * createMatrixFromQuaternionTranslationScale(
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
  var skinMat: mat4x4<f32> = weight.x * createMatrixFromQuaternionTranslationScale(
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

fn toNormalMatrix(m: mat4x4<f32>) -> mat3x3<f32> {
  let a00 = m[0][0];
  let a01 = m[0][1];
  let a02 = m[0][2];
  let a03 = m[0][3];
  let a10 = m[1][0];
  let a11 = m[1][1];
  let a12 = m[1][2];
  let a13 = m[1][3];
  let a20 = m[2][0];
  let a21 = m[2][1];
  let a22 = m[2][2];
  let a23 = m[2][3];
  let a30 = m[3][0];
  let a31 = m[3][1];
  let a32 = m[3][2];
  let a33 = m[3][3];

  let b00 = a00 * a11 - a01 * a10;
  let b01 = a00 * a12 - a02 * a10;
  let b02 = a00 * a13 - a03 * a10;
  let b03 = a01 * a12 - a02 * a11;
  let b04 = a01 * a13 - a03 * a11;
  let b05 = a02 * a13 - a03 * a12;
  let b06 = a20 * a31 - a21 * a30;
  let b07 = a20 * a32 - a22 * a30;
  let b08 = a20 * a33 - a23 * a30;
  let b09 = a21 * a32 - a22 * a31;
  let b10 = a21 * a33 - a23 * a31;
  let b11 = a22 * a33 - a23 * a32;

  let determinantVal = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat3x3<f32>(
    (a11 * b11 - a12 * b10 + a13 * b09) / determinantVal,
    (a12 * b08 - a10 * b11 - a13 * b07) / determinantVal,
    (a10 * b10 - a11 * b08 + a13 * b06) / determinantVal,
    (a02 * b10 - a01 * b11 - a03 * b09) / determinantVal,
    (a00 * b11 - a02 * b08 + a03 * b07) / determinantVal,
    (a01 * b08 - a00 * b10 - a03 * b06) / determinantVal,
    (a31 * b05 - a32 * b04 + a33 * b03) / determinantVal,
    (a32 * b02 - a30 * b05 - a33 * b01) / determinantVal,
    (a30 * b04 - a31 * b02 + a33 * b00) / determinantVal
  );
}
#endif

struct GeometryOutput {
  normalMatrix: mat3x3<f32>,
  position_inWorld: vec4<f32>,
  normal_inWorld: vec3<f32>,
  isSkinning: bool,
}

#ifdef RN_IS_SKINNING
fn skinning(
  skeletalComponentSID: u32,
  inNormalMatrix: mat3x3<f32>,
  inPosition_inLocal: vec3<f32>,
  inNormal_inLocal: vec3<f32>,
  joint: vec4<u32>,
  weight: vec4<f32>,
  ) -> GeometryOutput
{
  var output: GeometryOutput;
  let skinMat = getSkinMatrix(skeletalComponentSID, joint, weight);
  output.position_inWorld = skinMat * vec4<f32>(inPosition_inLocal, 1.0);
  output.normalMatrix = toNormalMatrix(skinMat);
  output.normal_inWorld = normalize(output.normalMatrix * inNormal_inLocal);
  output.isSkinning = true;

  return output;
}
#endif


fn processGeometry(
  worldMatrix: mat4x4<f32>,
  inNormalMatrix: mat3x3<f32>,
  viewMatrix: mat4x4<f32>,
  inPosition_inLocal: vec3<f32>,
  inNormal_inLocal: vec3<f32>,
  joint: vec4<u32>,
  weight: vec4<f32>,
  isBillboard: bool,
  outNormalMatrix: ptr<function, mat3x3<f32>>,
  outPosition_inWorld: ptr<function, vec4<f32>>,
  outNormal_inWorld: ptr<function, vec3<f32>>,
) -> bool {
  var output: GeometryOutput;

  var position_inLocal: vec3<f32>;
#ifdef RN_IS_MORPHING
  if (uniformDrawParameters.morphTargetNumber == 0u) {
#endif
    position_inLocal = inPosition_inLocal;
#ifdef RN_IS_MORPHING
  } else {
    let vertexIdx = u32(a_baryCentricCoord.w);
    let blendShapeComponentSID = u32(a_instanceIds.z);
    position_inLocal = get_position(vertexIdx, inPosition_inLocal, blendShapeComponentSID);
  }
#endif

  var worldMatrixInner = worldMatrix;
  if (isBillboard) {
    var inverseViewMatrix = inverse4x4(viewMatrix);
    inverseViewMatrix[3][0] = 0.0;
    inverseViewMatrix[3][1] = 0.0;
    inverseViewMatrix[3][2] = 0.0;
    worldMatrixInner = inverseViewMatrix * worldMatrix;
  }

#ifdef RN_IS_SKINNING
  let skeletalComponentSID = i32(a_instanceIds.y);
  if (skeletalComponentSID >= 0) {
    output = skinning(u32(skeletalComponentSID), inNormalMatrix, position_inLocal, inNormal_inLocal, joint, weight);
  } else {
#endif
    output.normalMatrix = inNormalMatrix;
    output.position_inWorld = worldMatrixInner * vec4f(position_inLocal, 1.0);
    output.normal_inWorld = normalize(inNormalMatrix * inNormal_inLocal);
    output.isSkinning = false;
#ifdef RN_IS_SKINNING
  }
#endif

  *outNormalMatrix = output.normalMatrix;
  *outPosition_inWorld = output.position_inWorld;
  *outNormal_inWorld = output.normal_inWorld;

  return output.isSkinning;
}
