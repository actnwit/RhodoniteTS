/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/opticalDefinition.wgsl)
#pragma shaderity: require(../common/perturbedNormal.wgsl)
#pragma shaderity: require(../common/pbrDefinition.wgsl)

// #param makeOutputSrgb: bool; // initialValue=1

// Color
// #param baseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;
// #param baseColorTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param baseColorTextureRotation: f32; // initialValue=0
// #param baseColorTexcoordIndex: f32; // initialValue=0

// #param ior: f32; // initialValue=1.5

// #param metallicRoughnessFactor: vec2<f32>; // initialValue=(1,1)
@group(1) @binding(1) var metallicRoughnessTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(1) var metallicRoughnessSampler: sampler;
// #param metallicRoughnessTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param metallicRoughnessTextureRotation: f32; // initialValue=0
// #param metallicRoughnessTexcoordIndex: f32; // initialValue=0

#ifdef RN_USE_NORMAL_TEXTURE
  @group(1) @binding(2) var normalTexture: texture_2d<f32>; // initialValue=black
  @group(2) @binding(2) var normalSampler: sampler;
  // #param normalTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
  // #param normalTextureRotation: f32; // initialValue=(0)
  // #param normalTexcoordIndex: f32; // initialValue=(0)
  // #param normalScale: f32; // initialValue=(1)
#endif

@group(1) @binding(3) var occlusionTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(3) var occlusionSampler: sampler;
// #param occlusionTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param occlusionTextureRotation: f32; // initialValue=0
// #param occlusionTexcoordIndex: u32; // initialValue=0
// #param occlusionStrength: f32; // initialValue=1

// #param emissiveFactor: vec3<f32>; // initialValue=(0,0,0)
// #param emissiveTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param emissiveTextureRotation: f32; // initialValue=0
// #param emissiveTexcoordIndex: u32; // initialValue=0
@group(1) @binding(4) var emissiveTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(4) var emissiveSampler: sampler;
// #param emissiveStrength: f32; // initialValue=1

#ifdef RN_USE_CLEARCOAT
// #param clearCoatFactor: f32; // initialValue=0
// #param clearCoatRoughnessFactor: f32; // initialValue=0
// #param clearCoatTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param clearCoatTextureRotation: f32; // initialValue=0
// #param clearCoatRoughnessTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param clearCoatRoughnessTextureRotation: f32; // initialValue=0
// #param clearCoatNormalTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param clearCoatNormalTextureRotation: f32; // initialValue=0
// #param clearCoatTexcoordIndex: u32; // initialValue=(0)
// #param clearCoatRoughnessTexcoordIndex: u32; // initialValue=(0)
// #param clearCoatNormalTexcoordIndex: u32; // initialValue=(0)
#endif // RN_USE_CLEARCOAT


#ifdef RN_USE_TRANSMISSION
// #param transmissionFactor: f32; // initialValue=(0)
#endif // RN_USE_TRANSMISSION

#ifdef RN_USE_VOLUME
// #param thicknessFactor: f32; // initialValue=(0)
// #param attenuationDistance: f32; // initialValue=(0.000001)
// #param attenuationColor: vec3<f32>; // initialValue=(1,1,1)
#endif

#ifdef RN_USE_SHEEN
// #param sheenColorFactor: vec3<f32>; // initialValue=(0,0,0)
// #param sheenRoughnessFactor: f32; // initialValue=(0)
#endif

#ifdef RN_USE_SPECULAR
// #param specularFactor: f32; // initialValue=1.0
// #param specularColorFactor: vec3<f32>; // initialValue=(1,1,1)
#endif

#ifdef RN_USE_IRIDESCENCE
// #param iridescenceFactor: f32; // initialValue=0
// #param iridescenceIor: f32; // initialValue=1.3
// #param iridescenceThicknessMinimum: f32; // initialValue=100
// #param iridescenceThicknessMaximum: f32; // initialValue=400
#endif

#ifdef RN_USE_ANISOTROPY
// #param anisotropyStrength: f32; // initialValue=0
// #param anisotropyRotation: vec2<f32>; // initialValue=(1,0)
#endif

// #param alphaCutoff: f32; // initialValue=0.01

@group(1) @binding(16) var diffuseEnvTexture: texture_cube<f32>; // initialValue=black
@group(2) @binding(16) var diffuseEnvSampler: sampler;
@group(1) @binding(17) var specularEnvTexture: texture_cube<f32>; // initialValue=black
@group(2) @binding(17) var specularEnvSampler: sampler;


