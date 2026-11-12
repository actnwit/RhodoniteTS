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

const LOGQUAT_BIAS: f32 = 1048575.0;
const LOGQUAT_HALF_PI: f32 = 1.5707963;

fn decodeLogQuat(lohi: vec2<u32>) -> vec4<f32> {
  let lo = lohi.x;
  let hi = lohi.y;
  let xi = lo & 0x1FFFFFu;
  let yi = (lo >> 21u) | ((hi & 0x3FFu) << 11u);
  let zi = (hi >> 10u) & 0x1FFFFFu;
  let v = (vec3<f32>(f32(xi), f32(yi), f32(zi)) - LOGQUAT_BIAS) / LOGQUAT_BIAS * LOGQUAT_HALF_PI;
  let a = length(v);                                   // 半角
  let k = select(sin(a) / a, 1.0 - a * a / 6.0, a < 1e-4);
  return vec4<f32>(v * k, cos(a));                     // (x, y, z, w) 単位クォータニオン
}

// Bone data type indices (must match BoneDataType in TypeScript)
const RN_BONE_DATA_TYPE_MAT43X1: i32 = 0;
const RN_BONE_DATA_TYPE_VEC4X2: i32 = 1;
const RN_BONE_DATA_TYPE_VEC4X1: i32 = 2;

// Vec4x1 stores log2(|uniform scale|) / RN_VEC4X1_LOG2_SCALE_RANGE as snorm16, and the sign of the scale
// (negative for a mirrored joint) in bit 31 of logQuat.hi (must match MathUtil.encodeVec4x1Scale and SkeletalComponent)
const RN_VEC4X1_LOG2_SCALE_RANGE: f32 = 16.0;
const RN_VEC4X1_NEGATIVE_SCALE_BIT: u32 = 0x80000000u;

fn decodeVec4x1Scale(encodedScale: f32, logQuatHi: u32) -> f32 {
  let scale = exp2(encodedScale * RN_VEC4X1_LOG2_SCALE_RANGE);
  return select(scale, -scale, (logQuatHi & RN_VEC4X1_NEGATIVE_SCALE_BIT) != 0u);
}

// Decode the matrix of one joint from the bone data, according to the bone data type of the skeleton
fn getBoneMatrix(skeletalComponentSID: u32, jointIdx: u32, boneDataType: i32, boneDataInfo: vec4<f32>) -> mat4x4<f32> {
  if (boneDataType == RN_BONE_DATA_TYPE_MAT43X1) {
    // 3 vec4 per joint: 4x3 matrix (column-major)
    let a = get_boneData(skeletalComponentSID, jointIdx * 3u);
    let b = get_boneData(skeletalComponentSID, jointIdx * 3u + 1u);
    let c = get_boneData(skeletalComponentSID, jointIdx * 3u + 2u);
    return mat4x4<f32>(
      vec4<f32>(a.x, a.y, a.z, 0.0),
      vec4<f32>(a.w, b.x, b.y, 0.0),
      vec4<f32>(b.z, b.w, c.x, 0.0),
      vec4<f32>(c.y, c.z, c.w, 1.0)
    );
  } else if (boneDataType == RN_BONE_DATA_TYPE_VEC4X2) {
    // 2 vec4 per joint: [translation.xyz, logQuat.lo], [scale.xyz, logQuat.hi]
    let tq = get_boneData(skeletalComponentSID, jointIdx * 2u);
    let sq = get_boneData(skeletalComponentSID, jointIdx * 2u + 1u);
    let quat = decodeLogQuat(vec2<u32>(bitcast<u32>(tq.w), bitcast<u32>(sq.w)));
    return createMatrixFromQuaternionTranslationScale(quat, tq.xyz, sq.xyz);
  }
  // 1 vec4 per joint: [logQuat.lo, logQuat.hi (bit 31: negative scale), packedTranslateScale.lo, packedTranslateScale.hi]
  let chunk = bitcast<vec4<u32>>(get_boneData(skeletalComponentSID, jointIdx));
  let ts = unpackVec4FromUvec2(chunk.zw);
  let translation = ts.xyz * boneDataInfo.xyz;
  let scale = decodeVec4x1Scale(ts.w, chunk.y);
  return createMatrixFromQuaternionTranslationScale(decodeLogQuat(chunk.xy), translation, vec3<f32>(scale));
}

fn getSkinMatrix(skeletalComponentSID: u32, joint: vec4<u32>, weight: vec4<f32>) -> mat4x4<f32> {
  let boneDataInfo = get_boneDataInfo(skeletalComponentSID);
  let boneDataType = i32(boneDataInfo.w + 0.5);

  var skinMat: mat4x4<f32> = weight.x * getBoneMatrix(skeletalComponentSID, joint.x, boneDataType, boneDataInfo);
  skinMat += weight.y * getBoneMatrix(skeletalComponentSID, joint.y, boneDataType, boneDataInfo);
  skinMat += weight.z * getBoneMatrix(skeletalComponentSID, joint.z, boneDataType, boneDataInfo);
  skinMat += weight.w * getBoneMatrix(skeletalComponentSID, joint.w, boneDataType, boneDataInfo);
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
  worldMatrix: mat4x4<f32>,
  inNormalMatrix: mat3x3<f32>,
  inPosition_inLocal: vec3<f32>,
  inNormal_inLocal: vec3<f32>,
  joint: vec4<u32>,
  weight: vec4<f32>,
  ) -> GeometryOutput
{
  var output: GeometryOutput;
  let skinMat = getSkinMatrix(skeletalComponentSID, joint, weight);
  output.position_inWorld = worldMatrix * skinMat * vec4<f32>(inPosition_inLocal, 1.0);
  output.normalMatrix = toNormalMatrix(worldMatrix * skinMat);
  output.normal_inWorld = normalize(output.normalMatrix * inNormal_inLocal);
  output.isSkinning = true;

  return output;
}
#endif


fn processGeometry(
  worldMatrix: mat4x4<f32>,
  inNormalMatrix: mat3x3<f32>,
  viewMatrix: mat4x4<f32>,
  inPosition_inLocal: vec4<f32>,
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
    position_inLocal = inPosition_inLocal.xyz;
#ifdef RN_IS_MORPHING
  } else {
    let vertexIdx = u32(a_baryCentricCoord.w);
    let blendShapeComponentSID = u32(a_instanceIds.z);
    position_inLocal = get_position(vertexIdx, inPosition_inLocal.xyz, blendShapeComponentSID);
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
  let skeletalComponentSID = a_instanceIds.y;
  if (skeletalComponentSID != INVALID_ID) {
    output = skinning(skeletalComponentSID, worldMatrixInner, inNormalMatrix, position_inLocal, inNormal_inLocal, joint, weight);
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
