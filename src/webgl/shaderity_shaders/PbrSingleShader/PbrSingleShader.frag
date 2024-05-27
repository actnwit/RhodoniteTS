#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in vec2 v_texcoord_0;
in vec2 v_texcoord_1;
in vec2 v_texcoord_2;
in vec3 v_baryCentricCoord;
in float v_instanceInfo;

#ifdef RN_USE_TANGENT
  in vec3 v_tangent_inWorld;
  in vec3 v_binormal_inWorld;
#endif

#ifdef RN_USE_SHADOW_MAPPING
in vec4 v_shadowCoord;
#endif

uniform vec4 u_baseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_baseColorTexture; // initialValue=(0,white)
uniform vec2 u_metallicRoughnessFactor; // initialValue=(1,1)
uniform sampler2D u_metallicRoughnessTexture; // initialValue=(1,white)
uniform sampler2D u_occlusionTexture; // initialValue=(3,white)
uniform vec3 u_emissiveFactor; // initialValue=(0,0,0)
uniform sampler2D u_emissiveTexture; // initialValue=(4,white)
uniform vec3 u_wireframe; // initialValue=(0,0,1)
uniform bool u_isOutputHDR; // initialValue=0
uniform bool u_makeOutputSrgb; // initialValue=1
uniform vec4 u_iblParameter; // initialValue=(1,1,1,1), isCustomSetting=true
uniform ivec2 u_hdriFormat; // initialValue=(0,0), isCustomSetting=true
uniform samplerCube u_diffuseEnvTexture; // initialValue=(5,white), isCustomSetting=true
uniform samplerCube u_specularEnvTexture; // initialValue=(6,white), isCustomSetting=true
uniform vec4 u_baseColorTextureTransform; // initialValue=(1,1,0,0)
uniform float u_baseColorTextureRotation; // initialValue=0
uniform vec4 u_metallicRoughnessTextureTransform; // initialValue=(1,1,0,0)
uniform float u_metallicRoughnessTextureRotation; // initialValue=0
uniform int u_baseColorTexcoordIndex; // initialValue=0
uniform int u_metallicRoughnessTexcoordIndex; // initialValue=0
uniform int u_occlusionTexcoordIndex; // initialValue=0
uniform vec4 u_occlusionTextureTransform; // initialValue=(1,1,0,0)
uniform float u_occlusionTextureRotation; // initialValue=0
uniform int u_emissiveTexcoordIndex; // initialValue=0
uniform vec4 u_emissiveTextureTransform; // initialValue=(1,1,0,0)
uniform float u_emissiveTextureRotation; // initialValue=0
uniform float u_occlusionStrength; // initialValue=1
uniform bool u_inverseEnvironment; // initialValue=true
uniform float u_ior; // initialValue=1.5

#ifdef RN_USE_NORMAL_TEXTURE
  uniform sampler2D u_normalTexture; // initialValue=(2,black)
  uniform vec4 u_normalTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_normalTextureRotation; // initialValue=(0)
  uniform int u_normalTexcoordIndex; // initialValue=(0)
  uniform float u_normalScale; // initialValue=(1)
#endif

#ifdef RN_USE_CLEARCOAT
  uniform float u_clearCoatFactor; // initialValue=0
  uniform float u_clearCoatRoughnessFactor; // initialValue=0
  uniform vec4 u_clearCoatTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_clearCoatTextureRotation; // initialValue=0
  uniform vec4 u_clearCoatRoughnessTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_clearCoatRoughnessTextureRotation; // initialValue=0
  uniform vec4 u_clearCoatNormalTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_clearCoatNormalTextureRotation; // initialValue=0
  uniform int u_clearCoatTexcoordIndex; // initialValue=(0)
  uniform int u_clearCoatRoughnessTexcoordIndex; // initialValue=(0)
  uniform int u_clearCoatNormalTexcoordIndex; // initialValue=(0)
#endif

#ifdef RN_USE_TRANSMISSION
  uniform float u_transmissionFactor; // initialValue=(0)
#endif

#ifdef RN_USE_VOLUME
  uniform float u_thicknessFactor; // initialValue=(0)
  uniform float u_attenuationDistance; // initialValue=(0.000001)
  uniform vec3 u_attenuationColor; // initialValue=(1,1,1)
