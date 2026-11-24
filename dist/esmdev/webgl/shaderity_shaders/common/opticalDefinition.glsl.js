// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/common/opticalDefinition.glsl
var code = `struct Light {
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
    light.direction = normalize(light.pointToLight);
    light.type = 1;

    // The attenuation is computed before the intensity and (for spot lights) the object-space direction are
    // read. A light outside its range or cone contributes exactly zero, so those reads are skipped. The callers
    // only use the attenuated intensity and the direction of such a light.
    float rangeAttenuation = getRangeAttenuationAt(dot(light.pointToLight, light.pointToLight), light.effectiveRange);
    if (!(rangeAttenuation > 0.0)) {
      light.intensity = vec3(0.0);
      light.attenuatedIntensity = vec3(0.0);
      return light;
    }

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
// The list a fragment iterates is a concatenation of two parts:
// - the "first" part: lights that are always evaluated (directional lights and lights without a range), read from
//   the all-light list in the clusteredLightData global property;
// - the "second" part: the local lights of the cluster of the fragment, read from the light index list of the
//   camera's view region (only when the camera has light clusters).
// Without a view region the list is the all-light list, i.e. all enabled lights.
#if defined(RN_IS_PIXEL_SHADER) && !defined(WEBGL2_MULTI_VIEW)
// The light cluster view of the camera of the draw, uploaded per draw by WebGLStrategyWebGL2:
// [0..5] the view header (see LightClusterLayout.ts), [6] (vec4 index of the view in the data texture, 0, 0, 0).
// Reading the header from uniforms is much cheaper than from the data texture.
uniform highp vec4 u_lightClusterView[7]; // skipProcess=true
#endif

// The two-part list above. secondBase is meaningful only for the second part: when the camera has no clusters,
// firstCount == count and the second part is empty.
struct LightList {
  int count;      // the number of lights in the list
  int firstCount; // the number of lights read from the all-light list
  int secondBase; // the vec4 index of the cluster lights in the light index list of the view
};

// The default is the all-light list (no clustering): every fragment evaluates all enabled lights.
LightList getLightList(vec3 positionInWorld, uint cameraSID) {
  vec4 header = get_clusteredLightData(0u, 0u); // (allCount, globalCount, localCount, sphereBase)
  LightList list;
  list.count = int(header.x);
  list.firstCount = int(header.x);
  list.secondBase = 0;
#if defined(RN_IS_PIXEL_SHADER) && !defined(WEBGL2_MULTI_VIEW)
  // The vec4 index of the view region of this camera, -1 when the camera has no clusters (LightClusterSystem
  // sets it on the camera). It is the x component of the last vec4 of the per-draw uniform.
  int viewBase = int(u_lightClusterView[6].x);
  if (viewBase >= 0) {
    vec4 grid = u_lightClusterView[4]; // (gridX, gridY, gridZ, state)
    if (grid.w == 0.0) {
      vec4 p = vec4(positionInWorld, 1.0);
      // w is the eye-plane distance: fragments behind the near plane (w <= 0) use the all-light list.
      float w = dot(u_lightClusterView[2], p);
      if (w > 0.0) {
        vec4 slice = u_lightClusterView[5]; // (sliceScale, sliceBias, zNear, zFar)
        // The tile coordinates are already in grid units (the header rows are scaled by 0.5 * grid), and the
        // depth slice uses the same logarithmic mapping as the cluster build. Clamping is correct because the
        // clusters at the border of the grid extend to infinity.
        vec3 cell = vec3(
          dot(u_lightClusterView[0], p) / w,
          dot(u_lightClusterView[1], p) / w,
          log(max(dot(u_lightClusterView[3], p), 1.0e-30)) * slice.x + slice.y);
        ivec3 c = ivec3(clamp(floor(cell), vec3(0.0), grid.xyz - 1.0));
        int gridX = int(grid.x);
        int gridY = int(grid.y);
        // The cluster index layout: (z * gridY + y) * gridX + x.
        int clusterIndex = (c.z * gridY + c.y) * gridX + c.x;
        // The cluster table starts after the 6 header vec4s; the light index list after the table.
        vec4 tableEntry = fetchElement(viewBase + 6 + clusterIndex); // (offset, count, 0, 0)
        int clusterCount = gridX * gridY * int(grid.z);
        // The first part is only the lights that can not be culled; the local lights of the whole scene are
        // replaced by the local lights of this cluster.
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
// The entries are packed as lightComponentSID + 65536 * (shadowSlot + 1) (see LightClusterLayout.ts), so the SID is
// the low 16 bits and the slot is the next bits minus one. Entries are stored 4 per vec4 in both parts of the list.
ivec2 getLightRef(LightList list, int n) {
  float entry;
  if (n < list.firstCount) {
    // First part: the all-light list, which starts after the global header vec4.
    vec4 entries = get_clusteredLightData(0u, uint(1 + (n >> 2)));
    entry = entries[n & 3];
  } else {
    // Second part: the light index list of the cluster, at secondBase (plus the vec4 and the component of n).
    int e = n - list.firstCount;
    vec4 entries = fetchElement(list.secondBase + (e >> 2));
    entry = entries[e & 3];
  }
  int packed = int(entry);
  return ivec2(packed & 0xFFFF, (packed >> 16) - 1);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvY29tbW9uL29wdGljYWxEZWZpbml0aW9uLmdsc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcInN0cnVjdCBMaWdodCB7XFxuICBpbnQgdHlwZTsgLy8gMCA9IGRpcmVjdGlvbmFsLCAxID0gcG9pbnQsIDIgPSBzcG90XFxuICB2ZWMzIHBvc2l0aW9uO1xcbiAgdmVjMyBpbnRlbnNpdHk7XFxuICB2ZWMzIGF0dGVudWF0ZWRJbnRlbnNpdHk7XFxuICB2ZWMzIGRpcmVjdGlvbk9mTGlnaHRPYmplY3Q7XFxuICB2ZWMzIGRpcmVjdGlvbjsgLy8gZGlyZWN0aW9uIG9mIGxpZ2h0IHZlY3RvciwgZXF1YWwgdG8gbm9ybWFsaXplKGxpZ2h0LnBvaW50VG9MaWdodClcXG4gIHZlYzMgcG9pbnRUb0xpZ2h0OyAvLyBub3Qgbm9ybWFsaXplZFxcbiAgZmxvYXQgaW5uZXJDb25lQ29zO1xcbiAgZmxvYXQgb3V0ZXJDb25lQ29zO1xcbiAgZmxvYXQgZWZmZWN0aXZlUmFuZ2U7XFxufTtcXG5cXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvYmxvYi9tYXN0ZXIvZXh0ZW5zaW9ucy8yLjAvS2hyb25vcy9LSFJfbGlnaHRzX3B1bmN0dWFsL1JFQURNRS5tZCNyYW5nZS1wcm9wZXJ0eVxcbmZsb2F0IGdldFJhbmdlQXR0ZW51YXRpb25BdChmbG9hdCBkaXN0YW5jZVNxdWFyZWQsIGZsb2F0IGVmZmVjdGl2ZVJhbmdlKVxcbntcXG4gIC8vIG1lYW5zIG5vIHJhbmdlIGxpbWl0XFxuICBpZiAoZWZmZWN0aXZlUmFuZ2UgPD0gMC4wKVxcbiAge1xcbiAgICByZXR1cm4gMS4wIC8gZGlzdGFuY2VTcXVhcmVkO1xcbiAgfVxcbiAgLy8gKGRpc3RhbmNlIC8gcmFuZ2UpXjQgYXMgbXVsdGlwbGljYXRpb25zOiB0aGlzIHJ1bnMgZm9yIGV2ZXJ5IGxpZ2h0IGluIGV2ZXJ5IGZyYWdtZW50LlxcbiAgZmxvYXQgaW52UmFuZ2VTcXVhcmVkID0gMS4wIC8gKGVmZmVjdGl2ZVJhbmdlICogZWZmZWN0aXZlUmFuZ2UpO1xcbiAgZmxvYXQgcmF0aW80ID0gZGlzdGFuY2VTcXVhcmVkICogZGlzdGFuY2VTcXVhcmVkICogaW52UmFuZ2VTcXVhcmVkICogaW52UmFuZ2VTcXVhcmVkO1xcbiAgcmV0dXJuIG1heChtaW4oMS4wIC0gcmF0aW80LCAxLjApLCAwLjApIC8gZGlzdGFuY2VTcXVhcmVkO1xcbn1cXG5cXG5mbG9hdCBnZXRSYW5nZUF0dGVudWF0aW9uKExpZ2h0IGxpZ2h0KVxcbntcXG4gIHJldHVybiBnZXRSYW5nZUF0dGVudWF0aW9uQXQoZG90KGxpZ2h0LnBvaW50VG9MaWdodCwgbGlnaHQucG9pbnRUb0xpZ2h0KSwgbGlnaHQuZWZmZWN0aXZlUmFuZ2UpO1xcbn1cXG5cXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvYmxvYi9tYXN0ZXIvZXh0ZW5zaW9ucy8yLjAvS2hyb25vcy9LSFJfbGlnaHRzX3B1bmN0dWFsL1JFQURNRS5tZCNpbm5lci1hbmQtb3V0ZXItY29uZS1hbmdsZXNcXG5mbG9hdCBnZXRTcG90QXR0ZW51YXRpb24oTGlnaHQgbGlnaHQpXFxue1xcbiAgZmxvYXQgYWN0dWFsQ29zID0gZG90KGxpZ2h0LmRpcmVjdGlvbiwgLWxpZ2h0LmRpcmVjdGlvbk9mTGlnaHRPYmplY3QpO1xcbiAgaWYgKGFjdHVhbENvcyA+IGxpZ2h0Lm91dGVyQ29uZUNvcykge1xcbiAgICBpZiAoYWN0dWFsQ29zIDwgbGlnaHQuaW5uZXJDb25lQ29zKSB7XFxuICAgICAgZmxvYXQgYXR0ZW51YXRpb24gPSAoYWN0dWFsQ29zIC0gbGlnaHQub3V0ZXJDb25lQ29zKSAvIChsaWdodC5pbm5lckNvbmVDb3MgLSBsaWdodC5vdXRlckNvbmVDb3MpO1xcbiAgICAgIHJldHVybiBhdHRlbnVhdGlvbiAqIGF0dGVudWF0aW9uO1xcbiAgICB9XFxuICAgIHJldHVybiAxLjA7XFxuICB9XFxuICByZXR1cm4gMC4wO1xcbn1cXG5cXG52ZWMzIGdldExpZ2h0QXR0ZW51YXRlZChMaWdodCBsaWdodCkge1xcbiAgbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSA9IGxpZ2h0LmludGVuc2l0eTtcXG4gIC8vIGlmIChsaWdodC50eXBlID09IDApIHsgLy8gRGlyZWN0aW9uYWwgTGlnaHRcXG4gICAgLy8gRGlyZWN0aW9uYWwgTGlnaHQgZG9uJ3QgYXR0ZW51YXRlIGdlb21ldGljYWxseVxcbiAgLy8gfVxcblxcbiAgLy8gUG9pbnQgTGlnaHQgJiYgU3BvdCBMaWdodFxcbiAgaWYgKGxpZ2h0LnR5cGUgIT0gMClcXG4gIHtcXG4gICAgbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSAqPSBnZXRSYW5nZUF0dGVudWF0aW9uKGxpZ2h0KTtcXG4gIH1cXG4gIC8vIFNwb3QgTGlnaHRcXG4gIGlmIChsaWdodC50eXBlID09IDIpXFxuICB7XFxuICAgIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHkgKj0gZ2V0U3BvdEF0dGVudWF0aW9uKGxpZ2h0KTtcXG4gIH1cXG5cXG4gIHJldHVybiBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5O1xcbn1cXG5cXG5MaWdodCBnZXRMaWdodChpbnQgbGlnaHRJZHgsIHZlYzMgdl9wb3NpdGlvbl9pbldvcmxkKSB7XFxuICB2ZWMzIGxpZ2h0UG9zaXRpb24gPSBnZXRfbGlnaHRQb3NpdGlvbih1aW50KGxpZ2h0SWR4KSk7XFxuICB2ZWM0IGxpZ2h0UHJvcGVydHkgPSBnZXRfbGlnaHRQcm9wZXJ0eSh1aW50KGxpZ2h0SWR4KSk7XFxuICBMaWdodCBsaWdodDtcXG4gIGxpZ2h0LmRpcmVjdGlvbk9mTGlnaHRPYmplY3QgPSB2ZWMzKDAuMCk7XFxuICBmbG9hdCBsaWdodFR5cGUgPSBsaWdodFByb3BlcnR5Lng7XFxuICBsaWdodC5lZmZlY3RpdmVSYW5nZSA9IGxpZ2h0UHJvcGVydHkueTtcXG4gIGxpZ2h0LmlubmVyQ29uZUNvcyA9IGxpZ2h0UHJvcGVydHkuejtcXG4gIGxpZ2h0Lm91dGVyQ29uZUNvcyA9IGxpZ2h0UHJvcGVydHkudztcXG4gIGxpZ2h0LnBvc2l0aW9uID0gbGlnaHRQb3NpdGlvbjtcXG5cXG4gIGlmIChsaWdodFR5cGUgPCAtMC41KSB7IC8vIGRpc2FibGVkIGxpZ2h0XFxuICAgIGxpZ2h0LmludGVuc2l0eSA9IHZlYzMoMC4wKTtcXG4gICAgbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSA9IHZlYzMoMC4wKTtcXG4gICAgbGlnaHQudHlwZSA9IC0xO1xcbiAgICByZXR1cm4gbGlnaHQ7XFxuICB9XFxuXFxuICBpZiAoMC43NSA8IGxpZ2h0VHlwZSkgeyAvLyBpcyBwb2ludCBsaWdodCBvciBzcG90IGxpZ2h0XFxuICAgIGxpZ2h0LnBvaW50VG9MaWdodCA9IGxpZ2h0UG9zaXRpb24gLSB2X3Bvc2l0aW9uX2luV29ybGQ7XFxuICAgIGxpZ2h0LmRpcmVjdGlvbiA9IG5vcm1hbGl6ZShsaWdodC5wb2ludFRvTGlnaHQpO1xcbiAgICBsaWdodC50eXBlID0gMTtcXG5cXG4gICAgLy8gVGhlIGF0dGVudWF0aW9uIGlzIGNvbXB1dGVkIGJlZm9yZSB0aGUgaW50ZW5zaXR5IGFuZCAoZm9yIHNwb3QgbGlnaHRzKSB0aGUgb2JqZWN0LXNwYWNlIGRpcmVjdGlvbiBhcmVcXG4gICAgLy8gcmVhZC4gQSBsaWdodCBvdXRzaWRlIGl0cyByYW5nZSBvciBjb25lIGNvbnRyaWJ1dGVzIGV4YWN0bHkgemVybywgc28gdGhvc2UgcmVhZHMgYXJlIHNraXBwZWQuIFRoZSBjYWxsZXJzXFxuICAgIC8vIG9ubHkgdXNlIHRoZSBhdHRlbnVhdGVkIGludGVuc2l0eSBhbmQgdGhlIGRpcmVjdGlvbiBvZiBzdWNoIGEgbGlnaHQuXFxuICAgIGZsb2F0IHJhbmdlQXR0ZW51YXRpb24gPSBnZXRSYW5nZUF0dGVudWF0aW9uQXQoZG90KGxpZ2h0LnBvaW50VG9MaWdodCwgbGlnaHQucG9pbnRUb0xpZ2h0KSwgbGlnaHQuZWZmZWN0aXZlUmFuZ2UpO1xcbiAgICBpZiAoIShyYW5nZUF0dGVudWF0aW9uID4gMC4wKSkge1xcbiAgICAgIGxpZ2h0LmludGVuc2l0eSA9IHZlYzMoMC4wKTtcXG4gICAgICBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5ID0gdmVjMygwLjApO1xcbiAgICAgIHJldHVybiBsaWdodDtcXG4gICAgfVxcblxcbiAgICBpZiAobGlnaHRUeXBlID4gMS43NSkgeyAvLyBpcyBzcG90IGxpZ2h0XFxuICAgICAgbGlnaHQudHlwZSA9IDI7XFxuICAgICAgbGlnaHQuZGlyZWN0aW9uT2ZMaWdodE9iamVjdCA9IGdldF9saWdodERpcmVjdGlvbih1aW50KGxpZ2h0SWR4KSk7XFxuICAgICAgZmxvYXQgc3BvdEF0dGVudWF0aW9uID0gZ2V0U3BvdEF0dGVudWF0aW9uKGxpZ2h0KTtcXG4gICAgICBpZiAoIShzcG90QXR0ZW51YXRpb24gPiAwLjApKSB7XFxuICAgICAgICBsaWdodC5pbnRlbnNpdHkgPSB2ZWMzKDAuMCk7XFxuICAgICAgICBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5ID0gdmVjMygwLjApO1xcbiAgICAgICAgcmV0dXJuIGxpZ2h0O1xcbiAgICAgIH1cXG4gICAgICAvLyBEZWZlciB0aGUgaW50ZW5zaXR5IHJlYWQgdW50aWwgdGhlIGxpZ2h0IGFjdHVhbGx5IGNvbnRyaWJ1dGVzLlxcbiAgICAgIGxpZ2h0LmludGVuc2l0eSA9IGdldF9saWdodEludGVuc2l0eSh1aW50KGxpZ2h0SWR4KSkgKiBNX1BJOyAvLyBQdW5jdHVhbCBMaWdodFxcbiAgICAgIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHkgPSBsaWdodC5pbnRlbnNpdHkgKiByYW5nZUF0dGVudWF0aW9uICogc3BvdEF0dGVudWF0aW9uO1xcbiAgICAgIHJldHVybiBsaWdodDtcXG4gICAgfVxcblxcbiAgICBsaWdodC5pbnRlbnNpdHkgPSBnZXRfbGlnaHRJbnRlbnNpdHkodWludChsaWdodElkeCkpICogTV9QSTsgLy8gUHVuY3R1YWwgTGlnaHRcXG4gICAgbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSA9IGxpZ2h0LmludGVuc2l0eSAqIHJhbmdlQXR0ZW51YXRpb247XFxuICAgIHJldHVybiBsaWdodDtcXG4gIH1cXG5cXG4gIC8vIGlzIERpcmVjdGlvbmFsIExpZ2h0XFxuICBsaWdodC50eXBlID0gMDtcXG4gIGxpZ2h0LmRpcmVjdGlvbk9mTGlnaHRPYmplY3QgPSBnZXRfbGlnaHREaXJlY3Rpb24odWludChsaWdodElkeCkpO1xcbiAgbGlnaHQuZGlyZWN0aW9uID0gbm9ybWFsaXplKGxpZ2h0LmRpcmVjdGlvbk9mTGlnaHRPYmplY3QgKiAtMS4wKTtcXG4gIGxpZ2h0LmludGVuc2l0eSA9IGdldF9saWdodEludGVuc2l0eSh1aW50KGxpZ2h0SWR4KSkgKiBNX1BJOyAvLyBQdW5jdHVhbCBMaWdodFxcbiAgbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eSA9IGxpZ2h0LmludGVuc2l0eTtcXG4gIHJldHVybiBsaWdodDtcXG59XFxuXFxuLy8gQ2x1c3RlcmVkIEZvcndhcmQgbGlnaHQgbGlzdCAoc2VlIHNyYy9mb3VuZGF0aW9uL3JlbmRlcmVyL2xpZ2h0Q2x1c3Rlci9MaWdodENsdXN0ZXJMYXlvdXQudHMpLlxcbi8vIFRoZSBsaXN0IGEgZnJhZ21lbnQgaXRlcmF0ZXMgaXMgYSBjb25jYXRlbmF0aW9uIG9mIHR3byBwYXJ0czpcXG4vLyAtIHRoZSBcXFwiZmlyc3RcXFwiIHBhcnQ6IGxpZ2h0cyB0aGF0IGFyZSBhbHdheXMgZXZhbHVhdGVkIChkaXJlY3Rpb25hbCBsaWdodHMgYW5kIGxpZ2h0cyB3aXRob3V0IGEgcmFuZ2UpLCByZWFkIGZyb21cXG4vLyAgIHRoZSBhbGwtbGlnaHQgbGlzdCBpbiB0aGUgY2x1c3RlcmVkTGlnaHREYXRhIGdsb2JhbCBwcm9wZXJ0eTtcXG4vLyAtIHRoZSBcXFwic2Vjb25kXFxcIiBwYXJ0OiB0aGUgbG9jYWwgbGlnaHRzIG9mIHRoZSBjbHVzdGVyIG9mIHRoZSBmcmFnbWVudCwgcmVhZCBmcm9tIHRoZSBsaWdodCBpbmRleCBsaXN0IG9mIHRoZVxcbi8vICAgY2FtZXJhJ3MgdmlldyByZWdpb24gKG9ubHkgd2hlbiB0aGUgY2FtZXJhIGhhcyBsaWdodCBjbHVzdGVycykuXFxuLy8gV2l0aG91dCBhIHZpZXcgcmVnaW9uIHRoZSBsaXN0IGlzIHRoZSBhbGwtbGlnaHQgbGlzdCwgaS5lLiBhbGwgZW5hYmxlZCBsaWdodHMuXFxuI2lmIGRlZmluZWQoUk5fSVNfUElYRUxfU0hBREVSKSAmJiAhZGVmaW5lZChXRUJHTDJfTVVMVElfVklFVylcXG4vLyBUaGUgbGlnaHQgY2x1c3RlciB2aWV3IG9mIHRoZSBjYW1lcmEgb2YgdGhlIGRyYXcsIHVwbG9hZGVkIHBlciBkcmF3IGJ5IFdlYkdMU3RyYXRlZ3lXZWJHTDI6XFxuLy8gWzAuLjVdIHRoZSB2aWV3IGhlYWRlciAoc2VlIExpZ2h0Q2x1c3RlckxheW91dC50cyksIFs2XSAodmVjNCBpbmRleCBvZiB0aGUgdmlldyBpbiB0aGUgZGF0YSB0ZXh0dXJlLCAwLCAwLCAwKS5cXG4vLyBSZWFkaW5nIHRoZSBoZWFkZXIgZnJvbSB1bmlmb3JtcyBpcyBtdWNoIGNoZWFwZXIgdGhhbiBmcm9tIHRoZSBkYXRhIHRleHR1cmUuXFxudW5pZm9ybSBoaWdocCB2ZWM0IHVfbGlnaHRDbHVzdGVyVmlld1s3XTsgLy8gc2tpcFByb2Nlc3M9dHJ1ZVxcbiNlbmRpZlxcblxcbi8vIFRoZSB0d28tcGFydCBsaXN0IGFib3ZlLiBzZWNvbmRCYXNlIGlzIG1lYW5pbmdmdWwgb25seSBmb3IgdGhlIHNlY29uZCBwYXJ0OiB3aGVuIHRoZSBjYW1lcmEgaGFzIG5vIGNsdXN0ZXJzLFxcbi8vIGZpcnN0Q291bnQgPT0gY291bnQgYW5kIHRoZSBzZWNvbmQgcGFydCBpcyBlbXB0eS5cXG5zdHJ1Y3QgTGlnaHRMaXN0IHtcXG4gIGludCBjb3VudDsgICAgICAvLyB0aGUgbnVtYmVyIG9mIGxpZ2h0cyBpbiB0aGUgbGlzdFxcbiAgaW50IGZpcnN0Q291bnQ7IC8vIHRoZSBudW1iZXIgb2YgbGlnaHRzIHJlYWQgZnJvbSB0aGUgYWxsLWxpZ2h0IGxpc3RcXG4gIGludCBzZWNvbmRCYXNlOyAvLyB0aGUgdmVjNCBpbmRleCBvZiB0aGUgY2x1c3RlciBsaWdodHMgaW4gdGhlIGxpZ2h0IGluZGV4IGxpc3Qgb2YgdGhlIHZpZXdcXG59O1xcblxcbi8vIFRoZSBkZWZhdWx0IGlzIHRoZSBhbGwtbGlnaHQgbGlzdCAobm8gY2x1c3RlcmluZyk6IGV2ZXJ5IGZyYWdtZW50IGV2YWx1YXRlcyBhbGwgZW5hYmxlZCBsaWdodHMuXFxuTGlnaHRMaXN0IGdldExpZ2h0TGlzdCh2ZWMzIHBvc2l0aW9uSW5Xb3JsZCwgdWludCBjYW1lcmFTSUQpIHtcXG4gIHZlYzQgaGVhZGVyID0gZ2V0X2NsdXN0ZXJlZExpZ2h0RGF0YSgwdSwgMHUpOyAvLyAoYWxsQ291bnQsIGdsb2JhbENvdW50LCBsb2NhbENvdW50LCBzcGhlcmVCYXNlKVxcbiAgTGlnaHRMaXN0IGxpc3Q7XFxuICBsaXN0LmNvdW50ID0gaW50KGhlYWRlci54KTtcXG4gIGxpc3QuZmlyc3RDb3VudCA9IGludChoZWFkZXIueCk7XFxuICBsaXN0LnNlY29uZEJhc2UgPSAwO1xcbiNpZiBkZWZpbmVkKFJOX0lTX1BJWEVMX1NIQURFUikgJiYgIWRlZmluZWQoV0VCR0wyX01VTFRJX1ZJRVcpXFxuICAvLyBUaGUgdmVjNCBpbmRleCBvZiB0aGUgdmlldyByZWdpb24gb2YgdGhpcyBjYW1lcmEsIC0xIHdoZW4gdGhlIGNhbWVyYSBoYXMgbm8gY2x1c3RlcnMgKExpZ2h0Q2x1c3RlclN5c3RlbVxcbiAgLy8gc2V0cyBpdCBvbiB0aGUgY2FtZXJhKS4gSXQgaXMgdGhlIHggY29tcG9uZW50IG9mIHRoZSBsYXN0IHZlYzQgb2YgdGhlIHBlci1kcmF3IHVuaWZvcm0uXFxuICBpbnQgdmlld0Jhc2UgPSBpbnQodV9saWdodENsdXN0ZXJWaWV3WzZdLngpO1xcbiAgaWYgKHZpZXdCYXNlID49IDApIHtcXG4gICAgdmVjNCBncmlkID0gdV9saWdodENsdXN0ZXJWaWV3WzRdOyAvLyAoZ3JpZFgsIGdyaWRZLCBncmlkWiwgc3RhdGUpXFxuICAgIGlmIChncmlkLncgPT0gMC4wKSB7XFxuICAgICAgdmVjNCBwID0gdmVjNChwb3NpdGlvbkluV29ybGQsIDEuMCk7XFxuICAgICAgLy8gdyBpcyB0aGUgZXllLXBsYW5lIGRpc3RhbmNlOiBmcmFnbWVudHMgYmVoaW5kIHRoZSBuZWFyIHBsYW5lICh3IDw9IDApIHVzZSB0aGUgYWxsLWxpZ2h0IGxpc3QuXFxuICAgICAgZmxvYXQgdyA9IGRvdCh1X2xpZ2h0Q2x1c3RlclZpZXdbMl0sIHApO1xcbiAgICAgIGlmICh3ID4gMC4wKSB7XFxuICAgICAgICB2ZWM0IHNsaWNlID0gdV9saWdodENsdXN0ZXJWaWV3WzVdOyAvLyAoc2xpY2VTY2FsZSwgc2xpY2VCaWFzLCB6TmVhciwgekZhcilcXG4gICAgICAgIC8vIFRoZSB0aWxlIGNvb3JkaW5hdGVzIGFyZSBhbHJlYWR5IGluIGdyaWQgdW5pdHMgKHRoZSBoZWFkZXIgcm93cyBhcmUgc2NhbGVkIGJ5IDAuNSAqIGdyaWQpLCBhbmQgdGhlXFxuICAgICAgICAvLyBkZXB0aCBzbGljZSB1c2VzIHRoZSBzYW1lIGxvZ2FyaXRobWljIG1hcHBpbmcgYXMgdGhlIGNsdXN0ZXIgYnVpbGQuIENsYW1waW5nIGlzIGNvcnJlY3QgYmVjYXVzZSB0aGVcXG4gICAgICAgIC8vIGNsdXN0ZXJzIGF0IHRoZSBib3JkZXIgb2YgdGhlIGdyaWQgZXh0ZW5kIHRvIGluZmluaXR5LlxcbiAgICAgICAgdmVjMyBjZWxsID0gdmVjMyhcXG4gICAgICAgICAgZG90KHVfbGlnaHRDbHVzdGVyVmlld1swXSwgcCkgLyB3LFxcbiAgICAgICAgICBkb3QodV9saWdodENsdXN0ZXJWaWV3WzFdLCBwKSAvIHcsXFxuICAgICAgICAgIGxvZyhtYXgoZG90KHVfbGlnaHRDbHVzdGVyVmlld1szXSwgcCksIDEuMGUtMzApKSAqIHNsaWNlLnggKyBzbGljZS55KTtcXG4gICAgICAgIGl2ZWMzIGMgPSBpdmVjMyhjbGFtcChmbG9vcihjZWxsKSwgdmVjMygwLjApLCBncmlkLnh5eiAtIDEuMCkpO1xcbiAgICAgICAgaW50IGdyaWRYID0gaW50KGdyaWQueCk7XFxuICAgICAgICBpbnQgZ3JpZFkgPSBpbnQoZ3JpZC55KTtcXG4gICAgICAgIC8vIFRoZSBjbHVzdGVyIGluZGV4IGxheW91dDogKHogKiBncmlkWSArIHkpICogZ3JpZFggKyB4LlxcbiAgICAgICAgaW50IGNsdXN0ZXJJbmRleCA9IChjLnogKiBncmlkWSArIGMueSkgKiBncmlkWCArIGMueDtcXG4gICAgICAgIC8vIFRoZSBjbHVzdGVyIHRhYmxlIHN0YXJ0cyBhZnRlciB0aGUgNiBoZWFkZXIgdmVjNHM7IHRoZSBsaWdodCBpbmRleCBsaXN0IGFmdGVyIHRoZSB0YWJsZS5cXG4gICAgICAgIHZlYzQgdGFibGVFbnRyeSA9IGZldGNoRWxlbWVudCh2aWV3QmFzZSArIDYgKyBjbHVzdGVySW5kZXgpOyAvLyAob2Zmc2V0LCBjb3VudCwgMCwgMClcXG4gICAgICAgIGludCBjbHVzdGVyQ291bnQgPSBncmlkWCAqIGdyaWRZICogaW50KGdyaWQueik7XFxuICAgICAgICAvLyBUaGUgZmlyc3QgcGFydCBpcyBvbmx5IHRoZSBsaWdodHMgdGhhdCBjYW4gbm90IGJlIGN1bGxlZDsgdGhlIGxvY2FsIGxpZ2h0cyBvZiB0aGUgd2hvbGUgc2NlbmUgYXJlXFxuICAgICAgICAvLyByZXBsYWNlZCBieSB0aGUgbG9jYWwgbGlnaHRzIG9mIHRoaXMgY2x1c3Rlci5cXG4gICAgICAgIGxpc3QuZmlyc3RDb3VudCA9IGludChoZWFkZXIueSk7XFxuICAgICAgICBsaXN0LnNlY29uZEJhc2UgPSB2aWV3QmFzZSArIDYgKyBjbHVzdGVyQ291bnQgKyBpbnQodGFibGVFbnRyeS54KTtcXG4gICAgICAgIGxpc3QuY291bnQgPSBsaXN0LmZpcnN0Q291bnQgKyBpbnQodGFibGVFbnRyeS55KTtcXG4gICAgICB9XFxuICAgIH1cXG4gIH1cXG4jZW5kaWZcXG4gIHJldHVybiBsaXN0O1xcbn1cXG5cXG4vLyBSZXR1cm5zIChsaWdodCBjb21wb25lbnQgU0lELCBzaGFkb3cgc2xvdCAoLTE6IG5vbmUpKSBvZiB0aGUgbi10aCBsaWdodCBvZiB0aGUgbGlzdC5cXG4vLyBUaGUgZW50cmllcyBhcmUgcGFja2VkIGFzIGxpZ2h0Q29tcG9uZW50U0lEICsgNjU1MzYgKiAoc2hhZG93U2xvdCArIDEpIChzZWUgTGlnaHRDbHVzdGVyTGF5b3V0LnRzKSwgc28gdGhlIFNJRCBpc1xcbi8vIHRoZSBsb3cgMTYgYml0cyBhbmQgdGhlIHNsb3QgaXMgdGhlIG5leHQgYml0cyBtaW51cyBvbmUuIEVudHJpZXMgYXJlIHN0b3JlZCA0IHBlciB2ZWM0IGluIGJvdGggcGFydHMgb2YgdGhlIGxpc3QuXFxuaXZlYzIgZ2V0TGlnaHRSZWYoTGlnaHRMaXN0IGxpc3QsIGludCBuKSB7XFxuICBmbG9hdCBlbnRyeTtcXG4gIGlmIChuIDwgbGlzdC5maXJzdENvdW50KSB7XFxuICAgIC8vIEZpcnN0IHBhcnQ6IHRoZSBhbGwtbGlnaHQgbGlzdCwgd2hpY2ggc3RhcnRzIGFmdGVyIHRoZSBnbG9iYWwgaGVhZGVyIHZlYzQuXFxuICAgIHZlYzQgZW50cmllcyA9IGdldF9jbHVzdGVyZWRMaWdodERhdGEoMHUsIHVpbnQoMSArIChuID4+IDIpKSk7XFxuICAgIGVudHJ5ID0gZW50cmllc1tuICYgM107XFxuICB9IGVsc2Uge1xcbiAgICAvLyBTZWNvbmQgcGFydDogdGhlIGxpZ2h0IGluZGV4IGxpc3Qgb2YgdGhlIGNsdXN0ZXIsIGF0IHNlY29uZEJhc2UgKHBsdXMgdGhlIHZlYzQgYW5kIHRoZSBjb21wb25lbnQgb2YgbikuXFxuICAgIGludCBlID0gbiAtIGxpc3QuZmlyc3RDb3VudDtcXG4gICAgdmVjNCBlbnRyaWVzID0gZmV0Y2hFbGVtZW50KGxpc3Quc2Vjb25kQmFzZSArIChlID4+IDIpKTtcXG4gICAgZW50cnkgPSBlbnRyaWVzW2UgJiAzXTtcXG4gIH1cXG4gIGludCBwYWNrZWQgPSBpbnQoZW50cnkpO1xcbiAgcmV0dXJuIGl2ZWMyKHBhY2tlZCAmIDB4RkZGRiwgKHBhY2tlZCA+PiAxNikgLSAxKTtcXG59XFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBcTRTLGtCQUFjO0FBQVcsdUJBQW1CO0FBQXo3UyxrQ0FBQyxNQUE0NFMsYUFBeUIsaUJBQXVCOyIsCiAgIm5hbWVzIjogW10KfQo=
