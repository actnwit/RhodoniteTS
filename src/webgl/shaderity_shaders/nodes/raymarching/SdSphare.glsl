void sdSphere(in vec3 position, in float radius, out float outDistance) {
  outDistance = length(position) - radius;
}
