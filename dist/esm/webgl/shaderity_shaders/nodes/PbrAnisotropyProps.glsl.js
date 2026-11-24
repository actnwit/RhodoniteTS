var n=`void pbrAnisotropyProps(
  in float anisotropyStrength,
  in vec2 anisotropyRotation,
  in vec4 anisotropyTexture,
  out AnisotropyProps outAnisotropyProps) {
#ifdef RN_USE_ANISOTROPY
  outAnisotropyProps.anisotropy = anisotropyStrength * anisotropyTexture.b;
  vec2 direction = anisotropyTexture.rg * 2.0 - vec2(1.0);
  outAnisotropyProps.direction = mat2(anisotropyRotation.x, anisotropyRotation.y, -anisotropyRotation.y, anisotropyRotation.x) * normalize(direction);
#else
  outAnisotropyProps.anisotropy = 0.0;
  outAnisotropyProps.direction = vec2(0.0, 0.0);
#endif // RN_USE_ANISOTROPY
}
`,r="fragment",i=!0,e={code:n,shaderStage:r,isFragmentShader:i};export{n as code,e as default,i as isFragmentShader,r as shaderStage};
