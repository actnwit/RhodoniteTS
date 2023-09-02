fn fetchMat4(vec4_idx: i32) -> mat4x4<f32>
{
  let col0 = storageData.data[vec4_idx];
  let col1 = storageData.data[vec4_idx + 1];
  let col2 = storageData.data[vec4_idx + 2];
  let col3 = storageData.data[vec4_idx + 3];

  let val = mat4x4<f32>(
    col0.x, col0.y, col0.z, col0.w,
    col1.x, col1.y, col1.z, col1.w,
    col2.x, col2.y, col2.z, col2.w,
    col3.x, col3.y, col3.z, col3.w
    );

  return val;
}
