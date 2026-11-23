void opSmoothSubtraction(in float base, in float subtractor, in float smoothness, out float outValue) {
  float k = max(smoothness, 0.0001);
  float h = clamp(0.5 - 0.5 * (subtractor + base) / k, 0.0, 1.0);
  outValue = mix(base, -subtractor, h) + k * h * (1.0 - h);
}
