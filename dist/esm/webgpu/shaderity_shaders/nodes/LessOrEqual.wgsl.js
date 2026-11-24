var u=`fn _lessOrEqualF32(lhs: f32, rhs: f32, outValue: ptr<function, bool>) {
  *outValue = lhs <= rhs;
}
fn _lessOrEqualI32(lhs: i32, rhs: i32, outValue: ptr<function, bool>) {
  *outValue = lhs <= rhs;
}
fn _lessOrEqualU32(lhs: u32, rhs: u32, outValue: ptr<function, bool>) {
  *outValue = lhs <= rhs;
}

`,s="fragment",r=!0,e={code:u,shaderStage:s,isFragmentShader:r};export{u as code,e as default,r as isFragmentShader,s as shaderStage};
