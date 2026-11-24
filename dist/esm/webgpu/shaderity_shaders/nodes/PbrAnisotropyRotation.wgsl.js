var n=`fn pbrAnisotropyRotation(
  anisotropyRotation: f32,
  outAnisotropyRotation: ptr<function, vec2<f32>>) {
  (*outAnisotropyRotation) = vec2<f32>(cos(anisotropyRotation), sin(anisotropyRotation));
}
`,i="fragment",a=!0,r={code:n,shaderStage:i,isFragmentShader:a};export{n as code,r as default,a as isFragmentShader,i as shaderStage};
