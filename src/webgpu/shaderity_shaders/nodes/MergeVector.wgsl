fn mergeVectorXYZ_W(xyz: vec3<f32>, w: f32, outXYZW: ptr<function, vec4<f32>>, outXYZ: ptr<function, vec3<f32>>, outXY: ptr<function, vec2<f32>>, outZW: ptr<function, vec2<f32>>) {
  *outXYZW = vec4<f32>(xyz, w);
  *outXYZ = xyz;
  *outXY = xyz.xy;
  *outZW = vec2f(xyz.z, w);
}

fn mergeVectorXY_ZW(xy: vec2<f32>, zw: vec2<f32>, outXYZW: ptr<function, vec4<f32>>, outXYZ: ptr<function, vec3<f32>>, outXY: ptr<function, vec2<f32>>, outZW: ptr<function, vec2<f32>>) {
  *outXYZW = vec4<f32>(xy, zw);
  *outXYZ = vec3f(xy, zw.x);
  *outXY = xy;
  *outZW = zw;
}

fn mergeVectorXY_Z_W(xy: vec2<f32>, z: f32, w: f32, outXYZW: ptr<function, vec4<f32>>, outXYZ: ptr<function, vec3<f32>>, outXY: ptr<function, vec2<f32>>, outZW: ptr<function, vec2<f32>>) {
  *outXYZW = vec4<f32>(xy.x, xy.y, z, w);
  *outXYZ = vec3f(xy, z);
  *outXY = xy;
  *outZW = vec2f(z, w);
}

fn mergeVectorZW_X_Y(zw: vec2<f32>, x: f32, y: f32, outXYZW: ptr<function, vec4<f32>>, outXYZ: ptr<function, vec3<f32>>, outXY: ptr<function, vec2<f32>>, outZW: ptr<function, vec2<f32>>) {
  *outXYZW = vec4<f32>(x, y, zw.x, zw.y);
  *outXYZ = vec3f(x, y, zw.x);
  *outXY = vec2f(x, y);
  *outZW = zw;
}

fn mergeVectorX_Y_Z_W(x: f32, y: f32, z: f32, w: f32, outXYZW: ptr<function, vec4<f32>>, outXYZ: ptr<function, vec3<f32>>, outXY: ptr<function, vec2<f32>>, outZW: ptr<function, vec2<f32>>) {
  *outXYZW = vec4<f32>(x, y, z, w);
  *outXYZ = vec3f(x, y, z);
  *outXY = vec2f(x, y);
  *outZW = vec2f(z, w);
}
