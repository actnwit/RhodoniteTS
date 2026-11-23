void opSmoothUnion(in float lhs, in float rhs, in float smoothness, out float outValue) {
  float k = max(smoothness, 0.0001);
  float h = clamp(0.5 + 0.5 * (rhs - lhs) / k, 0.0, 1.0);
  outValue = mix(rhs, lhs, h) - k * h * (1.0 - h);
}
