fn raymarchHitDistance(outValue: ptr<function, f32>) {
  let cameraPosition = get_viewPosition(uniformDrawParameters.cameraSID);
  *outValue = length(g_hitPosition - cameraPosition);
}
