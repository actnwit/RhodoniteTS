fn pbrShader(
  positionInWorld: vec4<f32>, normalInWorld: vec3<f32>, geomNormalInWorld: vec3<f32>, TBN: mat3x3<f32>,
  baseColor: vec4<f32>, metallic: f32, perceptualRoughness_: f32,
  occlusionProps: OcclusionProps,
  emissiveProps: EmissiveProps,
  ior: f32,
  transmission: f32,
  specularProps: SpecularProps,
  volumeProps: VolumeProps,
  clearcoatProps_: ClearcoatProps,
  anisotropyProps_: AnisotropyProps,
  sheenProps_: SheenProps,
  iridescenceProps_: IridescenceProps,
  diffuseTransmissionProps: DiffuseTransmissionProps,
  dispersion: f32,
  outColor: ptr<function, vec4<f32>>
) {
  var shadingColor = vec4<f32>(0.0, 0.0, 0.0, baseColor.a);

  // F0, F90
  let outsideIor = 1.0;
  var dielectricF0 = vec3f(sqF32((ior - outsideIor) / (ior + outsideIor)));
  dielectricF0 = min(dielectricF0 * specularProps.specularColor, vec3f(1.0));
  let dielectricF90 = vec3f(specularProps.specularWeight);

  let lightNumber = u32(get_lightNumber(0u, 0u));
  let cameraSID = uniformDrawParameters.cameraSID;
  let materialSID = uniformDrawParameters.materialSid;

  let viewPosition = get_viewPosition(cameraSID);
  let viewDirection = normalize(viewPosition - positionInWorld.xyz);
  let NdotV = saturate(dot(normalInWorld, viewDirection));

  // Roughness
  #ifdef RN_IS_PIXEL_SHADER
    let alphaRoughness = perceptualRoughness_ * perceptualRoughness_;
    let alphaRoughness2 = alphaRoughness * alphaRoughness;
    // filter NDF for specular AA --- https://jcgt.org/published/0010/02/02/
    let filteredRoughness2 = IsotropicNDFFiltering(normalInWorld, alphaRoughness2);
    let perceptualRoughness = sqrt(sqrt(filteredRoughness2));
  #else
    let perceptualRoughness = perceptualRoughness_;
  #endif

  // Anisotropy
  var anisotropyProps: AnisotropyProps = anisotropyProps_;
  #ifdef RN_USE_ANISOTROPY
    anisotropyProps.anisotropicT = normalize(TBN * vec3f(anisotropyProps.direction, 0.0));
    anisotropyProps.anisotropicB = normalize(cross(geomNormalInWorld, anisotropyProps.anisotropicT));
    anisotropyProps.BdotV = dot(anisotropyProps.anisotropicB, viewDirection);
    anisotropyProps.TdotV = dot(anisotropyProps.anisotropicT, viewDirection);
  #else
    anisotropyProps.anisotropy = 0.0;
    anisotropyProps.anisotropicT = vec3f(0.0, 0.0, 0.0);
    anisotropyProps.anisotropicB = vec3f(0.0, 0.0, 0.0);
    anisotropyProps.BdotV = 0.0;
    anisotropyProps.TdotV = 0.0;
  #endif // RN_USE_ANISOTROPY

  // Clearcoat
  var clearcoatProps: ClearcoatProps = clearcoatProps_;
  #ifdef RN_USE_CLEARCOAT
    clearcoatProps.clearcoatNormal_inWorld = normalize(TBN * clearcoatProps.clearcoatNormal_inTangent);
    clearcoatProps.VdotNc = saturate(dot(viewDirection, clearcoatProps.clearcoatNormal_inWorld));
    clearcoatProps.clearcoatF0 = vec3f(pow((ior - 1.0) / (ior + 1.0), 2.0));
    clearcoatProps.clearcoatF90 = vec3f(1.0);
    clearcoatProps.clearcoatFresnel = fresnelSchlick(clearcoatProps.clearcoatF0, clearcoatProps.clearcoatF90, clearcoatProps.VdotNc);
  #else
    clearcoatProps.clearcoatNormal_inWorld = vec3f(0.0, 0.0, 0.0);
    clearcoatProps.VdotNc = 0.0;
    clearcoatProps.clearcoatF0 = vec3f(0.0);
    clearcoatProps.clearcoatF90 = vec3f(0.0);
    clearcoatProps.clearcoatFresnel = vec3f(0.0);
  #endif // RN_USE_CLEARCOAT

  // Sheen
  var sheenProps: SheenProps = sheenProps_;
  #ifdef RN_USE_SHEEN
    sheenProps.albedoSheenScalingNdotV = 1.0 - max3(sheenProps.sheenColor) * textureSample(sheenLutTexture, sheenLutSampler, vec2(NdotV, sheenProps.sheenRoughness)).r;
  #else
    sheenProps.albedoSheenScalingNdotV = 1.0;
  #endif // RN_USE_SHEEN

  var iridescenceProps: IridescenceProps = iridescenceProps_;
  #ifdef RN_USE_IRIDESCENCE
    iridescenceProps.fresnelDielectric = calcIridescence(1.0, iridescenceProps.iridescenceIor, NdotV, iridescenceProps.iridescenceThickness, dielectricF0);
    iridescenceProps.fresnelMetal = calcIridescence(1.0, iridescenceProps.iridescenceIor, NdotV, iridescenceProps.iridescenceThickness, baseColor.rgb);
  #else
    iridescenceProps.fresnelDielectric = vec3f(0.0);
    iridescenceProps.fresnelMetal = vec3f(0.0);
  #endif // RN_USE_IRIDESCENCE

  for (var i = 0u; i < lightNumber ; i++) {
    let light: Light = getLight(i, positionInWorld.xyz);
    var lighting = lightingWithPunctualLight(light, normalInWorld, viewDirection, NdotV, baseColor.rgb,
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

  // Image-based Lighting
  let ibl: vec3f = IBLContribution(materialSID, cameraSID,
    normalInWorld, NdotV, viewDirection, geomNormalInWorld, positionInWorld.xyz,
    baseColor.rgb, perceptualRoughness, metallic, specularProps.specularWeight, dielectricF0, ior,
    clearcoatProps,
    transmission,
    volumeProps,
    sheenProps,
    iridescenceProps,
    anisotropyProps,
    diffuseTransmissionProps,
    dispersion
  );

  #ifdef RN_USE_OCCLUSION_TEXTURE
    let occlusion = occlusionProps.occlusionTexture.r;
    let occlusionStrength = occlusionProps.occlusionStrength;
    // Occlusion to Indirect Lights
    let indirectLight = ibl * (1.0 + occlusionStrength * (occlusion - 1.0));
  #else
    let indirectLight = ibl;
  #endif

  shadingColor += vec4<f32>(indirectLight, 0.0);

  // Emissive
  let emissive = emissiveProps.emissive * emissiveProps.emissiveStrength;

  #ifdef RN_USE_CLEARCOAT
    let coated_emissive = emissive * mix(vec3f(1.0), vec3f(0.04 + (1.0 - 0.04) * pow(1.0 - NdotV, 5.0)), clearcoatProps.clearcoat * clearcoatProps.clearcoatFresnel);
    shadingColor += vec4<f32>(coated_emissive, 0.0);
  #else
    shadingColor += vec4<f32>(emissive, 0.0);
  #endif // RN_USE_CLEARCOAT


  *outColor = shadingColor;
}
