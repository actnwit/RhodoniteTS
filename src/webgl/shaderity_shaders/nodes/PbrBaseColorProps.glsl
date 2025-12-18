void pbrBaseColorProps(in vec4 vertexColor, in vec4 baseColorFactor, in vec4 baseColorTexture, out vec4 outColor) {
  outColor = vertexColor * baseColorFactor * baseColorTexture;
}
