void sdTorus(in vec3 position, in float radius, in float tubeRadius, out float outDistance) {
  vec2 q = vec2(length(position.xz) - radius, position.y);
  outDistance = length(q) - tubeRadius;
}
