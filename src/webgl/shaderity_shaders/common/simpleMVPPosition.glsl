mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);

#ifdef RN_NO_CAMERA_TRANSFORM
  gl_Position = worldMatrix * vec4(a_position, 1.0);
#else

  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);

#endif
