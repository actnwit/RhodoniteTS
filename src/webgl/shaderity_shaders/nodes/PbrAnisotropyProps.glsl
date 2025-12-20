void pbrAnisotropyProps(
  in float anisotropyStrength,
  in vec2 anisotropyRotation,
  in vec4 anisotropyTexture,
  out AnisotropyProps outAnisotropyProps) {
  outAnisotropyProps.anisotropy = anisotropyStrength * anisotropyTexture.b;
  vec2 direction = anisotropyTexture.rg * 2.0 - vec2(1.0);
  outAnisotropyProps.direction = mat2(anisotropyRotation.x, anisotropyRotation.y, -anisotropyRotation.y, anisotropyRotation.x) * normalize(direction);
}
