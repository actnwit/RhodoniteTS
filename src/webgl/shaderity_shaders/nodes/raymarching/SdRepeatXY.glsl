void sdRepeatXY(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.xy = (fract(position.xy / interval) - 0.5) * interval;
  outPosition.z = position.z;
}
