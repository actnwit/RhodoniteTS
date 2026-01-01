void sdTubeY(in vec3 position, in float width, out float outDistance) {
  outDistance = length(position.xz) - width;
}
