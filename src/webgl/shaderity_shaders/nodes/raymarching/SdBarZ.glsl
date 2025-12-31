void sdBarZ(in vec3 position, in float width, out float outDistance) {
  outDistance = length(max(abs(position.xy)-width,0.));
}
