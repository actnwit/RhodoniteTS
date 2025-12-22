// Variant 1: Only X needed (1 sin hash call)
fn random_SinHash1(
  seed: vec2<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  var x: f32 = fract(sin(dot(seed.xy, vec2<f32>(12.9898, 78.233)))*43758.5453);
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

// Variant 2: X and Y needed (2 sin hash calls)
fn random_SinHash2(
  seed: vec2<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  var x: f32 = fract(sin(dot(seed.xy, vec2<f32>(12.9898, 78.233)))*43758.5453);
  var y: f32 = fract(sin(dot(seed.xy * 2.0, vec2<f32>(12.9898, 78.233)))*43758.5453);
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

// Variant 3: X, Y, and Z needed (3 sin hash calls)
fn random_SinHash3(
  seed: vec2<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  var x: f32 = fract(sin(dot(seed.xy, vec2<f32>(12.9898, 78.233)))*43758.5453);
  var y: f32 = fract(sin(dot(seed.xy * 2.0, vec2<f32>(12.9898, 78.233)))*43758.5453);
  var z: f32 = fract(sin(dot(seed.xy * 3.0, vec2<f32>(12.9898, 78.233)))*43758.5453);
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

// Variant 4: All components needed (4 sin hash calls) - default
fn random_SinHash4(
  seed: vec2<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  var x: f32 = fract(sin(dot(seed.xy, vec2<f32>(12.9898, 78.233)))*43758.5453);
  var y: f32 = fract(sin(dot(seed.xy * 2.0, vec2<f32>(12.9898, 78.233)))*43758.5453);
  var z: f32 = fract(sin(dot(seed.xy * 3.0, vec2<f32>(12.9898, 78.233)))*43758.5453);
  var w: f32 = fract(sin(dot(seed.xy * 4.0, vec2<f32>(12.9898, 78.233)))*43758.5453);
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
fn random_SinHash(
  seed: vec2<f32>,
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  random_SinHash4(seed, outXYZW, outXYZ1, outXYZ, outXY, outZW, outX, outY, outZ, outW);
}