#endif

#ifdef RN_USE_SHEEN
  uniform vec3 u_sheenColorFactor; // initialValue=(0,0,0)
  uniform float u_sheenRoughnessFactor; // initialValue=(0)
#endif

#ifdef RN_USE_SPECULAR
  uniform float u_specularFactor; // initialValue=1.0
  uniform vec3 u_specularColorFactor; // initialValue=(1,1,1)
#endif

#ifdef RN_USE_IRIDESCENCE
  uniform float u_iridescenceFactor; // initialValue=0
  uniform float u_iridescenceIor; // initialValue=1.3
  uniform float u_iridescenceThicknessMinimum; // initialValue=100
  uniform float u_iridescenceThicknessMaximum; // initialValue=400
#endif

#ifdef RN_USE_ANISOTROPY
  uniform float u_anisotropyStrength; // initialValue=0
  uniform vec2 u_anisotropyRotation; // initialValue=(1,0)
#endif

uniform float u_alphaCutoff; // initialValue=(0.01)

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/opticalDefinition.glsl)
#pragma shaderity: require(../common/pbrDefinition.glsl)

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/shadow.glsl)

#pragma shaderity: require(../common/iblDefinition.glsl)

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

vec2 getTexcoord(int texcoordIndex) {
  vec2 texcoord;
  if(texcoordIndex == 2){
    texcoord = v_texcoord_2;
  } else if(texcoordIndex == 1){
    texcoord = v_texcoord_1;
  }else{
    texcoord = v_texcoord_0;
  }
  return texcoord;
}

#pragma shaderity: require(../common/perturbedNormal.glsl)

void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  // View direction
  vec3 viewPosition = get_viewPosition(cameraSID, 0);
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;
  vec3 viewDirection = normalize(viewVector);

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  vec3 geomNormal_inWorld = normal_inWorld;
  vec4 normalTextureTransform = get_normalTextureTransform(materialSID, 0);
  float normalTextureRotation = get_normalTextureRotation(materialSID, 0);
  int normalTexcoordIndex = get_normalTexcoordIndex(materialSID, 0);
  vec2 normalTexcoord = getTexcoord(normalTexcoordIndex);
  vec2 normalTexUv = uvTransform(normalTextureTransform.xy, normalTextureTransform.zw, normalTextureRotation, normalTexcoord);
  mat3 TBN = getTBN(normal_inWorld, viewVector, normalTexUv);
  #ifdef RN_USE_NORMAL_TEXTURE
    vec3 normalTexValue = texture(u_normalTexture, normalTexUv).xyz;
    if(normalTexValue.b >= 128.0 / 255.0) {
      // normal texture is existence
      vec3 normalTex = normalTexValue * 2.0 - 1.0;
      float normalScale = get_normalScale(materialSID, 0);
      vec3 scaledNormal = normalize(normalTex * vec3(normalScale, normalScale, 1.0));
      normal_inWorld = normalize(TBN * scaledNormal);
    }
  #endif

  // BaseColorFactor
  vec3 baseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  vec4 baseColorFactor = get_baseColorFactor(materialSID, 0);
  if (v_color != baseColor && baseColorFactor.rgb != baseColor) {
    baseColor = v_color * baseColorFactor.rgb;
    alpha = baseColorFactor.a;
  } else if (v_color == baseColor) {
    baseColor = baseColorFactor.rgb;
    alpha = baseColorFactor.a;
  } else if (baseColorFactor.rgb == baseColor) {
    baseColor = v_color;
  } else {
    baseColor = vec3(1.0, 1.0, 1.0);
  }

  // BaseColor (take account for BaseColorTexture)
  vec4 baseColorTextureTransform = get_baseColorTextureTransform(materialSID, 0);
  float baseColorTextureRotation = get_baseColorTextureRotation(materialSID, 0);
  int baseColorTexcoordIndex = get_baseColorTexcoordIndex(materialSID, 0);
  vec2 baseColorTexcoord = getTexcoord(baseColorTexcoordIndex);
  vec2 baseColorTexUv = uvTransform(baseColorTextureTransform.xy, baseColorTextureTransform.zw, baseColorTextureRotation, baseColorTexcoord);
  vec4 textureColor = texture(u_baseColorTexture, baseColorTexUv);
  baseColor *= srgbToLinear(textureColor.rgb);
  alpha *= textureColor.a;

