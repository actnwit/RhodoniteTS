/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */

// #param wireframe: vec3<f32>; // initialValue=(0,0,1)

// #param makeOutputSrgb: bool; // initialValue=1

// Color
// #param baseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(1) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(1) var baseColorSampler: sampler;
// #param baseColorTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param baseColorTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param baseColorTextureTransformRotation: f32; // initialValue=0
// #param baseColorTexcoordIndex: f32; // initialValue=0

// #param ior: f32; // initialValue=1.5

// #param metallicFactor: f32; // initialValue=1
// #param roughnessFactor: f32; // initialValue=1
@group(1) @binding(2) var metallicRoughnessTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(2) var metallicRoughnessSampler: sampler;
// #param metallicRoughnessTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param metallicRoughnessTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param metallicRoughnessTextureTransformRotation: f32; // initialValue=0
// #param metallicRoughnessTexcoordIndex: f32; // initialValue=0

#ifdef RN_USE_NORMAL_TEXTURE
  @group(1) @binding(3) var normalTexture: texture_2d<f32>; // initialValue=black
  @group(2) @binding(3) var normalSampler: sampler;
  // #param normalScale: f32; // initialValue=(1)
#endif
  // #param normalTextureTransformScale: vec2<f32>; // initialValue=(1,1)
  // #param normalTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
  // #param normalTextureTransformRotation: f32; // initialValue=0
  // #param normalTexcoordIndex: f32; // initialValue=(0)

#ifdef RN_USE_OCCLUSION_TEXTURE
  @group(1) @binding(4) var occlusionTexture: texture_2d<f32>; // initialValue=white
  @group(2) @binding(4) var occlusionSampler: sampler;
  // #param occlusionTextureTransformScale: vec2<f32>; // initialValue=(1,1)
  // #param occlusionTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
  // #param occlusionTextureTransformRotation: f32; // initialValue=0
  // #param occlusionTexcoordIndex: u32; // initialValue=0
  // #param occlusionStrength: f32; // initialValue=1
#endif

#ifdef RN_USE_EMISSIVE_TEXTURE
  // #param emissiveTextureTransformScale: vec2<f32>; // initialValue=(1,1)
  // #param emissiveTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
  // #param emissiveTextureTransformRotation: f32; // initialValue=0
  // #param emissiveTexcoordIndex: u32; // initialValue=0
  @group(1) @binding(5) var emissiveTexture: texture_2d<f32>; // initialValue=white
  @group(2) @binding(5) var emissiveSampler: sampler;
#endif
  // #param emissiveFactor: vec3<f32>; // initialValue=(0,0,0)
#ifdef RN_USE_EMISSIVE_STRENGTH
  // #param emissiveStrength: f32; // initialValue=1
#endif

#ifdef RN_USE_CLEARCOAT
// #param clearcoatFactor: f32; // initialValue=0
// #param clearcoatRoughnessFactor: f32; // initialValue=0
// #param clearcoatTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param clearcoatTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param clearcoatTextureTransformRotation: f32; // initialValue=0
// #param clearcoatRoughnessTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param clearcoatRoughnessTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param clearcoatRoughnessTextureTransformRotation: f32; // initialValue=0
// #param clearcoatNormalTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param clearcoatNormalTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param clearcoatNormalTextureTransformRotation: f32; // initialValue=0
// #param clearcoatTexcoordIndex: u32; // initialValue=(0)
// #param clearcoatRoughnessTexcoordIndex: u32; // initialValue=(0)
// #param clearcoatNormalTexcoordIndex: u32; // initialValue=(0)
#endif // RN_USE_CLEARCOAT


#ifdef RN_USE_TRANSMISSION
// #param transmissionFactor: f32; // initialValue=(0)
// #param transmissionTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param transmissionTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param transmissionTextureTransformRotation: f32; // initialValue=0
// #param transmissionTexcoordIndex: u32; // initialValue=0
#endif // RN_USE_TRANSMISSION

#if defined(RN_USE_VOLUME) || defined(RN_USE_TRANSMISSION)
// #param thicknessFactor: f32; // initialValue=(0)
// #param attenuationDistance: f32; // initialValue=(0.000001)
// #param attenuationColor: vec3<f32>; // initialValue=(1,1,1)
// #param thicknessTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param thicknessTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param thicknessTextureTransformRotation: f32; // initialValue=0
// #param thicknessTexcoordIndex: u32; // initialValue=0
#endif

#ifdef RN_USE_SHEEN
// #param sheenColorFactor: vec3<f32>; // initialValue=(0,0,0)
// #param sheenRoughnessFactor: f32; // initialValue=(0)
// #param sheenColorTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param sheenColorTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param sheenColorTextureTransformRotation: f32; // initialValue=0
// #param sheenColorTexcoordIndex: u32; // initialValue=0
// #param sheenRoughnessTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param sheenRoughnessTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param sheenRoughnessTextureTransformRotation: f32; // initialValue=0
// #param sheenRoughnessTexcoordIndex: u32; // initialValue=0
#endif

