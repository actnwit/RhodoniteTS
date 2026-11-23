void bendYZ(in vec3 position, in float strength, out vec3 outPosition) {
  float angle = strength * position.y;
  float c = cos(angle);
  float s = sin(angle);
  outPosition = vec3(position.x, c * position.y - s * position.z, s * position.y + c * position.z);
}
