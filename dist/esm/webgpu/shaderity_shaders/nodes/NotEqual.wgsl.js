var o=`fn _notEqualF32(lhs: f32, rhs: f32, outValue: ptr<function, bool>) {
  *outValue = lhs != rhs;
}
fn _notEqualI32(lhs: i32, rhs: i32, outValue: ptr<function, bool>) {
  *outValue = lhs != rhs;
}
fn _notEqualU32(lhs: u32, rhs: u32, outValue: ptr<function, bool>) {
  *outValue = lhs != rhs;
}

`,t="fragment",l=!0,a={code:o,shaderStage:t,isFragmentShader:l};export{o as code,a as default,l as isFragmentShader,t as shaderStage};
