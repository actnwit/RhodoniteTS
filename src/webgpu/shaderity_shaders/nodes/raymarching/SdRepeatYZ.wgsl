fn sdRepeatYZ(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = vec3f(position.x, (fract(position.yz / interval) - vec2<f32>(0.5)) * interval);
}
