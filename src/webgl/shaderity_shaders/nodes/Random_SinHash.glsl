// Variant 1: Only X needed (1 sin hash call)
void random_SinHash1(
  in vec2 seed,
  out vec4 outXYZW,
  out vec4 outXYZ1,
  out vec3 outXYZ,
  out vec2 outXY,
  out vec2 outZW,
  out float outX,
  out float outY,
  out float outZ,
  out float outW) {

  float x = fract(sin(dot(seed.xy, vec2(12.9898, 78.233)))*43758.5453);
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

// Variant 2: X and Y needed (2 sin hash calls)
void random_SinHash2(
  in vec2 seed,
  out vec4 outXYZW,
  out vec4 outXYZ1,
  out vec3 outXYZ,
  out vec2 outXY,
  out vec2 outZW,
  out float outX,
  out float outY,
  out float outZ,
  out float outW) {

  float x = fract(sin(dot(seed.xy, vec2(12.9898, 78.233)))*43758.5453);
  float y = fract(sin(dot(seed.xy * 2.0, vec2(12.9898, 78.233)))*43758.5453);
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

// Variant 3: X, Y, and Z needed (3 sin hash calls)
void random_SinHash3(
  in vec2 seed,
  out vec4 outXYZW,
  out vec4 outXYZ1,
  out vec3 outXYZ,
  out vec2 outXY,
  out vec2 outZW,
  out float outX,
  out float outY,
  out float outZ,
  out float outW) {

  float x = fract(sin(dot(seed.xy, vec2(12.9898, 78.233)))*43758.5453);
  float y = fract(sin(dot(seed.xy * 2.0, vec2(12.9898, 78.233)))*43758.5453);
  float z = fract(sin(dot(seed.xy * 3.0, vec2(12.9898, 78.233)))*43758.5453);
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

// Variant 4: All components needed (4 sin hash calls) - default
void random_SinHash4(
  in vec2 seed,
  out vec4 outXYZW,
  out vec4 outXYZ1,
  out vec3 outXYZ,
  out vec2 outXY,
  out vec2 outZW,
  out float outX,
  out float outY,
  out float outZ,
  out float outW) {

  float x = fract(sin(dot(seed.xy, vec2(12.9898, 78.233)))*43758.5453);
  float y = fract(sin(dot(seed.xy * 2.0, vec2(12.9898, 78.233)))*43758.5453);
  float z = fract(sin(dot(seed.xy * 3.0, vec2(12.9898, 78.233)))*43758.5453);
  float w = fract(sin(dot(seed.xy * 4.0, vec2(12.9898, 78.233)))*43758.5453);
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
void random_SinHash(
  in vec2 seed,
  out vec4 outXYZW,
  out vec4 outXYZ1,
  out vec3 outXYZ,
  out vec2 outXY,
  out vec2 outZW,
  out float outX,
  out float outY,
  out float outZ,
  out float outW) {
  random_SinHash4(seed, outXYZW, outXYZ1, outXYZ, outXY, outZW, outX, outY, outZ, outW);
}
