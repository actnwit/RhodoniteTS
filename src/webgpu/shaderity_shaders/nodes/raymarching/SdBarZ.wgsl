fn sdBarZ(position: vec3f, width: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(max(abs(position.xy)-width, vec2f(0.0)));
}
