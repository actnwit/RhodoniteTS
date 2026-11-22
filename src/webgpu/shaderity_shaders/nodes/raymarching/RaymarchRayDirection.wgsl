fn raymarchRayDirection(outValue: ptr<function, vec3f>) {
  let cameraPosition = get_viewPosition(uniformDrawParameters.cameraSID);
  *outValue = normalize(g_hitPosition - cameraPosition);
}
