struct Light {
  int type; // 0 = directional, 1 = point, 2 = spot
  vec3 position;
  vec3 intensity;
  vec3 attenuatedIntensity;
  vec3 directionOfLightObject;
  vec3 direction; // direction of light vector, equal to normalize(light.pointToLight)
  vec3 pointToLight; // not normalized
  float innerConeCos;
  float outerConeCos;
  float effectiveRange;
};

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#range-property
float getRangeAttenuationAt(float distanceSquared, float effectiveRange)
{
  // means no range limit
  if (effectiveRange <= 0.0)
  {
    return 1.0 / distanceSquared;
  }
  // (distance / range)^4 as multiplications: this runs for every light in every fragment.
  float invRangeSquared = 1.0 / (effectiveRange * effectiveRange);
  float ratio4 = distanceSquared * distanceSquared * invRangeSquared * invRangeSquared;
  return max(min(1.0 - ratio4, 1.0), 0.0) / distanceSquared;
}

float getRangeAttenuation(Light light)
{
  return getRangeAttenuationAt(dot(light.pointToLight, light.pointToLight), light.effectiveRange);
}

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#inner-and-outer-cone-angles
float getSpotAttenuation(Light light)
{
  float actualCos = dot(light.direction, -light.directionOfLightObject);
  if (actualCos > light.outerConeCos) {
    if (actualCos < light.innerConeCos) {
      float attenuation = (actualCos - light.outerConeCos) / (light.innerConeCos - light.outerConeCos);
      return attenuation * attenuation;
    }
    return 1.0;
  }
  return 0.0;
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
  vec3 lightPosition = get_lightPosition(uint(lightIdx));
  vec4 lightProperty = get_lightProperty(uint(lightIdx));
  Light light;
  light.directionOfLightObject = vec3(0.0);
  float lightType = lightProperty.x;
  light.effectiveRange = lightProperty.y;
  light.innerConeCos = lightProperty.z;
  light.outerConeCos = lightProperty.w;
  light.position = lightPosition;

  if (lightType < -0.5) { // disabled light
    light.intensity = vec3(0.0);
    light.attenuatedIntensity = vec3(0.0);
    light.type = -1;
    return light;
  }

  if (0.75 < lightType) { // is point light or spot light
    light.pointToLight = lightPosition - v_position_inWorld;
    light.direction = vec3(0.0);
    light.type = 1;

    // The range attenuation is computed before the direction normalize, the intensity and (for spot lights)
    // the object-space direction. A light outside its range contributes exactly zero, so the normalize and
    // those reads are skipped. The callers only use the attenuated intensity of such a light.
    float rangeAttenuation = getRangeAttenuationAt(dot(light.pointToLight, light.pointToLight), light.effectiveRange);
    if (!(rangeAttenuation > 0.0)) {
      light.intensity = vec3(0.0);
      light.attenuatedIntensity = vec3(0.0);
      return light;
    }
    light.direction = normalize(light.pointToLight);

    if (lightType > 1.75) { // is spot light
      light.type = 2;
      light.directionOfLightObject = get_lightDirection(uint(lightIdx));
      float spotAttenuation = getSpotAttenuation(light);
      if (!(spotAttenuation > 0.0)) {
        light.intensity = vec3(0.0);
        light.attenuatedIntensity = vec3(0.0);
        return light;
      }
      // Defer the intensity read until the light actually contributes.
      light.intensity = get_lightIntensity(uint(lightIdx)) * M_PI; // Punctual Light
      light.attenuatedIntensity = light.intensity * rangeAttenuation * spotAttenuation;
      return light;
    }

    light.intensity = get_lightIntensity(uint(lightIdx)) * M_PI; // Punctual Light
    light.attenuatedIntensity = light.intensity * rangeAttenuation;
    return light;
  }

  // is Directional Light
  light.type = 0;
  light.directionOfLightObject = get_lightDirection(uint(lightIdx));
  light.direction = normalize(light.directionOfLightObject * -1.0);
  light.intensity = get_lightIntensity(uint(lightIdx)) * M_PI; // Punctual Light
  light.attenuatedIntensity = light.intensity;
  return light;
}

// Clustered Forward light list (see src/foundation/renderer/lightCluster/LightClusterLayout.ts).
// The list is the lights that can not be culled followed by the local lights of the cluster of the position,
// or all enabled lights when the camera has no light clusters.
#if defined(RN_IS_PIXEL_SHADER) && !defined(WEBGL2_MULTI_VIEW)
// The light cluster view of the camera of the draw, uploaded per draw by WebGLStrategyWebGL2:
// [0..5] the view header (see LightClusterLayout.ts), [6] (vec4 index of the view in the data texture, 0, 0, 0).
// Reading the header from uniforms is much cheaper than from the data texture.
uniform highp vec4 u_lightClusterView[7]; // skipProcess=true
#endif

struct LightList {
  int count;      // the number of lights in the list
  int firstCount; // the number of lights read from the all-light list
  int secondBase; // the vec4 index of the cluster lights in the light index list of the view
};

LightList getLightList(vec3 positionInWorld, uint cameraSID) {
  vec4 header = get_clusteredLightData(0u, 0u); // (allCount, globalCount, localCount, sphereBase)
  LightList list;
  list.count = int(header.x);
  list.firstCount = int(header.x);
  list.secondBase = 0;
#if defined(RN_IS_PIXEL_SHADER) && !defined(WEBGL2_MULTI_VIEW)
  int viewBase = int(u_lightClusterView[6].x);
  if (viewBase >= 0) {
    vec4 grid = u_lightClusterView[4]; // (gridX, gridY, gridZ, state)
    if (grid.w == 0.0) {
      vec4 p = vec4(positionInWorld, 1.0);
      float w = dot(u_lightClusterView[2], p);
      if (w > 0.0) {
        vec4 slice = u_lightClusterView[5]; // (sliceScale, sliceBias, zNear, zFar)
        vec3 cell = vec3(
          dot(u_lightClusterView[0], p) / w,
          dot(u_lightClusterView[1], p) / w,
          log(max(dot(u_lightClusterView[3], p), 1.0e-30)) * slice.x + slice.y);
        ivec3 c = ivec3(clamp(floor(cell), vec3(0.0), grid.xyz - 1.0));
        int gridX = int(grid.x);
        int gridY = int(grid.y);
        int clusterIndex = (c.z * gridY + c.y) * gridX + c.x;
        vec4 tableEntry = fetchElement(viewBase + 6 + clusterIndex); // (offset, count, 0, 0)
        int clusterCount = gridX * gridY * int(grid.z);
        list.firstCount = int(header.y);
        list.secondBase = viewBase + 6 + clusterCount + int(tableEntry.x);
        list.count = list.firstCount + int(tableEntry.y);
      }
    }
  }
#endif
  return list;
}

// Returns (light component SID, shadow slot (-1: none)) of the n-th light of the list.
ivec2 getLightRef(LightList list, int n) {
  float entry;
  if (n < list.firstCount) {
    vec4 entries = get_clusteredLightData(0u, uint(1 + (n >> 2)));
    entry = entries[n & 3];
  } else {
    int e = n - list.firstCount;
    vec4 entries = fetchElement(list.secondBase + (e >> 2));
    entry = entries[e & 3];
  }
  int packed = int(entry);
  return ivec2(packed & 0xFFFF, (packed >> 16) - 1);
}
