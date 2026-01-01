void sdRepeat(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition = (fract(position / interval) - 0.5) * interval;
}
