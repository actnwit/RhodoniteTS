
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

const float LOGQUAT_BIAS    = 1048575.0;       // 2^20 - 1
const float LOGQUAT_HALF_PI = 1.57079632679;

// Decode a 64-bit log-quaternion (lo, hi) into a unit quaternion (x, y, z, w)
vec4 decodeLogQuat(uvec2 lohi) {
  uint lo = lohi.x;
  uint hi = lohi.y;
  uint xi = lo & 0x1FFFFFu;
  uint yi = (lo >> 21u) | ((hi & 0x3FFu) << 11u);
  uint zi = (hi >> 10u) & 0x1FFFFFu;

  vec3 v = (vec3(float(xi), float(yi), float(zi)) - LOGQUAT_BIAS) / LOGQUAT_BIAS * LOGQUAT_HALF_PI;
  float a = length(v);                                        // half angle
  float k = (a < 1e-4) ? 1.0 - a * a * (1.0 / 6.0) : sin(a) / a;
  return vec4(v * k, cos(a));
}

// Bone data type indices (must match BoneDataType in TypeScript)
const int RN_BONE_DATA_TYPE_MAT43X1 = 0;
const int RN_BONE_DATA_TYPE_VEC4X2 = 1;
const int RN_BONE_DATA_TYPE_VEC4X1 = 2;

// Vec4x1 stores log2(|uniform scale|) / RN_VEC4X1_LOG2_SCALE_RANGE as snorm16, and the sign of the scale
// (negative for a mirrored joint) in bit 31 of logQuat.hi (must match MathUtil.encodeVec4x1Scale and SkeletalComponent)
const float RN_VEC4X1_LOG2_SCALE_RANGE = 16.0;
const uint RN_VEC4X1_NEGATIVE_SCALE_BIT = 0x80000000u;

float decodeVec4x1Scale(float encodedScale, uint logQuatHi) {
  float scale = exp2(encodedScale * RN_VEC4X1_LOG2_SCALE_RANGE);
  return (logQuatHi & RN_VEC4X1_NEGATIVE_SCALE_BIT) != 0u ? -scale : scale;
}

// Decode the matrix of one joint from the bone data, according to the bone data type of the skeleton
mat4 getBoneMatrix(uint skeletalComponentSID, uint jointIdx, int boneDataType, vec4 boneDataInfo) {
  if (boneDataType == RN_BONE_DATA_TYPE_MAT43X1) {
    // 3 vec4 per joint: 4x3 matrix (column-major)
    vec4 a = get_boneData(skeletalComponentSID, jointIdx * 3u);
    vec4 b = get_boneData(skeletalComponentSID, jointIdx * 3u + 1u);
    vec4 c = get_boneData(skeletalComponentSID, jointIdx * 3u + 2u);
    return mat4(
      a.x, a.y, a.z, 0.0,
      a.w, b.x, b.y, 0.0,
      b.z, b.w, c.x, 0.0,
      c.y, c.z, c.w, 1.0
    );
  } else if (boneDataType == RN_BONE_DATA_TYPE_VEC4X2) {
    // 2 vec4 per joint: [translation.xyz, logQuat.lo], [scale.xyz, logQuat.hi]
    vec4 tq = get_boneData(skeletalComponentSID, jointIdx * 2u);
    vec4 sq = get_boneData(skeletalComponentSID, jointIdx * 2u + 1u);
    vec4 quat = decodeLogQuat(uvec2(floatBitsToUint(tq.w), floatBitsToUint(sq.w)));
    return createMatrixFromQuaternionTranslationScale(quat, tq.xyz, sq.xyz);
  } else {
    // 1 vec4 per joint: [logQuat.lo, logQuat.hi (bit 31: negative scale), packedTranslateScale.lo, packedTranslateScale.hi]
    uvec4 chunk = floatBitsToUint(get_boneData(skeletalComponentSID, jointIdx));
    vec4 ts = unpackVec4FromUvec2(chunk.zw);
    vec3 translation = ts.xyz * boneDataInfo.xyz;
    float scale = decodeVec4x1Scale(ts.w, chunk.y);
    return createMatrixFromQuaternionTranslationScale(decodeLogQuat(chunk.xy), translation, vec3(scale));
  }
}

mat4 getSkinMatrix(uint skeletalComponentSID, uvec4 joint, vec4 weight) {
  vec4 boneDataInfo = get_boneDataInfo(skeletalComponentSID);
  int boneDataType = int(boneDataInfo.w + 0.5);

  mat4 skinMat = weight.x * getBoneMatrix(skeletalComponentSID, joint.x, boneDataType, boneDataInfo);
  skinMat += weight.y * getBoneMatrix(skeletalComponentSID, joint.y, boneDataType, boneDataInfo);
  skinMat += weight.z * getBoneMatrix(skeletalComponentSID, joint.z, boneDataType, boneDataInfo);
  skinMat += weight.w * getBoneMatrix(skeletalComponentSID, joint.w, boneDataType, boneDataInfo);
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
