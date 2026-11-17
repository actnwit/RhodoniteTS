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

  let cameraSID = uniformDrawParameters.cameraSID;
  let materialSID = uniformDrawParameters.materialSid;
  let lightList = getLightList(positionInWorld.xyz, cameraSID);

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

  // Fragment-invariant terms of the light loop (see lightingWithPunctualLight).
  let lightAlphaRoughness = perceptualRoughness * perceptualRoughness;
  let lightAlphaRoughness2 = lightAlphaRoughness * lightAlphaRoughness;
  let sqrtNdotVTerm = sqrt(NdotV * NdotV * (1.0 - lightAlphaRoughness2) + lightAlphaRoughness2);
  let diffuseBrdf = baseColor.rgb * RECIPROCAL_PI;

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

  for (var n = 0u; n < lightList.count; n++) {
    let lightRef = getLightRef(lightList, n);
    let i = u32(lightRef.x); // light component SID
    let light: Light = getLight(i, positionInWorld.xyz);
    // A light at the border of the cluster can be outside its range. Its contribution is exactly
    // zero, so skip the BRDF and the shadow lookup without changing the result. With transmission
    // the WebGL2 path recomputes the attenuation from the refracted light position, so keep the
    // old behavior there to keep both backends identical.
    #ifndef RN_USE_TRANSMISSION
      if (all(light.attenuatedIntensity == vec3f(0.0))) {
        continue;
      }
    #endif
    // A light behind the surface does not contribute: the diffuse term is zero, and the specular
    // term is proportional to NdotL, which lightingWithPunctualLight clamps to Epsilon. Skip the
    // BRDF without changing the result. Transmission shaders can receive light from behind the
    // surface, and a clearcoat normal map can make such a light visible to the coat, so those
    // shaders keep the old behavior.
    #if !defined(RN_USE_TRANSMISSION) && !defined(RN_USE_DIFFUSE_TRANSMISSION) && !defined(RN_USE_CLEARCOAT)
      if (dot(normalInWorld, light.direction) <= 0.0) {
        continue;
      }
    #endif
    var lighting = lightingWithPunctualLight(light, normalInWorld, viewDirection, NdotV, baseColor.rgb,
                      lightAlphaRoughness, lightAlphaRoughness2, sqrtNdotVTerm, diffuseBrdf,
                      metallic, specularProps.specularWeight, dielectricF0, dielectricF90, ior,
                      transmission,
                      volumeProps,
                      clearcoatProps,
                      anisotropyProps,
                      sheenProps,
                      iridescenceProps,
                      diffuseTransmissionProps);

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
            let pointLightFarPlane = get_pointLightFarPlane(materialSID, 0);
            let pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0);
            lighting *= varianceShadowContributionParaboloid(positionInWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, u32(depthTextureIndex));
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
              lighting *= varianceShadowContribution(shadowCoord, normalizedDepth - bias, u32(depthTextureIndex));
            }
          }
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
