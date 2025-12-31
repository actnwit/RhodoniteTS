fn sdBarX(position: vec3f, width: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(max(abs(position.yz)-width,0.0));
}
