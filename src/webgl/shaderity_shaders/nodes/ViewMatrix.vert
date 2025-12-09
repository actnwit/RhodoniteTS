
void viewMatrix(out mat4 outValue) {
  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID}*/]);
  outValue = get_viewMatrix(cameraSID);
}
