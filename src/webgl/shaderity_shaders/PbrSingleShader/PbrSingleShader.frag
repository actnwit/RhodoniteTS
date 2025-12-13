

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexIn} */

/* shaderity: @{prerequisites} */

uniform vec3 u_wireframe; // initialValue=(0,0,1)

uniform vec4 u_baseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_baseColorTexture; // initialValue=(1,white)
uniform float u_metallicFactor; // initialValue=1
uniform float u_roughnessFactor; // initialValue=1
uniform sampler2D u_metallicRoughnessTexture; // initialValue=(2,white)
uniform bool u_isOutputHDR; // initialValue=0
uniform bool u_makeOutputSrgb; // initialValue=1
uniform vec4 u_iblParameter; // initialValue=(1,1,1,1), isInternalSetting=true
uniform ivec2 u_hdriFormat; // initialValue=(0,0), isInternalSetting=true
uniform samplerCube u_diffuseEnvTexture; // initialValue=(6,black), isInternalSetting=true
uniform samplerCube u_specularEnvTexture; // initialValue=(7,black), isInternalSetting=true
uniform vec2 u_baseColorTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_baseColorTextureTransformOffset; // initialValue=(0,0)
uniform float u_baseColorTextureTransformRotation; // initialValue=0
uniform vec2 u_metallicRoughnessTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_metallicRoughnessTextureTransformOffset; // initialValue=(0,0)
uniform float u_metallicRoughnessTextureTransformRotation; // initialValue=0
uniform int u_baseColorTexcoordIndex; // initialValue=0
uniform int u_metallicRoughnessTexcoordIndex; // initialValue=0
#ifdef RN_USE_OCCLUSION_TEXTURE
  uniform int u_occlusionTexcoordIndex; // initialValue=0
  uniform vec2 u_occlusionTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_occlusionTextureTransformOffset; // initialValue=(0,0)
  uniform float u_occlusionTextureTransformRotation; // initialValue=0
  uniform sampler2D u_occlusionTexture; // initialValue=(4,white)
  uniform float u_occlusionStrength; // initialValue=1
#endif
#ifdef RN_USE_EMISSIVE_TEXTURE
  uniform sampler2D u_emissiveTexture; // initialValue=(5,white)
  uniform int u_emissiveTexcoordIndex; // initialValue=0
  uniform vec2 u_emissiveTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_emissiveTextureTransformOffset; // initialValue=(0,0)
  uniform float u_emissiveTextureTransformRotation; // initialValue=0
#endif
uniform vec3 u_emissiveFactor; // initialValue=(0,0,0)
#ifdef RN_USE_EMISSIVE_STRENGTH
  uniform float u_emissiveStrength; // initialValue=1
#endif

uniform bool u_inverseEnvironment; // initialValue=false
uniform float u_ior; // initialValue=1.5

#ifdef RN_USE_NORMAL_TEXTURE
  uniform sampler2D u_normalTexture; // initialValue=(3,black)
  uniform float u_normalScale; // initialValue=(1)
#endif
  uniform vec2 u_normalTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_normalTextureTransformOffset; // initialValue=(0,0)
  uniform float u_normalTextureTransformRotation; // initialValue=0
  uniform int u_normalTexcoordIndex; // initialValue=0

#ifdef RN_USE_CLEARCOAT
  uniform float u_clearcoatFactor; // initialValue=0
  uniform float u_clearcoatRoughnessFactor; // initialValue=0
  uniform vec2 u_clearcoatTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_clearcoatTextureTransformOffset; // initialValue=(0,0)
  uniform float u_clearcoatTextureTransformRotation; // initialValue=0
  uniform vec2 u_clearcoatRoughnessTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_clearcoatRoughnessTextureTransformOffset; // initialValue=(0,0)
  uniform float u_clearcoatRoughnessTextureTransformRotation; // initialValue=0
  uniform vec2 u_clearcoatNormalTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_clearcoatNormalTextureTransformOffset; // initialValue=(0,0)
  uniform float u_clearcoatNormalTextureTransformRotation; // initialValue=0
  uniform int u_clearcoatTexcoordIndex; // initialValue=0
  uniform int u_clearcoatRoughnessTexcoordIndex; // initialValue=0
  uniform int u_clearcoatNormalTexcoordIndex; // initialValue=0
#endif

#ifdef RN_USE_TRANSMISSION
  uniform float u_transmissionFactor; // initialValue=(0)
  uniform vec2 u_transmissionTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_transmissionTextureTransformOffset; // initialValue=(0,0)
  uniform float u_transmissionTextureTransformRotation; // initialValue=0
  uniform int u_transmissionTexcoordIndex; // initialValue=0
#endif

#if defined(RN_USE_VOLUME) || defined(RN_USE_TRANSMISSION)
  uniform float u_thicknessFactor; // initialValue=(0)
  uniform float u_attenuationDistance; // initialValue=(0.000001)
  uniform vec3 u_attenuationColor; // initialValue=(1,1,1)
  uniform vec2 u_thicknessTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_thicknessTextureTransformOffset; // initialValue=(0,0)
  uniform float u_thicknessTextureTransformRotation; // initialValue=0
  uniform int u_thicknessTexcoordIndex; // initialValue=0