#ifdef RN_USE_SPECULAR
// #param specularFactor: f32; // initialValue=1.0
// #param specularColorFactor: vec3<f32>; // initialValue=(1,1,1)
// #param specularTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param specularTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param specularTextureTransformRotation: f32; // initialValue=0
// #param specularTexcoordIndex: u32; // initialValue=0
// #param specularColorTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param specularColorTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param specularColorTextureTransformRotation: f32; // initialValue=0
// #param specularColorTexcoordIndex: u32; // initialValue=0
#endif

#ifdef RN_USE_IRIDESCENCE
// #param iridescenceFactor: f32; // initialValue=0
// #param iridescenceIor: f32; // initialValue=1.3
// #param iridescenceThicknessMinimum: f32; // initialValue=100
// #param iridescenceThicknessMaximum: f32; // initialValue=400
// #param iridescenceTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param iridescenceTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param iridescenceTextureTransformRotation: f32; // initialValue=0
// #param iridescenceTexcoordIndex: u32; // initialValue=0
// #param iridescenceThicknessTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param iridescenceThicknessTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param iridescenceThicknessTextureTransformRotation: f32; // initialValue=0
// #param iridescenceThicknessTexcoordIndex: u32; // initialValue=0
#endif

#ifdef RN_USE_ANISOTROPY
// #param anisotropyStrength: f32; // initialValue=0
// #param anisotropyRotation: vec2<f32>; // initialValue=(1,0)
// #param anisotropyTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param anisotropyTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param anisotropyTextureTransformRotation: f32; // initialValue=0
// #param anisotropyTexcoordIndex: u32; // initialValue=0
#endif

#ifdef RN_USE_DIFFUSE_TRANSMISSION
// #param diffuseTransmissionFactor: f32; // initialValue=0
// #param diffuseTransmissionColorFactor: vec3<f32>; // initialValue=(1,1,1)
// #param diffuseTransmissionTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param diffuseTransmissionTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param diffuseTransmissionTextureTransformRotation: f32; // initialValue=0
// #param diffuseTransmissionTexcoordIndex: u32; // initialValue=0
// #param diffuseTransmissionColorTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param diffuseTransmissionColorTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param diffuseTransmissionColorTextureTransformRotation: f32; // initialValue=0
// #param diffuseTransmissionColorTexcoordIndex: u32; // initialValue=0
#endif

#ifdef RN_USE_DISPERSION
// #param dispersion: f32; // initialValue=0
#endif

// #param alphaCutoff: f32; // initialValue=0.01

@group(1) @binding(17) var diffuseEnvTexture: texture_cube<f32>; // initialValue=black, isInternalSetting=true
@group(2) @binding(17) var diffuseEnvSampler: sampler;
@group(1) @binding(18) var specularEnvTexture: texture_cube<f32>; // initialValue=black, isInternalSetting=true
@group(2) @binding(18) var specularEnvSampler: sampler;


// #param iblParameter: vec4<f32>; // initialValue=(1,1,1,1), isInternalSetting=true
// #param hdriFormat: vec2<i32>; // initialValue=(0,0), isInternalSetting=true
// #param inverseEnvironment: bool; // initialValue=false
#ifdef RN_USE_SHADOW_MAPPING
  // #param pointLightFarPlane: f32; // initialValue=1000.0
  // #param pointLightShadowMapUvScale: f32; // initialValue=0.93
#endif

/* shaderity: @{shadowDefinition} */
/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */

#pragma shaderity: require(../nodes/PbrShader.wgsl)

