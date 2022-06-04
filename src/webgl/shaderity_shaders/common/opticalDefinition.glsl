struct Light {
  int type; // 0 = directional, 1 = point, 2 = spot
  vec3 position;
  vec3 intensity;
  vec3 attenuatedIntensity;
  vec3 directionOfLightObject;
  vec3 direction; // direction of light vector, equal to normalize(light.pointToLight)
  vec3 pointToLight; // not normalized
  float spotAngleScale;
  float spotAngleOffset;
  float effectiveRange;
};

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#range-property
float getRangeAttenuation(Light light)
{
  float distance = length(light.pointToLight);
  if (light.effectiveRange <= 0.0) // means no range limit
  {
    return 1.0 / pow(distance, 2.0);
  }
  return max(min(1.0 - pow(distance / light.effectiveRange, 4.0), 1.0), 0.0) / pow(distance, 2.0);
}

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#inner-and-outer-cone-angles
float getSpotAttenuation(Light light)
{

  float cd = dot(light.directionOfLightObject, light.direction);
  float angularAttenuation = clamp(cd * light.spotAngleScale + light.spotAngleOffset, 0.0, 1.0);
  return angularAttenuation;
}

void getLightAttenuated(Light light) {
  light.attenuatedIntensity = light.intensity;
  // if (light.type == 0) { // Directional Light
    // Directional Light don't attenuate geometically
  // }
  if (light.type != 0) // Point Light and Spot Light
  {
    light.attenuatedIntensity *= getRangeAttenuation(light);
  }
  if (light.type == 2) // Spot light
  {
    light.attenuatedIntensity *= getSpotAttenuation(light);
  }
}

Light getLight(int lightIdx, vec3 v_position_inWorld) {
  vec4 position_and_w_of_LightObject = get_lightPosition(0.0, lightIdx);
  vec4 direction_and_w_of_LightObject = get_lightDirection(0.0, lightIdx);
  vec4 intensity_and_w_of_LightObject = get_lightIntensity(0.0, lightIdx);
  Light light;
  vec3 lightPosition = position_and_w_of_LightObject.xyz;
  light.directionOfLightObject = direction_and_w_of_LightObject.xyz;
  vec3 lightIntensity = intensity_and_w_of_LightObject.xyz;
  float lightType = position_and_w_of_LightObject.w;
  light.spotAngleScale = direction_and_w_of_LightObject.w;
  light.spotAngleOffset = intensity_and_w_of_LightObject.w;

  light.intensity = lightIntensity;
  light.position = lightPosition;
  if (lightType < -0.5) { // disabled light
    light.intensity = vec3(0.0);
    light.type = -1;
  } else if (0.75 < lightType) { // is pointlight or spotlight
    light.pointToLight = lightPosition - v_position_inWorld;
    light.direction = normalize(light.pointToLight);
    light.type = 1;
  } else { // is Directional Light
    light.type = 0;
    light.direction = normalize(light.directionOfLightObject);
  }

  if (lightType > 1.75) { // is spotlight
    light.type = 2;
  }

  const float M_PI = 3.141592653589793;
  light.intensity *= M_PI; // Punctual Light

  // Attenuation
  light.attenuatedIntensity = light.intensity;
  getLightAttenuated(light);

  return light;
}
