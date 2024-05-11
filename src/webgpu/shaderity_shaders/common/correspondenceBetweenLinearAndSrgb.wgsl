fn linearToSrgb(linearColor: vec3f) -> vec3f {
  return pow(linearColor, vec3f(1.0/2.2));
}

fn srgbToLinear(srgbColor: vec3f) -> vec3f {
  return pow(srgbColor, vec3f(2.2));
}
