// float versions
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

// int versions
fn mergeVectorXYZ_WI32(xyz: vec3<i32>, w: i32, outXYZW: ptr<function, vec4<i32>>, outXYZ: ptr<function, vec3<i32>>, outXY: ptr<function, vec2<i32>>, outZW: ptr<function, vec2<i32>>) {
  *outXYZW = vec4<i32>(xyz, w);
  *outXYZ = xyz;
  *outXY = xyz.xy;
  *outZW = vec2<i32>(xyz.z, w);
}

fn mergeVectorXY_ZWI32(xy: vec2<i32>, zw: vec2<i32>, outXYZW: ptr<function, vec4<i32>>, outXYZ: ptr<function, vec3<i32>>, outXY: ptr<function, vec2<i32>>, outZW: ptr<function, vec2<i32>>) {
  *outXYZW = vec4<i32>(xy, zw);
  *outXYZ = vec3<i32>(xy, zw.x);
  *outXY = xy;
  *outZW = zw;
}

fn mergeVectorXY_Z_WI32(xy: vec2<i32>, z: i32, w: i32, outXYZW: ptr<function, vec4<i32>>, outXYZ: ptr<function, vec3<i32>>, outXY: ptr<function, vec2<i32>>, outZW: ptr<function, vec2<i32>>) {
  *outXYZW = vec4<i32>(xy.x, xy.y, z, w);
  *outXYZ = vec3<i32>(xy, z);
  *outXY = xy;
  *outZW = vec2<i32>(z, w);
}

fn mergeVectorZW_X_YI32(zw: vec2<i32>, x: i32, y: i32, outXYZW: ptr<function, vec4<i32>>, outXYZ: ptr<function, vec3<i32>>, outXY: ptr<function, vec2<i32>>, outZW: ptr<function, vec2<i32>>) {
  *outXYZW = vec4<i32>(x, y, zw.x, zw.y);
  *outXYZ = vec3<i32>(x, y, zw.x);
  *outXY = vec2<i32>(x, y);
  *outZW = zw;
}

fn mergeVectorX_Y_Z_WI32(x: i32, y: i32, z: i32, w: i32, outXYZW: ptr<function, vec4<i32>>, outXYZ: ptr<function, vec3<i32>>, outXY: ptr<function, vec2<i32>>, outZW: ptr<function, vec2<i32>>) {
  *outXYZW = vec4<i32>(x, y, z, w);
  *outXYZ = vec3<i32>(x, y, z);
  *outXY = vec2<i32>(x, y);
  *outZW = vec2<i32>(z, w);
}

// uint versions
fn mergeVectorXYZ_WU32(xyz: vec3<u32>, w: u32, outXYZW: ptr<function, vec4<u32>>, outXYZ: ptr<function, vec3<u32>>, outXY: ptr<function, vec2<u32>>, outZW: ptr<function, vec2<u32>>) {
  *outXYZW = vec4<u32>(xyz, w);
  *outXYZ = xyz;
  *outXY = xyz.xy;
  *outZW = vec2<u32>(xyz.z, w);
}

fn mergeVectorXY_ZWU32(xy: vec2<u32>, zw: vec2<u32>, outXYZW: ptr<function, vec4<u32>>, outXYZ: ptr<function, vec3<u32>>, outXY: ptr<function, vec2<u32>>, outZW: ptr<function, vec2<u32>>) {
  *outXYZW = vec4<u32>(xy, zw);
  *outXYZ = vec3<u32>(xy, zw.x);
  *outXY = xy;
  *outZW = zw;
}

fn mergeVectorXY_Z_WU32(xy: vec2<u32>, z: u32, w: u32, outXYZW: ptr<function, vec4<u32>>, outXYZ: ptr<function, vec3<u32>>, outXY: ptr<function, vec2<u32>>, outZW: ptr<function, vec2<u32>>) {
  *outXYZW = vec4<u32>(xy.x, xy.y, z, w);
  *outXYZ = vec3<u32>(xy, z);
  *outXY = xy;
  *outZW = vec2<u32>(z, w);
}

fn mergeVectorZW_X_YU32(zw: vec2<u32>, x: u32, y: u32, outXYZW: ptr<function, vec4<u32>>, outXYZ: ptr<function, vec3<u32>>, outXY: ptr<function, vec2<u32>>, outZW: ptr<function, vec2<u32>>) {
  *outXYZW = vec4<u32>(x, y, zw.x, zw.y);
  *outXYZ = vec3<u32>(x, y, zw.x);
  *outXY = vec2<u32>(x, y);
  *outZW = zw;
}

fn mergeVectorX_Y_Z_WU32(x: u32, y: u32, z: u32, w: u32, outXYZW: ptr<function, vec4<u32>>, outXYZ: ptr<function, vec3<u32>>, outXY: ptr<function, vec2<u32>>, outZW: ptr<function, vec2<u32>>) {
  *outXYZW = vec4<u32>(x, y, z, w);
  *outXYZ = vec3<u32>(x, y, z);
  *outXY = vec2<u32>(x, y);
  *outZW = vec2<u32>(z, w);
}
