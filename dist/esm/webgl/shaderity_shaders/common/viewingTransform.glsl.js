var e=`  uint cameraSID = uint(u_currentComponentSIDs[\${WellKnownComponentTIDs.CameraComponentTID}]);
  mat4 worldMatrix = get_worldMatrix(uint(a_instanceIds.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * a_position;
`,n="fragment",r=!0,i={code:e,shaderStage:n,isFragmentShader:r};export{e as code,i as default,r as isFragmentShader,n as shaderStage};