// #param iblParameter: vec4<f32>; // initialValue=(1,1,1,1), isInternalSetting=true
// #param hdriFormat: vec2<i32>; // initialValue=(0,0), isInternalSetting=true
// #param inverseEnvironment: bool; // initialValue=true
#pragma shaderity: require(../common/iblDefinition.wgsl)

@fragment
fn main(
  input: VertexOutput,
  @builtin(front_facing) isFront: bool,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)
  let viewPosition = get_viewPosition(cameraSID, 0);
  let viewVector = viewPosition - input.position_inWorld.xyz;
  let viewDirection = normalize(viewVector);

// BaseColor
  var baseColor = vec4<f32>(1, 1, 1, 1);
  var baseColorFactor = get_baseColorFactor(materialSID, 0u);

#ifdef RN_USE_COLOR_0
  baseColor = input.color_0;
#endif

  baseColor *= baseColorFactor;

#ifdef RN_USE_TEXCOORD_0
  let baseColorTextureTransform: vec4f = get_baseColorTextureTransform(materialSID, 0);
  let baseColorTextureRotation: f32 = get_baseColorTextureRotation(materialSID, 0);
  let baseColorTexcoordIndex: u32 = u32(get_baseColorTexcoordIndex(materialSID, 0));
  let baseColorTexcoord = getTexcoord(baseColorTexcoordIndex, input);
  let baseColorTexUv = uvTransform(baseColorTextureTransform.xy, baseColorTextureTransform.zw, baseColorTextureRotation, baseColorTexcoord);
  let textureColor = textureSample(baseColorTexture, baseColorSampler, baseColorTexUv);
  baseColor *= vec4(srgbToLinear(textureColor.rgb), textureColor.a);
#else
  let baseColorTexUv = vec2f(0.0, 0.0);
#endif

#pragma shaderity: require(../common/alphaMask.wgsl)

// Normal
  var normal_inWorld = normalize(input.normal_inWorld);
  let geomNormal_inWorld = normal_inWorld;
  let normalTextureTransform: vec4f = get_normalTextureTransform(materialSID, 0);
  let normalTextureRotation: f32 = get_normalTextureRotation(materialSID, 0);
  let normalTexcoordIndex: u32 = u32(get_normalTexcoordIndex(materialSID, 0));
  let normalTexcoord: vec2f = getTexcoord(normalTexcoordIndex, input);
  let normalTexUv: vec2f = uvTransform(normalTextureTransform.xy, normalTextureTransform.zw, normalTextureRotation, normalTexcoord);
  let TBN: mat3x3<f32> = getTBN(normal_inWorld, input, viewVector, normalTexUv, isFront);
  #ifdef RN_USE_NORMAL_TEXTURE
    let normalTexValue: vec3f = textureSample(normalTexture, normalSampler, normalTexUv).xyz;
    if(normalTexValue.b >= 128.0 / 255.0) {
      // normal texture is existence
      let normalTex = normalTexValue * 2.0 - 1.0;
      let normalScale = get_normalScale(materialSID, 0);
      let scaledNormal = normalize(normalTex * vec3(normalScale, normalScale, 1.0));
      normal_inWorld = normalize(TBN * scaledNormal);
    }
  #endif


  // Metallic & Roughness
  let metallicRoughnessFactor: vec2f = get_metallicRoughnessFactor(materialSID, 0);
  var metallic = metallicRoughnessFactor.x;
  let metallicRoughnessTextureTransform = get_metallicRoughnessTextureTransform(materialSID, 0);
  let metallicRoughnessTextureRotation = get_metallicRoughnessTextureRotation(materialSID, 0);
  let metallicRoughnessTexcoordIndex = u32(get_metallicRoughnessTexcoordIndex(materialSID, 0));
  let metallicRoughnessTexcoord = getTexcoord(metallicRoughnessTexcoordIndex, input);
  let metallicRoughnessTexUv = uvTransform(metallicRoughnessTextureTransform.xy, metallicRoughnessTextureTransform.zw, metallicRoughnessTextureRotation, metallicRoughnessTexcoord);
  let ormTexel = textureSample(metallicRoughnessTexture, metallicRoughnessSampler, metallicRoughnessTexUv);
  var perceptualRoughness = ormTexel.g * metallicRoughnessFactor.y;
  metallic = ormTexel.b * metallic;
  metallic = clamp(metallic, 0.0, 1.0);
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
  let alphaRoughness = perceptualRoughness * perceptualRoughness;
    // filter NDF for specular AA --- https://jcgt.org/published/0010/02/02/
  let alphaRoughness2 = alphaRoughness * alphaRoughness;
  let filteredRoughness2 = IsotropicNDFFiltering(normal_inWorld, alphaRoughness2);
  perceptualRoughness = sqrt(sqrt(filteredRoughness2));

  // Albedo
  let black = vec3f(0.0);
  let albedo = mix(baseColor.rgb, black, metallic);

  // NdotV
  let NdotV = clamp(dot(normal_inWorld, viewDirection), Epsilon, 1.0);

