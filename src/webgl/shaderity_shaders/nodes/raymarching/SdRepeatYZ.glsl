void sdRepeatYZ(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition.yz = (fract(position.yz / interval) - 0.5) * interval;
  outPosition.x = position.x;
}
