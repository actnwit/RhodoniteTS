fn classicShader(vertexColor: vec4<f32>, diffuseColorFactor: vec4<f32>, diffuseTextureColor: vec4<f32>, shadingModel: u32, shininess: f32, positionInWorld: vec4<f32>, normalInWorld: vec3<f32>, outColor: ptr<function, vec4<f32>>) {
  var diffuseColor = vertexColor * diffuseColorFactor * diffuseTextureColor;
  var shadingColor = vec4<f32>(0.0, 0.0, 0.0, diffuseColor.a);
  if (shadingModel > 0) {
    let lightNumber = u32(get_lightNumber(0u, 0u));
    let cameraSID = uniformDrawParameters.cameraSID;
    let materialSID = uniformDrawParameters.materialSid;
    for (var i = 0u; i < lightNumber ; i++) {
      var specular = vec3<f32>(0.0, 0.0, 0.0);
      let light: Light = getLight(i, positionInWorld.xyz);

      // Diffuse
      var diffuse = diffuseColor.rgb * max(0.0, dot(normalInWorld, light.direction)) * light.attenuatedIntensity;

      let viewPosition = get_viewPosition(cameraSID);

      // Specular
      if (shadingModel == 2u) {// BLINN
        // ViewDirection
        let viewDirection = normalize(viewPosition - positionInWorld.xyz);
        let halfVector = normalize(light.direction + viewDirection);
        specular += pow(max(0.0, dot(halfVector, normalInWorld)), shininess);
      } else if (shadingModel == 3u) { // PHONG
        let viewDirection = normalize(viewPosition - positionInWorld.xyz);
        let R = reflect(light.direction, normalInWorld);
        specular += pow(max(0.0, dot(R, viewDirection)), shininess);
      }

      #ifdef RN_USE_SHADOW_MAPPING
        // Point Light
        let depthTextureIndex = u32(get_depthTextureIndexList(materialSID, i));
        let pointLightFarPlane = get_pointLightFarPlane(materialSID, 0);
        let pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0);
        let shadowContributionParaboloid = varianceShadowContributionParaboloid(positionInWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, depthTextureIndex);

        // Directional Light or Spot Light
        let v_shadowCoord = get_depthBiasPV(materialSID, i) * positionInWorld;
        let bias = 0.001;
        let shadowCoord = v_shadowCoord.xy / v_shadowCoord.w;
        let lightDirection = normalize(get_lightDirection(i));
        let lightPosToWorldPos = normalize(positionInWorld.xyz - light.position);
        let dotProduct = dot(lightPosToWorldPos, lightDirection);
        var shadowContribution = 1.0;
        shadowContribution = varianceShadowContribution(shadowCoord, (v_shadowCoord.z - bias)/v_shadowCoord.w, depthTextureIndex);

        if (light.lightType == 1 && depthTextureIndex >= 0) { // Point Light
          diffuse *= shadowContributionParaboloid;
          specular *= shadowContributionParaboloid;
        } else if ((light.lightType == 0 || light.lightType == 2) && depthTextureIndex >= 0) { // Directional Light or Spot Light
          if (dotProduct > 0.0 && shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
            diffuse *= shadowContribution;
            specular *= shadowContribution;
          }
        }
      #endif

      shadingColor += vec4<f32>(diffuse + specular, shadingColor.a);
    }
  } else {
    shadingColor = diffuseColor;
  }

  *outColor = shadingColor;
}