#pragma shaderity: require(../common/alphaMask.glsl)


#ifdef RN_IS_LIGHTING
  // Metallic & Roughness
  vec2 metallicRoughnessFactor = get_metallicRoughnessFactor(materialSID, 0);
  float metallic = metallicRoughnessFactor.x;
  vec4 metallicRoughnessTextureTransform = get_metallicRoughnessTextureTransform(materialSID, 0);
  float metallicRoughnessTextureRotation = get_metallicRoughnessTextureRotation(materialSID, 0);
  int metallicRoughnessTexcoordIndex = get_metallicRoughnessTexcoordIndex(materialSID, 0);
  vec2 metallicRoughnessTexcoord = getTexcoord(metallicRoughnessTexcoordIndex);
  vec2 metallicRoughnessTexUv = uvTransform(metallicRoughnessTextureTransform.xy, metallicRoughnessTextureTransform.zw, metallicRoughnessTextureRotation, metallicRoughnessTexcoord);
  vec4 ormTexel = texture(u_metallicRoughnessTexture, metallicRoughnessTexUv);
  float perceptualRoughness = ormTexel.g * metallicRoughnessFactor.y;
  metallic = ormTexel.b * metallic;
  metallic = clamp(metallic, 0.0, 1.0);
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
  float alphaRoughness = perceptualRoughness * perceptualRoughness;
    // filter NDF for specular AA --- https://jcgt.org/published/0010/02/02/
  float alphaRoughness2 = alphaRoughness * alphaRoughness;
  float filteredRoughness2 = IsotropicNDFFiltering(normal_inWorld, alphaRoughness2);
  perceptualRoughness = sqrt(sqrt(filteredRoughness2));

  // Albedo
  vec3 black = vec3(0.0);
  vec3 albedo = mix(baseColor.rgb, black, metallic);

  // NdotV
  float NdotV = saturateEpsilonToOne(dot(normal_inWorld, viewDirection));

  #ifdef RN_USE_ANISOTROPY
    float anisotropy = get_anisotropyStrength(materialSID, 0);
    vec2 anisotropyRotation = get_anisotropyRotation(materialSID, 0);
    vec2 direction = anisotropyRotation;
    vec3 anisotropyTex = texture(u_anisotropyTexture, baseColorTexUv).rgb;
    direction = anisotropyTex.rg * 2.0 - vec2(1.0);
    direction = mat2(anisotropyRotation.x, anisotropyRotation.y, -anisotropyRotation.y, anisotropyRotation.x) * normalize(direction);
    anisotropy *= anisotropyTex.b;
    vec3 anisotropicT = normalize(TBN * vec3(direction, 0.0));
    vec3 anisotropicB = normalize(cross(geomNormal_inWorld, anisotropicT));
    float BdotV = dot(anisotropicB, viewDirection);
    float TdotV = dot(anisotropicT, viewDirection);
  #else
    float anisotropy = 0.0;
    vec3 anisotropicT = vec3(0.0, 0.0, 0.0);
    vec3 anisotropicB = vec3(0.0, 0.0, 0.0);
    float BdotV = 0.0;
    float TdotV = 0.0;
  #endif

    // Clearcoat
  #ifdef RN_USE_CLEARCOAT
    float clearcoatFactor = get_clearCoatFactor(materialSID, 0);
    vec4 clearcoatTextureTransform = get_clearCoatTextureTransform(materialSID, 0);
    float clearcoatTextureRotation = get_clearCoatTextureRotation(materialSID, 0);
    int clearCoatTexcoordIndex = get_clearCoatTexcoordIndex(materialSID, 0);
    vec2 clearCoatTexcoord = getTexcoord(clearCoatTexcoordIndex);
    vec2 clearcoatTexUv = uvTransform(clearcoatTextureTransform.xy, clearcoatTextureTransform.zw, clearcoatTextureRotation, clearCoatTexcoord);
    float clearcoatTexture = texture(u_clearCoatTexture, clearcoatTexUv).r;
    float clearcoat = clearcoatFactor * clearcoatTexture;
  #else
    float clearcoat = 0.0;
  #endif // RN_USE_CLEARCOAT

    // Transmission
  #ifdef RN_USE_TRANSMISSION
    float transmissionFactor = get_transmissionFactor(materialSID, 0);
    float transmissionTexture = texture(u_transmissionTexture, baseColorTexUv).r;
    float transmission = transmissionFactor * transmissionTexture;
    // alpha *= transmission;
  #else
    float transmission = 0.0;
  #endif // RN_USE_TRANSMISSION

  #ifdef RN_USE_SPECULAR
    float specularTexture = texture(u_specularTexture, baseColorTexUv).a;
    float specular = get_specularFactor(materialSID, 0) * specularTexture;
    vec3 specularColorTexture = srgbToLinear(texture(u_specularColorTexture, baseColorTexUv).rgb);
    vec3 specularColor = get_specularColorFactor(materialSID, 0) * specularColorTexture;
  #else
    float specular = 1.0;
    vec3 specularColor = vec3(1.0, 1.0, 1.0);
  #endif // RN_USE_SPECULAR

  // F0, F90
  float ior = get_ior(materialSID, 0);
  float outsideIor = 1.0;
  vec3 dielectricSpecularF0 = min(
    ((ior - outsideIor) / (ior + outsideIor)) * ((ior - outsideIor) / (ior + outsideIor)) * specularColor,
    vec3(1.0)
    ) * specular;
  vec3 dielectricSpecularF90 = vec3(specular);
  vec3 F0 = mix(dielectricSpecularF0, baseColor.rgb, metallic);
  vec3 F90 = mix(dielectricSpecularF90, vec3(1.0), metallic);

  // Iridescence
  #ifdef RN_USE_IRIDESCENCE
    float iridescenceFactor = get_iridescenceFactor(materialSID, 0);
    float iridescenceTexture = texture(u_iridescenceTexture, baseColorTexUv).r;
    float iridescence = iridescenceFactor * iridescenceTexture;
    float iridescenceIor = get_iridescenceIor(materialSID, 0);
    float thicknessRatio = texture(u_iridescenceThicknessTexture, baseColorTexUv).r;
    float iridescenceThicknessMinimum = get_iridescenceThicknessMinimum(materialSID, 0);
    float iridescenceThicknessMaximum = get_iridescenceThicknessMaximum(materialSID, 0);
    float iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);
    vec3 iridescenceFresnel = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, F0);
    vec3 iridescenceF0 = Schlick_to_F0(iridescenceFresnel, NdotV);
  #else
    float iridescence = 0.0;
    vec3 iridescenceFresnel = vec3(0.0);
    vec3 iridescenceF0 = F0;
  #endif // RN_USE_IRIDESCENCE

  #ifdef RN_USE_CLEARCOAT
    // Clearcoat
    float clearcoatRoughnessFactor = get_clearCoatRoughnessFactor(materialSID, 0);
    int clearCoatRoughnessTexcoordIndex = get_clearCoatRoughnessTexcoordIndex(materialSID, 0);
    vec2 clearCoatRoughnessTexcoord = getTexcoord(clearCoatRoughnessTexcoordIndex);
    vec4 clearcoatRoughnessTextureTransform = get_clearCoatRoughnessTextureTransform(materialSID, 0);
    float clearcoatRoughnessTextureRotation = get_clearCoatRoughnessTextureRotation(materialSID, 0);
    vec2 clearcoatRoughnessTexUv = uvTransform(clearcoatRoughnessTextureTransform.xy, clearcoatRoughnessTextureTransform.zw, clearcoatRoughnessTextureRotation, clearCoatRoughnessTexcoord);
    float textureRoughnessTexture = texture(u_clearCoatRoughnessTexture, clearcoatRoughnessTexUv).g;
    float clearcoatRoughness = clearcoatRoughnessFactor * textureRoughnessTexture;

    int clearCoatNormalTexcoordIndex = get_clearCoatNormalTexcoordIndex(materialSID, 0);
    vec2 clearCoatNormalTexcoord = getTexcoord(clearCoatNormalTexcoordIndex);
    vec4 clearcoatNormalTextureTransform = get_clearCoatNormalTextureTransform(materialSID, 0);
    float clearcoatNormalTextureRotation = get_clearCoatNormalTextureRotation(materialSID, 0);
    vec2 clearcoatNormalTexUv = uvTransform(clearcoatNormalTextureTransform.xy, clearcoatNormalTextureTransform.zw, clearcoatNormalTextureRotation, clearCoatNormalTexcoord);
    vec3 textureNormal_tangent = texture(u_clearCoatNormalTexture, clearcoatNormalTexUv).xyz * vec3(2.0) - vec3(1.0);
    vec3 clearcoatNormal_inWorld = normalize(TBN * textureNormal_tangent);
    float VdotNc = saturateEpsilonToOne(dot(viewDirection, clearcoatNormal_inWorld));
  #else
    float clearcoatRoughness = 0.0;
    vec3 clearcoatNormal_inWorld = vec3(0.0);
    float VdotNc = 0.0;
  #endif // RN_USE_CLEARCOAT

  #ifdef RN_USE_VOLUME
    // Volume
    float thicknessFactor = get_thicknessFactor(materialSID, 0);
    float thicknessTexture = texture(u_thicknessTexture, baseColorTexUv).g;
    float attenuationDistance = get_attenuationDistance(materialSID, 0);
    vec3 attenuationColor = get_attenuationColor(materialSID, 0);
    float thickness = thicknessFactor * thicknessTexture;
  #else
    float thickness = 0.0;
    vec3 attenuationColor = vec3(0.0);
    float attenuationDistance = 0.000001;
  #endif // RN_USE_VOLUME

  #ifdef RN_USE_SHEEN
    // Sheen
    vec3 sheenColorFactor = get_sheenColorFactor(materialSID, 0);
    vec3 sheenColorTexture = texture(u_sheenColorTexture, baseColorTexUv).rgb;
    float sheenRoughnessFactor = get_sheenRoughnessFactor(materialSID, 0);
    float sheenRoughnessTexture = texture(u_sheenRoughnessTexture, baseColorTexUv).a;
    vec3 sheenColor = sheenColorFactor * sheenColorTexture;
    float sheenRoughness = clamp(sheenRoughnessFactor * sheenRoughnessTexture, 0.000001, 1.0);
    float albedoSheenScalingNdotV = 1.0 - max3(sheenColor) * texture(u_sheenLutTexture, vec2(NdotV, sheenRoughness)).r;
  #else
    vec3 sheenColor = vec3(0.0);
    float sheenRoughness = 0.000001;
    float albedoSheenScalingNdotV = 1.0;
  #endif // RN_USE_SHEEN

  rt0 = vec4(0.0, 0.0, 0.0, alpha);

  // Lighting
  for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Light
    Light light = getLight(i, v_position_inWorld.xyz);
    rt0.xyz += gltfBRDF(light, normal_inWorld, viewDirection, NdotV, albedo,
                        perceptualRoughness, metallic, F0, F90, ior, transmission,
                        clearcoat, clearcoatRoughness, clearcoatNormal_inWorld, VdotNc,
                        attenuationColor, attenuationDistance,
                        anisotropy, anisotropicT, anisotropicB, BdotV, TdotV,
                        sheenColor, sheenRoughness, albedoSheenScalingNdotV,
                        iridescence, iridescenceFresnel, specular);
  }

  #ifdef RN_USE_SHADOW_MAPPING
    float bias = 0.001;
    vec2 shadowCoord = v_shadowCoord.xy / v_shadowCoord.w;
    float shadowContribusion = 1.0;
    if (shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
      shadowContribusion = varianceShadowContribution(shadowCoord, (v_shadowCoord.z - bias)/v_shadowCoord.w);
    }
    // rt0.rgb = rt0.rgb * (0.5 + shadowContribusion * 0.5);
    rt0.rgb = rt0.rgb * shadowContribusion;
  #endif

  vec3 ibl = IBLContribution(materialSID, normal_inWorld, NdotV, viewDirection,
    albedo, F0, perceptualRoughness, clearcoatRoughness, clearcoatNormal_inWorld,
    clearcoat, VdotNc, geomNormal_inWorld, cameraSID, transmission, v_position_inWorld.xyz, thickness,
    sheenColor, sheenRoughness, albedoSheenScalingNdotV, ior, iridescenceFresnel, iridescenceF0, iridescence, anisotropy, anisotropicB);

  int occlusionTexcoordIndex = get_occlusionTexcoordIndex(materialSID, 0);
  vec2 occlusionTexcoord = getTexcoord(occlusionTexcoordIndex);
  vec4 occlusionTextureTransform = get_occlusionTextureTransform(materialSID, 0);
  float occlusionTextureRotation = get_occlusionTextureRotation(materialSID, 0);
  vec2 occlusionTexUv = uvTransform(occlusionTextureTransform.xy, occlusionTextureTransform.zw, occlusionTextureRotation, occlusionTexcoord);
  float occlusion = texture(u_occlusionTexture, occlusionTexUv).r;
  float occlusionStrength = get_occlusionStrength(materialSID, 0);

  // Occlution to Indirect Lights
  rt0.xyz += mix(ibl, ibl * occlusion, occlusionStrength);
