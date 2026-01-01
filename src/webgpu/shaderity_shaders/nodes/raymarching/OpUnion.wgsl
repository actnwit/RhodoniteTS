fn opUnion(lhs: f32, rhs: f32, outValue: ptr<function, f32>) {
  *outValue = min(lhs, rhs);
}
