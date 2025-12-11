fn flatShader(vertexColor: vec4<f32>, diffuseColorFactor: vec4<f32>, diffuseTextureColor: vec4<f32>, outColor: ptr<function, vec4<f32>>) {
  *outColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
}