@fragment
fn main(
  input: VertexOutput,
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  let viewPosition = get_viewPosition(cameraSID);
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
  let baseColorTextureTransformScale: vec2f = get_baseColorTextureTransformScale(materialSID, 0);
  let baseColorTextureTransformOffset: vec2f = get_baseColorTextureTransformOffset(materialSID, 0);
  let baseColorTextureTransformRotation: f32 = get_baseColorTextureTransformRotation(materialSID, 0);
  let baseColorTexcoordIndex: u32 = u32(get_baseColorTexcoordIndex(materialSID, 0));
  let baseColorTexcoord = getTexcoord(baseColorTexcoordIndex, input);
  let baseColorTexUv = uvTransform(baseColorTextureTransformScale, baseColorTextureTransformOffset, baseColorTextureTransformRotation, baseColorTexcoord);
  let textureColor = textureSample(baseColorTexture, baseColorSampler, baseColorTexUv);
  baseColor *= vec4(srgbToLinear(textureColor.rgb), textureColor.a);
#else
  let baseColorTexUv = vec2f(0.0, 0.0);
#endif

  var alpha = baseColor.a;
/* shaderity: @{alphaProcess} */
  baseColor.a = alpha;

// Normal
  var normal_inWorld = normalize(input.normal_inWorld);
  let geomNormal_inWorld = normal_inWorld;
  let normalTextureTransformScale: vec2f = get_normalTextureTransformScale(materialSID, 0);
  let normalTextureTransformOffset: vec2f = get_normalTextureTransformOffset(materialSID, 0);
  let normalTextureTransformRotation: f32 = get_normalTextureTransformRotation(materialSID, 0);
  let normalTexcoordIndex: u32 = u32(get_normalTexcoordIndex(materialSID, 0));
  let normalTexcoord: vec2f = getTexcoord(normalTexcoordIndex, input);
  let normalTexUv: vec2f = uvTransform(normalTextureTransformScale, normalTextureTransformOffset, normalTextureTransformRotation, normalTexcoord);
  let TBN: mat3x3<f32> = getTBN(normal_inWorld, input.tangent_inWorld, input.bitangent_inWorld, viewVector, normalTexUv);
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

#ifdef RN_IS_LIGHTING
  // Metallic & Roughness
  let metallicRoughnessTextureTransformScale: vec2f = get_metallicRoughnessTextureTransformScale(materialSID, 0);
  let metallicRoughnessTextureTransformOffset: vec2f = get_metallicRoughnessTextureTransformOffset(materialSID, 0);
  let metallicRoughnessTextureTransformRotation: f32 = get_metallicRoughnessTextureTransformRotation(materialSID, 0);
  let metallicRoughnessTexcoordIndex = u32(get_metallicRoughnessTexcoordIndex(materialSID, 0));
  let metallicRoughnessTexcoord = getTexcoord(metallicRoughnessTexcoordIndex, input);
  let metallicRoughnessTexUv = uvTransform(metallicRoughnessTextureTransformScale, metallicRoughnessTextureTransformOffset, metallicRoughnessTextureTransformRotation, metallicRoughnessTexcoord);
  let ormTexel = textureSample(metallicRoughnessTexture, metallicRoughnessSampler, metallicRoughnessTexUv);
  var perceptualRoughness = ormTexel.g * get_roughnessFactor(materialSID, 0);
  var metallic = ormTexel.b * get_metallicFactor(materialSID, 0);
  metallic = clamp(metallic, 0.0, 1.0);
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
  let alphaRoughness = perceptualRoughness * perceptualRoughness;
    // filter NDF for specular AA --- https://jcgt.org/published/0010/02/02/
  let alphaRoughness2 = alphaRoughness * alphaRoughness;
  let filteredRoughness2 = IsotropicNDFFiltering(normal_inWorld, alphaRoughness2);
  perceptualRoughness = sqrt(sqrt(filteredRoughness2));

  // NdotV
  let NdotV = saturate(dot(normal_inWorld, viewDirection));

  var anisotropyProps: AnisotropyProps;
#ifdef RN_USE_ANISOTROPY
  // Anisotropy
  var anisotropy: f32 = get_anisotropyStrength(materialSID, 0);
  let anisotropyRotation: vec2f = get_anisotropyRotation(materialSID, 0);
  var direction: vec2f = anisotropyRotation;
  let anisotropyTexcoordIndex = u32(get_anisotropyTexcoordIndex(materialSID, 0));
  let anisotropyTexcoord = getTexcoord(anisotropyTexcoordIndex, input);
  let anisotropyTextureTransformScale: vec2f = get_anisotropyTextureTransformScale(materialSID, 0);
  let anisotropyTextureTransformOffset: vec2f = get_anisotropyTextureTransformOffset(materialSID, 0);
  let anisotropyTextureTransformRotation: f32 = get_anisotropyTextureTransformRotation(materialSID, 0);
  let anisotropyTexUv = uvTransform(anisotropyTextureTransformScale, anisotropyTextureTransformOffset, anisotropyTextureTransformRotation, anisotropyTexcoord);
  let anisotropyTex = textureSample(anisotropyTexture, anisotropySampler, anisotropyTexUv);
  direction = anisotropyTex.rg * 2.0 - vec2f(1.0);
  direction = mat2x2<f32>(anisotropyRotation.x, anisotropyRotation.y, -anisotropyRotation.y, anisotropyRotation.x) * normalize(direction);
  anisotropy *= anisotropyTex.b;
  let anisotropicT: vec3f = normalize(TBN * vec3f(direction, 0.0));
  let anisotropicB: vec3f = normalize(cross(geomNormal_inWorld, anisotropicT));
  let BdotV: f32 = dot(anisotropicB, viewDirection);
  let TdotV: f32 = dot(anisotropicT, viewDirection);
  anisotropyProps.anisotropy = anisotropy;
  anisotropyProps.anisotropicT = anisotropicT;
  anisotropyProps.anisotropicB = anisotropicB;
  anisotropyProps.BdotV = BdotV;
  anisotropyProps.TdotV = TdotV;
#else
  anisotropyProps.anisotropy = 0.0;
  anisotropyProps.anisotropicT = vec3f(0.0, 0.0, 0.0);
  anisotropyProps.anisotropicB = vec3f(0.0, 0.0, 0.0);
  anisotropyProps.BdotV = 0.0;
  anisotropyProps.TdotV = 0.0;
#endif

let ior = get_ior(materialSID, 0);

  // Transmission
#ifdef RN_USE_TRANSMISSION
  let transmissionFactor = get_transmissionFactor(materialSID, 0);
  let transmissionTextureTransformScale: vec2f = get_transmissionTextureTransformScale(materialSID, 0);
  let transmissionTextureTransformOffset: vec2f = get_transmissionTextureTransformOffset(materialSID, 0);
  let transmissionTextureTransformRotation: f32 = get_transmissionTextureTransformRotation(materialSID, 0);
  let transmissionTexcoordIndex = get_transmissionTexcoordIndex(materialSID, 0);
  let transmissionTexcoord = getTexcoord(transmissionTexcoordIndex, input);
  let transmissionTexUv = uvTransform(transmissionTextureTransformScale, transmissionTextureTransformOffset, transmissionTextureTransformRotation, transmissionTexcoord);
  let transmissionTexture = textureSample(transmissionTexture, transmissionSampler, transmissionTexUv).r;
  let transmission = transmissionFactor * transmissionTexture;
    // alpha *= transmission;
#else
  let transmission = 0.0;
#endif // RN_USE_TRANSMISSION

var specularProps: SpecularProps;
#ifdef RN_USE_SPECULAR
  let specularTextureTransformScale: vec2f = get_specularTextureTransformScale(materialSID, 0);
  let specularTextureTransformOffset: vec2f = get_specularTextureTransformOffset(materialSID, 0);
  let specularTextureTransformRotation: f32 = get_specularTextureTransformRotation(materialSID, 0);
  let specularTexcoordIndex = get_specularTexcoordIndex(materialSID, 0);
  let specularTexcoord = getTexcoord(specularTexcoordIndex, input);
  let specularTexUv = uvTransform(specularTextureTransformScale, specularTextureTransformOffset, specularTextureTransformRotation, specularTexcoord);
  let specularTexture: f32 = textureSample(specularTexture, specularSampler, specularTexUv).a;
  let specularWeight: f32 = get_specularFactor(materialSID, 0) * specularTexture;
  let specularColorTextureTransformScale: vec2f = get_specularColorTextureTransformScale(materialSID, 0);
  let specularColorTextureTransformOffset: vec2f = get_specularColorTextureTransformOffset(materialSID, 0);
  let specularColorTextureTransformRotation: f32 = get_specularColorTextureTransformRotation(materialSID, 0);
  let specularColorTexcoordIndex = get_specularColorTexcoordIndex(materialSID, 0);
  let specularColorTexcoord = getTexcoord(specularColorTexcoordIndex, input);
  let specularColorTexUv = uvTransform(specularColorTextureTransformScale, specularColorTextureTransformOffset, specularColorTextureTransformRotation, specularColorTexcoord);
  let specularColorTexture: vec3f = srgbToLinear(textureSample(specularColorTexture, specularColorSampler, specularColorTexUv).rgb);
  let specularColor: vec3f = get_specularColorFactor(materialSID, 0) * specularColorTexture;
  specularProps.specularWeight = specularWeight;
  specularProps.specularColor = specularColor;
#else
  specularProps.specularWeight = 1.0;
  specularProps.specularColor = vec3f(1.0, 1.0, 1.0);
#endif // RN_USE_SPECULAR

  // F0, F90
  let outsideIor = 1.0;
  var dielectricF0 = vec3f(sqF32((ior - outsideIor) / (ior + outsideIor)));
  dielectricF0 = min(dielectricF0 * specularProps.specularColor, vec3f(1.0));
  let dielectricF90 = vec3f(specularProps.specularWeight);

// Iridescence
  var iridescenceProps: IridescenceProps;
#ifdef RN_USE_IRIDESCENCE
  let iridescenceFactor: f32 = get_iridescenceFactor(materialSID, 0);
  let iridescenceTextureTransformScale: vec2f = get_iridescenceTextureTransformScale(materialSID, 0);
  let iridescenceTextureTransformOffset: vec2f = get_iridescenceTextureTransformOffset(materialSID, 0);
  let iridescenceTextureTransformRotation: f32 = get_iridescenceTextureTransformRotation(materialSID, 0);
  let iridescenceTexcoordIndex = get_iridescenceTexcoordIndex(materialSID, 0);
  let iridescenceTexcoord = getTexcoord(iridescenceTexcoordIndex, input);
  let iridescenceTexUv = uvTransform(iridescenceTextureTransformScale, iridescenceTextureTransformOffset, iridescenceTextureTransformRotation, iridescenceTexcoord);
  let iridescenceTexture: f32 = textureSample(iridescenceTexture, iridescenceSampler, iridescenceTexUv).r;
  let iridescence: f32 = iridescenceFactor * iridescenceTexture;

  let iridescenceThicknessTextureTransformScale: vec2f = get_iridescenceThicknessTextureTransformScale(materialSID, 0);
  let iridescenceThicknessTextureTransformOffset: vec2f = get_iridescenceThicknessTextureTransformOffset(materialSID, 0);
  let iridescenceThicknessTextureTransformRotation: f32 = get_iridescenceThicknessTextureTransformRotation(materialSID, 0);
  let iridescenceThicknessTexcoordIndex = get_iridescenceThicknessTexcoordIndex(materialSID, 0);
  let iridescenceThicknessTexcoord = getTexcoord(iridescenceThicknessTexcoordIndex, input);
  let iridescenceThicknessTexUv = uvTransform(iridescenceThicknessTextureTransformScale, iridescenceThicknessTextureTransformOffset, iridescenceThicknessTextureTransformRotation, iridescenceThicknessTexcoord);
  let thicknessRatio: f32 = textureSample(iridescenceThicknessTexture, iridescenceThicknessSampler, iridescenceThicknessTexUv).g;
  let iridescenceThicknessMinimum: f32 = get_iridescenceThicknessMinimum(materialSID, 0);
  let iridescenceThicknessMaximum: f32 = get_iridescenceThicknessMaximum(materialSID, 0);
  let iridescenceThickness: f32 = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);

  let iridescenceIor: f32 = get_iridescenceIor(materialSID, 0);
  let iridescenceFresnel_dielectric: vec3f = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, dielectricF0);
  let iridescenceFresnel_metal: vec3f = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, baseColor.rgb);

  iridescenceProps.iridescence = iridescence;
  iridescenceProps.fresnelDielectric = iridescenceFresnel_dielectric;
  iridescenceProps.fresnelMetal = iridescenceFresnel_metal;
