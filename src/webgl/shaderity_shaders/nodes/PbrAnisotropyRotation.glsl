void pbrAnisotropyRotation(
  in float anisotropyRotation,
  out vec2 outAnisotropyRotation) {
  outAnisotropyRotation = vec2(cos(anisotropyRotation), sin(anisotropyRotation));
}
