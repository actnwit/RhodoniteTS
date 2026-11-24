var i=`mat4 worldMatrix = get_worldMatrix(uint(a_instanceIds.x));
mat4 viewMatrix = get_viewMatrix(cameraSID);
mat4 projectionMatrix = get_projectionMatrix(cameraSID);
gl_Position = projectionMatrix * viewMatrix * worldMatrix * a_position;
`,r="fragment",e=!0,n={code:i,shaderStage:r,isFragmentShader:e};export{i as code,n as default,e as isFragmentShader,r as shaderStage};