#else
  iridescenceProps.iridescence = 0.0;
  iridescenceProps.fresnelDielectric = vec3f(0.0);
  iridescenceProps.fresnelMetal = vec3f(0.0);
#endif // RN_USE_IRIDESCENCE

// Clearcoat
  var clearcoatProps: ClearcoatProps;
#ifdef RN_USE_CLEARCOAT
  let clearcoatFactor = get_clearcoatFactor(materialSID, 0);
  let clearcoatTextureTransformScale: vec2f = get_clearcoatTextureTransformScale(materialSID, 0);
  let clearcoatTextureTransformOffset: vec2f = get_clearcoatTextureTransformOffset(materialSID, 0);
  let clearcoatTextureTransformRotation: f32 = get_clearcoatTextureTransformRotation(materialSID, 0);
  let clearcoatTexcoordIndex = get_clearcoatTexcoordIndex(materialSID, 0);
  let clearcoatTexcoord = getTexcoord(clearcoatTexcoordIndex, input);
  let clearcoatTexUv = uvTransform(clearcoatTextureTransformScale, clearcoatTextureTransformOffset, clearcoatTextureTransformRotation, clearcoatTexcoord);
  let clearcoatTexture = textureSample(clearcoatTexture, clearcoatSampler, clearcoatTexUv).r;
  let clearcoat = clearcoatFactor * clearcoatTexture;

  let clearcoatRoughnessFactor = get_clearcoatRoughnessFactor(materialSID, 0);
  let clearcoatRoughnessTexcoordIndex = get_clearcoatRoughnessTexcoordIndex(materialSID, 0);
  let clearcoatRoughnessTexcoord = getTexcoord(clearcoatRoughnessTexcoordIndex, input);
  let clearcoatRoughnessTextureTransformScale: vec2f = get_clearcoatRoughnessTextureTransformScale(materialSID, 0);
  let clearcoatRoughnessTextureTransformOffset: vec2f = get_clearcoatRoughnessTextureTransformOffset(materialSID, 0);
  let clearcoatRoughnessTextureTransformRotation: f32 = get_clearcoatRoughnessTextureTransformRotation(materialSID, 0);
  let clearcoatRoughnessTexUv = uvTransform(clearcoatRoughnessTextureTransformScale, clearcoatRoughnessTextureTransformOffset, clearcoatRoughnessTextureTransformRotation, clearcoatRoughnessTexcoord);
  let textureRoughnessTexture = textureSample(clearcoatRoughnessTexture, clearcoatRoughnessSampler, clearcoatRoughnessTexUv).g;
  let clearcoatRoughness = clearcoatRoughnessFactor * textureRoughnessTexture;

  let clearcoatNormalTexcoordIndex = get_clearcoatNormalTexcoordIndex(materialSID, 0);
  let clearcoatNormalTexcoord = getTexcoord(clearcoatNormalTexcoordIndex, input);
  let clearcoatNormalTextureTransformScale: vec2f = get_clearcoatNormalTextureTransformScale(materialSID, 0);
  let clearcoatNormalTextureTransformOffset: vec2f = get_clearcoatNormalTextureTransformOffset(materialSID, 0);
  let clearcoatNormalTextureTransformRotation: f32 = get_clearcoatNormalTextureTransformRotation(materialSID, 0);
  let clearcoatNormalTexUv = uvTransform(clearcoatNormalTextureTransformScale, clearcoatNormalTextureTransformOffset, clearcoatNormalTextureTransformRotation, clearcoatNormalTexcoord);
  let textureNormal_tangent = textureSample(clearcoatNormalTexture, clearcoatNormalSampler, clearcoatNormalTexUv).xyz * vec3(2.0) - vec3(1.0);
  let clearcoatNormal_inWorld = normalize(TBN * textureNormal_tangent);
  let VdotNc = saturate(dot(viewDirection, clearcoatNormal_inWorld));

  let clearcoatF0 = vec3f(pow((ior - 1.0) / (ior + 1.0), 2.0));
  let clearcoatF90 = vec3f(1.0);
  let clearcoatFresnel = fresnelSchlick(clearcoatF0, clearcoatF90, VdotNc);
  clearcoatProps.clearcoat = clearcoat;
  clearcoatProps.clearcoatRoughness = clearcoatRoughness;
  clearcoatProps.clearcoatNormal_inWorld = clearcoatNormal_inWorld;
  clearcoatProps.VdotNc = VdotNc;
  clearcoatProps.clearcoatF0 = clearcoatF0;
  clearcoatProps.clearcoatF90 = clearcoatF90;
  clearcoatProps.clearcoatFresnel = clearcoatFresnel;
