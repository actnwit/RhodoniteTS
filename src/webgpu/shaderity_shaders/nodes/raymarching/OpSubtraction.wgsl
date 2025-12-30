fn opSubtraction(d1: f32, minus_d2: f32, outValue: ptr<function, f32>) {
  *outValue = max(d1, -minus_d2);
}
