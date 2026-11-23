void sdCapsule(in vec3 position, in vec3 pointA, in vec3 pointB, in float radius, out float outDistance) {
  vec3 pa = position - pointA;
  vec3 ba = pointB - pointA;
  float denominator = dot(ba, ba);
  float h = denominator > 0.0 ? clamp(dot(pa, ba) / denominator, 0.0, 1.0) : 0.0;
  outDistance = length(pa - ba * h) - radius;
}
