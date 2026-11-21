#ifdef RN_IS_SKINNING
// The bone matrix decoding (decodeBoneMatrix, toNormalMatrix) is prepended from boneDecode.wgsl (see ShaderHandler).

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

// Decode the matrix of one joint from the bone data, according to the bone data type of the skeleton
fn getBoneMatrix(skeletalComponentSID: u32, jointIdx: u32, boneDataType: i32, boneDataInfo: vec4<f32>) -> mat4x4<f32> {
  let chunkCount = boneDataChunkCountOfJoint(boneDataType);
  let base = jointIdx * chunkCount;
  let c0 = get_boneData(skeletalComponentSID, base);
  var c1 = vec4<f32>(0.0);
  var c2 = vec4<f32>(0.0);
  if (chunkCount >= 2u) {
    c1 = get_boneData(skeletalComponentSID, base + 1u);
  }
  if (chunkCount >= 3u) {
    c2 = get_boneData(skeletalComponentSID, base + 2u);
  }
  return decodeBoneMatrix(boneDataType, c0, c1, c2, boneDataInfo);
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

  var worldMatrixInner = worldMatrix;
  if (isBillboard) {
    var inverseViewMatrix = inverse4x4(viewMatrix);
    inverseViewMatrix[3][0] = 0.0;
    inverseViewMatrix[3][1] = 0.0;
    inverseViewMatrix[3][2] = 0.0;
    worldMatrixInner = inverseViewMatrix * worldMatrix;
  }

#if defined(RN_IS_SKINNING) || defined(RN_IS_MORPHING)
  // The instances drawn by the WebGPU GPU culling were morphed and skinned by its compute shader
  // (WebGpuVertexDeformer). instanceIds.w is then 1 + the index of the first deformed vertex of the instance.
  let deformedVertexBase = a_instanceIds.w;
  if (deformedVertexBase != 0u) {
    let deformedIndex = (deformedVertexBase - 1u + uniformDrawParameters.deformedVertexOffset + a_vertexIdx) * 2u;
    // The deformed position keeps the w of the skinning matrix product, like the skinning below.
    let deformedPosition = deformedVertices[deformedIndex];
    let deformedNormal = deformedVertices[deformedIndex + 1u].xyz;
    *outNormalMatrix = inNormalMatrix;
    *outPosition_inWorld = worldMatrixInner * deformedPosition;
    // normalMatrix(worldMatrix * skinMatrix) == normalMatrix(worldMatrix) * normalMatrix(skinMatrix)
    *outNormal_inWorld = normalize(inNormalMatrix * deformedNormal);
    return a_instanceIds.y != INVALID_ID;
  }
#endif

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
