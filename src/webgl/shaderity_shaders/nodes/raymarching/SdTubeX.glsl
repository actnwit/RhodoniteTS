void sdTubeX(in vec3 position, in float width, out float outDistance) {
  outDistance = length(position.yz) - width;
}
