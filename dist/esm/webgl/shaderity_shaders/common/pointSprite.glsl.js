var i=`// #ifdef RN_IS_POINTSPRITE

vec4 position_inWorld = worldMatrix * vec4(a_position, 1.0);
vec3 viewPosition = get_viewPosition(cameraSID);
float distanceFromCamera = length(position_inWorld.xyz - viewPosition);
vec3 pointDistanceAttenuation = get_pointDistanceAttenuation(materialSID, 0u);
float distanceAttenuationFactor = sqrt(1.0/(pointDistanceAttenuation.x + pointDistanceAttenuation.y * distanceFromCamera + pointDistanceAttenuation.z * distanceFromCamera * distanceFromCamera));
float maxPointSize = get_pointSize(materialSID, 0u);
gl_PointSize = clamp(distanceAttenuationFactor * maxPointSize, 0.0, maxPointSize);

// #endif
`,e="fragment",a=!0,o={code:i,shaderStage:e,isFragmentShader:a};export{i as code,o as default,a as isFragmentShader,e as shaderStage};
