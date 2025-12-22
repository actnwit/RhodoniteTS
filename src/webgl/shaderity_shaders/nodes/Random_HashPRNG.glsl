// Helper macro to initialize random seed
#define INIT_RANDOM_SEED(seed) \
  if (seed != vec3(0.0)) { \
    INIT_RANDOM_SEED_IMPL \
  }

#ifdef RN_IS_VERTEX_SHADER
  #define INIT_RANDOM_SEED_IMPL init_rand(uvec3(uint(gl_VertexID),0u,0u), uvec3(fract(seed) * float(0xffffffffu)));
#else
  #define INIT_RANDOM_SEED_IMPL init_rand(uvec3(uint(gl_FragCoord.x), uint(gl_FragCoord.y),0u), uvec3(fract(seed) * float(0xffffffffu)));
#endif

// Variant 1: Only X needed (1 random_f32 call)
void random_HashPRNG1(
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
  INIT_RANDOM_SEED(seed)

  float x = random_f32();
  outXYZW = vec4(x, 0.0, 0.0, 0.0);
  outXYZ1 = vec4(x, 0.0, 0.0, 1.0);
  outXYZ = vec3(x, 0.0, 0.0);
  outXY = vec2(x, 0.0);
  outZW = vec2(0.0);
  outX = x;
  outY = 0.0;
  outZ = 0.0;
  outW = 0.0;
}

// Variant 2: X and Y needed (2 random_f32 calls)
void random_HashPRNG2(
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
  INIT_RANDOM_SEED(seed)

  float x = random_f32();
  float y = random_f32();
  outXYZW = vec4(x, y, 0.0, 0.0);
  outXYZ1 = vec4(x, y, 0.0, 1.0);
  outXYZ = vec3(x, y, 0.0);
  outXY = vec2(x, y);
  outZW = vec2(0.0);
  outX = x;
  outY = y;
  outZ = 0.0;
  outW = 0.0;
}

// Variant 3: X, Y, and Z needed (3 random_f32 calls)
void random_HashPRNG3(
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
  INIT_RANDOM_SEED(seed)

  float x = random_f32();
  float y = random_f32();
  float z = random_f32();
  outXYZW = vec4(x, y, z, 0.0);
  outXYZ1 = vec4(x, y, z, 1.0);
  outXYZ = vec3(x, y, z);
  outXY = vec2(x, y);
  outZW = vec2(z, 0.0);
  outX = x;
  outY = y;
  outZ = z;
  outW = 0.0;
}

// Variant 4: All components needed (4 random_f32 calls) - default
void random_HashPRNG4(
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
  INIT_RANDOM_SEED(seed)

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

// Original function name for backward compatibility
void random_HashPRNG(
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
  random_HashPRNG4(seed, outXYZW, outXYZ1, outXYZ, outXY, outZW, outX, outY, outZ, outW);
}

