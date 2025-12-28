fn sdSphere(position: vec3f, radius: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(position) - radius;
}
