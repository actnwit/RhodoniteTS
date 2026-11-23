void bendZY(in vec3 position, in float strength, out vec3 outPosition) {
  float angle = strength * position.z;
  float c = cos(angle);
  float s = sin(angle);
  outPosition = vec3(position.x, s * position.z + c * position.y, c * position.z - s * position.y);
}
