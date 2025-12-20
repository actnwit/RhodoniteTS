fn pbrAnisotropyProps(
  anisotropyStrength: f32,
  anisotropyRotation: vec2<f32>,
  anisotropyTexture: vec4<f32>,
  outAnisotropyProps: ptr<function, AnisotropyProps>) {
  (*outAnisotropyProps).anisotropy = anisotropyStrength * anisotropyTexture.b;
  let direction = anisotropyTexture.rg * 2.0 - vec2<f32>(1.0);
  (*outAnisotropyProps).direction = mat2x2<f32>(anisotropyRotation.x, anisotropyRotation.y, -anisotropyRotation.y, anisotropyRotation.x) * normalize(direction);
}
