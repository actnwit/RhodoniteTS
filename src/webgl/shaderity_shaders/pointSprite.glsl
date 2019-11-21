vec4 position_inWorld = worldMatrix * vec4(a_position, 1.0);
vec3 viewPosition = get_viewPosition(cameraSID, 0);
float distanceFromCamera = length(position_inWorld.xyz - viewPosition);
vec3 pointDistanceAttenuation = get_pointDistanceAttenuation(materialSID, 0);
float distanceAttenuationFactor = sqrt(1.0/(pointDistanceAttenuation.x + pointDistanceAttenuation.y * distanceFromCamera + pointDistanceAttenuation.z * distanceFromCamera * distanceFromCamera));
float maxPointSize = get_pointSize(materialSID, 0);
gl_PointSize = clamp(distanceAttenuationFactor * maxPointSize, 0.0, maxPointSize);
