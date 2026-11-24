var r=`let worldMatrix = get_worldMatrix(u32(instanceIds.x));
let viewMatrix = get_viewMatrix(cameraSID);
let projectionMatrix = get_projectionMatrix(cameraSID);
output.position = projectionMatrix * viewMatrix * worldMatrix * position;
`,i="fragment",a=!0,o={code:r,shaderStage:i,isFragmentShader:a};export{r as code,o as default,a as isFragmentShader,i as shaderStage};
