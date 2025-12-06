// float versions
void mergeVectorXYZ_W(in vec3 xyz, in float w, out vec4 outXYZW, out vec3 outXYZ, out vec2 outXY, out vec2 outZW) {
  outXYZW.x = xyz.x;
  outXYZW.y = xyz.y;
  outXYZW.z = xyz.z;
  outXYZW.w = w;
  outXYZ = xyz;
  outXY = xyz.xy;
  outZW = vec2(xyz.z, w);
}

void mergeVectorXY_ZW(in vec2 xy, in vec2 zw, out vec4 outXYZW, out vec3 outXYZ, out vec2 outXY, out vec2 outZW) {
  outXYZW.x = xy.x;
  outXYZW.y = xy.y;
  outXYZW.z = zw.x;
  outXYZW.w = zw.y;
  outXYZ = vec3(xy, zw.x);
  outXY = xy;
  outZW = zw;
}

void mergeVectorXY_Z_W(in vec2 xy, in float z, in float w, out vec4 outXYZW, out vec3 outXYZ, out vec2 outXY, out vec2 outZW) {
  outXYZW.x = xy.x;
  outXYZW.y = xy.y;
  outXYZW.z = z;
  outXYZW.w = w;
  outXYZ = vec3(xy, z);
  outXY = xy;
  outZW = vec2(z, w);
}

void mergeVectorZW_X_Y(in vec2 zw, in float x, in float y, out vec4 outXYZW, out vec3 outXYZ, out vec2 outXY, out vec2 outZW) {
  outXYZW.x = x;
  outXYZW.y = y;
  outXYZW.z = zw.x;
  outXYZW.w = zw.y;
  outXYZ = vec3(x, y, zw.x);
  outXY = vec2(x, y);
  outZW = zw;
}

void mergeVectorX_Y_Z_W(in float x, in float y, in float z, in float w, out vec4 outXYZW, out vec3 outXYZ, out vec2 outXY, out vec2 outZW) {
  outXYZW.x = x;
  outXYZW.y = y;
  outXYZW.z = z;
  outXYZW.w = w;
  outXYZ = vec3(x, y, z);
  outXY = vec2(x, y);
  outZW = vec2(z, w);
}

// int versions
void mergeVectorXYZ_W(in ivec3 xyz, in int w, out ivec4 outXYZW, out ivec3 outXYZ, out ivec2 outXY, out ivec2 outZW) {
  outXYZW.x = xyz.x;
  outXYZW.y = xyz.y;
  outXYZW.z = xyz.z;
  outXYZW.w = w;
  outXYZ = xyz;
  outXY = xyz.xy;
  outZW = ivec2(xyz.z, w);
}

void mergeVectorXY_ZW(in ivec2 xy, in ivec2 zw, out ivec4 outXYZW, out ivec3 outXYZ, out ivec2 outXY, out ivec2 outZW) {
  outXYZW.x = xy.x;
  outXYZW.y = xy.y;
  outXYZW.z = zw.x;
  outXYZW.w = zw.y;
  outXYZ = ivec3(xy, zw.x);
  outXY = xy;
  outZW = zw;
}

void mergeVectorXY_Z_W(in ivec2 xy, in int z, in int w, out ivec4 outXYZW, out ivec3 outXYZ, out ivec2 outXY, out ivec2 outZW) {
  outXYZW.x = xy.x;
  outXYZW.y = xy.y;
  outXYZW.z = z;
  outXYZW.w = w;
  outXYZ = ivec3(xy, z);
  outXY = xy;
  outZW = ivec2(z, w);
}

void mergeVectorZW_X_Y(in ivec2 zw, in int x, in int y, out ivec4 outXYZW, out ivec3 outXYZ, out ivec2 outXY, out ivec2 outZW) {
  outXYZW.x = x;
  outXYZW.y = y;
  outXYZW.z = zw.x;
  outXYZW.w = zw.y;
  outXYZ = ivec3(x, y, zw.x);
  outXY = ivec2(x, y);
  outZW = zw;
}

void mergeVectorX_Y_Z_W(in int x, in int y, in int z, in int w, out ivec4 outXYZW, out ivec3 outXYZ, out ivec2 outXY, out ivec2 outZW) {
  outXYZW.x = x;
  outXYZW.y = y;
  outXYZW.z = z;
  outXYZW.w = w;
  outXYZ = ivec3(x, y, z);
  outXY = ivec2(x, y);
  outZW = ivec2(z, w);
}

// uint versions
void mergeVectorXYZ_W(in uvec3 xyz, in uint w, out uvec4 outXYZW, out uvec3 outXYZ, out uvec2 outXY, out uvec2 outZW) {
  outXYZW.x = xyz.x;
  outXYZW.y = xyz.y;
  outXYZW.z = xyz.z;
  outXYZW.w = w;
  outXYZ = xyz;
  outXY = xyz.xy;
  outZW = uvec2(xyz.z, w);
}

void mergeVectorXY_ZW(in uvec2 xy, in uvec2 zw, out uvec4 outXYZW, out uvec3 outXYZ, out uvec2 outXY, out uvec2 outZW) {
  outXYZW.x = xy.x;
  outXYZW.y = xy.y;
  outXYZW.z = zw.x;
  outXYZW.w = zw.y;
  outXYZ = uvec3(xy, zw.x);
  outXY = xy;
  outZW = zw;
}

void mergeVectorXY_Z_W(in uvec2 xy, in uint z, in uint w, out uvec4 outXYZW, out uvec3 outXYZ, out uvec2 outXY, out uvec2 outZW) {
  outXYZW.x = xy.x;
  outXYZW.y = xy.y;
  outXYZW.z = z;
  outXYZW.w = w;
  outXYZ = uvec3(xy, z);
  outXY = xy;
  outZW = uvec2(z, w);
}

void mergeVectorZW_X_Y(in uvec2 zw, in uint x, in uint y, out uvec4 outXYZW, out uvec3 outXYZ, out uvec2 outXY, out uvec2 outZW) {
  outXYZW.x = x;
  outXYZW.y = y;
  outXYZW.z = zw.x;
  outXYZW.w = zw.y;
  outXYZ = uvec3(x, y, zw.x);
  outXY = uvec2(x, y);
  outZW = zw;
}

void mergeVectorX_Y_Z_W(in uint x, in uint y, in uint z, in uint w, out uvec4 outXYZW, out uvec3 outXYZ, out uvec2 outXY, out uvec2 outZW) {
  outXYZW.x = x;
  outXYZW.y = y;
  outXYZW.z = z;
  outXYZW.w = w;
  outXYZ = uvec3(x, y, z);
  outXY = uvec2(x, y);
  outZW = uvec2(z, w);
}
