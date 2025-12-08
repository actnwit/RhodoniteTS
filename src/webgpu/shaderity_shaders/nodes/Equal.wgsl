fn _equalF32(lhs: f32, rhs: f32, outValue: ptr<function, bool>) {
  *outValue = lhs == rhs;
}
fn _equalI32(lhs: i32, rhs: i32, outValue: ptr<function, bool>) {
  *outValue = lhs == rhs;
}
fn _equalU32(lhs: u32, rhs: u32, outValue: ptr<function, bool>) {
  *outValue = lhs == rhs;
}

