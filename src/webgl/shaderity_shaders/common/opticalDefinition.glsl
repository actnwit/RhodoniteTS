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
  // means no range limit
  if (light.effectiveRange <= 0.0)
  {
    return 1.0 / pow(distance, 2.0);
  }
  return max(min(1.0 - pow(distance / light.effectiveRange, 4.0), 1.0), 0.0) / pow(distance, 2.0);
}

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#inner-and-outer-cone-angles
float getSpotAttenuation(Light light)
{

  float cd = dot(-normalize(light.directionOfLightObject), light.direction);
  float angularAttenuation = clamp(cd * light.spotAngleScale + light.spotAngleOffset, 0.0, 1.0);
  return angularAttenuation;
}

vec3 getLightAttenuated(Light light) {
  light.attenuatedIntensity = light.intensity;
  // if (light.type == 0) { // Directional Light
    // Directional Light don't attenuate geometically
  // }

  // Point Light && Spot Light
  if (light.type != 0)
  {
    light.attenuatedIntensity *= getRangeAttenuation(light);
  }
  // Spot Light
  if (light.type == 2)
  {
    light.attenuatedIntensity *= getSpotAttenuation(light);
  }

  return light.attenuatedIntensity;
}

Light getLight(int lightIdx, vec3 v_position_inWorld) {
  vec3 lightPosition = get_lightPosition(0.0, lightIdx);
  vec3 direction_and_w_of_LightObject = get_lightDirection(0.0, lightIdx);
  vec3 lightIntensity = get_lightIntensity(0.0, lightIdx);
  vec4 lightProperty = get_lightProperty(0.0, lightIdx);
  Light light;
  light.directionOfLightObject = direction_and_w_of_LightObject;
  float lightType = lightProperty.x;
  light.effectiveRange = lightProperty.y;
  light.spotAngleScale = lightProperty.z;
  light.spotAngleOffset = lightProperty.w;

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
    light.direction = normalize(light.directionOfLightObject * -1.0);
  }

  if (lightType > 1.75) { // is spotlight
    light.type = 2;
  }

  const float M_PI = 3.141592653589793;
  light.intensity *= M_PI; // Punctual Light

  // Attenuation
  light.attenuatedIntensity = light.intensity;
  light.attenuatedIntensity = getLightAttenuated(light);

  return light;
}
