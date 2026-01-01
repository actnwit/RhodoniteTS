fn sdTubeX(position: vec3f, width: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(position.yz) - width;
}
