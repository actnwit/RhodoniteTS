void sdRepeatY(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.y = (fract(position.y / interval) - 0.5) * interval;
  outPosition.xz = position.xz;
}