#else
  clearcoatProps.clearcoat = 0.0;
  clearcoatProps.clearcoatRoughness = 0.0;
  clearcoatProps.clearcoatNormal_inWorld = vec3f(0.0);
  clearcoatProps.VdotNc = 0.0;
  clearcoatProps.clearcoatF0 = vec3f(0.0);
  clearcoatProps.clearcoatF90 = vec3f(0.0);
  clearcoatProps.clearcoatFresnel = vec3f(0.0);
#endif // RN_USE_CLEARCOAT

  var volumeProps: VolumeProps;
#ifdef RN_USE_VOLUME
  // Volume
  let thicknessFactor: f32 = get_thicknessFactor(materialSID, 0);
  let thicknessTexcoordIndex = get_thicknessTexcoordIndex(materialSID, 0);
  let thicknessTexcoord = getTexcoord(thicknessTexcoordIndex, input);
  let thicknessTextureTransformScale: vec2f = get_thicknessTextureTransformScale(materialSID, 0);
  let thicknessTextureTransformOffset: vec2f = get_thicknessTextureTransformOffset(materialSID, 0);
  let thicknessTextureTransformRotation: f32 = get_thicknessTextureTransformRotation(materialSID, 0);
  let thicknessTexUv = uvTransform(thicknessTextureTransformScale, thicknessTextureTransformOffset, thicknessTextureTransformRotation, thicknessTexcoord);
  let thicknessTexture: f32 = textureSample(thicknessTexture, thicknessSampler, thicknessTexUv).g;
  let attenuationDistance: f32 = get_attenuationDistance(materialSID, 0);
  let attenuationColor: vec3f = get_attenuationColor(materialSID, 0);
  let thickness: f32 = thicknessFactor * thicknessTexture;
  volumeProps.thickness = thickness;
  volumeProps.attenuationColor = attenuationColor;
  volumeProps.attenuationDistance = attenuationDistance;
