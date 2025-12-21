void pbrTransmissionProps(
  in float transmissionFactor,
  in vec4 transmissionTexture,
  out float outTransmission) {
  outTransmission = transmissionFactor * transmissionTexture.r;
}
