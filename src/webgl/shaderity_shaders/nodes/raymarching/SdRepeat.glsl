void sdRepeat(in vec2 position, in float interval, out vec2 outPosition) {
  outPosition = (fract(position / interval) - 0.5) * interval;
}

void sdRepeat(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition = (fract(position / interval) - 0.5) * interval;
}
