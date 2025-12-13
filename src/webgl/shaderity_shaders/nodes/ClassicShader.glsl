void classicShader(in vec4 vertexColor, in vec4 diffuseColorFactor, in vec4 diffuseTextureColor, in uint shadingModel, in float shininess, in vec4 positionInWorld, in vec3 normalInWorld, out vec4 outColor) {
  vec4 diffuseColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
  vec4 shadingColor = vec4(0.0, 0.0, 0.0, diffuseColor.a);
  if (shadingModel >= 1u && shadingModel <= 3u) {
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

    for (int i = 0; i < lightNumber; i++) {
      vec3 specular = vec3(0.0, 0.0, 0.0);
      // Get Light
      Light light = getLight(i, positionInWorld.xyz);

      // Diffuse
      vec3 albedo = diffuseColor.rgb / 2.0;
      vec3 specColor = diffuseColor.rgb / 2.0;
      vec3 diffuse = albedo * RECIPROCAL_PI * max(0.0, dot(normalInWorld, light.direction)) * light.attenuatedIntensity;

      vec3 viewPosition = get_viewPosition(cameraSID);

      // Specular
      if (shadingModel == 2u) {// BLINN
        // ViewDirection
        vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
        vec3 halfVector = normalize(light.direction + viewDirection);
        float normalizationFactor = (shininess + 2.0) / (2.0 * PI);
        specular += specColor * normalizationFactor * pow(max(0.0, dot(halfVector, normalInWorld)), shininess) * light.attenuatedIntensity;
      } else if (shadingModel == 3u) { // PHONG
        vec3 viewDirection = normalize(viewPosition - positionInWorld.xyz);
        vec3 R = reflect(-light.direction, normalInWorld);
        float normalizationFactor = (shininess + 2.0) / (2.0 * PI);
        specular += specColor * normalizationFactor * pow(max(0.0, dot(R, viewDirection)), shininess) * light.attenuatedIntensity;
      } else {
        diffuse *= 2.0; // for energy conservation
      }

      #ifdef RN_USE_SHADOW_MAPPING
      int depthTextureIndex = get_depthTextureIndexList(materialSID, uint(i));
      if (light.type == 1 && depthTextureIndex >= 0) { // Point Light
        float pointLightFarPlane = get_pointLightFarPlane(materialSID, 0u);
        float pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0u);
        float shadowContribution = varianceShadowContributionParaboloid(positionInWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, depthTextureIndex);
        diffuse *= shadowContribution;
        specular *= shadowContribution;
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
        diffuse *= shadowContribution;
        specular *= shadowContribution;
      }
      #endif

      shadingColor.rgb += diffuse + specular;
    }
  } else {
    shadingColor.rgb = diffuseColor.rgb;
  }

  outColor = shadingColor;
}
