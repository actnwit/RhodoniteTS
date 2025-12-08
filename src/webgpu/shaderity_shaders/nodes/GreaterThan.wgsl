fn _greaterThanF32(lhs: f32, rhs: f32, outValue: ptr<function, bool>) {
  *outValue = lhs > rhs;
}
fn _greaterThanI32(lhs: i32, rhs: i32, outValue: ptr<function, bool>) {
  *outValue = lhs > rhs;
}
fn _greaterThanU32(lhs: u32, rhs: u32, outValue: ptr<function, bool>) {
  *outValue = lhs > rhs;
}


