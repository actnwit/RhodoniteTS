var l=`fn _lessThanF32(lhs: f32, rhs: f32, outValue: ptr<function, bool>) {
  *outValue = lhs < rhs;
}
fn _lessThanI32(lhs: i32, rhs: i32, outValue: ptr<function, bool>) {
  *outValue = lhs < rhs;
}
fn _lessThanU32(lhs: u32, rhs: u32, outValue: ptr<function, bool>) {
  *outValue = lhs < rhs;
}

`,u="fragment",h=!0,e={code:l,shaderStage:u,isFragmentShader:h};export{l as code,e as default,h as isFragmentShader,u as shaderStage};
