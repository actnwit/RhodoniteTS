var n=`vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}`,o="fragment",a=!0,c={code:n,shaderStage:o,isFragmentShader:a};export{n as code,c as default,a as isFragmentShader,o as shaderStage};
