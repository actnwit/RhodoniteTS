void sdRepeatZX(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.xz = (fract(position.xz / interval) - 0.5) * interval;
  outPosition.y = position.y;
}