#else
  volumeProps.thickness = 0.0;
  volumeProps.attenuationColor = vec3f(1.0);
  volumeProps.attenuationDistance = 1e20;
#endif // RN_USE_VOLUME

  var sheenProps: SheenProps;
#ifdef RN_USE_SHEEN
  // Sheen
  let sheenColorFactor: vec3f = get_sheenColorFactor(materialSID, 0);
  let sheenColorTextureTransformScale: vec2f = get_sheenColorTextureTransformScale(materialSID, 0);
  let sheenColorTextureTransformOffset: vec2f = get_sheenColorTextureTransformOffset(materialSID, 0);
  let sheenColorTextureTransformRotation: f32 = get_sheenColorTextureTransformRotation(materialSID, 0);
  let sheenColorTexcoordIndex = get_sheenColorTexcoordIndex(materialSID, 0);
  let sheenColorTexcoord = getTexcoord(sheenColorTexcoordIndex, input);
  let sheenColorTexUv = uvTransform(sheenColorTextureTransformScale, sheenColorTextureTransformOffset, sheenColorTextureTransformRotation, sheenColorTexcoord);
  let sheenColorTexture: vec3f = textureSample(sheenColorTexture, sheenColorSampler, sheenColorTexUv).rgb;

  let sheenRoughnessFactor: f32 = get_sheenRoughnessFactor(materialSID, 0);
  let sheenRoughnessTextureTransformScale: vec2f = get_sheenRoughnessTextureTransformScale(materialSID, 0);
  let sheenRoughnessTextureTransformOffset: vec2f = get_sheenRoughnessTextureTransformOffset(materialSID, 0);
  let sheenRoughnessTextureTransformRotation: f32 = get_sheenRoughnessTextureTransformRotation(materialSID, 0);
  let sheenRoughnessTexcoordIndex = get_sheenRoughnessTexcoordIndex(materialSID, 0);
  let sheenRoughnessTexcoord = getTexcoord(sheenRoughnessTexcoordIndex, input);
  let sheenRoughnessTexUv = uvTransform(sheenRoughnessTextureTransformScale, sheenRoughnessTextureTransformOffset, sheenRoughnessTextureTransformRotation, sheenRoughnessTexcoord);
  let sheenRoughnessTexture: f32 = textureSample(sheenRoughnessTexture, sheenRoughnessSampler, sheenRoughnessTexUv).a;

  let sheenColor: vec3f = sheenColorFactor * sheenColorTexture;
  let sheenRoughness: f32 = clamp(sheenRoughnessFactor * sheenRoughnessTexture, 0.000001, 1.0);
  let albedoSheenScalingNdotV: f32 = 1.0 - max3(sheenColor) * textureSample(sheenLutTexture, sheenLutSampler, vec2(NdotV, sheenRoughness)).r;
  sheenProps.sheenColor = sheenColor;
  sheenProps.sheenRoughness = sheenRoughness;
  sheenProps.albedoSheenScalingNdotV = albedoSheenScalingNdotV;
