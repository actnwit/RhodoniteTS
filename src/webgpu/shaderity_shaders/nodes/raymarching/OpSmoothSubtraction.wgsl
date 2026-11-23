fn opSmoothSubtraction(base: f32, subtractor: f32, smoothness: f32, outValue: ptr<function, f32>) {
  let k = max(smoothness, 0.0001);
  let h = clamp(0.5 - 0.5 * (subtractor + base) / k, 0.0, 1.0);
  *outValue = mix(base, -subtractor, h) + k * h * (1.0 - h);
}
