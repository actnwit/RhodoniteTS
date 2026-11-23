fn bendZY(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {
  let angle = strength * position.z;
  let c = cos(angle);
  let s = sin(angle);
  *outPosition = vec3f(position.x, s * position.z + c * position.y, c * position.z - s * position.y);
}
