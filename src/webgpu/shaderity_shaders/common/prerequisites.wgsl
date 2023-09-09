struct StorageData {
  data: array<vec4<f32>>,
}
@group(0) @binding(0) var<storage> storageData: StorageData;
struct UniformMorphOffsets {
  data: array<vec4<u32>, /* shaderity: @{maxMorphDataNumber} */ >,
}
@group(0) @binding(1) var<uniform> uniformMorphOffsets: UniformMorphOffsets;
struct UniformMorphWeights {
  data: array<vec4<f32>, /* shaderity: @{maxMorphDataNumber} */ >,
}
@group(0) @binding(2) var<uniform> uniformMorphWeights: UniformMorphWeights;

override _materialSID: u32;
override _currentPrimitiveIdx = 0u;
override _morphTargetNumber: u32 = 0u;

fn fetchElement(vec4_idx: u32) -> vec4<f32>
{
  return storageData.data[vec4_idx];
}

fn fetchVec3No16BytesAligned(scalar_idx: u32) -> vec3<f32> {
  let posIn4bytes = scalar_idx % 4u;

  let basePosIn16bytes = (scalar_idx - posIn4bytes) / 4u;
  if (posIn4bytes == 0u) {
    let val = fetchElement(basePosIn16bytes);
    return val.xyz;
  } else if (posIn4bytes == 1u) {
    let val0 = fetchElement(basePosIn16bytes);
    return vec3<f32>(val0.yzw);
  } else if (posIn4bytes == 2u) {
    let val0 = fetchElement(basePosIn16bytes);
    let val1 = fetchElement(basePosIn16bytes+1u);
    return vec3<f32>(val0.zw, val1.x);
  } else { // posIn4bytes == 3
    let val0 = fetchElement(basePosIn16bytes);
    let val1 = fetchElement(basePosIn16bytes+1u);
    return vec3<f32>(val0.w, val1.xy);
  }
}

fn fetchVec4(vec4_idx: u32) -> vec4<f32> {
  return fetchElement(vec4_idx);
}

fn fetchScalarNo16BytesAligned(scalar_idx: u32) -> f32 {
  let posIn4bytes = scalar_idx % 4u;
  let basePosIn16bytes = (scalar_idx - posIn4bytes) / 4u;
  let val = fetchElement(basePosIn16bytes);
  if (posIn4bytes == 0u) {
    return val.x;
  } else if (posIn4bytes == 1u) {
    return val.y;
  } else if (posIn4bytes == 2u) {
    return val.z;
  } else { // posIn4bytes == 3u
    return val.w;
  }
}




fn fetchMat4(vec4_idx: u32) -> mat4x4<f32>
{
  let col0 = fetchElement(vec4_idx);
  let col1 = fetchElement(vec4_idx + 1u);
  let col2 = fetchElement(vec4_idx + 2u);
  let col3 = fetchElement(vec4_idx + 3u);

  let val = mat4x4<f32>(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w,
    col3.x, col3.y, col3.z, col3.w
    );

  return val;
}


fn fetchMat4x3(vec4_idx: u32) -> mat4x3<f32> {
  let col0 = fetchElement(vec4_idx);
  let col1 = fetchElement(vec4_idx + 1u);
  let col2 = fetchElement(vec4_idx + 2u);

  let val = mat4x3<f32>(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w);

  return val;
}


fn fetchMat3No16BytesAligned(scalar_idx: u32) -> mat3x3<f32> {
  let posIn4bytes = scalar_idx % 4u;

  let basePosIn16bytes = (scalar_idx - posIn4bytes) / 4u;
  if (posIn4bytes == 0u) {
    let col0 = fetchElement(basePosIn16bytes);
    let col1 = fetchElement(basePosIn16bytes + 1u);
    let col2 = fetchElement(basePosIn16bytes + 2u);
    let val = mat3x3<f32>(
      col0.x, col0.y, col0.z,
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x
      );
    return val;
  } else if (posIn4bytes == 1u) {
    let col0 = fetchElement(basePosIn16bytes);
    let col1 = fetchElement(basePosIn16bytes + 1u);
    let col2 = fetchElement(basePosIn16bytes + 2u);
    let val = mat3x3<f32>(
      col0.y, col0.z, col0.w,
      col1.x, col1.y, col1.z,
      col1.w, col2.x, col2.y
      );
    return val;
  } else if (posIn4bytes == 2u) {
    let col0 = fetchElement(basePosIn16bytes);
    let col1 = fetchElement(basePosIn16bytes + 1u);
    let col2 = fetchElement(basePosIn16bytes + 2u);
    let val = mat3x3<f32>(
      col0.z, col0.w, col1.x,
      col1.y, col1.z, col1.w,
      col2.x, col2.y, col2.z
      );
    return val;
  } else { // posIn4bytes == 3u
    let col0 = fetchElement(basePosIn16bytes);
    let col1 = fetchElement(basePosIn16bytes + 1u);
    let col2 = fetchElement(basePosIn16bytes + 2u);
    let val = mat3x3<f32>(
      col0.w, col1.x, col1.y,
      col1.z, col1.w, col2.x,
      col2.y, col2.z, col2.w
      );
    return val;
  }
}
