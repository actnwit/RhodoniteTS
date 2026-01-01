fn sdRepeatZ(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = vec3f(position.x, position.y, (fract(position.z / interval) - 0.5) * interval);
}
