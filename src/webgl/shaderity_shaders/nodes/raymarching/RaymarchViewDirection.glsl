void raymarchViewDirection(out vec3 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  outValue = normalize(get_viewPosition(cameraSID) - g_hitPosition);
}