#ifdef RN_USE_ANISOTROPY
  // Anisotropy
  var anisotropy: f32 = get_anisotropyStrength(materialSID, 0);
  let anisotropyRotation: vec2f = get_anisotropyRotation(materialSID, 0);
  var direction: vec2f = anisotropyRotation;
  let anisotropyTex: vec3f = textureSample(anisotropyTexture, anisotropySampler, baseColorTexUv).rgb;
  direction = anisotropyTex.rg * 2.0 - vec2f(1.0);
  direction = mat2x2<f32>(anisotropyRotation.x, anisotropyRotation.y, -anisotropyRotation.y, anisotropyRotation.x) * normalize(direction);
  anisotropy *= anisotropyTex.b;
  let anisotropicT: vec3f = normalize(TBN * vec3f(direction, 0.0));
  let anisotropicB: vec3f = normalize(cross(geomNormal_inWorld, anisotropicT));
  let BdotV: f32 = dot(anisotropicB, viewDirection);
  let TdotV: f32 = dot(anisotropicT, viewDirection);
#else
  let anisotropy = 0.0;
  let anisotropicT = vec3f(0.0, 0.0, 0.0);
  let anisotropicB = vec3f(0.0, 0.0, 0.0);
  let BdotV = 0.0;
  let TdotV = 0.0;
#endif

  // Clearcoat
#ifdef RN_USE_CLEARCOAT
  let clearcoatFactor = get_clearCoatFactor(materialSID, 0);
  let clearcoatTextureTransform = get_clearCoatTextureTransform(materialSID, 0);
  let clearcoatTextureRotation = get_clearCoatTextureRotation(materialSID, 0);
  let clearCoatTexcoordIndex = get_clearCoatTexcoordIndex(materialSID, 0);
  let clearCoatTexcoord = getTexcoord(clearCoatTexcoordIndex, input);
  let clearcoatTexUv = uvTransform(clearcoatTextureTransform.xy, clearcoatTextureTransform.zw, clearcoatTextureRotation, clearCoatTexcoord);
  let clearcoatTexture = textureSample(clearCoatTexture, clearCoatSampler, clearcoatTexUv).r;
  let clearcoat = clearcoatFactor * clearcoatTexture;
#else
  let clearcoat = 0.0;
#endif // RN_USE_CLEARCOAT

  // Transmission
#ifdef RN_USE_TRANSMISSION
  let transmissionFactor = get_transmissionFactor(materialSID, 0);
  let transmissionTexture = textureSample(transmissionTexture, transmissionSampler, baseColorTexUv).r;
  let transmission = transmissionFactor * transmissionTexture;
    // alpha *= transmission;
#else
  let transmission = 0.0;
#endif // RN_USE_TRANSMISSION

#ifdef RN_USE_SPECULAR
  let specularTexture: f32 = textureSample(specularTexture, specularSampler, baseColorTexUv).a;
  let specular: f32 = get_specularFactor(materialSID, 0) * specularTexture;
  let specularColorTexture: vec3f = srgbToLinear(textureSample(specularColorTexture, specularColorSampler, baseColorTexUv).rgb);
  let specularColor: vec3f = get_specularColorFactor(materialSID, 0) * specularColorTexture;
#else
  let specular = 1.0;
  let specularColor = vec3f(1.0, 1.0, 1.0);
#endif // RN_USE_SPECULAR

  // F0, F90
  let ior = get_ior(materialSID, 0);
  let outsideIor = 1.0;
  let dielectricSpecularF0 = min(
    ((ior - outsideIor) / (ior + outsideIor)) * ((ior - outsideIor) / (ior + outsideIor)) * specularColor,
    vec3f(1.0)
    ) * specular;
  let dielectricSpecularF90 = vec3f(specular);
  let F0 = mix(dielectricSpecularF0, baseColor.rgb, metallic);
  let F90 = mix(dielectricSpecularF90, vec3f(1.0), metallic);

