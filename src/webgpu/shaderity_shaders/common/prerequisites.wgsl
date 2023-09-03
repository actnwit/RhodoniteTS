fn fetchElement(vec4_idx: i32) -> vec4<f32>
{
  return storageData.data[vec4_idx];
}

fn fetchVec4(vec4_idx: i32) -> vec4<f32> {
  return fetchElement(vec4_idx);
}

fn fetchScalarNo16BytesAligned(scalar_idx: i32) -> f32 {
  let posIn4bytes = scalar_idx % 4;
  let basePosIn16bytes = (scalar_idx - posIn4bytes) / 4;
  let val = fetchElement(basePosIn16bytes);
  if (posIn4bytes == 0) {
    return val.x;
  } else if (posIn4bytes == 1) {
    return val.y;
  } else if (posIn4bytes == 2) {
    return val.z;
  } else { // posIn4bytes == 3
    return val.w;
  }
}




fn fetchMat4(vec4_idx: i32) -> mat4x4<f32>
{
  let col0 = fetchElement(vec4_idx);
  let col1 = fetchElement(vec4_idx + 1);
  let col2 = fetchElement(vec4_idx + 2);
  let col3 = fetchElement(vec4_idx + 3);

  let val = mat4x4<f32>(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w,
    col3.x, col3.y, col3.z, col3.w
    );

  return val;
}


fn fetchMat4x3(vec4_idx: i32) -> mat4x3<f32> {
  let col0 = fetchElement(vec4_idx);
  let col1 = fetchElement(vec4_idx + 1);
  let col2 = fetchElement(vec4_idx + 2);

  let val = mat4x3<f32>(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w);

  return val;
}
