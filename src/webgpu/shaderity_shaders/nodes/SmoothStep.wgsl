fn _smoothstepF32(value: f32, edge0: f32, edge1: f32, outValue: ptr<function, f32>) {
  *outValue = smoothstep(edge0, edge1, value);
}
fn _smoothstepVec2f(value: vec2<f32>, edge0: vec2<f32>, edge1: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = smoothstep(edge0, edge1, value);
}
fn _smoothstepVec3f(value: vec3<f32>, edge0: vec3<f32>, edge1: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = smoothstep(edge0, edge1, value);
}
fn _smoothstepVec4f(value: vec4<f32>, edge0: vec4<f32>, edge1: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = smoothstep(edge0, edge1, value);
}
