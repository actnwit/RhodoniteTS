fn sdRepeatY(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = vec3f(position.x, (fract(position.y / interval) - 0.5) * interval, position.z);
}
