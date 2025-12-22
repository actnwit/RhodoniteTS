// Variant 1: Only X needed (1 random_f32 call)
fn random_HashPRNG1(
  seed: vec3<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  if (any(seed != vec3<f32>(0.0))) {
  #ifdef RN_IS_VERTEX_SHADER
    init_rand(vec3u(a_vertexIdx,0u,0u), vec3u(fract(seed) * f32(0xffffffffu)));
  #else
    init_rand(vec3u(u32(g_position.x),u32(g_position.y),u32(g_position.z)), vec3u(fract(seed) * f32(0xffffffffu)));
  #endif
  }
  var x: f32 = random_f32();
  *outXYZW = vec4<f32>(x, 0.0, 0.0, 0.0);
  *outXYZ1 = vec4<f32>(x, 0.0, 0.0, 1.0);
  *outXYZ = vec3<f32>(x, 0.0, 0.0);
  *outXY = vec2<f32>(x, 0.0);
  *outZW = vec2<f32>(0.0);
  *outX = x;
  *outY = 0.0;
  *outZ = 0.0;
  *outW = 0.0;
}

// Variant 2: X and Y needed (2 random_f32 calls)
fn random_HashPRNG2(
  seed: vec3<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  if (any(seed != vec3<f32>(0.0))) {
  #ifdef RN_IS_VERTEX_SHADER
    init_rand(vec3u(a_vertexIdx,0u,0u), vec3u(fract(seed) * f32(0xffffffffu)));
  #else
    init_rand(vec3u(u32(g_position.x),u32(g_position.y),u32(g_position.z)), vec3u(fract(seed) * f32(0xffffffffu)));
  #endif
  }
  var x: f32 = random_f32();
  var y: f32 = random_f32();
  *outXYZW = vec4<f32>(x, y, 0.0, 0.0);
  *outXYZ1 = vec4<f32>(x, y, 0.0, 1.0);
  *outXYZ = vec3<f32>(x, y, 0.0);
  *outXY = vec2<f32>(x, y);
  *outZW = vec2<f32>(0.0);
  *outX = x;
  *outY = y;
  *outZ = 0.0;
  *outW = 0.0;
}

// Variant 3: X, Y, and Z needed (3 random_f32 calls)
fn random_HashPRNG3(
  seed: vec3<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  if (any(seed != vec3<f32>(0.0))) {
  #ifdef RN_IS_VERTEX_SHADER
    init_rand(vec3u(a_vertexIdx,0u,0u), vec3u(fract(seed) * f32(0xffffffffu)));
  #else
    init_rand(vec3u(u32(g_position.x),u32(g_position.y),u32(g_position.z)), vec3u(fract(seed) * f32(0xffffffffu)));
  #endif
  }
  var x: f32 = random_f32();
  var y: f32 = random_f32();
  var z: f32 = random_f32();
  *outXYZW = vec4<f32>(x, y, z, 0.0);
  *outXYZ1 = vec4<f32>(x, y, z, 1.0);
  *outXYZ = vec3<f32>(x, y, z);
  *outXY = vec2<f32>(x, y);
  *outZW = vec2<f32>(z, 0.0);
  *outX = x;
  *outY = y;
  *outZ = z;
  *outW = 0.0;
}

// Variant 4: All components needed (4 random_f32 calls) - default
fn random_HashPRNG4(
  seed: vec3<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  if (any(seed != vec3<f32>(0.0))) {
  #ifdef RN_IS_VERTEX_SHADER
    init_rand(vec3u(a_vertexIdx,0u,0u), vec3u(fract(seed) * f32(0xffffffffu)));
  #else
    init_rand(vec3u(u32(g_position.x),u32(g_position.y),u32(g_position.z)), vec3u(fract(seed) * f32(0xffffffffu)));
  #endif
  }
  var x: f32 = random_f32();
  var y: f32 = random_f32();
  var z: f32 = random_f32();
  var w: f32 = random_f32();
  *outXYZW = vec4<f32>(x, y, z, w);
  *outXYZ1 = vec4<f32>(x, y, z, 1.0);
  *outXYZ = vec3<f32>(x, y, z);
  *outXY = vec2<f32>(x, y);
  *outZW = vec2<f32>(z, w);
  *outX = x;
  *outY = y;
  *outZ = z;
  *outW = w;
}

// Original function name for backward compatibility
fn random_HashPRNG(
  seed: vec3<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  random_HashPRNG4(seed, outXYZW, outXYZ1, outXYZ, outXY, outZW, outX, outY, outZ, outW);
}

