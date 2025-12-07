// bool to float - Scalar
fn castToFloatBoolScalar(value: bool, outValue: ptr<function, f32>) {
  if (value) {
    *outValue = 1.0;
  } else {
    *outValue = 0.0;
  }
}

// int to float - Scalar
fn castToFloatIntScalar(value: i32, outValue: ptr<function, f32>) {
  *outValue = f32(value);
}

// uint to float - Scalar
fn castToFloatUintScalar(value: u32, outValue: ptr<function, f32>) {
  *outValue = f32(value);
}

// bool to float - Vector2
fn castToFloatBoolVec2(value: vec2<bool>, outValue: ptr<function, vec2<f32>>) {
  *outValue = vec2<f32>(
    select(0.0, 1.0, value.x),
    select(0.0, 1.0, value.y)
  );
}

// int to float - Vector2
fn castToFloatIntVec2(value: vec2<i32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = vec2<f32>(value);
}

// uint to float - Vector2
fn castToFloatUintVec2(value: vec2<u32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = vec2<f32>(value);
}

// bool to float - Vector3
fn castToFloatBoolVec3(value: vec3<bool>, outValue: ptr<function, vec3<f32>>) {
  *outValue = vec3<f32>(
    select(0.0, 1.0, value.x),
    select(0.0, 1.0, value.y),
    select(0.0, 1.0, value.z)
  );
}

// int to float - Vector3
fn castToFloatIntVec3(value: vec3<i32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = vec3<f32>(value);
}

// uint to float - Vector3
fn castToFloatUintVec3(value: vec3<u32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = vec3<f32>(value);
}

// bool to float - Vector4
fn castToFloatBoolVec4(value: vec4<bool>, outValue: ptr<function, vec4<f32>>) {
  *outValue = vec4<f32>(
    select(0.0, 1.0, value.x),
    select(0.0, 1.0, value.y),
    select(0.0, 1.0, value.z),
    select(0.0, 1.0, value.w)
  );
}

// int to float - Vector4
fn castToFloatIntVec4(value: vec4<i32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = vec4<f32>(value);
}

// uint to float - Vector4
fn castToFloatUintVec4(value: vec4<u32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = vec4<f32>(value);
}

