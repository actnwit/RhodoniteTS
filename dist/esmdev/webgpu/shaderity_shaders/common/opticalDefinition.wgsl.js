// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/common/opticalDefinition.wgsl
var code = `struct Light {
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
`;
var shaderStage = "fragment";
var isFragmentShader = true;
var opticalDefinition_default = { code, shaderStage, isFragmentShader };
export {
  code,
  opticalDefinition_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL2NvbW1vbi9vcHRpY2FsRGVmaW5pdGlvbi53Z3NsIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XCJjb2RlXCI6XCJzdHJ1Y3QgTGlnaHQge1xcbiAgbGlnaHRUeXBlOiBpMzIsIC8vIDAgPSBkaXJlY3Rpb25hbCwgMSA9IHBvaW50LCAyID0gc3BvdFxcbiAgcG9zaXRpb246IHZlYzM8ZjMyPixcXG4gIGludGVuc2l0eTogdmVjMzxmMzI+LFxcbiAgYXR0ZW51YXRlZEludGVuc2l0eTogdmVjMzxmMzI+LFxcbiAgZGlyZWN0aW9uT2ZMaWdodE9iamVjdDogdmVjMzxmMzI+LFxcbiAgZGlyZWN0aW9uOiB2ZWMzPGYzMj4sIC8vIGRpcmVjdGlvbiBvZiBsaWdodCB2ZWN0b3IsIGVxdWFsIHRvIG5vcm1hbGl6ZShsaWdodC5wb2ludFRvTGlnaHQpXFxuICBwb2ludFRvTGlnaHQ6IHZlYzM8ZjMyPiwgLy8gbm90IG5vcm1hbGl6ZWRcXG4gIGlubmVyQ29uZUNvczogZjMyLFxcbiAgb3V0ZXJDb25lQ29zOiBmMzIsXFxuICBlZmZlY3RpdmVSYW5nZTogZjMyLFxcbn07XFxuXFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL2Jsb2IvbWFzdGVyL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX2xpZ2h0c19wdW5jdHVhbC9SRUFETUUubWQjcmFuZ2UtcHJvcGVydHlcXG5mbiBnZXRSYW5nZUF0dGVudWF0aW9uQXQoZGlzdGFuY2VTcXVhcmVkOiBmMzIsIGVmZmVjdGl2ZVJhbmdlOiBmMzIpIC0+IGYzMlxcbntcXG4gIC8vIG1lYW5zIG5vIHJhbmdlIGxpbWl0XFxuICBpZiAoZWZmZWN0aXZlUmFuZ2UgPD0gMC4wKVxcbiAge1xcbiAgICByZXR1cm4gMS4wIC8gZGlzdGFuY2VTcXVhcmVkO1xcbiAgfVxcbiAgLy8gKGRpc3RhbmNlIC8gcmFuZ2UpXjQgYXMgbXVsdGlwbGljYXRpb25zOiB0aGlzIHJ1bnMgZm9yIGV2ZXJ5IGxpZ2h0IGluIGV2ZXJ5IGZyYWdtZW50LlxcbiAgbGV0IGludlJhbmdlU3F1YXJlZCA9IDEuMCAvIChlZmZlY3RpdmVSYW5nZSAqIGVmZmVjdGl2ZVJhbmdlKTtcXG4gIGxldCByYXRpbzQgPSBkaXN0YW5jZVNxdWFyZWQgKiBkaXN0YW5jZVNxdWFyZWQgKiBpbnZSYW5nZVNxdWFyZWQgKiBpbnZSYW5nZVNxdWFyZWQ7XFxuICByZXR1cm4gbWF4KG1pbigxLjAgLSByYXRpbzQsIDEuMCksIDAuMCkgLyBkaXN0YW5jZVNxdWFyZWQ7XFxufVxcblxcbmZuIGdldFJhbmdlQXR0ZW51YXRpb24obGlnaHQ6IExpZ2h0KSAtPiBmMzJcXG57XFxuICByZXR1cm4gZ2V0UmFuZ2VBdHRlbnVhdGlvbkF0KGRvdChsaWdodC5wb2ludFRvTGlnaHQsIGxpZ2h0LnBvaW50VG9MaWdodCksIGxpZ2h0LmVmZmVjdGl2ZVJhbmdlKTtcXG59XFxuXFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL2Jsb2IvbWFzdGVyL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX2xpZ2h0c19wdW5jdHVhbC9SRUFETUUubWQjaW5uZXItYW5kLW91dGVyLWNvbmUtYW5nbGVzXFxuZm4gZ2V0U3BvdEF0dGVudWF0aW9uKGxpZ2h0OiBMaWdodCkgLT4gZjMyXFxue1xcbiAgbGV0IGFjdHVhbENvcyA9IGRvdChsaWdodC5kaXJlY3Rpb24sIC1saWdodC5kaXJlY3Rpb25PZkxpZ2h0T2JqZWN0KTtcXG4gIGlmIChhY3R1YWxDb3MgPiBsaWdodC5vdXRlckNvbmVDb3MpIHtcXG4gICAgaWYgKGFjdHVhbENvcyA8IGxpZ2h0LmlubmVyQ29uZUNvcykge1xcbiAgICAgIGxldCBhdHRlbnVhdGlvbiA9IChhY3R1YWxDb3MgLSBsaWdodC5vdXRlckNvbmVDb3MpIC8gKGxpZ2h0LmlubmVyQ29uZUNvcyAtIGxpZ2h0Lm91dGVyQ29uZUNvcyk7XFxuICAgICAgcmV0dXJuIGF0dGVudWF0aW9uICogYXR0ZW51YXRpb247XFxuICAgIH1cXG4gICAgcmV0dXJuIDEuMDtcXG4gIH1cXG4gIHJldHVybiAwLjA7XFxufVxcblxcbmZuIGdldExpZ2h0QXR0ZW51YXRlZChsaWdodDogTGlnaHQpIC0+IExpZ2h0IHtcXG4gIHZhciBuZXdMaWdodDogTGlnaHQgPSBsaWdodDtcXG4gIG5ld0xpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHkgPSBsaWdodC5pbnRlbnNpdHk7XFxuICAvLyBpZiAobGlnaHQubGlnaHRUeXBlID09IDApIHsgLy8gRGlyZWN0aW9uYWwgTGlnaHRcXG4gICAgLy8gRGlyZWN0aW9uYWwgTGlnaHQgZG9uJ3QgYXR0ZW51YXRlIGdlb21ldGljYWxseVxcbiAgLy8gfVxcblxcbiAgLy8gUG9pbnQgTGlnaHQgJiYgU3BvdCBMaWdodFxcbiAgaWYgKGxpZ2h0LmxpZ2h0VHlwZSAhPSAwKVxcbiAge1xcbiAgICBuZXdMaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5ICo9IGdldFJhbmdlQXR0ZW51YXRpb24obGlnaHQpO1xcbiAgfVxcbiAgLy8gU3BvdCBMaWdodFxcbiAgaWYgKGxpZ2h0LmxpZ2h0VHlwZSA9PSAyKVxcbiAge1xcbiAgICBuZXdMaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5ICo9IGdldFNwb3RBdHRlbnVhdGlvbihsaWdodCk7XFxuICB9XFxuXFxuICByZXR1cm4gbmV3TGlnaHQ7XFxufVxcblxcbmZuIGdldExpZ2h0KGxpZ2h0SWR4OiB1MzIsIHZfcG9zaXRpb25faW5Xb3JsZDogdmVjMzxmMzI+KSAtPiBMaWdodCB7XFxuICBsZXQgbGlnaHRQb3NpdGlvbjogdmVjMzxmMzI+ID0gZ2V0X2xpZ2h0UG9zaXRpb24obGlnaHRJZHgpO1xcbiAgbGV0IGxpZ2h0UHJvcGVydHk6IHZlYzQ8ZjMyPiA9IGdldF9saWdodFByb3BlcnR5KGxpZ2h0SWR4KTtcXG4gIHZhciBsaWdodDogTGlnaHQ7XFxuICBsaWdodC5kaXJlY3Rpb25PZkxpZ2h0T2JqZWN0ID0gdmVjMzxmMzI+KDAuMCwgMC4wLCAwLjApO1xcbiAgbGV0IGxpZ2h0VHlwZSA9IGxpZ2h0UHJvcGVydHkueDtcXG4gIGxpZ2h0LmVmZmVjdGl2ZVJhbmdlID0gbGlnaHRQcm9wZXJ0eS55O1xcbiAgbGlnaHQuaW5uZXJDb25lQ29zID0gbGlnaHRQcm9wZXJ0eS56O1xcbiAgbGlnaHQub3V0ZXJDb25lQ29zID0gbGlnaHRQcm9wZXJ0eS53O1xcbiAgbGlnaHQucG9zaXRpb24gPSBsaWdodFBvc2l0aW9uO1xcblxcbiAgaWYgKGxpZ2h0VHlwZSA8IC0wLjUpIHsgLy8gZGlzYWJsZWQgbGlnaHRcXG4gICAgbGlnaHQuaW50ZW5zaXR5ID0gdmVjM2YoMC4wKTtcXG4gICAgbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSA9IHZlYzNmKDAuMCk7XFxuICAgIGxpZ2h0LmxpZ2h0VHlwZSA9IC0xO1xcbiAgICByZXR1cm4gbGlnaHQ7XFxuICB9XFxuXFxuICBpZiAoMC43NSA8IGxpZ2h0VHlwZSkgeyAvLyBpcyBwb2ludCBsaWdodCBvciBzcG90IGxpZ2h0XFxuICAgIGxpZ2h0LnBvaW50VG9MaWdodCA9IGxpZ2h0UG9zaXRpb24gLSB2X3Bvc2l0aW9uX2luV29ybGQ7XFxuICAgIGxpZ2h0LmRpcmVjdGlvbiA9IG5vcm1hbGl6ZShsaWdodC5wb2ludFRvTGlnaHQpO1xcbiAgICBsaWdodC5saWdodFR5cGUgPSAxO1xcblxcbiAgICAvLyBUaGUgYXR0ZW51YXRpb24gaXMgY29tcHV0ZWQgYmVmb3JlIHRoZSBpbnRlbnNpdHkgYW5kIChmb3Igc3BvdCBsaWdodHMpIHRoZSBvYmplY3Qtc3BhY2UgZGlyZWN0aW9uIGFyZVxcbiAgICAvLyByZWFkLiBBIGxpZ2h0IG91dHNpZGUgaXRzIHJhbmdlIG9yIGNvbmUgY29udHJpYnV0ZXMgZXhhY3RseSB6ZXJvLCBzbyB0aG9zZSByZWFkcyBhcmUgc2tpcHBlZC4gVGhlIGNhbGxlcnNcXG4gICAgLy8gb25seSB1c2UgdGhlIGF0dGVudWF0ZWQgaW50ZW5zaXR5IGFuZCB0aGUgZGlyZWN0aW9uIG9mIHN1Y2ggYSBsaWdodC5cXG4gICAgbGV0IHJhbmdlQXR0ZW51YXRpb24gPSBnZXRSYW5nZUF0dGVudWF0aW9uQXQoXFxuICAgICAgZG90KGxpZ2h0LnBvaW50VG9MaWdodCwgbGlnaHQucG9pbnRUb0xpZ2h0KSwgbGlnaHQuZWZmZWN0aXZlUmFuZ2UpO1xcbiAgICBpZiAoIShyYW5nZUF0dGVudWF0aW9uID4gMC4wKSkge1xcbiAgICAgIGxpZ2h0LmludGVuc2l0eSA9IHZlYzNmKDAuMCk7XFxuICAgICAgbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSA9IHZlYzNmKDAuMCk7XFxuICAgICAgcmV0dXJuIGxpZ2h0O1xcbiAgICB9XFxuXFxuICAgIGlmIChsaWdodFR5cGUgPiAxLjc1KSB7IC8vIGlzIHNwb3QgbGlnaHRcXG4gICAgICBsaWdodC5saWdodFR5cGUgPSAyO1xcbiAgICAgIGxpZ2h0LmRpcmVjdGlvbk9mTGlnaHRPYmplY3QgPSBnZXRfbGlnaHREaXJlY3Rpb24obGlnaHRJZHgpO1xcbiAgICAgIGxldCBzcG90QXR0ZW51YXRpb24gPSBnZXRTcG90QXR0ZW51YXRpb24obGlnaHQpO1xcbiAgICAgIGlmICghKHNwb3RBdHRlbnVhdGlvbiA+IDAuMCkpIHtcXG4gICAgICAgIGxpZ2h0LmludGVuc2l0eSA9IHZlYzNmKDAuMCk7XFxuICAgICAgICBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5ID0gdmVjM2YoMC4wKTtcXG4gICAgICAgIHJldHVybiBsaWdodDtcXG4gICAgICB9XFxuICAgICAgLy8gRGVmZXIgdGhlIGludGVuc2l0eSByZWFkIHVudGlsIHRoZSBsaWdodCBhY3R1YWxseSBjb250cmlidXRlcy5cXG4gICAgICBsaWdodC5pbnRlbnNpdHkgPSBnZXRfbGlnaHRJbnRlbnNpdHkobGlnaHRJZHgpICogTV9QSTsgLy8gUHVuY3R1YWwgTGlnaHRcXG4gICAgICBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5ID0gbGlnaHQuaW50ZW5zaXR5ICogcmFuZ2VBdHRlbnVhdGlvbiAqIHNwb3RBdHRlbnVhdGlvbjtcXG4gICAgICByZXR1cm4gbGlnaHQ7XFxuICAgIH1cXG5cXG4gICAgbGlnaHQuaW50ZW5zaXR5ID0gZ2V0X2xpZ2h0SW50ZW5zaXR5KGxpZ2h0SWR4KSAqIE1fUEk7IC8vIFB1bmN0dWFsIExpZ2h0XFxuICAgIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHkgPSBsaWdodC5pbnRlbnNpdHkgKiByYW5nZUF0dGVudWF0aW9uO1xcbiAgICByZXR1cm4gbGlnaHQ7XFxuICB9XFxuXFxuICAvLyBpcyBEaXJlY3Rpb25hbCBMaWdodFxcbiAgbGlnaHQubGlnaHRUeXBlID0gMDtcXG4gIGxpZ2h0LmRpcmVjdGlvbk9mTGlnaHRPYmplY3QgPSBnZXRfbGlnaHREaXJlY3Rpb24obGlnaHRJZHgpO1xcbiAgbGlnaHQuZGlyZWN0aW9uID0gbm9ybWFsaXplKGxpZ2h0LmRpcmVjdGlvbk9mTGlnaHRPYmplY3QgKiAtMS4wKTtcXG4gIGxpZ2h0LmludGVuc2l0eSA9IGdldF9saWdodEludGVuc2l0eShsaWdodElkeCkgKiBNX1BJOyAvLyBQdW5jdHVhbCBMaWdodFxcbiAgbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSA9IGxpZ2h0LmludGVuc2l0eTtcXG4gIHJldHVybiBsaWdodDtcXG59XFxuXFxuLy8gQ2x1c3RlcmVkIEZvcndhcmQgbGlnaHQgbGlzdCAoc2VlIHNyYy9mb3VuZGF0aW9uL3JlbmRlcmVyL2xpZ2h0Q2x1c3Rlci9MaWdodENsdXN0ZXJMYXlvdXQudHMpLlxcbi8vIFRoZSBsaXN0IGEgZnJhZ21lbnQgaXRlcmF0ZXMgaXMgYSBjb25jYXRlbmF0aW9uIG9mIHR3byBwYXJ0czpcXG4vLyAtIHRoZSBcXFwiZmlyc3RcXFwiIHBhcnQ6IGxpZ2h0cyB0aGF0IGFyZSBhbHdheXMgZXZhbHVhdGVkIChkaXJlY3Rpb25hbCBsaWdodHMgYW5kIGxpZ2h0cyB3aXRob3V0IGEgcmFuZ2UpLCByZWFkIGZyb21cXG4vLyAgIHRoZSBhbGwtbGlnaHQgbGlzdCBpbiB0aGUgY2x1c3RlcmVkTGlnaHREYXRhIGdsb2JhbCBwcm9wZXJ0eTtcXG4vLyAtIHRoZSBcXFwic2Vjb25kXFxcIiBwYXJ0OiB0aGUgbG9jYWwgbGlnaHRzIG9mIHRoZSBjbHVzdGVyIG9mIHRoZSBmcmFnbWVudCwgcmVhZCBmcm9tIHRoZSBsaWdodCBpbmRleCBsaXN0IG9mIHRoZVxcbi8vICAgY2FtZXJhJ3MgdmlldyByZWdpb24gKG9ubHkgd2hlbiB0aGUgY2FtZXJhIGhhcyBsaWdodCBjbHVzdGVycykuXFxuLy8gV2l0aG91dCBhIHZpZXcgcmVnaW9uIHRoZSBsaXN0IGlzIHRoZSBhbGwtbGlnaHQgbGlzdCwgaS5lLiBhbGwgZW5hYmxlZCBsaWdodHMuXFxuc3RydWN0IExpZ2h0TGlzdCB7XFxuICBjb3VudDogdTMyLCAgICAgIC8vIHRoZSBudW1iZXIgb2YgbGlnaHRzIGluIHRoZSBsaXN0XFxuICBmaXJzdENvdW50OiB1MzIsIC8vIHRoZSBudW1iZXIgb2YgbGlnaHRzIHJlYWQgZnJvbSB0aGUgYWxsLWxpZ2h0IGxpc3RcXG4gIHNlY29uZEJhc2U6IHUzMiwgLy8gdGhlIHZlYzQgaW5kZXggb2YgdGhlIGNsdXN0ZXIgbGlnaHRzIGluIHRoZSBsaWdodCBpbmRleCBsaXN0IG9mIHRoZSB2aWV3XFxufTtcXG5cXG4vLyBUaGUgZGVmYXVsdCBpcyB0aGUgYWxsLWxpZ2h0IGxpc3QgKG5vIGNsdXN0ZXJpbmcpOiBldmVyeSBmcmFnbWVudCBldmFsdWF0ZXMgYWxsIGVuYWJsZWQgbGlnaHRzLlxcbmZuIGdldExpZ2h0TGlzdChwb3NpdGlvbkluV29ybGQ6IHZlYzM8ZjMyPiwgY2FtZXJhU0lEOiB1MzIpIC0+IExpZ2h0TGlzdCB7XFxuICBsZXQgaGVhZGVyID0gZ2V0X2NsdXN0ZXJlZExpZ2h0RGF0YSgwdSwgMHUpOyAvLyAoYWxsQ291bnQsIGdsb2JhbENvdW50LCBsb2NhbENvdW50LCBzcGhlcmVCYXNlKVxcbiAgdmFyIGxpc3Q6IExpZ2h0TGlzdDtcXG4gIGxpc3QuY291bnQgPSB1MzIoaGVhZGVyLngpO1xcbiAgbGlzdC5maXJzdENvdW50ID0gdTMyKGhlYWRlci54KTtcXG4gIGxpc3Quc2Vjb25kQmFzZSA9IDB1O1xcbiNpZmRlZiBSTl9JU19QSVhFTF9TSEFERVJcXG4gIC8vIFRoZSB2ZWM0IGluZGV4IG9mIHRoZSB2aWV3IHJlZ2lvbiBvZiB0aGlzIGNhbWVyYSwgLTEgd2hlbiB0aGUgY2FtZXJhIGhhcyBubyBjbHVzdGVycyAoTGlnaHRDbHVzdGVyU3lzdGVtXFxuICAvLyBzZXRzIGl0IG9uIHRoZSBjYW1lcmEgY29tcG9uZW50OyB0aGUgdmFsdWUgaXMgcmVhZCBmcm9tIHRoZSBHUFUgaW5zdGFuY2UgZGF0YSkuXFxuICBsZXQgdmlld0Jhc2UgPSBnZXRfbGlnaHRDbHVzdGVyVmlld0luZm8oY2FtZXJhU0lEKS54O1xcbiAgaWYgKHZpZXdCYXNlID49IDAuMCkge1xcbiAgICBsZXQgYmFzZSA9IHUzMih2aWV3QmFzZSk7XFxuICAgIGxldCBncmlkID0gZmV0Y2hFbGVtZW50KGJhc2UgKyA0dSk7IC8vIChncmlkWCwgZ3JpZFksIGdyaWRaLCBzdGF0ZSlcXG4gICAgaWYgKGdyaWQudyA9PSAwLjApIHtcXG4gICAgICBsZXQgcCA9IHZlYzQ8ZjMyPihwb3NpdGlvbkluV29ybGQsIDEuMCk7XFxuICAgICAgLy8gdyBpcyB0aGUgZXllLXBsYW5lIGRpc3RhbmNlOiBmcmFnbWVudHMgYmVoaW5kIHRoZSBuZWFyIHBsYW5lICh3IDw9IDApIHVzZSB0aGUgYWxsLWxpZ2h0IGxpc3QuXFxuICAgICAgbGV0IHcgPSBkb3QoZmV0Y2hFbGVtZW50KGJhc2UgKyAydSksIHApO1xcbiAgICAgIGlmICh3ID4gMC4wKSB7XFxuICAgICAgICBsZXQgc2xpY2UgPSBmZXRjaEVsZW1lbnQoYmFzZSArIDV1KTsgLy8gKHNsaWNlU2NhbGUsIHNsaWNlQmlhcywgek5lYXIsIHpGYXIpXFxuICAgICAgICAvLyBUaGUgdGlsZSBjb29yZGluYXRlcyBhcmUgYWxyZWFkeSBpbiBncmlkIHVuaXRzICh0aGUgaGVhZGVyIHJvd3MgYXJlIHNjYWxlZCBieSAwLjUgKiBncmlkKSwgYW5kIHRoZVxcbiAgICAgICAgLy8gZGVwdGggc2xpY2UgdXNlcyB0aGUgc2FtZSBsb2dhcml0aG1pYyBtYXBwaW5nIGFzIHRoZSBjbHVzdGVyIGJ1aWxkLiBDbGFtcGluZyBpcyBjb3JyZWN0IGJlY2F1c2UgdGhlXFxuICAgICAgICAvLyBjbHVzdGVycyBhdCB0aGUgYm9yZGVyIG9mIHRoZSBncmlkIGV4dGVuZCB0byBpbmZpbml0eS5cXG4gICAgICAgIGxldCBjZWxsID0gdmVjMzxmMzI+KFxcbiAgICAgICAgICBkb3QoZmV0Y2hFbGVtZW50KGJhc2UpLCBwKSAvIHcsXFxuICAgICAgICAgIGRvdChmZXRjaEVsZW1lbnQoYmFzZSArIDF1KSwgcCkgLyB3LFxcbiAgICAgICAgICBsb2cobWF4KGRvdChmZXRjaEVsZW1lbnQoYmFzZSArIDN1KSwgcCksIDEuMGUtMzApKSAqIHNsaWNlLnggKyBzbGljZS55KTtcXG4gICAgICAgIGxldCBjID0gdmVjMzx1MzI+KGNsYW1wKGZsb29yKGNlbGwpLCB2ZWMzPGYzMj4oMC4wKSwgZ3JpZC54eXogLSAxLjApKTtcXG4gICAgICAgIGxldCBncmlkWCA9IHUzMihncmlkLngpO1xcbiAgICAgICAgbGV0IGdyaWRZID0gdTMyKGdyaWQueSk7XFxuICAgICAgICAvLyBUaGUgY2x1c3RlciBpbmRleCBsYXlvdXQ6ICh6ICogZ3JpZFkgKyB5KSAqIGdyaWRYICsgeC5cXG4gICAgICAgIGxldCBjbHVzdGVySW5kZXggPSAoYy56ICogZ3JpZFkgKyBjLnkpICogZ3JpZFggKyBjLng7XFxuICAgICAgICAvLyBUaGUgY2x1c3RlciB0YWJsZSBzdGFydHMgYWZ0ZXIgdGhlIDYgaGVhZGVyIHZlYzRzOyB0aGUgbGlnaHQgaW5kZXggbGlzdCBhZnRlciB0aGUgdGFibGUuXFxuICAgICAgICBsZXQgdGFibGVFbnRyeSA9IGZldGNoRWxlbWVudChiYXNlICsgNnUgKyBjbHVzdGVySW5kZXgpOyAvLyAob2Zmc2V0LCBjb3VudCwgMCwgMClcXG4gICAgICAgIGxldCBjbHVzdGVyQ291bnQgPSBncmlkWCAqIGdyaWRZICogdTMyKGdyaWQueik7XFxuICAgICAgICAvLyBUaGUgZmlyc3QgcGFydCBpcyBvbmx5IHRoZSBsaWdodHMgdGhhdCBjYW4gbm90IGJlIGN1bGxlZDsgdGhlIGxvY2FsIGxpZ2h0cyBvZiB0aGUgd2hvbGUgc2NlbmUgYXJlXFxuICAgICAgICAvLyByZXBsYWNlZCBieSB0aGUgbG9jYWwgbGlnaHRzIG9mIHRoaXMgY2x1c3Rlci5cXG4gICAgICAgIGxpc3QuZmlyc3RDb3VudCA9IHUzMihoZWFkZXIueSk7XFxuICAgICAgICBsaXN0LnNlY29uZEJhc2UgPSBiYXNlICsgNnUgKyBjbHVzdGVyQ291bnQgKyB1MzIodGFibGVFbnRyeS54KTtcXG4gICAgICAgIGxpc3QuY291bnQgPSBsaXN0LmZpcnN0Q291bnQgKyB1MzIodGFibGVFbnRyeS55KTtcXG4gICAgICB9XFxuICAgIH1cXG4gIH1cXG4jZW5kaWZcXG4gIHJldHVybiBsaXN0O1xcbn1cXG5cXG4vLyBSZXR1cm5zIChsaWdodCBjb21wb25lbnQgU0lELCBzaGFkb3cgc2xvdCAoLTE6IG5vbmUpKSBvZiB0aGUgbi10aCBsaWdodCBvZiB0aGUgbGlzdC5cXG4vLyBUaGUgZW50cmllcyBhcmUgcGFja2VkIGFzIGxpZ2h0Q29tcG9uZW50U0lEICsgNjU1MzYgKiAoc2hhZG93U2xvdCArIDEpIChzZWUgTGlnaHRDbHVzdGVyTGF5b3V0LnRzKSwgc28gdGhlIFNJRCBpc1xcbi8vIHRoZSBsb3cgMTYgYml0cyBhbmQgdGhlIHNsb3QgaXMgdGhlIG5leHQgYml0cyBtaW51cyBvbmUuIEVudHJpZXMgYXJlIHN0b3JlZCA0IHBlciB2ZWM0IGluIGJvdGggcGFydHMgb2YgdGhlIGxpc3QuXFxuZm4gZ2V0TGlnaHRSZWYobGlzdDogTGlnaHRMaXN0LCBuOiB1MzIpIC0+IHZlYzI8aTMyPiB7XFxuICB2YXIgZW50cnk6IGYzMjtcXG4gIGlmIChuIDwgbGlzdC5maXJzdENvdW50KSB7XFxuICAgIC8vIEZpcnN0IHBhcnQ6IHRoZSBhbGwtbGlnaHQgbGlzdCwgd2hpY2ggc3RhcnRzIGFmdGVyIHRoZSBnbG9iYWwgaGVhZGVyIHZlYzQuXFxuICAgIGxldCBlbnRyaWVzID0gZ2V0X2NsdXN0ZXJlZExpZ2h0RGF0YSgwdSwgMXUgKyAobiA+PiAydSkpO1xcbiAgICBlbnRyeSA9IGVudHJpZXNbbiAmIDN1XTtcXG4gIH0gZWxzZSB7XFxuICAgIC8vIFNlY29uZCBwYXJ0OiB0aGUgbGlnaHQgaW5kZXggbGlzdCBvZiB0aGUgY2x1c3RlciwgYXQgc2Vjb25kQmFzZSAocGx1cyB0aGUgdmVjNCBhbmQgdGhlIGNvbXBvbmVudCBvZiBuKS5cXG4gICAgbGV0IGUgPSBuIC0gbGlzdC5maXJzdENvdW50O1xcbiAgICBsZXQgZW50cmllcyA9IGZldGNoRWxlbWVudChsaXN0LnNlY29uZEJhc2UgKyAoZSA+PiAydSkpO1xcbiAgICBlbnRyeSA9IGVudHJpZXNbZSAmIDN1XTtcXG4gIH1cXG4gIGxldCBwYWNrZWQgPSBpMzIoZW50cnkpO1xcbiAgcmV0dXJuIHZlYzI8aTMyPihwYWNrZWQgJiAweEZGRkYsIChwYWNrZWQgPj4gMTZ1KSAtIDEpO1xcbn1cXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUErOVIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBbmhTLGtDQUFDLE1BQXMrUixhQUF5QixpQkFBdUI7IiwKICAibmFtZXMiOiBbXQp9Cg==
