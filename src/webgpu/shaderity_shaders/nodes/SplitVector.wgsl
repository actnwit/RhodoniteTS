// float versions
fn splitVectorXYZW(xyzw: vec4<f32>, outXYZ: ptr<function, vec3<f32>>, outXY: ptr<function, vec2<f32>>, outZW: ptr<function, vec2<f32>>, outX: ptr<function, f32>, outY: ptr<function, f32>, outZ: ptr<function, f32>, outW: ptr<function, f32>) {
  *outX = xyzw.x;
  *outY = xyzw.y;
  *outZ = xyzw.z;
  *outW = xyzw.w;
  *outXYZ = xyzw.xyz;
  *outXY = xyzw.xy;
  *outZW = xyzw.zw;
}

fn splitVectorXYZ(xyz: vec3<f32>, outXYZ: ptr<function, vec3<f32>>, outXY: ptr<function, vec2<f32>>, outZW: ptr<function, vec2<f32>>, outX: ptr<function, f32>, outY: ptr<function, f32>, outZ: ptr<function, f32>, outW: ptr<function, f32>) {
  *outX = xyz.x;
  *outY = xyz.y;
  *outZ = xyz.z;
  *outW = 0.0;
  *outXYZ = xyz;
  *outXY = xyz.xy;
  *outZW = vec2(xyz.z, 0.0);
}

fn splitVectorXY(xy: vec2<f32>, outXYZ: ptr<function, vec3<f32>>, outXY: ptr<function, vec2<f32>>, outZW: ptr<function, vec2<f32>>, outX: ptr<function, f32>, outY: ptr<function, f32>, outZ: ptr<function, f32>, outW: ptr<function, f32>) {
  *outX = xy.x;
  *outY = xy.y;
  *outZ = 0.0;
  *outW = 0.0;
  *outXYZ = vec3(xy, 0.0);
  *outXY = xy;
  *outZW = vec2(0.0);
}

// int versions
fn splitVectorXYZWI32(xyzw: vec4<i32>, outXYZ: ptr<function, vec3<i32>>, outXY: ptr<function, vec2<i32>>, outZW: ptr<function, vec2<i32>>, outX: ptr<function, i32>, outY: ptr<function, i32>, outZ: ptr<function, i32>, outW: ptr<function, i32>) {
  *outX = xyzw.x;
  *outY = xyzw.y;
  *outZ = xyzw.z;
  *outW = xyzw.w;
  *outXYZ = xyzw.xyz;
  *outXY = xyzw.xy;
  *outZW = xyzw.zw;
}

fn splitVectorXYZI32(xyz: vec3<i32>, outXYZ: ptr<function, vec3<i32>>, outXY: ptr<function, vec2<i32>>, outZW: ptr<function, vec2<i32>>, outX: ptr<function, i32>, outY: ptr<function, i32>, outZ: ptr<function, i32>, outW: ptr<function, i32>) {
  *outX = xyz.x;
  *outY = xyz.y;
  *outZ = xyz.z;
  *outW = 0;
  *outXYZ = xyz;
  *outXY = xyz.xy;
  *outZW = vec2<i32>(xyz.z, 0);
}

fn splitVectorXYI32(xy: vec2<i32>, outXYZ: ptr<function, vec3<i32>>, outXY: ptr<function, vec2<i32>>, outZW: ptr<function, vec2<i32>>, outX: ptr<function, i32>, outY: ptr<function, i32>, outZ: ptr<function, i32>, outW: ptr<function, i32>) {
  *outX = xy.x;
  *outY = xy.y;
  *outZ = 0;
  *outW = 0;
  *outXYZ = vec3<i32>(xy, 0);
  *outXY = xy;
  *outZW = vec2<i32>(0);
}

// uint versions
fn splitVectorXYZWU32(xyzw: vec4<u32>, outXYZ: ptr<function, vec3<u32>>, outXY: ptr<function, vec2<u32>>, outZW: ptr<function, vec2<u32>>, outX: ptr<function, u32>, outY: ptr<function, u32>, outZ: ptr<function, u32>, outW: ptr<function, u32>) {
  *outX = xyzw.x;
  *outY = xyzw.y;
  *outZ = xyzw.z;
  *outW = xyzw.w;
  *outXYZ = xyzw.xyz;
  *outXY = xyzw.xy;
  *outZW = xyzw.zw;
}

fn splitVectorXYZU32(xyz: vec3<u32>, outXYZ: ptr<function, vec3<u32>>, outXY: ptr<function, vec2<u32>>, outZW: ptr<function, vec2<u32>>, outX: ptr<function, u32>, outY: ptr<function, u32>, outZ: ptr<function, u32>, outW: ptr<function, u32>) {
  *outX = xyz.x;
  *outY = xyz.y;
  *outZ = xyz.z;
  *outW = 0u;
  *outXYZ = xyz;
  *outXY = xyz.xy;
  *outZW = vec2<u32>(xyz.z, 0u);
}

fn splitVectorXYU32(xy: vec2<u32>, outXYZ: ptr<function, vec3<u32>>, outXY: ptr<function, vec2<u32>>, outZW: ptr<function, vec2<u32>>, outX: ptr<function, u32>, outY: ptr<function, u32>, outZ: ptr<function, u32>, outW: ptr<function, u32>) {
  *outX = xy.x;
  *outY = xy.y;
  *outZ = 0u;
  *outW = 0u;
  *outXYZ = vec3<u32>(xy, 0u);
  *outXY = xy;
  *outZW = vec2<u32>(0u);
}
