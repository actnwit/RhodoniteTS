fn pbrShader(
  instanceIds: vec4<u32>,
  positionInWorld: vec4<f32>,
  normalInWorld: vec3<f32>,
  baseColor: vec4<f32>,
  perceptualRoughness: f32,
  metallic: f32,
  ior: f32,
  transmission: f32,
  specularProps: SpecularProps,
  volumeProps: VolumeProps,
  clearcoatProps: ClearcoatProps,
  anisotropyProps: AnisotropyProps,
  sheenProps: SheenProps,
  iridescenceProps: IridescenceProps,
  diffuseTransmissionProps: DiffuseTransmissionProps,
  outColor: ptr<function, vec4<f32>>
) {
  var shadingColor = vec4<f32>(0.0, 0.0, 0.0, baseColor.a);
  let lightNumber = u32(get_lightNumber(0u, 0u));
  let cameraSID = uniformDrawParameters.cameraSID;
  let materialSID = uniformDrawParameters.materialSid;
  for (var i = 0u; i < lightNumber ; i++) {
    let light: Light = getLight(i, positionInWorld.xyz);
    let lighting = lightingWithPunctualLight(instanceIds, light, normalInWorld, viewDirection, NdotV, baseColor.rgb,
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
      // Point Light
      let depthTextureIndex = get_depthTextureIndexList(materialSID, i);
      let pointLightFarPlane = get_pointLightFarPlane(materialSID, 0);
      let pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0);
      let shadowContributionParaboloid = varianceShadowContributionParaboloid(positionInWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, u32(depthTextureIndex));

      // Directional Light or Spot Light
      let v_shadowCoord = get_depthBiasPV(materialSID, i) * positionInWorld;
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
      var shadowContribution = 1.0;
      shadowContribution = varianceShadowContribution(shadowCoord, normalizedDepth - bias, u32(depthTextureIndex));

      if (light.lightType == 1 && depthTextureIndex >= 0) { // Point Light
        lighting *= shadowContributionParaboloid;
      } else if ((light.lightType == 0 || light.lightType == 2) && depthTextureIndex >= 0) { // Directional Light or Spot Light
        if (dotProduct > 0.0 && shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
          lighting *= shadowContribution;
        }
      }
    #endif

    shadingColor += vec4<f32>(lighting, 0.0);
  }

  *outColor = shadingColor;
}
