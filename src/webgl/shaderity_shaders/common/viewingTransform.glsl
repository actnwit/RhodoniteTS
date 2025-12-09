  uint cameraSID = uint(u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}]);
  mat4 worldMatrix = get_worldMatrix(uint(a_instanceInfo.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * a_position;
