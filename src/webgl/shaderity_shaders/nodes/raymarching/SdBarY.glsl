void sdBarY(in vec3 position, in float width, out float outDistance) {
  outDistance = length(max(abs(position.xz)-width,0.));
}
