void sdRepeat(in vec2 position, in float interval, out vec2 outPosition) {
  outPosition = mod(position, interval) - interval * 0.5;
}

void sdRepeat(in vec3 position, in float interval, out vec3 outPosition) {
  outPosition = mod(position, interval) - interval * 0.5;
}