#endif

#ifdef RN_USE_SHEEN
  uniform vec3 u_sheenColorFactor; // initialValue=(0,0,0)
  uniform float u_sheenRoughnessFactor; // initialValue=(0)
  uniform vec2 u_sheenColorTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_sheenColorTextureTransformOffset; // initialValue=(0,0)
  uniform float u_sheenColorTextureTransformRotation; // initialValue=0
  uniform int u_sheenColorTexcoordIndex; // initialValue=0
  uniform vec2 u_sheenRoughnessTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_sheenRoughnessTextureTransformOffset; // initialValue=(0,0)
  uniform float u_sheenRoughnessTextureTransformRotation; // initialValue=0
  uniform int u_sheenRoughnessTexcoordIndex; // initialValue=0
#endif

#ifdef RN_USE_SPECULAR
  uniform float u_specularFactor; // initialValue=1.0
  uniform vec3 u_specularColorFactor; // initialValue=(1,1,1)
  uniform vec2 u_specularTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_specularTextureTransformOffset; // initialValue=(0,0)
  uniform float u_specularTextureTransformRotation; // initialValue=0
  uniform int u_specularTexcoordIndex; // initialValue=0
  uniform vec2 u_specularColorTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_specularColorTextureTransformOffset; // initialValue=(0,0)
  uniform float u_specularColorTextureTransformRotation; // initialValue=0
  uniform int u_specularColorTexcoordIndex; // initialValue=0
#endif

#ifdef RN_USE_IRIDESCENCE
  uniform float u_iridescenceFactor; // initialValue=0
  uniform float u_iridescenceIor; // initialValue=1.3
  uniform float u_iridescenceThicknessMinimum; // initialValue=100
  uniform float u_iridescenceThicknessMaximum; // initialValue=400
  uniform vec2 u_iridescenceTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_iridescenceTextureTransformOffset; // initialValue=(0,0)
  uniform float u_iridescenceTextureTransformRotation; // initialValue=0
  uniform int u_iridescenceTexcoordIndex; // initialValue=0
  uniform vec2 u_iridescenceThicknessTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_iridescenceThicknessTextureTransformOffset; // initialValue=(0,0)
  uniform float u_iridescenceThicknessTextureTransformRotation; // initialValue=0
  uniform int u_iridescenceThicknessTexcoordIndex; // initialValue=0
#endif

#ifdef RN_USE_ANISOTROPY
  uniform float u_anisotropyStrength; // initialValue=0
  uniform vec2 u_anisotropyRotation; // initialValue=(1,0)
  uniform vec2 u_anisotropyTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_anisotropyTextureTransformOffset; // initialValue=(0,0)
  uniform float u_anisotropyTextureTransformRotation; // initialValue=0
  uniform int u_anisotropyTexcoordIndex; // initialValue=0
#endif

#ifdef RN_USE_DIFFUSE_TRANSMISSION
  uniform float u_diffuseTransmissionFactor; // initialValue=0
  uniform vec3 u_diffuseTransmissionColorFactor; // initialValue=(1,1,1)
  uniform vec2 u_diffuseTransmissionTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_diffuseTransmissionTextureTransformOffset; // initialValue=(0,0)
  uniform float u_diffuseTransmissionTextureTransformRotation; // initialValue=0
  uniform int u_diffuseTransmissionTexcoordIndex; // initialValue=0
  uniform vec2 u_diffuseTransmissionColorTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_diffuseTransmissionColorTextureTransformOffset; // initialValue=(0,0)
  uniform float u_diffuseTransmissionColorTextureTransformRotation; // initialValue=0
  uniform int u_diffuseTransmissionColorTexcoordIndex; // initialValue=0
#endif

#ifdef RN_USE_DISPERSION
  uniform float u_dispersion; // initialValue=0
#endif

uniform float u_alphaCutoff; // initialValue=(0.01)

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */

#ifdef RN_USE_SHADOW_MAPPING
  uniform float u_pointLightFarPlane; // initialValue=1000.0
  uniform float u_pointLightShadowMapUvScale; // initialValue=0.93
#endif

/* shaderity: @{shadowDefinition} */

/* shaderity: @{pbrDefinition} */
/* shaderity: @{iblDefinition} */

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

