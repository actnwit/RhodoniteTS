fn sdTubeZ(position: vec3f, width: f32, outDistance: ptr<function, f32>) {
  *outDistance = length(position.xy) - width;
}
