fn calcBitangent(
  tangent: vec4<f32>,
  normalInWorld: vec3<f32>,
  worldMatrix: mat4x4<f32>,
  outTangentInWorld: ptr<function, vec3<f32>>,
  outBitangentInWorld: ptr<function, vec3<f32>>
) {
  #ifdef RN_USE_TANGENT
    let tangentInWorld = (worldMatrix * vec4f(tangent.xyz, 0.0)).xyz;
    let bitangentInWorld = cross(normalInWorld, tangentInWorld) * tangent.w;
  #else
    // Fallback: Generate tangent and bitangent from normal when tangent attributes are not available
    let n = normalize(normalInWorld);
    // Choose a helper vector that is not parallel to the normal
    // Use (0, 1, 0) unless the normal is nearly parallel to it, then use (1, 0, 0)
    let helper = select(vec3f(0.0, 1.0, 0.0), vec3f(1.0, 0.0, 0.0), abs(n.y) >= 0.999);
    // Compute tangent and bitangent using cross products
    let tangentInWorld = normalize(cross(helper, n));
    let bitangentInWorld = normalize(cross(n, tangentInWorld));
  #endif
  *outTangentInWorld = tangentInWorld;
  *outBitangentInWorld = bitangentInWorld;
}

