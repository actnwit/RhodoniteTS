fn sdRepeatVec2f(position: vec2f, interval: f32, outPosition: ptr<function, vec2f>) {
  *outPosition = mod(position, interval) - interval * 0.5;
}

fn sdRepeatVec3f(position: vec3f, interval: f32, outPosition: ptr<function, vec3f>) {
  *outPosition = mod(position, interval) - interval * 0.5;
}
