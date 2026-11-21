void raymarchHitDistance(out float outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  outValue = length(g_hitPosition - get_viewPosition(cameraSID));
}
