var t=`fn classicShader(vertexColor: vec4<f32>, diffuseColorFactor: vec4<f32>, diffuseTextureColor: vec4<f32>, shadingModel: u32, shininess: f32, positionInWorld: vec4<f32>, normalInWorld: vec3<f32>, outColor: ptr<function, vec4<f32>>) {
  var diffuseColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
  var shadingColor = vec4<f32>(0.0, 0.0, 0.0, diffuseColor.a);
  if (shadingModel >= 1u && shadingModel <= 3u) {
    let cameraSID = uniformDrawParameters.cameraSID;
    let materialSID = uniformDrawParameters.materialSid;
    let lightList = getLightList(positionInWorld.xyz, cameraSID);
    for (var n = 0u; n < lightList.count; n++) {
      let lightRef = getLightRef(lightList, n);
      let i = u32(lightRef.x); // light component SID
      var specular = vec3<f32>(0.0, 0.0, 0.0);
      let light: Light = getLight(i, positionInWorld.xyz);
      // A light at the border of the cluster can be outside its range. Its contribution is exactly
      // zero, so skip the shading and the shadow lookup without changing the result.
      if (all(light.attenuatedIntensity == vec3f(0.0))) {
        continue;
      }

      // Diffuse
      let albedo = diffuseColor.rgb / 2.0;
      let specColor = diffuseColor.rgb / 2.0;
      var diffuse = albedo * RECIPROCAL_PI * max(0.0, dot(normalInWorld, light.direction)) * light.attenuatedIntensity;

      let viewPosition = get_viewPosition(cameraSID);

      // Specular
      if (shadingModel == 2u) {// BLINN
        // ViewDirection
        let viewDirection = normalize(viewPosition - positionInWorld.xyz);
        let halfVector = normalize(light.direction + viewDirection);
        let normalizationFactor = (shininess + 2.0) / (2.0 * M_PI);
        specular += specColor * normalizationFactor * pow(max(0.0, dot(halfVector, normalInWorld)), shininess) * light.attenuatedIntensity;
      } else if (shadingModel == 3u) { // PHONG
        let viewDirection = normalize(viewPosition - positionInWorld.xyz);
        let R = reflect(-light.direction, normalInWorld);
        let normalizationFactor = (shininess + 2.0) / (2.0 * M_PI);
        specular += specColor * normalizationFactor * pow(max(0.0, dot(R, viewDirection)), shininess) * light.attenuatedIntensity;
      } else {
        diffuse *= 2.0; // for energy conservation
      }

      #ifdef RN_USE_SHADOW_MAPPING
        // The shadow data of the light is at its shadow slot (-1: no shadow data).
        // Everything is read only when the light has shadow data: most lights do not, and the
        // texture samples and the matrix fetch would otherwise run for every light in every
        // fragment (the WebGL2 shader reads them in the same order for the same reason).
        if (lightRef.y >= 0) {
          let shadowSlot = u32(lightRef.y);
          let depthTextureIndex = get_depthTextureIndexList(materialSID, shadowSlot);
          if (depthTextureIndex >= 0) {
            if (light.lightType == 1) { // Point Light
              let pointLightFarPlane = get_pointLightFarPlane(materialSID, shadowSlot);
              let pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0);
              let shadowContributionParaboloid = varianceShadowContributionParaboloid(positionInWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, u32(depthTextureIndex));
              diffuse *= shadowContributionParaboloid;
              specular *= shadowContributionParaboloid;
            } else if (light.lightType == 0 || light.lightType == 2) { // Directional Light or Spot Light
              let v_shadowCoord = get_depthBiasPV(materialSID, shadowSlot) * positionInWorld;
              let shadowCoord = v_shadowCoord.xy / v_shadowCoord.w;
              let normalizedDepth = v_shadowCoord.z / v_shadowCoord.w;

              // Slope-scaled bias in normalized depth space to reduce shadow acne
              let NdotL = max(dot(normalInWorld, light.direction), 0.0);
              let baseBias = 0.001;
              let slopeBias = 0.005 * sqrt(1.0 - NdotL * NdotL) / max(NdotL, 0.05);
              let bias = min(baseBias + slopeBias, 0.05);  // Clamp to prevent excessive bias

              let lightDirection = normalize(get_lightDirection(i));
              let lightPosToWorldPos = normalize(positionInWorld.xyz - light.position);
              let dotProduct = dot(lightPosToWorldPos, lightDirection);

              if (dotProduct > 0.0 && shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
                let shadowContribution = varianceShadowContribution(shadowCoord, normalizedDepth - bias, u32(depthTextureIndex));
                diffuse *= shadowContribution;
                specular *= shadowContribution;
              }
            }
          }
        }
      #endif

      shadingColor += vec4<f32>(diffuse + specular, 0.0);
    }
  } else {
    shadingColor = diffuseColor;
  }

  *outColor = shadingColor;
}
`,n="fragment",i=!0,a={code:t,shaderStage:n,isFragmentShader:i};export{t as code,a as default,i as isFragmentShader,n as shaderStage};