// Iridescence
#ifdef RN_USE_IRIDESCENCE
  let iridescenceFactor: f32 = get_iridescenceFactor(materialSID, 0);
  let iridescenceTexture: f32 = textureSample(iridescenceTexture, iridescenceSampler, baseColorTexUv).r;
  let iridescence: f32 = iridescenceFactor * iridescenceTexture;
  let iridescenceIor: f32 = get_iridescenceIor(materialSID, 0);
  let thicknessRatio: f32 = textureSample(iridescenceThicknessTexture, iridescenceThicknessSampler, baseColorTexUv).r;
  let iridescenceThicknessMinimum: f32 = get_iridescenceThicknessMinimum(materialSID, 0);
  let iridescenceThicknessMaximum: f32 = get_iridescenceThicknessMaximum(materialSID, 0);
  let iridescenceThickness: f32 = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);
  let iridescenceFresnel: vec3f = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, F0);
  let iridescenceF0: vec3f = Schlick_to_F0(iridescenceFresnel, NdotV);
#else
  let iridescence = 0.0;
  let iridescenceFresnel = vec3f(0.0);
  let iridescenceF0: vec3f = F0;
#endif // RN_USE_IRIDESCENCE

// Clearcoat
#ifdef RN_USE_CLEARCOAT
  let clearcoatRoughnessFactor = get_clearCoatRoughnessFactor(materialSID, 0);
  let clearCoatRoughnessTexcoordIndex = get_clearCoatRoughnessTexcoordIndex(materialSID, 0);
  let clearCoatRoughnessTexcoord = getTexcoord(clearCoatRoughnessTexcoordIndex, input);
  let clearcoatRoughnessTextureTransform = get_clearCoatRoughnessTextureTransform(materialSID, 0);
  let clearcoatRoughnessTextureRotation = get_clearCoatRoughnessTextureRotation(materialSID, 0);
  let clearcoatRoughnessTexUv = uvTransform(clearcoatRoughnessTextureTransform.xy, clearcoatRoughnessTextureTransform.zw, clearcoatRoughnessTextureRotation, clearCoatRoughnessTexcoord);
  let textureRoughnessTexture = textureSample(clearCoatRoughnessTexture, clearCoatRoughnessSampler, clearcoatRoughnessTexUv).g;
  let clearcoatRoughness = clearcoatRoughnessFactor * textureRoughnessTexture;

  let clearCoatNormalTexcoordIndex = get_clearCoatNormalTexcoordIndex(materialSID, 0);
  let clearCoatNormalTexcoord = getTexcoord(clearCoatNormalTexcoordIndex, input);
  let clearcoatNormalTextureTransform = get_clearCoatNormalTextureTransform(materialSID, 0);
  let clearcoatNormalTextureRotation = get_clearCoatNormalTextureRotation(materialSID, 0);
  let clearcoatNormalTexUv = uvTransform(clearcoatNormalTextureTransform.xy, clearcoatNormalTextureTransform.zw, clearcoatNormalTextureRotation, clearCoatNormalTexcoord);
  let textureNormal_tangent = textureSample(clearCoatNormalTexture, clearCoatNormalSampler, clearcoatNormalTexUv).xyz * vec3(2.0) - vec3(1.0);
  let clearcoatNormal_inWorld = normalize(TBN * textureNormal_tangent);
  let VdotNc = saturateEpsilonToOne(dot(viewDirection, clearcoatNormal_inWorld));
#else
  let clearcoatRoughness = 0.0;
  let clearcoatNormal_inWorld = vec3f(0.0);
  let VdotNc = 0.0;
#endif // RN_USE_CLEARCOAT


#ifdef RN_USE_VOLUME
  // Volume
  let thicknessFactor: f32 = get_thicknessFactor(materialSID, 0);
  let thicknessTexture: f32 = textureSample(thicknessTexture, thicknessSampler, baseColorTexUv).g;
  let attenuationDistance: f32 = get_attenuationDistance(materialSID, 0);
  let attenuationColor: vec3f = get_attenuationColor(materialSID, 0);
  let thickness: f32 = thicknessFactor * thicknessTexture;
#else
  let thickness = 0.0;
  let attenuationColor = vec3f(0.0);
  let attenuationDistance = 0.000001;
#endif // RN_USE_VOLUME

