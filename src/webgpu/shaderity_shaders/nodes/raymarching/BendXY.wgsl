fn bendXY(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {
  let angle = strength * position.x;
  let c = cos(angle);
  let s = sin(angle);
  *outPosition = vec3f(c * position.x - s * position.y, s * position.x + c * position.y, position.z);
}
