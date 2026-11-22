void raymarchRayDirection(out vec3 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  outValue = normalize(g_hitPosition - get_viewPosition(cameraSID));
}
