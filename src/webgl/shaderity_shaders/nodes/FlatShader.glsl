void flatShader(in vec4 vertexColor, in vec4 diffuseColorFactor, in vec4 diffuseTextureColor, out vec4 outColor) {
  outColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
}
