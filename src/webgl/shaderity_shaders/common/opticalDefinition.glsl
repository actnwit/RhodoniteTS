struct Light {
  int type; // 0 = directional, 1 = point, 2 = spot
  vec3 position;
  vec3 intensity;
  vec3 direction;
  float spotCosCutoff;
  float spotExponent;
};

Light getLight(int lightIdx, vec3 v_position_inWorld) {
  vec4 position_and_w_of_LightObject = get_lightPosition(0.0, lightIdx);
  vec4 direction_and_w_of_LightObject = get_lightDirection(0.0, lightIdx);
  vec4 intensity_and_w_of_LightObject = get_lightIntensity(0.0, lightIdx);
  vec3 lightPosition = position_and_w_of_LightObject.xyz;
  vec3 lightDirection = direction_and_w_of_LightObject.xyz;
  vec3 lightIntensity = intensity_and_w_of_LightObject.xyz;
  float lightType = position_and_w_of_LightObject.w;
  float spotCosCutoff = direction_and_w_of_LightObject.w;
  float spotExponent = intensity_and_w_of_LightObject.w;

  Light light;

  light.position = lightPosition;
  light.spotCosCutoff = spotCosCutoff;
  light.spotExponent = spotExponent;
  light.type = 0;
  if (0.75 < lightType) { // is pointlight or spotlight
    lightDirection = normalize(lightPosition - v_position_inWorld);
    light.type = 1;
  }
  light.direction = lightDirection;
  float spotEffect = 1.0;
  if (lightType > 1.75) { // is spotlight
    light.type = 2;
    spotEffect = dot(direction_and_w_of_LightObject.xyz, lightDirection);
    if (spotEffect > spotCosCutoff) {
      spotEffect = pow(spotEffect, spotExponent);
    } else {
      spotEffect = 0.0;
    }
  }

  // IncidentLight
  vec3 intensity = spotEffect * lightIntensity.xyz;
  const float M_PI = 3.141592653589793;
  intensity *= M_PI;
  light.intensity = intensity;

  return light;
}
