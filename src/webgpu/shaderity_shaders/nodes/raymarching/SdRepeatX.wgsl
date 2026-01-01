fn sdRepeatX(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = vec3f((fract(position.x / interval) - 0.5) * interval, position.y, position.z);
}
