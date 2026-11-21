fn raymarchCameraPosition(outValue: ptr<function, vec3f>) {
  *outValue = get_viewPosition(uniformDrawParameters.cameraSID);
}
