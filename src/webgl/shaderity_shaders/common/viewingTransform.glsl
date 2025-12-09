  float cameraSID = u_currentComponentSIDs[${WellKnownComponentTIDs.CameraComponentTID}];
  mat4 worldMatrix = get_worldMatrix(uint(a_instanceInfo.x));
  mat4 viewMatrix = get_viewMatrix(uint(cameraSID));
  mat4 projectionMatrix = get_projectionMatrix(uint(cameraSID));
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * a_position;
