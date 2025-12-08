fn _greaterOrEqualF32(lhs: f32, rhs: f32, outValue: ptr<function, bool>) {
  *outValue = lhs >= rhs;
}
fn _greaterOrEqualI32(lhs: i32, rhs: i32, outValue: ptr<function, bool>) {
  *outValue = lhs >= rhs;
}
fn _greaterOrEqualU32(lhs: u32, rhs: u32, outValue: ptr<function, bool>) {
  *outValue = lhs >= rhs;
}