#ifdef RN_USE_SHEEN
  // Sheen
  let sheenColorFactor: vec3f = get_sheenColorFactor(materialSID, 0);
  let sheenColorTexture: vec3f = textureSample(sheenColorTexture, sheenColorSampler, baseColorTexUv).rgb;
  let sheenRoughnessFactor: f32 = get_sheenRoughnessFactor(materialSID, 0);
  let sheenRoughnessTexture: f32 = textureSample(sheenRoughnessTexture, sheenRoughnessSampler, baseColorTexUv).a;
  let sheenColor: vec3f = sheenColorFactor * sheenColorTexture;
  let sheenRoughness: f32 = clamp(sheenRoughnessFactor * sheenRoughnessTexture, 0.000001, 1.0);
  let albedoSheenScalingNdotV: f32 = 1.0 - max3(sheenColor) * textureSample(sheenLutTexture, sheenLutSampler, vec2(NdotV, sheenRoughness)).r;
#else
  let sheenColor = vec3f(0.0);
  let sheenRoughness = 0.000001;
  let albedoSheenScalingNdotV = 1.0;
#endif // RN_USE_SHEEN

  var resultColor = vec3<f32>(0, 0, 0);
  var resultAlpha = 0.0;

  // Lighting
  let lightNumber = u32(get_lightNumber(0u, 0u));
  for (var i = 0u; i < lightNumber; i++) {
    let light: Light = getLight(i, input.position_inWorld);
    resultColor += lightingWithPunctualLight(light, normal_inWorld, viewDirection,
                            NdotV, albedo, perceptualRoughness, F0, F90,
                            transmission, ior,
                            clearcoat, clearcoatRoughness, clearcoatNormal_inWorld, VdotNc,
                            attenuationColor, attenuationDistance,
                            anisotropy, anisotropicT, anisotropicB, BdotV, TdotV,
                            sheenColor, sheenRoughness, albedoSheenScalingNdotV,
                            iridescence, iridescenceFresnel, specular
                            );
  }

  let ibl: vec3f = IBLContribution(materialSID, cameraSID, normal_inWorld, NdotV, viewDirection,
    albedo, F0, perceptualRoughness,
    clearcoatRoughness, clearcoatNormal_inWorld, clearcoat, VdotNc, geomNormal_inWorld,
    transmission, input.position_inWorld.xyz, u32(input.instanceInfo), thickness, ior,
    sheenColor, sheenRoughness, albedoSheenScalingNdotV,
    iridescenceFresnel, iridescenceF0, iridescence,
    anisotropy, anisotropicB, specular
  );

  let occlusionTexcoordIndex = get_occlusionTexcoordIndex(materialSID, 0);
  let occlusionTexcoord = getTexcoord(occlusionTexcoordIndex, input);
  let occlusionTextureTransform = get_occlusionTextureTransform(materialSID, 0);
  let occlusionTextureRotation = get_occlusionTextureRotation(materialSID, 0);
  let occlusionTexUv = uvTransform(occlusionTextureTransform.xy, occlusionTextureTransform.zw, occlusionTextureRotation, occlusionTexcoord);
  let occlusion = textureSample(occlusionTexture, occlusionSampler, occlusionTexUv).r;
  let occlusionStrength = get_occlusionStrength(materialSID, 0);

  // Occlution to Indirect Lights
  resultColor += mix(ibl, ibl * occlusion, occlusionStrength);

  // Emissive
  let emissiveFactor = get_emissiveFactor(materialSID, 0);
  let emissiveTexcoordIndex = get_emissiveTexcoordIndex(materialSID, 0);
  let emissiveTexcoord = getTexcoord(emissiveTexcoordIndex, input);
  let emissiveTextureTransform = get_emissiveTextureTransform(materialSID, 0);
  let emissiveTextureRotation = get_emissiveTextureRotation(materialSID, 0);
  let emissiveTexUv = uvTransform(emissiveTextureTransform.xy, emissiveTextureTransform.zw, emissiveTextureRotation, emissiveTexcoord);
  let emissiveStrength = get_emissiveStrength(materialSID, 0);
  let emissive = emissiveFactor * srgbToLinear(textureSample(emissiveTexture, emissiveSampler, emissiveTexUv).xyz) * emissiveStrength;

#ifdef RN_USE_CLEARCOAT
  let coated_emissive = emissive * mix(vec3f(1.0), vec3f(0.04 + (1.0 - 0.04) * pow(1.0 - NdotV, 5.0)), clearcoat);
  resultColor += coated_emissive;
#else
  resultColor += emissive;
#endif // RN_USE_CLEARCOAT

#ifdef RN_IS_ALPHA_MODE_BLEND
  resultAlpha = baseColor.a;
#else
  resultAlpha = 1.0;
#endif

#pragma shaderity: require(../common/outputSrgb.wgsl)
  return vec4f(resultColor * resultAlpha, resultAlpha);
}
