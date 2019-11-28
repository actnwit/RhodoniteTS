vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}