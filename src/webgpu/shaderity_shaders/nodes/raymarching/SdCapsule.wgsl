fn sdCapsule(position: vec3f, pointA: vec3f, pointB: vec3f, radius: f32, outDistance: ptr<function, f32>) {
  let pa = position - pointA;
  let ba = pointB - pointA;
  let denominator = dot(ba, ba);
  var h = 0.0;
  if (denominator > 0.0) {
    h = clamp(dot(pa, ba) / denominator, 0.0, 1.0);
  }
  *outDistance = length(pa - ba * h) - radius;
}
