var e=`fn _greaterThanF32(lhs: f32, rhs: f32, outValue: ptr<function, bool>) {
  *outValue = lhs > rhs;
}
fn _greaterThanI32(lhs: i32, rhs: i32, outValue: ptr<function, bool>) {
  *outValue = lhs > rhs;
}
fn _greaterThanU32(lhs: u32, rhs: u32, outValue: ptr<function, bool>) {
  *outValue = lhs > rhs;
}


`,t="fragment",u=!0,a={code:e,shaderStage:t,isFragmentShader:u};export{e as code,a as default,u as isFragmentShader,t as shaderStage};