#else
  sheenProps.sheenColor = vec3f(0.0);
  sheenProps.sheenRoughness = 0.000001;
  sheenProps.albedoSheenScalingNdotV = 1.0;
#endif // RN_USE_SHEEN

var diffuseTransmissionProps: DiffuseTransmissionProps;
#ifdef RN_USE_DIFFUSE_TRANSMISSION
  let diffuseTransmissionFactor = get_diffuseTransmissionFactor(materialSID, 0);
  let diffuseTransmissionTextureTransformScale = get_diffuseTransmissionTextureTransformScale(materialSID, 0);
  let diffuseTransmissionTextureTransformOffset = get_diffuseTransmissionTextureTransformOffset(materialSID, 0);
  let diffuseTransmissionTextureTransformRotation = get_diffuseTransmissionTextureTransformRotation(materialSID, 0);
  let diffuseTransmissionTexcoordIndex = get_diffuseTransmissionTexcoordIndex(materialSID, 0);
  let diffuseTransmissionTexcoord = getTexcoord(diffuseTransmissionTexcoordIndex, input);
  let diffuseTransmissionTexUv = uvTransform(diffuseTransmissionTextureTransformScale, diffuseTransmissionTextureTransformOffset, diffuseTransmissionTextureTransformRotation, diffuseTransmissionTexcoord);
  let diffuseTransmissionTexture = textureSample(diffuseTransmissionTexture, diffuseTransmissionSampler, diffuseTransmissionTexUv).a;
  let diffuseTransmission = diffuseTransmissionFactor * diffuseTransmissionTexture;

  let diffuseTransmissionColorFactor = get_diffuseTransmissionColorFactor(materialSID, 0);
  let diffuseTransmissionColorTextureTransformScale = get_diffuseTransmissionColorTextureTransformScale(materialSID, 0);
  let diffuseTransmissionColorTextureTransformOffset = get_diffuseTransmissionColorTextureTransformOffset(materialSID, 0);
  let diffuseTransmissionColorTextureTransformRotation = get_diffuseTransmissionColorTextureTransformRotation(materialSID, 0);
  let diffuseTransmissionColorTexcoordIndex = get_diffuseTransmissionColorTexcoordIndex(materialSID, 0);
  let diffuseTransmissionColorTexcoord = getTexcoord(diffuseTransmissionColorTexcoordIndex, input);
  let diffuseTransmissionColorTexUv = uvTransform(diffuseTransmissionColorTextureTransformScale, diffuseTransmissionColorTextureTransformOffset, diffuseTransmissionColorTextureTransformRotation, diffuseTransmissionColorTexcoord);
  let diffuseTransmissionColorTexture = textureSample(diffuseTransmissionColorTexture, diffuseTransmissionColorSampler, diffuseTransmissionColorTexUv).rgb;
  let diffuseTransmissionColor = diffuseTransmissionColorFactor * diffuseTransmissionColorTexture;
  var diffuseTransmissionThickness = 1.0;

  diffuseTransmissionProps.diffuseTransmission = diffuseTransmission;
  diffuseTransmissionProps.diffuseTransmissionColor = diffuseTransmissionColor;
  diffuseTransmissionProps.diffuseTransmissionThickness = diffuseTransmissionThickness;

