fn pbrAnisotropyRotation(
  anisotropyRotation: f32,
  outAnisotropyRotation: ptr<function, vec2<f32>>) {
  (*outAnisotropyRotation) = vec2<f32>(cos(anisotropyRotation), sin(anisotropyRotation));
}
