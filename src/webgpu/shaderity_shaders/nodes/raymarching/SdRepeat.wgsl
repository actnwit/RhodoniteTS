fn sdRepeatVec2f(position: vec2f, interval: f32, outPosition: ptr<function, vec2f>) {
  *outPosition = (fract(position / interval) - vec2<f32>(0.5)) * interval;
}

fn sdRepeatVec3f(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = (fract(position / interval) - vec3<f32>(0.5)) * interval;
}