#else
  rt0 = vec4(baseColor, alpha);
#endif // RN_IS_LIGHTING

  // Emissive
  vec3 emissiveFactor = get_emissiveFactor(materialSID, 0);
  int emissiveTexcoordIndex = get_emissiveTexcoordIndex(materialSID, 0);
  vec2 emissiveTexcoord = getTexcoord(emissiveTexcoordIndex);
  vec4 emissiveTextureTransform = get_emissiveTextureTransform(materialSID, 0);
  float emissiveTextureRotation = get_emissiveTextureRotation(materialSID, 0);
  vec2 emissiveTexUv = uvTransform(emissiveTextureTransform.xy, emissiveTextureTransform.zw, emissiveTextureRotation, emissiveTexcoord);
  vec3 emissive = emissiveFactor * srgbToLinear(texture(u_emissiveTexture, emissiveTexUv).xyz);

#ifdef RN_USE_CLEARCOAT
  vec3 coated_emissive = emissive * mix(vec3(1.0), vec3(0.04 + (1.0 - 0.04) * pow(1.0 - NdotV, 5.0)), clearcoat);
  rt0.xyz += coated_emissive;
#else
  rt0.xyz += emissive;
#endif // RN_USE_CLEARCOAT

  bool isOutputHDR = get_isOutputHDR(materialSID, 0);
  if(isOutputHDR){
#pragma shaderity: require(../common/glFragColor.glsl)
    return;
  }

