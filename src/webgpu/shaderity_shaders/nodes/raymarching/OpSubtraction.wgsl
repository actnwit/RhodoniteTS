fn opSubtraction(base: f32, subtractor: f32, outValue: ptr<function, f32>) {
  *outValue = max(base, -subtractor);
}
