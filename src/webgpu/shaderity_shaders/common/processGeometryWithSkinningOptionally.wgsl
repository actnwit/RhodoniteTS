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

struct GeometoryOutput {
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
  ) -> GeometoryOutput
{
  var output: GeometoryOutput;
  let skinMat43 = getSkinMatrix(skeletalComponentSID, joint, weight);
  var skinMat = mat4x4<f32>(
    vec4<f32>(skinMat43[0], 0.0),
    vec4<f32>(skinMat43[1], 0.0),
    vec4<f32>(skinMat43[2], 0.0),
    vec4<f32>(skinMat43[3], 1.0)
  );
  output.position_inWorld = skinMat * vec4<f32>(inPosition_inLocal, 1.0);
  output.normalMatrix = toNormalMatrix(skinMat);
  output.normal_inWorld = normalize(output.normalMatrix * inNormal_inLocal);
  output.isSkinning = true;

  return output;
}
#endif


fn processGeometryWithMorphingAndSkinning(
  skeletalComponentSID: u32,
  blendShapeComponentSID: u32,
  worldMatrix: mat4x4<f32>,
  viewMatrix: mat4x4<f32>,
  isBillboard: bool,
  inNormalMatrix: mat3x3<f32>,
  inPosition_inLocal: vec3<f32>,
  inNormal_inLocal: vec3<f32>,
  baryCentricCoord: vec4<f32>,
  joint: vec4<u32>,
  weight: vec4<f32>,
) -> GeometoryOutput {
  var output: GeometoryOutput;

  var position_inLocal: vec3<f32>;
#ifdef RN_IS_MORPHING
  if (_morphTargetNumber == 0u) {
#endif
    position_inLocal = inPosition_inLocal;
#ifdef RN_IS_MORPHING
  } else {
    let vertexIdx = u32(baryCentricCoord.w);
    position_inLocal = get_position(vertexIdx, inPosition_inLocal, blendShapeComponentSID);
  }
#endif

  var worldMatrixInner = worldMatrix;

#ifdef RN_IS_SKINNING
  if (skeletalComponentSID >= 0u) {
    output = skinning(skeletalComponentSID, inNormalMatrix, position_inLocal, inNormal_inLocal, joint, weight);
  } else {
#endif
    output.normalMatrix = inNormalMatrix;
    output.position_inWorld = worldMatrixInner * vec4(position_inLocal, 1.0);
    output.normal_inWorld = normalize(inNormalMatrix * inNormal_inLocal);
    output.isSkinning = false;
#ifdef RN_IS_SKINNING
  }
#endif

  return output;
}
