void _random(
  in vec3 seed,
  out vec4 outXYZW,
  out vec4 outXYZ1,
  out vec3 outXYZ,
  out vec2 outXY,
  out vec2 outZW,
  out float outX,
  out float outY,
  out float outZ,
  out float outW) {
  if (seed != vec3(0.0)) {
  #ifdef RN_IS_VERTEX_SHADER
    init_rand(uvec3(uint(gl_VertexID),0u,0u), uvec3(fract(seed) * float(0xffffffffu)));
  #else
    init_rand(uvec3(uint(gl_FragCoord.x), uint(gl_FragCoord.y),0u), uvec3(fract(seed) * float(0xffffffffu)));
  #endif
  }

  float x = random_f32();
  float y = random_f32();
  float z = random_f32();
  float w = random_f32();
  outXYZW = vec4(x, y, z, w);
  outXYZ1 = vec4(x, y, z, 1.0);
  outXYZ = vec3(x, y, z);
  outXY = vec2(x, y);
  outZW = vec2(z, w);
  outX = x;
  outY = y;
  outZ = z;
  outW = w;
}
