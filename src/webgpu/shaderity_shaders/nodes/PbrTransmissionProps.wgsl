fn pbrTransmissionProps(
  transmissionFactor: f32,
  transmissionTexture: vec4<f32>,
  outTransmission: ptr<function, f32>) {
  (*outTransmission) = transmissionFactor * transmissionTexture.r;
}
