let worldMatrix = get_worldMatrix(u32(instance_ids.x));

#ifdef RN_NO_CAMERA_TRANSFORM
  output.position = worldMatrix * vec4f(position, 1.0);
#else

  let viewMatrix = get_viewMatrix(cameraSID, 0);
  let projectionMatrix = get_projectionMatrix(cameraSID, 0);
  output.position = projectionMatrix * viewMatrix * worldMatrix * vec4f(position, 1.0);

#endif