void main ()
{

/* shaderity: @{mainPrerequisites} */

  // View direction
  vec3 viewPosition = get_viewPosition(cameraSID);
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;
  vec3 viewDirection = normalize(viewVector);

  // BaseColor
  vec4 baseColor = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 baseColorFactor = get_baseColorFactor(materialSID, 0u);
  if (v_color != baseColor && baseColorFactor != baseColor) {
    baseColor = v_color * baseColorFactor;
  } else if (v_color == baseColor) {
    baseColor = baseColorFactor;
  } else if (baseColorFactor == baseColor) {
    baseColor = v_color;
  } else {
    baseColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
  vec2 baseColorTextureTransformScale = get_baseColorTextureTransformScale(materialSID, 0u);
  vec2 baseColorTextureTransformOffset = get_baseColorTextureTransformOffset(materialSID, 0u);
  float baseColorTextureTransformRotation = get_baseColorTextureTransformRotation(materialSID, 0u);
  int baseColorTexcoordIndex = get_baseColorTexcoordIndex(materialSID, 0u);
  vec2 baseColorTexcoord = getTexcoord(baseColorTexcoordIndex);
  vec2 baseColorTexUv = uvTransform(baseColorTextureTransformScale, baseColorTextureTransformOffset, baseColorTextureTransformRotation, baseColorTexcoord);
  vec4 textureColor = texture(u_baseColorTexture, baseColorTexUv);
  baseColor.rgb *= srgbToLinear(textureColor.rgb);
  baseColor.a *= textureColor.a;

  float alpha = baseColor.a;
/* shaderity: @{alphaProcess} */
  baseColor.a = alpha;

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  vec3 geomNormal_inWorld = normal_inWorld;
  vec2 normalTextureTransformScale = get_normalTextureTransformScale(materialSID, 0u);
  vec2 normalTextureTransformOffset = get_normalTextureTransformOffset(materialSID, 0u);
  float normalTextureTransformRotation = get_normalTextureTransformRotation(materialSID, 0u);
  int normalTexcoordIndex = get_normalTexcoordIndex(materialSID, 0u);
  vec2 normalTexcoord = getTexcoord(normalTexcoordIndex);
  vec2 normalTexUv = uvTransform(normalTextureTransformScale, normalTextureTransformOffset, normalTextureTransformRotation, normalTexcoord);
  mat3 TBN = getTBN(normal_inWorld, v_tangent_inWorld, v_binormal_inWorld, viewVector, normalTexUv);
  #ifdef RN_USE_NORMAL_TEXTURE
    vec3 normalTexValue = texture(u_normalTexture, normalTexUv).xyz;
    if(normalTexValue.b >= 128.0 / 255.0) {
      // normal texture is existence
      vec3 normalTex = normalTexValue * 2.0 - 1.0;
      float normalScale = get_normalScale(materialSID, 0u);
      vec3 scaledNormal = normalize(normalTex * vec3(normalScale, normalScale, 1.0));
      normal_inWorld = normalize(TBN * scaledNormal);
    }
  #endif

#ifdef RN_IS_LIGHTING
  // Metallic & Roughness
  vec2 metallicRoughnessTextureTransformScale = get_metallicRoughnessTextureTransformScale(materialSID, 0u);
  vec2 metallicRoughnessTextureTransformOffset = get_metallicRoughnessTextureTransformOffset(materialSID, 0u);
  float metallicRoughnessTextureTransformRotation = get_metallicRoughnessTextureTransformRotation(materialSID, 0u);
  int metallicRoughnessTexcoordIndex = get_metallicRoughnessTexcoordIndex(materialSID, 0u);
  vec2 metallicRoughnessTexcoord = getTexcoord(metallicRoughnessTexcoordIndex);
  vec2 metallicRoughnessTexUv = uvTransform(metallicRoughnessTextureTransformScale, metallicRoughnessTextureTransformOffset, metallicRoughnessTextureTransformRotation, metallicRoughnessTexcoord);
  vec4 ormTexel = texture(u_metallicRoughnessTexture, metallicRoughnessTexUv);
  float perceptualRoughness = ormTexel.g * get_roughnessFactor(materialSID, 0u);
  float metallic = ormTexel.b * get_metallicFactor(materialSID, 0u);
  metallic = clamp(metallic, 0.0, 1.0);
  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
  float alphaRoughness = perceptualRoughness * perceptualRoughness;
    // filter NDF for specular AA --- https://jcgt.org/published/0010/02/02/
  float alphaRoughness2 = alphaRoughness * alphaRoughness;
  float filteredRoughness2 = IsotropicNDFFiltering(normal_inWorld, alphaRoughness2);
  perceptualRoughness = sqrt(sqrt(filteredRoughness2));

  // NdotV
  float NdotV = saturate(dot(normal_inWorld, viewDirection));

  AnisotropyProps anisotropyProps;
  #ifdef RN_USE_ANISOTROPY
    float anisotropy = get_anisotropyStrength(materialSID, 0u);
    vec2 anisotropyRotation = get_anisotropyRotation(materialSID, 0u);
    vec2 direction = anisotropyRotation;
    vec2 anisotropyTextureTransformScale = get_anisotropyTextureTransformScale(materialSID, 0u);
    vec2 anisotropyTextureTransformOffset = get_anisotropyTextureTransformOffset(materialSID, 0u);
    float anisotropyTextureTransformRotation = get_anisotropyTextureTransformRotation(materialSID, 0u);
    int anisotropyTexcoordIndex = get_anisotropyTexcoordIndex(materialSID, 0u);
    vec2 anisotropyTexcoord = getTexcoord(anisotropyTexcoordIndex);
    vec2 anisotropyTexUv = uvTransform(anisotropyTextureTransformScale, anisotropyTextureTransformOffset, anisotropyTextureTransformRotation, anisotropyTexcoord);
    vec3 anisotropyTex = texture(u_anisotropyTexture, anisotropyTexUv).rgb;
    direction = anisotropyTex.rg * 2.0 - vec2(1.0);
    direction = mat2(anisotropyRotation.x, anisotropyRotation.y, -anisotropyRotation.y, anisotropyRotation.x) * normalize(direction);
    anisotropy *= anisotropyTex.b;
    anisotropyProps.anisotropy = anisotropy;
    anisotropyProps.anisotropicT = normalize(TBN * vec3(direction, 0.0));
    anisotropyProps.anisotropicB = normalize(cross(geomNormal_inWorld, anisotropyProps.anisotropicT));
    anisotropyProps.BdotV = dot(anisotropicProps.anisotropicB, viewDirection);
    anisotropyProps.TdotV = dot(anisotropyProps.anisotropicT, viewDirection);
  #else
    anisotropyProps.anisotropy = 0.0;
    anisotropyProps.anisotropicT = vec3(0.0, 0.0, 0.0);
    anisotropyProps.anisotropicB = vec3(0.0, 0.0, 0.0);
    anisotropyProps.BdotV = 0.0;
    anisotropyProps.TdotV = 0.0;
  #endif

  float ior = get_ior(materialSID, 0u);

    // Transmission
  #ifdef RN_USE_TRANSMISSION
    float transmissionFactor = get_transmissionFactor(materialSID, 0u);
    vec2 transmissionTextureTransformScale = get_transmissionTextureTransformScale(materialSID, 0u);
    vec2 transmissionTextureTransformOffset = get_transmissionTextureTransformOffset(materialSID, 0u);
    float transmissionTextureTransformRotation = get_transmissionTextureTransformRotation(materialSID, 0u);
    int transmissionTexcoordIndex = get_transmissionTexcoordIndex(materialSID, 0u);
    vec2 transmissionTexcoord = getTexcoord(transmissionTexcoordIndex);
    vec2 transmissionTexUv = uvTransform(transmissionTextureTransformScale, transmissionTextureTransformOffset, transmissionTextureTransformRotation, transmissionTexcoord);
    float transmissionTexture = texture(u_transmissionTexture, transmissionTexUv).r;
    float transmission = transmissionFactor * transmissionTexture;
    // alpha *= transmission;
  #else
    float transmission = 0.0;
  #endif // RN_USE_TRANSMISSION

  #ifdef RN_USE_SPECULAR
    vec2 specularTextureTransformScale = get_specularTextureTransformScale(materialSID, 0u);
    vec2 specularTextureTransformOffset = get_specularTextureTransformOffset(materialSID, 0u);
    float specularTextureTransformRotation = get_specularTextureTransformRotation(materialSID, 0u);
    int specularTexcoordIndex = get_specularTexcoordIndex(materialSID, 0u);
    vec2 specularTexcoord = getTexcoord(specularTexcoordIndex);
    vec2 specularTexUv = uvTransform(specularTextureTransformScale, specularTextureTransformOffset, specularTextureTransformRotation, specularTexcoord);
    float specularTexture = texture(u_specularTexture, specularTexUv).a;
    float specularWeight = get_specularFactor(materialSID, 0u) * specularTexture;
    vec2 specularColorTextureTransformScale = get_specularColorTextureTransformScale(materialSID, 0u);
    vec2 specularColorTextureTransformOffset = get_specularColorTextureTransformOffset(materialSID, 0u);
    float specularColorTextureTransformRotation = get_specularColorTextureTransformRotation(materialSID, 0u);
    int specularColorTexcoordIndex = get_specularColorTexcoordIndex(materialSID, 0u);
    vec2 specularColorTexcoord = getTexcoord(specularColorTexcoordIndex);
    vec2 specularColorTexUv = uvTransform(specularColorTextureTransformScale, specularColorTextureTransformOffset, specularColorTextureTransformRotation, specularColorTexcoord);
    vec3 specularColorTexture = srgbToLinear(texture(u_specularColorTexture, specularColorTexUv).rgb);
    vec3 specularColor = get_specularColorFactor(materialSID, 0u) * specularColorTexture;
  #else
    float specularWeight = 1.0;
    vec3 specularColor = vec3(1.0, 1.0, 1.0);
  #endif // RN_USE_SPECULAR

  // F0, F90
  float outsideIor = 1.0;
  vec3 dielectricF0 = vec3(sq((ior - outsideIor) / (ior + outsideIor)));
  dielectricF0 = min(dielectricF0 * specularColor, vec3(1.0));
  vec3 dielectricF90 = vec3(specularWeight);

  // Iridescence
  #ifdef RN_USE_IRIDESCENCE
    float iridescenceFactor = get_iridescenceFactor(materialSID, 0u);
    vec2 iridescenceTextureTransformScale = get_iridescenceTextureTransformScale(materialSID, 0u);
    vec2 iridescenceTextureTransformOffset = get_iridescenceTextureTransformOffset(materialSID, 0u);
    float iridescenceTextureTransformRotation = get_iridescenceTextureTransformRotation(materialSID, 0u);
    int iridescenceTexcoordIndex = get_iridescenceTexcoordIndex(materialSID, 0u);
    vec2 iridescenceTexcoord = getTexcoord(iridescenceTexcoordIndex);
    vec2 iridescenceTexUv = uvTransform(iridescenceTextureTransformScale, iridescenceTextureTransformOffset, iridescenceTextureTransformRotation, iridescenceTexcoord);
    float iridescenceTexture = texture(u_iridescenceTexture, iridescenceTexUv).r;
    float iridescence = iridescenceFactor * iridescenceTexture;

    vec2 iridescenceThicknessTextureTransformScale = get_iridescenceThicknessTextureTransformScale(materialSID, 0u);
    vec2 iridescenceThicknessTextureTransformOffset = get_iridescenceThicknessTextureTransformOffset(materialSID, 0u);
    float iridescenceThicknessTextureTransformRotation = get_iridescenceThicknessTextureTransformRotation(materialSID, 0u);
    int iridescenceThicknessTexcoordIndex = get_iridescenceThicknessTexcoordIndex(materialSID, 0u);
    vec2 iridescenceThicknessTexcoord = getTexcoord(iridescenceThicknessTexcoordIndex);
    vec2 iridescenceThicknessTexUv = uvTransform(iridescenceThicknessTextureTransformScale, iridescenceThicknessTextureTransformOffset, iridescenceThicknessTextureTransformRotation, iridescenceThicknessTexcoord);
    float thicknessRatio = texture(u_iridescenceThicknessTexture, iridescenceThicknessTexUv).g;
    float iridescenceThicknessMinimum = get_iridescenceThicknessMinimum(materialSID, 0u);
    float iridescenceThicknessMaximum = get_iridescenceThicknessMaximum(materialSID, 0u);
    float iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);

    float iridescenceIor = get_iridescenceIor(materialSID, 0u);
    vec3 iridescenceFresnel_dielectric = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, dielectricF0);
    vec3 iridescenceFresnel_metal = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, baseColor.rgb);

    if (iridescenceThickness == 0.0) {
      iridescence = 0.0;
    }
  #else
    float iridescence = 0.0;
    vec3 iridescenceFresnel_dielectric = vec3(0.0);
    vec3 iridescenceFresnel_metal = vec3(0.0);
  #endif // RN_USE_IRIDESCENCE

  ClearcoatProps clearcoatProps;
  #ifdef RN_USE_CLEARCOAT
    // Clearcoat
    float clearcoatFactor = get_clearcoatFactor(materialSID, 0u);
    vec2 clearcoatTextureTransformScale = get_clearcoatTextureTransformScale(materialSID, 0u);
    vec2 clearcoatTextureTransformOffset = get_clearcoatTextureTransformOffset(materialSID, 0u);
    float clearcoatTextureTransformRotation = get_clearcoatTextureTransformRotation(materialSID, 0u);
    int clearcoatTexcoordIndex = get_clearcoatTexcoordIndex(materialSID, 0u);
    vec2 clearcoatTexcoord = getTexcoord(clearcoatTexcoordIndex);
    vec2 clearcoatTexUv = uvTransform(clearcoatTextureTransformScale, clearcoatTextureTransformOffset, clearcoatTextureTransformRotation, clearcoatTexcoord);
    float clearcoatTexture = texture(u_clearcoatTexture, clearcoatTexUv).r;
    clearcoatProps.clearcoat = clearcoatFactor * clearcoatTexture;

    float clearcoatRoughnessFactor = get_clearcoatRoughnessFactor(materialSID, 0u);
    int clearcoatRoughnessTexcoordIndex = get_clearcoatRoughnessTexcoordIndex(materialSID, 0u);
    vec2 clearcoatRoughnessTexcoord = getTexcoord(clearcoatRoughnessTexcoordIndex);
    vec2 clearcoatRoughnessTextureTransformScale = get_clearcoatRoughnessTextureTransformScale(materialSID, 0u);
    vec2 clearcoatRoughnessTextureTransformOffset = get_clearcoatRoughnessTextureTransformOffset(materialSID, 0u);
    float clearcoatRoughnessTextureTransformRotation = get_clearcoatRoughnessTextureTransformRotation(materialSID, 0u);
    vec2 clearcoatRoughnessTexUv = uvTransform(clearcoatRoughnessTextureTransformScale, clearcoatRoughnessTextureTransformOffset, clearcoatRoughnessTextureTransformRotation, clearcoatRoughnessTexcoord);
    float textureRoughnessTexture = texture(u_clearcoatRoughnessTexture, clearcoatRoughnessTexUv).g;
    clearcoatProps.clearcoatRoughness = clearcoatRoughnessFactor * textureRoughnessTexture;

    int clearcoatNormalTexcoordIndex = get_clearcoatNormalTexcoordIndex(materialSID, 0u);
    vec2 clearcoatNormalTexcoord = getTexcoord(clearcoatNormalTexcoordIndex);
    vec2 clearcoatNormalTextureTransformScale = get_clearcoatNormalTextureTransformScale(materialSID, 0u);
    vec2 clearcoatNormalTextureTransformOffset = get_clearcoatNormalTextureTransformOffset(materialSID, 0u);
    float clearcoatNormalTextureTransformRotation = get_clearcoatNormalTextureTransformRotation(materialSID, 0u);
    vec2 clearcoatNormalTexUv = uvTransform(clearcoatNormalTextureTransformScale, clearcoatNormalTextureTransformOffset, clearcoatNormalTextureTransformRotation, clearcoatNormalTexcoord);
    vec3 textureNormal_tangent = texture(u_clearcoatNormalTexture, clearcoatNormalTexUv).xyz * vec3(2.0) - vec3(1.0);
    clearcoatProps.clearcoatNormal_inWorld = normalize(TBN * textureNormal_tangent);
    clearcoatProps.VdotNc = saturate(dot(viewDirection, clearcoatProps.clearcoatNormal_inWorld));

    clearcoatProps.clearcoatF0 = vec3(pow((ior - 1.0) / (ior + 1.0), 2.0));
    clearcoatProps.clearcoatF90 = vec3(1.0);
    clearcoatProps.clearcoatFresnel = fresnelSchlick(clearcoatProps.clearcoatF0, clearcoatProps.clearcoatF90, clearcoatProps.VdotNc);
  #else
    clearcoatProps.clearcoat = 0.0;
    clearcoatProps.clearcoatRoughness = 0.0;
    clearcoatProps.clearcoatNormal_inWorld = vec3(0.0);
    clearcoatProps.VdotNc = 0.0;
    clearcoatProps.clearcoatF0 = vec3(0.0);
    clearcoatProps.clearcoatF90 = vec3(0.0);
    clearcoatProps.clearcoatFresnel = vec3(0.0);
  #endif // RN_USE_CLEARCOAT

  VolumeProps volumeProps;
  #ifdef RN_USE_VOLUME
    // Volume
    float thicknessFactor = get_thicknessFactor(materialSID, 0u);
    vec2 thicknessTextureTransformScale = get_thicknessTextureTransformScale(materialSID, 0u);
    vec2 thicknessTextureTransformOffset = get_thicknessTextureTransformOffset(materialSID, 0u);
    float thicknessTextureTransformRotation = get_thicknessTextureTransformRotation(materialSID, 0u);
    int thicknessTexcoordIndex = get_thicknessTexcoordIndex(materialSID, 0u);
    vec2 thicknessTexcoord = getTexcoord(thicknessTexcoordIndex);
    vec2 thicknessTexUv = uvTransform(thicknessTextureTransformScale, thicknessTextureTransformOffset, thicknessTextureTransformRotation, thicknessTexcoord);
    float thicknessTexture = texture(u_thicknessTexture, thicknessTexUv).g;
    volumeProps.attenuationDistance = get_attenuationDistance(materialSID, 0u);
    volumeProps.attenuationColor = get_attenuationColor(materialSID, 0u);
    volumeProps.thickness = thicknessFactor * thicknessTexture;
  #else
    volumeProps.thickness = 0.0;
    volumeProps.attenuationColor = vec3(0.0);
    volumeProps.attenuationDistance = 0.000001;
  #endif // RN_USE_VOLUME

  #ifdef RN_USE_SHEEN
    // Sheen
    vec3 sheenColorFactor = get_sheenColorFactor(materialSID, 0u);
    vec2 sheenColorTextureTransformScale = get_sheenColorTextureTransformScale(materialSID, 0u);
    vec2 sheenColorTextureTransformOffset = get_sheenColorTextureTransformOffset(materialSID, 0u);
    float sheenColorTextureTransformRotation = get_sheenColorTextureTransformRotation(materialSID, 0u);
    int sheenColorTexcoordIndex = get_sheenColorTexcoordIndex(materialSID, 0u);
    vec2 sheenColorTexcoord = getTexcoord(sheenColorTexcoordIndex);
    vec2 sheenColorTexUv = uvTransform(sheenColorTextureTransformScale, sheenColorTextureTransformOffset, sheenColorTextureTransformRotation, sheenColorTexcoord);
    vec3 sheenColorTexture = texture(u_sheenColorTexture, sheenColorTexUv).rgb;

    float sheenRoughnessFactor = get_sheenRoughnessFactor(materialSID, 0u);
    vec2 sheenRoughnessTextureTransformScale = get_sheenRoughnessTextureTransformScale(materialSID, 0u);
    vec2 sheenRoughnessTextureTransformOffset = get_sheenRoughnessTextureTransformOffset(materialSID, 0u);
    float sheenRoughnessTextureTransformRotation = get_sheenRoughnessTextureTransformRotation(materialSID, 0u);
    int sheenRoughnessTexcoordIndex = get_sheenRoughnessTexcoordIndex(materialSID, 0u);
    vec2 sheenRoughnessTexcoord = getTexcoord(sheenRoughnessTexcoordIndex);
    vec2 sheenRoughnessTexUv = uvTransform(sheenRoughnessTextureTransformScale, sheenRoughnessTextureTransformOffset, sheenRoughnessTextureTransformRotation, sheenRoughnessTexcoord);
    float sheenRoughnessTexture = texture(u_sheenRoughnessTexture, sheenRoughnessTexUv).a;

    vec3 sheenColor = sheenColorFactor * sheenColorTexture;
    float sheenRoughness = clamp(sheenRoughnessFactor * sheenRoughnessTexture, 0.000001, 1.0);
    float albedoSheenScalingNdotV = 1.0 - max3(sheenColor) * texture(u_sheenLutTexture, vec2(NdotV, sheenRoughness)).r;
  #else
    vec3 sheenColor = vec3(0.0);
    float sheenRoughness = 0.000001;
    float albedoSheenScalingNdotV = 1.0;
  #endif // RN_USE_SHEEN

  #ifdef RN_USE_DIFFUSE_TRANSMISSION
    float diffuseTransmissionFactor = get_diffuseTransmissionFactor(materialSID, 0u);
    vec2 diffuseTransmissionTextureTransformScale = get_diffuseTransmissionTextureTransformScale(materialSID, 0u);
    vec2 diffuseTransmissionTextureTransformOffset = get_diffuseTransmissionTextureTransformOffset(materialSID, 0u);
    float diffuseTransmissionTextureTransformRotation = get_diffuseTransmissionTextureTransformRotation(materialSID, 0u);
    int diffuseTransmissionTexcoordIndex = get_diffuseTransmissionTexcoordIndex(materialSID, 0u);
    vec2 diffuseTransmissionTexcoord = getTexcoord(diffuseTransmissionTexcoordIndex);
    vec2 diffuseTransmissionTexUv = uvTransform(diffuseTransmissionTextureTransformScale, diffuseTransmissionTextureTransformOffset, diffuseTransmissionTextureTransformRotation, diffuseTransmissionTexcoord);
    float diffuseTransmissionTexture = texture(u_diffuseTransmissionTexture, diffuseTransmissionTexUv).a;
    float diffuseTransmission = diffuseTransmissionFactor * diffuseTransmissionTexture;

    vec3 diffuseTransmissionColorFactor = get_diffuseTransmissionColorFactor(materialSID, 0u);
    vec2 diffuseTransmissionColorTextureTransformScale = get_diffuseTransmissionColorTextureTransformScale(materialSID, 0u);
    vec2 diffuseTransmissionColorTextureTransformOffset = get_diffuseTransmissionColorTextureTransformOffset(materialSID, 0u);
    float diffuseTransmissionColorTextureTransformRotation = get_diffuseTransmissionColorTextureTransformRotation(materialSID, 0u);
    int diffuseTransmissionColorTexcoordIndex = get_diffuseTransmissionColorTexcoordIndex(materialSID, 0u);
    vec2 diffuseTransmissionColorTexcoord = getTexcoord(diffuseTransmissionColorTexcoordIndex);
    vec2 diffuseTransmissionColorTexUv = uvTransform(diffuseTransmissionColorTextureTransformScale, diffuseTransmissionColorTextureTransformOffset, diffuseTransmissionColorTextureTransformRotation, diffuseTransmissionColorTexcoord);
    vec3 diffuseTransmissionColorTexture = texture(u_diffuseTransmissionColorTexture, diffuseTransmissionColorTexUv).rgb;
    vec3 diffuseTransmissionColor = diffuseTransmissionColorFactor * diffuseTransmissionColorTexture;

    float diffuseTransmissionThickness = 1.0;
  #ifdef RN_USE_VOLUME
    mat4 worldMatrix = get_worldMatrix(uint(v_instanceInfo));
    diffuseTransmissionThickness = thickness * (length(worldMatrix[0].xyz) * length(worldMatrix[1].xyz) * length(worldMatrix[2].xyz)) / 3.0;
  #endif // RN_USE_VOLUME

  #else
    float diffuseTransmission = 0.0;
    vec3 diffuseTransmissionColor = vec3(0.0);
    float diffuseTransmissionThickness = 0.0;
  #endif // RN_USE_DIFFUSE_TRANSMISSION

  rt0 = vec4(0.0, 0.0, 0.0, baseColor.a);

  // Punctual Lights
  for (int i = 0; i < lightNumber; i++) {
    Light light = getLight(i, v_position_inWorld.xyz);
    if (light.type < 0) {
      continue;
    }
    vec3 lighting = lightingWithPunctualLight(light, normal_inWorld, viewDirection, NdotV, baseColor.rgb,
                        perceptualRoughness, metallic, dielectricF0, dielectricF90, ior, transmission, volumeProps,
                        clearcoatProps,
                        anisotropyProps,
                        sheenColor, sheenRoughness, albedoSheenScalingNdotV,
                        iridescence, iridescenceFresnel_dielectric, iridescenceFresnel_metal, specularWeight,
                        diffuseTransmission, diffuseTransmissionColor, diffuseTransmissionThickness);

  #ifdef RN_USE_SHADOW_MAPPING
    int depthTextureIndex = get_depthTextureIndexList(materialSID, uint(i));
    if (light.type == 1 && depthTextureIndex >= 0) { // Point Light
      float pointLightFarPlane = get_pointLightFarPlane(materialSID, 0u);
      float pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0u);
      float shadowContribution = varianceShadowContributionParaboloid(v_position_inWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, depthTextureIndex);
      lighting *= shadowContribution;
    } else if ((light.type == 0 || light.type == 2) && depthTextureIndex >= 0) { // Spot Light
      vec4 shadowCoordVec4 = get_depthBiasPV(materialSID, uint(i)) * v_position_inWorld;
      vec2 shadowCoord = shadowCoordVec4.xy / shadowCoordVec4.w;
      float normalizedDepth = shadowCoordVec4.z / shadowCoordVec4.w;

      // Slope-scaled bias in normalized depth space to reduce shadow acne
      float NdotL = max(dot(normal_inWorld, light.direction), 0.0);
      float baseBias = 0.001;
      float slopeBias = 0.005 * sqrt(1.0 - NdotL * NdotL) / max(NdotL, 0.05);
      float bias = min(baseBias + slopeBias, 0.05);  // Clamp to prevent excessive bias

      vec3 lightDirection = normalize(get_lightDirection(uint(i)));
      vec3 lightPosToWorldPos = normalize(v_position_inWorld.xyz - light.position);
      float dotProduct = dot(lightPosToWorldPos, lightDirection);
      float shadowContribution = 1.0;
      if (dotProduct > 0.0 && shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
        shadowContribution = varianceShadowContribution(shadowCoord, normalizedDepth - bias, depthTextureIndex);
      }
      lighting *= shadowContribution;
    }
  #endif

    rt0.rgb += lighting;
  }

  // Image-based Lighting
  vec3 ibl = IBLContribution(materialSID, normal_inWorld, NdotV, viewDirection,
    baseColor.rgb, perceptualRoughness, clearcoatProps, geomNormal_inWorld, cameraSID, transmission, v_position_inWorld.xyz, volumeProps.thickness,
    sheenColor, sheenRoughness, albedoSheenScalingNdotV,
    ior, iridescenceFresnel_dielectric, iridescenceFresnel_metal, iridescence,
    anisotropyProps, specularWeight, dielectricF0, metallic,
    diffuseTransmission, diffuseTransmissionColor, diffuseTransmissionThickness);

  #ifdef RN_USE_OCCLUSION_TEXTURE
    int occlusionTexcoordIndex = get_occlusionTexcoordIndex(materialSID, 0u);
    vec2 occlusionTexcoord = getTexcoord(occlusionTexcoordIndex);
    vec2 occlusionTextureTransformScale = get_occlusionTextureTransformScale(materialSID, 0u);
    vec2 occlusionTextureTransformOffset = get_occlusionTextureTransformOffset(materialSID, 0u);
    float occlusionTextureTransformRotation = get_occlusionTextureTransformRotation(materialSID, 0u);
    vec2 occlusionTexUv = uvTransform(occlusionTextureTransformScale, occlusionTextureTransformOffset, occlusionTextureTransformRotation, occlusionTexcoord);
    float occlusion = texture(u_occlusionTexture, occlusionTexUv).r;
    float occlusionStrength = get_occlusionStrength(materialSID, 0u);
    // Occlusion to Indirect Lights
    vec3 indirectLight = ibl * (1.0 + occlusionStrength * (occlusion - 1.0));
  #else
    vec3 indirectLight = ibl;
  #endif

  rt0.xyz += indirectLight;
