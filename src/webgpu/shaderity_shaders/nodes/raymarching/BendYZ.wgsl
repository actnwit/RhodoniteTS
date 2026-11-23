fn bendYZ(position: vec3f, strength: f32, outPosition: ptr<function, vec3f>) {
  let angle = strength * position.y;
  let c = cos(angle);
  let s = sin(angle);
  *outPosition = vec3f(position.x, c * position.y - s * position.z, s * position.y + c * position.z);
}
