
void projectionMatrix(out mat4 outValue) {
  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID}*/];
  outValue = get_projectionMatrix(cameraSID, 0);
}
