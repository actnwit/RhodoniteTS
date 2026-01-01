fn sdRepeat(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = (fract(position / interval) - vec3<f32>(0.5)) * interval;
}
