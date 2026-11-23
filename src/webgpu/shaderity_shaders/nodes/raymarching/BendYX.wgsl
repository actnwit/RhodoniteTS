fn bendYX(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {
  let angle = strength * position.y;
  let c = cos(angle);
  let s = sin(angle);
  *outPosition = vec3f(s * position.y + c * position.x, c * position.y - s * position.x, position.z);
}
