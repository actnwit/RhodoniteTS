void sdBarX(in vec3 position, in float width, out float outDistance) {
  outDistance = length(max(abs(position.yz)-width,0.));
}
