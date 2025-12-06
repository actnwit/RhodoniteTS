fn branchF32(condition: bool, ifTrue: f32, ifFalse: f32, outValue: ptr<function, f32>) {
  *outValue = select(ifFalse, ifTrue, condition);
}
fn branchI32(condition: bool, ifTrue: i32, ifFalse: i32, outValue: ptr<function, i32>) {
  *outValue = select(ifFalse, ifTrue, condition);
}
fn branchVec2f(condition: bool, ifTrue: vec2<f32>, ifFalse: vec2<f32>, outValue: ptr<function, vec2<f32>>) {
  *outValue = select(ifFalse, ifTrue, condition);
}
fn branchVec3f(condition: bool, ifTrue: vec3<f32>, ifFalse: vec3<f32>, outValue: ptr<function, vec3<f32>>) {
  *outValue = select(ifFalse, ifTrue, condition);
}
fn branchVec4f(condition: bool, ifTrue: vec4<f32>, ifFalse: vec4<f32>, outValue: ptr<function, vec4<f32>>) {
  *outValue = select(ifFalse, ifTrue, condition);
}


