void sdRepeatZ(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.z = (fract(position.z / interval) - 0.5) * interval;
  outPosition.xy = position.xy;
}
