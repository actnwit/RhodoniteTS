void pbrShader(
  in vec4 baseColor, in float perceptualRoughness, in float metallic,
  in float ior, in vec3 specularColor, in float specularWeight,
  in float transmission, in float thickness,
  float clearcoat, float clearcoatRoughness, vec3 clearcoatF0, vec3 clearcoatF90, vec3 clearcoatFresnel, vec3 clearcoatNormal_inWorld, float VdotNc,
  vec3 attenuationColor, float attenuationDistance,
  float anisotropy, vec3 anisotropicT, vec3 anisotropicB, float BdotV, float TdotV,
  vec3 sheenColor, float sheenRoughness, float albedoSheenScalingNdotV,
  float iridescence, vec3 iridescenceFresnel_dielectric, vec3 iridescenceFresnel_metal,
  float diffuseTransmission, vec3 diffuseTransmissionColor, float diffuseTransmissionThickness,
  in vec4 positionInWorld, in vec3 normalInWorld, out vec4 outColor) {
  vec4 shadingColor = vec4(0.0, 0.0, 0.0, baseColor.a);

    // F0, F90
  float outsideIor = 1.0;
  vec3 dielectricF0 = vec3(sq((ior - outsideIor) / (ior + outsideIor)));
  dielectricF0 = min(dielectricF0 * specularColor, vec3(1.0));
  vec3 dielectricF90 = vec3(specularWeight);

  int lightNumber = 0;
  #ifdef RN_IS_LIGHTING
    lightNumber = get_lightNumber(0u, 0u);
  #endif

  uint cameraSID = uint(u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */]);
  #if defined(WEBGL2_MULTI_VIEW) && defined(RN_IS_VERTEX_SHADER)
    cameraSID += uint(gl_ViewID_OVR);
  #endif

  #ifdef RN_IS_DATATEXTURE_MODE
    uint materialSID = uint(u_currentComponentSIDs[0]); // index 0 data is the materialSID
  #else // RN_IS_UNIFORM_MODE
    uint materialSID = 0u; // materialSID is not used in Uniform mode
  #endif

  vec3 viewPosition = get_viewPosition(cameraSID);
  vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
  float NdotV = saturate(dot(normalInWorld, viewDirection));

  for (int i = 0; i < lightNumber; i++) {
    vec3 specular = vec3(0.0, 0.0, 0.0);
    // Get Light
    Light light = getLight(i, positionInWorld.xyz);

    vec3 lighting = lightingWithPunctualLight(light, normalInWorld, viewDirection, NdotV, baseColor.rgb,
                  perceptualRoughness, metallic, dielectricF0, dielectricF90, ior, transmission, thickness,
                  clearcoat, clearcoatRoughness, clearcoatF0, clearcoatF90, clearcoatFresnel, clearcoatNormal_inWorld, VdotNc,
                  attenuationColor, attenuationDistance,
                  anisotropy, anisotropicT, anisotropicB, BdotV, TdotV,
                  sheenColor, sheenRoughness, albedoSheenScalingNdotV,
                  iridescence, iridescenceFresnel_dielectric, iridescenceFresnel_metal, specularWeight,
                  diffuseTransmission, diffuseTransmissionColor, diffuseTransmissionThickness);

    #ifdef RN_USE_SHADOW_MAPPING
    int depthTextureIndex = get_depthTextureIndexList(materialSID, uint(i));
    if (light.type == 1 && depthTextureIndex >= 0) { // Point Light
      float pointLightFarPlane = get_pointLightFarPlane(materialSID, 0u);
      float pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0u);
      float shadowContribution = varianceShadowContributionParaboloid(positionInWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, depthTextureIndex);
      lighting *= shadowContribution;
    } else if ((light.type == 0 || light.type == 2) && depthTextureIndex >= 0) { // Spot Light
      vec4 shadowCoordVec4 = get_depthBiasPV(materialSID, uint(i)) * positionInWorld;
      vec2 shadowCoord = shadowCoordVec4.xy / shadowCoordVec4.w;
      float normalizedDepth = shadowCoordVec4.z / shadowCoordVec4.w;

      // Slope-scaled bias in normalized depth space to reduce shadow acne
      float NdotL = max(dot(normalInWorld, light.direction), 0.0);
      float baseBias = 0.001;
      float slopeBias = 0.005 * sqrt(1.0 - NdotL * NdotL) / max(NdotL, 0.05);
      float bias = min(baseBias + slopeBias, 0.05);  // Clamp to prevent excessive bias

      vec3 lightDirection = normalize(get_lightDirection(uint(i)));
      vec3 lightPosToWorldPos = normalize(positionInWorld.xyz - light.position);
      float dotProduct = dot(lightPosToWorldPos, lightDirection);
      float shadowContribution = 1.0;
      if (dotProduct > 0.0 && shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
        shadowContribution = varianceShadowContribution(shadowCoord, normalizedDepth - bias, depthTextureIndex);
      }
      lighting *= shadowContribution;
    }
    #endif

    shadingColor.rgb += lighting;
  }

  outColor = shadingColor;
}
