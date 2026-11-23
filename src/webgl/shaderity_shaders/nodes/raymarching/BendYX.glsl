void bendYX(in vec3 position, in float strength, out vec3 outPosition) {
  float angle = strength * position.y;
  float c = cos(angle);
  float s = sin(angle);
  outPosition = vec3(s * position.y + c * position.x, c * position.y - s * position.x, position.z);
}
