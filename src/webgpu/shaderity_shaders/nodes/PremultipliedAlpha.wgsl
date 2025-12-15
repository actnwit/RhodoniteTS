
fn _premultipliedAlphaVec4f(value: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = vec4<f32>(value.rgb * value.a, value.a);
}

