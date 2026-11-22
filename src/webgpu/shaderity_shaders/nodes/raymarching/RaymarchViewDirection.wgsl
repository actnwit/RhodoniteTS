fn raymarchViewDirection(outValue: ptr<function, vec3f>) {
  *outValue = normalize(get_viewPosition(uniformDrawParameters.cameraSID) - g_hitPosition);
}
