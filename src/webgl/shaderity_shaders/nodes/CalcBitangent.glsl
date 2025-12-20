void calcBitangent(in vec4 tangent, in vec3 normalInWorld, in mat4 worldMatrix, out vec3 outTangentInWorld, out vec3 outBitangentInWorld) {
  #ifdef RN_USE_TANGENT
    vec3 tangentInWorld = vec3(worldMatrix * vec4(tangent.xyz, 0.0));
    vec3 bitangentInWorld = cross(normalInWorld, tangentInWorld) * tangent.w;
  #else
    // Fallback: Generate tangent and bitangent from normal when tangent attributes are not available
    vec3 n = normalize(normalInWorld);
    // Choose a helper vector that is not parallel to the normal
    // Use (0, 1, 0) unless the normal is nearly parallel to it, then use (1, 0, 0)
    vec3 helper = abs(n.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    // Compute tangent and bitangent using cross products
    vec3 tangentInWorld = normalize(cross(helper, n));
    vec3 bitangentInWorld = normalize(cross(n, tangentInWorld));
  #endif
  outTangentInWorld = tangentInWorld;
  outBitangentInWorld = bitangentInWorld;
}

