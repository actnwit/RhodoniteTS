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
