fn _random(
  outXYZW: ptr<function, vec4<f32>>,
  outXYZ1: ptr<function, vec4<f32>>,
  outXYZ: ptr<function, vec3<f32>>,
  outXY: ptr<function, vec2<f32>>,
  outZW: ptr<function, vec2<f32>>,
  outX: ptr<function, f32>,
  outY: ptr<function, f32>,
  outZ: ptr<function, f32>,
  outW: ptr<function, f32>) {
  float x = random_f32();
  float y = random_f32();
  float z = random_f32();
  float w = random_f32();
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
