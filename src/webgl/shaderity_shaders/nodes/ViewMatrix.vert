
void viewMatrix(out mat4 outValue) {
  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID}*/];
  outValue = get_viewMatrix(cameraSID, 0);
}
