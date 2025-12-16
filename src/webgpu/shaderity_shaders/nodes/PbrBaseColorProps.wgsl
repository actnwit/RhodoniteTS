fn pbrBaseColorProps(vertexColor: vec4<f32>, baseColorFactor: vec4<f32>, baseColorTexture: vec4<f32>, outColor: ptr<function, vec4<f32>>) {
  *outColor = vertexColor * baseColorFactor * baseColorTexture;
}
