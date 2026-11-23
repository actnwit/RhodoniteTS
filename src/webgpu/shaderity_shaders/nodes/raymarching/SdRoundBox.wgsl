fn sdRoundBox(position: vec3f, size: vec3f, radius: f32, outDistance: ptr<function, f32>) {
  let q = abs(position) - size;
  *outDistance = length(max(q, vec3f(0.0))) - radius;
}
