fn raymarchTBN(outValue: ptr<function, mat3x3<f32>>) {
  let viewVector = get_viewPosition(uniformDrawParameters.cameraSID) - g_hitPosition;
  *outValue = getTBN(g_hitNormal, vec3f(1.0, 0.0, 0.0), vec3f(0.0, 1.0, 0.0), viewVector, vec2f(0.0));
}
