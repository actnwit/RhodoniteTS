struct Light {
  lightType: i32, // 0 = directional, 1 = point, 2 = spot
  position: vec3<f32>,
  intensity: vec3<f32>,
  attenuatedIntensity: vec3<f32>,
  directionOfLightObject: vec3<f32>,
  direction: vec3<f32>, // direction of light vector, equal to normalize(light.pointToLight)
  pointToLight: vec3<f32>, // not normalized
  spotAngleScale: f32,
  spotAngleOffset: f32,
  effectiveRange: f32,
};

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#range-property
fn getRangeAttenuation(light: Light) -> f32
{
  let distance = length(light.pointToLight);
  // means no range limit
  if (light.effectiveRange <= 0.0)
  {
    return 1.0 / pow(distance, 2.0);
  }
  return max(min(1.0 - pow(distance / light.effectiveRange, 4.0), 1.0), 0.0) / pow(distance, 2.0);
}

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#inner-and-outer-cone-angles
fn getSpotAttenuation(light: Light) -> f32
{

  let cd = dot(light.directionOfLightObject, light.direction);
  let angularAttenuation = clamp(cd * light.spotAngleScale + light.spotAngleOffset, 0.0, 1.0);
  return angularAttenuation;
}

fn getLightAttenuated(light: Light) -> Light {
  var newLight: Light = light;
  newLight.attenuatedIntensity = light.intensity;
  // if (light.lightType == 0) { // Directional Light
    // Directional Light don't attenuate geometically
  // }

  // Point Light and Spot Light
  if (light.lightType != 0)
  {
    newLight.attenuatedIntensity *= getRangeAttenuation(light);
  }
  // Spot light
  if (light.lightType == 2)
  {
    newLight.attenuatedIntensity *= getSpotAttenuation(light);
  }

  return newLight;
}

fn getLight(lightIdx: u32, v_position_inWorld: vec3<f32>) -> Light {
  let lightPosition: vec3<f32> = get_lightPosition(0u, lightIdx);
  let direction_and_w_of_LightObject: vec3<f32> = get_lightDirection(0u, lightIdx);
  let lightIntensity: vec3<f32> = get_lightIntensity(0u, lightIdx);
  let lightProperty: vec4<f32> = get_lightProperty(0u, lightIdx);
  var light: Light;
  light.directionOfLightObject = direction_and_w_of_LightObject;
  let lightType = lightProperty.x;
  light.effectiveRange = lightProperty.y;
  light.spotAngleScale = lightProperty.z;
  light.spotAngleOffset = lightProperty.w;

  light.intensity = lightIntensity;
  light.position = lightPosition;
  if (lightType < -0.5) { // disabled light
    light.intensity = vec3(0.0);
    light.lightType = -1;
  } else if (0.75 < lightType) { // is pointlight or spotlight
    light.pointToLight = lightPosition - v_position_inWorld;
    light.direction = normalize(light.pointToLight);
    light.lightType = 1;
  } else { // is Directional Light
    light.lightType = 0;
    light.direction = normalize(light.directionOfLightObject * -1.0);
  }

  if (lightType > 1.75) { // is spotlight
    light.lightType = 2;
  }

  let M_PI = 3.141592653589793;
  light.intensity *= M_PI; // Punctual Light

  // Attenuation
  light.attenuatedIntensity = light.intensity;
  light = getLightAttenuated(light);

  return light;
}
