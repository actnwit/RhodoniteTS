var n=`struct Light {
  lightType: i32, // 0 = directional, 1 = point, 2 = spot
  position: vec3<f32>,
  intensity: vec3<f32>,
  attenuatedIntensity: vec3<f32>,
  directionOfLightObject: vec3<f32>,
  direction: vec3<f32>, // direction of light vector, equal to normalize(light.pointToLight)
  pointToLight: vec3<f32>, // not normalized
  innerConeCos: f32,
  outerConeCos: f32,
  effectiveRange: f32,
};

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#range-property
fn getRangeAttenuationAt(distanceSquared: f32, effectiveRange: f32) -> f32
{
  // means no range limit
  if (effectiveRange <= 0.0)
  {
    return 1.0 / distanceSquared;
  }
  // (distance / range)^4 as multiplications: this runs for every light in every fragment.
  let invRangeSquared = 1.0 / (effectiveRange * effectiveRange);
  let ratio4 = distanceSquared * distanceSquared * invRangeSquared * invRangeSquared;
  return max(min(1.0 - ratio4, 1.0), 0.0) / distanceSquared;
}

fn getRangeAttenuation(light: Light) -> f32
{
  return getRangeAttenuationAt(dot(light.pointToLight, light.pointToLight), light.effectiveRange);
}

// https://github.com/KhronosGroup/glTF/blob/master/extensions/2.0/Khronos/KHR_lights_punctual/README.md#inner-and-outer-cone-angles
fn getSpotAttenuation(light: Light) -> f32
{
  let actualCos = dot(light.direction, -light.directionOfLightObject);
  if (actualCos > light.outerConeCos) {
    if (actualCos < light.innerConeCos) {
      let attenuation = (actualCos - light.outerConeCos) / (light.innerConeCos - light.outerConeCos);
      return attenuation * attenuation;
    }
    return 1.0;
  }
  return 0.0;
}

fn getLightAttenuated(light: Light) -> Light {
  var newLight: Light = light;
  newLight.attenuatedIntensity = light.intensity;
  // if (light.lightType == 0) { // Directional Light
    // Directional Light don't attenuate geometically
  // }

  // Point Light && Spot Light
  if (light.lightType != 0)
  {
    newLight.attenuatedIntensity *= getRangeAttenuation(light);
  }
  // Spot Light
  if (light.lightType == 2)
  {
    newLight.attenuatedIntensity *= getSpotAttenuation(light);
  }

  return newLight;
}

fn getLight(lightIdx: u32, v_position_inWorld: vec3<f32>) -> Light {
  let lightPosition: vec3<f32> = get_lightPosition(lightIdx);
  let lightProperty: vec4<f32> = get_lightProperty(lightIdx);
  var light: Light;
  light.directionOfLightObject = vec3<f32>(0.0, 0.0, 0.0);
  let lightType = lightProperty.x;
  light.effectiveRange = lightProperty.y;
  light.innerConeCos = lightProperty.z;
  light.outerConeCos = lightProperty.w;
  light.position = lightPosition;

  if (lightType < -0.5) { // disabled light
    light.intensity = vec3f(0.0);
    light.attenuatedIntensity = vec3f(0.0);
    light.lightType = -1;
    return light;
  }

  if (0.75 < lightType) { // is point light or spot light
    light.pointToLight = lightPosition - v_position_inWorld;
    light.direction = normalize(light.pointToLight);
    light.lightType = 1;

    // The attenuation is computed before the intensity and (for spot lights) the object-space direction are
    // read. A light outside its range or cone contributes exactly zero, so those reads are skipped. The callers
    // only use the attenuated intensity and the direction of such a light.
    let rangeAttenuation = getRangeAttenuationAt(
      dot(light.pointToLight, light.pointToLight), light.effectiveRange);
    if (!(rangeAttenuation > 0.0)) {
      light.intensity = vec3f(0.0);
      light.attenuatedIntensity = vec3f(0.0);
      return light;
    }

    if (lightType > 1.75) { // is spot light
      light.lightType = 2;
      light.directionOfLightObject = get_lightDirection(lightIdx);
      let spotAttenuation = getSpotAttenuation(light);
      if (!(spotAttenuation > 0.0)) {
        light.intensity = vec3f(0.0);
        light.attenuatedIntensity = vec3f(0.0);
        return light;
      }
      // Defer the intensity read until the light actually contributes.
      light.intensity = get_lightIntensity(lightIdx) * M_PI; // Punctual Light
      light.attenuatedIntensity = light.intensity * rangeAttenuation * spotAttenuation;
      return light;
    }

    light.intensity = get_lightIntensity(lightIdx) * M_PI; // Punctual Light
    light.attenuatedIntensity = light.intensity * rangeAttenuation;
    return light;
  }

  // is Directional Light
  light.lightType = 0;
  light.directionOfLightObject = get_lightDirection(lightIdx);
  light.direction = normalize(light.directionOfLightObject * -1.0);
  light.intensity = get_lightIntensity(lightIdx) * M_PI; // Punctual Light
  light.attenuatedIntensity = light.intensity;
  return light;
}

// Clustered Forward light list (see src/foundation/renderer/lightCluster/LightClusterLayout.ts).
// The list a fragment iterates is a concatenation of two parts:
// - the "first" part: lights that are always evaluated (directional lights and lights without a range), read from
//   the all-light list in the clusteredLightData global property;
// - the "second" part: the local lights of the cluster of the fragment, read from the light index list of the
//   camera's view region (only when the camera has light clusters).
// Without a view region the list is the all-light list, i.e. all enabled lights.
struct LightList {
  count: u32,      // the number of lights in the list
  firstCount: u32, // the number of lights read from the all-light list
  secondBase: u32, // the vec4 index of the cluster lights in the light index list of the view
};

// The default is the all-light list (no clustering): every fragment evaluates all enabled lights.
fn getLightList(positionInWorld: vec3<f32>, cameraSID: u32) -> LightList {
  let header = get_clusteredLightData(0u, 0u); // (allCount, globalCount, localCount, sphereBase)
  var list: LightList;
  list.count = u32(header.x);
  list.firstCount = u32(header.x);
  list.secondBase = 0u;
#ifdef RN_IS_PIXEL_SHADER
  // The vec4 index of the view region of this camera, -1 when the camera has no clusters (LightClusterSystem
  // sets it on the camera component; the value is read from the GPU instance data).
  let viewBase = get_lightClusterViewInfo(cameraSID).x;
  if (viewBase >= 0.0) {
    let base = u32(viewBase);
    let grid = fetchElement(base + 4u); // (gridX, gridY, gridZ, state)
    if (grid.w == 0.0) {
      let p = vec4<f32>(positionInWorld, 1.0);
      // w is the eye-plane distance: fragments behind the near plane (w <= 0) use the all-light list.
      let w = dot(fetchElement(base + 2u), p);
      if (w > 0.0) {
        let slice = fetchElement(base + 5u); // (sliceScale, sliceBias, zNear, zFar)
        // The tile coordinates are already in grid units (the header rows are scaled by 0.5 * grid), and the
        // depth slice uses the same logarithmic mapping as the cluster build. Clamping is correct because the
        // clusters at the border of the grid extend to infinity.
        let cell = vec3<f32>(
          dot(fetchElement(base), p) / w,
          dot(fetchElement(base + 1u), p) / w,
          log(max(dot(fetchElement(base + 3u), p), 1.0e-30)) * slice.x + slice.y);
        let c = vec3<u32>(clamp(floor(cell), vec3<f32>(0.0), grid.xyz - 1.0));
        let gridX = u32(grid.x);
        let gridY = u32(grid.y);
        // The cluster index layout: (z * gridY + y) * gridX + x.
        let clusterIndex = (c.z * gridY + c.y) * gridX + c.x;
        // The cluster table starts after the 6 header vec4s; the light index list after the table.
        let tableEntry = fetchElement(base + 6u + clusterIndex); // (offset, count, 0, 0)
        let clusterCount = gridX * gridY * u32(grid.z);
        // The first part is only the lights that can not be culled; the local lights of the whole scene are
        // replaced by the local lights of this cluster.
        list.firstCount = u32(header.y);
        list.secondBase = base + 6u + clusterCount + u32(tableEntry.x);
        list.count = list.firstCount + u32(tableEntry.y);
      }
    }
  }
#endif
  return list;
}

// Returns (light component SID, shadow slot (-1: none)) of the n-th light of the list.
// The entries are packed as lightComponentSID + 65536 * (shadowSlot + 1) (see LightClusterLayout.ts), so the SID is
// the low 16 bits and the slot is the next bits minus one. Entries are stored 4 per vec4 in both parts of the list.
fn getLightRef(list: LightList, n: u32) -> vec2<i32> {
  var entry: f32;
  if (n < list.firstCount) {
    // First part: the all-light list, which starts after the global header vec4.
    let entries = get_clusteredLightData(0u, 1u + (n >> 2u));
    entry = entries[n & 3u];
  } else {
    // Second part: the light index list of the cluster, at secondBase (plus the vec4 and the component of n).
    let e = n - list.firstCount;
    let entries = fetchElement(list.secondBase + (e >> 2u));
    entry = entries[e & 3u];
  }
  let packed = i32(entry);
  return vec2<i32>(packed & 0xFFFF, (packed >> 16u) - 1);
}
`,i="fragment",l=!0,h={code:n,shaderStage:i,isFragmentShader:l};export{n as code,h as default,l as isFragmentShader,i as shaderStage};