#ifdef RN_USE_VOLUME
  let worldMatrix = get_worldMatrix(u32(input.instanceIds.x));
  diffuseTransmissionProps.diffuseTransmissionThickness = volumeProps.thickness * (length(worldMatrix[0].xyz) * length(worldMatrix[1].xyz) * length(worldMatrix[2].xyz)) / 3.0;
#endif // RN_USE_VOLUME

#else
  diffuseTransmissionProps.diffuseTransmission = 0.0;
  diffuseTransmissionProps.diffuseTransmissionColor = vec3f(0.0);
  diffuseTransmissionProps.diffuseTransmissionThickness = 0.0;
#endif // RN_USE_DIFFUSE_TRANSMISSION

#ifdef RN_USE_DISPERSION
  let dispersion = get_dispersion(materialSID, 0);
#else
  let dispersion = 0.0;
#endif

var occlusionProps: OcclusionProps;
#ifdef RN_USE_OCCLUSION_TEXTURE
  let occlusionTexcoordIndex = get_occlusionTexcoordIndex(materialSID, 0);
  let occlusionTexcoord = getTexcoord(occlusionTexcoordIndex, input);
  let occlusionTextureTransformScale: vec2f = get_occlusionTextureTransformScale(materialSID, 0);
  let occlusionTextureTransformOffset: vec2f = get_occlusionTextureTransformOffset(materialSID, 0);
  let occlusionTextureTransformRotation: f32 = get_occlusionTextureTransformRotation(materialSID, 0);
  let occlusionTexUv = uvTransform(occlusionTextureTransformScale, occlusionTextureTransformOffset, occlusionTextureTransformRotation, occlusionTexcoord);
  occlusionProps.occlusionTexture = textureSample(occlusionTexture, occlusionSampler, occlusionTexUv);
  occlusionProps.occlusionStrength = get_occlusionStrength(materialSID, 0);
#else
  occlusionProps.occlusionTexture = vec4f(1.0);
  occlusionProps.occlusionStrength = 1.0;
#endif

var emissiveProps: EmissiveProps;
let emissiveFactor = get_emissiveFactor(materialSID, 0);
#ifdef RN_USE_EMISSIVE_TEXTURE
  let emissiveTexcoordIndex = get_emissiveTexcoordIndex(materialSID, 0);
  let emissiveTexcoord = getTexcoord(emissiveTexcoordIndex, input);
  let emissiveTextureTransformScale: vec2f = get_emissiveTextureTransformScale(materialSID, 0);
  let emissiveTextureTransformOffset: vec2f = get_emissiveTextureTransformOffset(materialSID, 0);
  let emissiveTextureTransformRotation: f32 = get_emissiveTextureTransformRotation(materialSID, 0);
  let emissiveTexUv = uvTransform(emissiveTextureTransformScale, emissiveTextureTransformOffset, emissiveTextureTransformRotation, emissiveTexcoord);
  let emissive = emissiveFactor * srgbToLinear(textureSample(emissiveTexture, emissiveSampler, emissiveTexUv).xyz);
#else
  let emissive = emissiveFactor;
#endif
  emissiveProps.emissive = emissive;
#ifdef RN_USE_EMISSIVE_STRENGTH
  let emissiveStrength = get_emissiveStrength(materialSID, 0);
  emissiveProps.emissiveStrength = emissiveStrength;
#else
  emissiveProps.emissiveStrength = 1.0;
#endif // RN_USE_EMISSIVE_STRENGTH

  var rt0 = vec4<f32>(0.0, 0.0, 0.0, baseColor.a);

  pbrShader(
    input.position_inWorld, normal_inWorld, geomNormal_inWorld,
    baseColor, perceptualRoughness, metallic,
    occlusionProps,
    emissiveProps,
    ior,
    transmission,
    specularProps,
    volumeProps,
    clearcoatProps,
    anisotropyProps,
    sheenProps,
    iridescenceProps,
    diffuseTransmissionProps,
    dispersion,
    &rt0);
#else
  var rt0 = baseColor;
#endif // RN_IS_LIGHTING

  /* shaderity: @{wireframe} */

  /* shaderity: @{outputSrgb} */

  rt0 = vec4f(rt0.rgb * rt0.a, rt0.a);

  return rt0;
}