#else
  rt0 = baseColor;
#endif // RN_IS_LIGHTING

  // Emissive
  vec3 emissiveFactor = get_emissiveFactor(materialSID, 0u);
  #ifdef RN_USE_EMISSIVE_TEXTURE
    int emissiveTexcoordIndex = get_emissiveTexcoordIndex(materialSID, 0u);
    vec2 emissiveTexcoord = getTexcoord(emissiveTexcoordIndex);
    vec2 emissiveTextureTransformScale = get_emissiveTextureTransformScale(materialSID, 0u);
    vec2 emissiveTextureTransformOffset = get_emissiveTextureTransformOffset(materialSID, 0u);
    float emissiveTextureTransformRotation = get_emissiveTextureTransformRotation(materialSID, 0u);
    vec2 emissiveTexUv = uvTransform(emissiveTextureTransformScale, emissiveTextureTransformOffset, emissiveTextureTransformRotation, emissiveTexcoord);
    vec3 emissive = emissiveFactor * srgbToLinear(texture(u_emissiveTexture, emissiveTexUv).xyz);
  #else
    vec3 emissive = emissiveFactor;
  #endif
#ifdef RN_USE_EMISSIVE_STRENGTH
  float emissiveStrength = get_emissiveStrength(materialSID, 0u);
  emissive *= emissiveStrength;
#endif // RN_USE_EMISSIVE_STRENGTH

#ifdef RN_USE_CLEARCOAT
  vec3 coated_emissive = emissive * mix(vec3(1.0), vec3(0.04 + (1.0 - 0.04) * pow(1.0 - NdotV, 5.0)), clearcoatProps.clearcoat * clearcoatProps.clearcoatFresnel);
  rt0.xyz += coated_emissive;
#else
  rt0.xyz += emissive;
#endif // RN_USE_CLEARCOAT

  bool isOutputHDR = get_isOutputHDR(materialSID, 0u);
  if(isOutputHDR){

    return;
  }

  // Wireframe
  /* shaderity: @{wireframe} */

  /* shaderity: @{outputSrgb} */
rt0.rgb = rt0.rgb * rt0.a; // alpha premultiplied
rt1 = rt0;
rt2 = rt0;
rt3 = rt0;


}
