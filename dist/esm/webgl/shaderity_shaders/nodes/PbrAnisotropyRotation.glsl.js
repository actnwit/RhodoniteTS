var n=`void pbrAnisotropyRotation(
  in float anisotropyRotation,
  out vec2 outAnisotropyRotation) {
  outAnisotropyRotation = vec2(cos(anisotropyRotation), sin(anisotropyRotation));
}
`,i="fragment",a=!0,r={code:n,shaderStage:i,isFragmentShader:a};export{n as code,r as default,a as isFragmentShader,i as shaderStage};
