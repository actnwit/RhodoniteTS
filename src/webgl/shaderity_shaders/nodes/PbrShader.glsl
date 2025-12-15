void pbrShader(
  in uvec4 instanceIds,
  in vec4 positionInWorld, in vec3 normalInWorld, in vec3 geomNormalInWorld,
  in vec4 baseColor, in float perceptualRoughness, in float metallic,
  in OcclusionProps occlusionProps,
  in float ior,
  in float transmission,
  in SpecularProps specularProps,
  in VolumeProps volumeProps,
  in ClearcoatProps clearcoatProps,
  in AnisotropyProps anisotropyProps,
  in SheenProps sheenProps,
  in IridescenceProps iridescenceProps,
  in DiffuseTransmissionProps diffuseTransmissionProps,
  out vec4 outColor) {
  vec4 shadingColor = vec4(0.0, 0.0, 0.0, baseColor.a);

 // Alpha Test
  float alpha = baseColor.a;
/* shaderity: @{alphaProcess} */
  baseColor.a = alpha;

    // F0, F90
  float outsideIor = 1.0;
  vec3 dielectricF0 = vec3(sq((ior - outsideIor) / (ior + outsideIor)));
  dielectricF0 = min(dielectricF0 * specularProps.specularColor, vec3(1.0));
  vec3 dielectricF90 = vec3(specularProps.specularWeight);

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
    // Get Light
    Light light = getLight(i, positionInWorld.xyz);
    vec3 lighting = lightingWithPunctualLight(instanceIds, light, normalInWorld, viewDirection, NdotV, baseColor.rgb,
                        perceptualRoughness, metallic,
                        specularProps.specularWeight, dielectricF0, dielectricF90, ior,
                        transmission,
                        volumeProps,
                        clearcoatProps,
                        anisotropyProps,
                        sheenProps,
                        iridescenceProps,
                        diffuseTransmissionProps);

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

  // Image-based Lighting
  vec3 ibl = IBLContribution(instanceIds, materialSID, normalInWorld, NdotV, viewDirection, geomNormalInWorld, cameraSID, positionInWorld.xyz,
    baseColor.rgb, perceptualRoughness, metallic,
    specularProps.specularWeight, dielectricF0, ior,
    clearcoatProps,
    transmission,
    volumeProps,
    sheenProps,
    iridescenceProps,
    anisotropyProps,
    diffuseTransmissionProps,
    dispersion);

  #ifdef RN_USE_OCCLUSION_TEXTURE
    float occlusion = occlusionProps.occlusionTexture.r
    float occlusionStrength = occlusionProps.occlusionStrength;
    // Occlusion to Indirect Lights
    vec3 indirectLight = ibl * (1.0 + occlusionStrength * (occlusion - 1.0));
  #else
    vec3 indirectLight = ibl;
  #endif

  shadingColor.rgb += indirectLight;

  outColor = shadingColor;
}
