void sdRepeatX(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.x = (fract(position.x / interval) - 0.5) * interval;
  outPosition.yz = position.yz;
}