#pragma shaderity: require(../common/setAlphaIfNotInAlphaBlendMode.glsl)

  // Wireframe
  float threshold = 0.001;
  vec3 wireframe = get_wireframe(materialSID, 0);
  float wireframeWidthInner = wireframe.z;
  float wireframeWidthRelativeScale = 1.0;
  if (wireframe.x > 0.5 && wireframe.y < 0.5) {
    rt0.a = 0.0;
  }
  vec4 wireframeResult = rt0;
  vec4 wireframeColor = vec4(0.2, 0.75, 0.0, 1.0);
  float edgeRatio = edge_ratio(v_baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  float edgeRatioModified = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  wireframeResult.rgb = wireframeColor.rgb * edgeRatioModified + rt0.rgb * (1.0 - edgeRatioModified);
  wireframeResult.a = max(rt0.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

  if (wireframe.x > 0.5) {
    rt0 = wireframeResult;
    if (wireframe.y < 0.5 && rt0.a == 0.0) {
      discard;
    }
  }

  // rt0.rgb = vec3(texture(u_depthTexture, v_shadowCoord.xy/v_shadowCoord.w).r);

  // premultiplied alpha
  // rt0.rgb /= alpha;
  // rt0 = vec4(perceptualRoughness, 0.0, 0.0, 1.0);

#pragma shaderity: require(../common/outputSrgb.glsl)
rt1 = rt0;
rt2 = rt0;
rt3 = rt0;
#pragma shaderity: require(../common/glFragColor.glsl)

}
