// float versions
void splitVector(in vec4 xyzw, out vec3 outXYZ, out vec2 outXY, out vec2 outZW, out float outX, out float outY, out float outZ, out float outW) {
  outX = xyzw.x;
  outY = xyzw.y;
  outZ = xyzw.z;
  outW = xyzw.w;
  outXYZ = xyzw.xyz;
  outXY = xyzw.xy;
  outZW = xyzw.zw;
}

void splitVector(in vec3 xyz, out vec3 outXYZ, out vec2 outXY, out vec2 outZW, out float outX, out float outY, out float outZ, out float outW) {
  outX = xyz.x;
  outY = xyz.y;
  outZ = xyz.z;
  outW = 0.0;
  outXYZ = xyz;
  outXY = xyz.xy;
  outZW = vec2(xyz.z, 0.0);
}

void splitVector(in vec2 xy, out vec3 outXYZ, out vec2 outXY, out vec2 outZW, out float outX, out float outY, out float outZ, out float outW) {
  outX = xy.x;
  outY = xy.y;
  outZ = 0.0;
  outW = 0.0;
  outXYZ = vec3(xy, 0.0);
  outXY = xy;
  outZW = vec2(0.0);
}

// int versions
void splitVector(in ivec4 xyzw, out ivec3 outXYZ, out ivec2 outXY, out ivec2 outZW, out int outX, out int outY, out int outZ, out int outW) {
  outX = xyzw.x;
  outY = xyzw.y;
  outZ = xyzw.z;
  outW = xyzw.w;
  outXYZ = xyzw.xyz;
  outXY = xyzw.xy;
  outZW = xyzw.zw;
}

void splitVector(in ivec3 xyz, out ivec3 outXYZ, out ivec2 outXY, out ivec2 outZW, out int outX, out int outY, out int outZ, out int outW) {
  outX = xyz.x;
  outY = xyz.y;
  outZ = xyz.z;
  outW = 0;
  outXYZ = xyz;
  outXY = xyz.xy;
  outZW = ivec2(xyz.z, 0);
}

void splitVector(in ivec2 xy, out ivec3 outXYZ, out ivec2 outXY, out ivec2 outZW, out int outX, out int outY, out int outZ, out int outW) {
  outX = xy.x;
  outY = xy.y;
  outZ = 0;
  outW = 0;
  outXYZ = ivec3(xy, 0);
  outXY = xy;
  outZW = ivec2(0);
}

// uint versions
void splitVector(in uvec4 xyzw, out uvec3 outXYZ, out uvec2 outXY, out uvec2 outZW, out uint outX, out uint outY, out uint outZ, out uint outW) {
  outX = xyzw.x;
  outY = xyzw.y;
  outZ = xyzw.z;
  outW = xyzw.w;
  outXYZ = xyzw.xyz;
  outXY = xyzw.xy;
  outZW = xyzw.zw;
}

void splitVector(in uvec3 xyz, out uvec3 outXYZ, out uvec2 outXY, out uvec2 outZW, out uint outX, out uint outY, out uint outZ, out uint outW) {
  outX = xyz.x;
  outY = xyz.y;
  outZ = xyz.z;
  outW = 0u;
  outXYZ = xyz;
  outXY = xyz.xy;
  outZW = uvec2(xyz.z, 0u);
}

void splitVector(in uvec2 xy, out uvec3 outXYZ, out uvec2 outXY, out uvec2 outZW, out uint outX, out uint outY, out uint outZ, out uint outW) {
  outX = xy.x;
  outY = xy.y;
  outZ = 0u;
  outW = 0u;
  outXYZ = uvec3(xy, 0u);
  outXY = xy;
  outZW = uvec2(0u);
}
