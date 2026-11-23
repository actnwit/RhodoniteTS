void sdRoundBox(in vec3 position, in vec3 size, in float radius, out float outDistance) {
  vec3 q = abs(position) - size;
  outDistance = length(max(q, 0.0)) - radius;
}
