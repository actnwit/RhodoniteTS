void mergeVectorXYZ_W(in vec3 xyz, in float w, out vec4 outXYZW, out vec3 outXYZ, out vec2 outXY, out vec2 outZW) {
  outXYZW.x = xyz.x;
  outXYZW.y = xyz.y;
  outXYZW.z = xyz.z;
  outXYZW.w = w;
  outXYZ = xyz;
  outXY = xyz.xy;
  outZW = xyz.zw;
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
