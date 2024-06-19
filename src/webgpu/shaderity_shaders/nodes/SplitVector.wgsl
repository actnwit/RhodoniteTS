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
