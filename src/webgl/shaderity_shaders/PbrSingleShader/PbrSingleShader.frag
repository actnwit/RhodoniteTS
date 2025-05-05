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
in float v_displayIdx;

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
uniform float u_emissiveStrength; // initialValue=1
uniform vec3 u_wireframe; // initialValue=(0,0,1)
uniform bool u_isOutputHDR; // initialValue=0
uniform bool u_makeOutputSrgb; // initialValue=1
uniform vec4 u_iblParameter; // initialValue=(1,1,1,1), isInternalSetting=true
uniform ivec2 u_hdriFormat; // initialValue=(0,0), isInternalSetting=true
uniform samplerCube u_diffuseEnvTexture; // initialValue=(5,black), isInternalSetting=true
uniform samplerCube u_specularEnvTexture; // initialValue=(6,black), isInternalSetting=true
uniform vec2 u_baseColorTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_baseColorTextureTransformOffset; // initialValue=(0,0)
uniform float u_baseColorTextureTransformRotation; // initialValue=0
uniform vec2 u_metallicRoughnessTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_metallicRoughnessTextureTransformOffset; // initialValue=(0,0)
uniform float u_metallicRoughnessTextureTransformRotation; // initialValue=0
uniform int u_baseColorTexcoordIndex; // initialValue=0
uniform int u_metallicRoughnessTexcoordIndex; // initialValue=0
uniform int u_occlusionTexcoordIndex; // initialValue=0
uniform vec2 u_occlusionTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_occlusionTextureTransformOffset; // initialValue=(0,0)
uniform float u_occlusionTextureTransformRotation; // initialValue=0
uniform int u_emissiveTexcoordIndex; // initialValue=0
uniform vec2 u_emissiveTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_emissiveTextureTransformOffset; // initialValue=(0,0)
uniform float u_emissiveTextureTransformRotation; // initialValue=0
uniform float u_occlusionStrength; // initialValue=1
uniform bool u_inverseEnvironment; // initialValue=false
uniform float u_ior; // initialValue=1.5

#ifdef RN_USE_NORMAL_TEXTURE
  uniform sampler2D u_normalTexture; // initialValue=(2,black)
  uniform vec2 u_normalTextureTransformScale; // initialValue=(1,1)
  uniform vec2 u_normalTextureTransformOffset; // initialValue=(0,0)
  uniform float u_normalTextureTransformRotation; // initialValue=0
  uniform int u_normalTexcoordIndex; // initialValue=0
  uniform float u_normalScale; // initialValue=(1)
#endif

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

#ifdef RN_USE_VOLUME
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

uniform float u_alphaCutoff; // initialValue=(0.01)

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/opticalDefinition.glsl)

/* shaderity: @{matricesGetters} */

#ifdef RN_USE_SHADOW_MAPPING
  uniform float u_pointLightFarPlane; // initialValue=1000.0
  uniform float u_pointLightShadowMapUvScale; // initialValue=0.93
#endif

#pragma shaderity: require(../common/shadow.glsl)

#pragma shaderity: require(../common/pbrDefinition.glsl)
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

  // BaseColor
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
  vec2 baseColorTextureTransformScale = get_baseColorTextureTransformScale(materialSID, 0);
  vec2 baseColorTextureTransformOffset = get_baseColorTextureTransformOffset(materialSID, 0);
  float baseColorTextureTransformRotation = get_baseColorTextureTransformRotation(materialSID, 0);
  int baseColorTexcoordIndex = get_baseColorTexcoordIndex(materialSID, 0);
  vec2 baseColorTexcoord = getTexcoord(baseColorTexcoordIndex);
  vec2 baseColorTexUv = uvTransform(baseColorTextureTransformScale, baseColorTextureTransformOffset, baseColorTextureTransformRotation, baseColorTexcoord);
  vec4 textureColor = texture(u_baseColorTexture, baseColorTexUv);
  baseColor *= srgbToLinear(textureColor.rgb);
  alpha *= textureColor.a;

#pragma shaderity: require(../common/alphaMask.glsl)

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  vec3 geomNormal_inWorld = normal_inWorld;
  #ifdef RN_USE_NORMAL_TEXTURE
    vec2 normalTextureTransformScale = get_normalTextureTransformScale(materialSID, 0);
    vec2 normalTextureTransformOffset = get_normalTextureTransformOffset(materialSID, 0);
    float normalTextureTransformRotation = get_normalTextureTransformRotation(materialSID, 0);
    int normalTexcoordIndex = get_normalTexcoordIndex(materialSID, 0);
    vec2 normalTexcoord = getTexcoord(normalTexcoordIndex);
    vec2 normalTexUv = uvTransform(normalTextureTransformScale, normalTextureTransformOffset, normalTextureTransformRotation, normalTexcoord);
    mat3 TBN = getTBN(normal_inWorld, viewVector, normalTexUv);
    vec3 normalTexValue = texture(u_normalTexture, normalTexUv).xyz;
    if(normalTexValue.b >= 128.0 / 255.0) {
      // normal texture is existence
      vec3 normalTex = normalTexValue * 2.0 - 1.0;
      float normalScale = get_normalScale(materialSID, 0);
      vec3 scaledNormal = normalize(normalTex * vec3(normalScale, normalScale, 1.0));
      normal_inWorld = normalize(TBN * scaledNormal);
    }
  #endif

#ifdef RN_IS_LIGHTING
  // Metallic & Roughness
  vec2 metallicRoughnessFactor = get_metallicRoughnessFactor(materialSID, 0);
  float metallic = metallicRoughnessFactor.x;
  vec2 metallicRoughnessTextureTransformScale = get_metallicRoughnessTextureTransformScale(materialSID, 0);
  vec2 metallicRoughnessTextureTransformOffset = get_metallicRoughnessTextureTransformOffset(materialSID, 0);
  float metallicRoughnessTextureTransformRotation = get_metallicRoughnessTextureTransformRotation(materialSID, 0);
  int metallicRoughnessTexcoordIndex = get_metallicRoughnessTexcoordIndex(materialSID, 0);
  vec2 metallicRoughnessTexcoord = getTexcoord(metallicRoughnessTexcoordIndex);
  vec2 metallicRoughnessTexUv = uvTransform(metallicRoughnessTextureTransformScale, metallicRoughnessTextureTransformOffset, metallicRoughnessTextureTransformRotation, metallicRoughnessTexcoord);
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
    vec2 anisotropyTextureTransformScale = get_anisotropyTextureTransformScale(materialSID, 0);
    vec2 anisotropyTextureTransformOffset = get_anisotropyTextureTransformOffset(materialSID, 0);
    float anisotropyTextureTransformRotation = get_anisotropyTextureTransformRotation(materialSID, 0);
    int anisotropyTexcoordIndex = get_anisotropyTexcoordIndex(materialSID, 0);
    vec2 anisotropyTexcoord = getTexcoord(anisotropyTexcoordIndex);
    vec2 anisotropyTexUv = uvTransform(anisotropyTextureTransformScale, anisotropyTextureTransformOffset, anisotropyTextureTransformRotation, anisotropyTexcoord);
    vec3 anisotropyTex = texture(u_anisotropyTexture, anisotropyTexUv).rgb;
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

  float ior = get_ior(materialSID, 0);

    // Transmission
  #ifdef RN_USE_TRANSMISSION
    float transmissionFactor = get_transmissionFactor(materialSID, 0);
    vec2 transmissionTextureTransformScale = get_transmissionTextureTransformScale(materialSID, 0);
    vec2 transmissionTextureTransformOffset = get_transmissionTextureTransformOffset(materialSID, 0);
    float transmissionTextureTransformRotation = get_transmissionTextureTransformRotation(materialSID, 0);
    int transmissionTexcoordIndex = get_transmissionTexcoordIndex(materialSID, 0);
    vec2 transmissionTexcoord = getTexcoord(transmissionTexcoordIndex);
    vec2 transmissionTexUv = uvTransform(transmissionTextureTransformScale, transmissionTextureTransformOffset, transmissionTextureTransformRotation, transmissionTexcoord);
    float transmissionTexture = texture(u_transmissionTexture, transmissionTexUv).r;
    float transmission = transmissionFactor * transmissionTexture;
    // alpha *= transmission;
  #else
    float transmission = 0.0;
  #endif // RN_USE_TRANSMISSION

  #ifdef RN_USE_SPECULAR
    vec2 specularTextureTransformScale = get_specularTextureTransformScale(materialSID, 0);
    vec2 specularTextureTransformOffset = get_specularTextureTransformOffset(materialSID, 0);
    float specularTextureTransformRotation = get_specularTextureTransformRotation(materialSID, 0);
    int specularTexcoordIndex = get_specularTexcoordIndex(materialSID, 0);
    vec2 specularTexcoord = getTexcoord(specularTexcoordIndex);
    vec2 specularTexUv = uvTransform(specularTextureTransformScale, specularTextureTransformOffset, specularTextureTransformRotation, specularTexcoord);
    float specularTexture = texture(u_specularTexture, specularTexUv).a;
    float specular = get_specularFactor(materialSID, 0) * specularTexture;
    vec2 specularColorTextureTransformScale = get_specularColorTextureTransformScale(materialSID, 0);
    vec2 specularColorTextureTransformOffset = get_specularColorTextureTransformOffset(materialSID, 0);
    float specularColorTextureTransformRotation = get_specularColorTextureTransformRotation(materialSID, 0);
    int specularColorTexcoordIndex = get_specularColorTexcoordIndex(materialSID, 0);
    vec2 specularColorTexcoord = getTexcoord(specularColorTexcoordIndex);
    vec2 specularColorTexUv = uvTransform(specularColorTextureTransformScale, specularColorTextureTransformOffset, specularColorTextureTransformRotation, specularColorTexcoord);
    vec3 specularColorTexture = srgbToLinear(texture(u_specularColorTexture, specularColorTexUv).rgb);
    vec3 specularColor = get_specularColorFactor(materialSID, 0) * specularColorTexture;
  #else
    float specular = 1.0;
    vec3 specularColor = vec3(1.0, 1.0, 1.0);
  #endif // RN_USE_SPECULAR

  // F0, F90
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
    vec2 iridescenceTextureTransformScale = get_iridescenceTextureTransformScale(materialSID, 0);
    vec2 iridescenceTextureTransformOffset = get_iridescenceTextureTransformOffset(materialSID, 0);
    float iridescenceTextureTransformRotation = get_iridescenceTextureTransformRotation(materialSID, 0);
    int iridescenceTexcoordIndex = get_iridescenceTexcoordIndex(materialSID, 0);
    vec2 iridescenceTexcoord = getTexcoord(iridescenceTexcoordIndex);
    vec2 iridescenceTexUv = uvTransform(iridescenceTextureTransformScale, iridescenceTextureTransformOffset, iridescenceTextureTransformRotation, iridescenceTexcoord);
    float iridescenceTexture = texture(u_iridescenceTexture, iridescenceTexUv).r;
    float iridescence = iridescenceFactor * iridescenceTexture;

    vec2 iridescenceThicknessTextureTransformScale = get_iridescenceThicknessTextureTransformScale(materialSID, 0);
    vec2 iridescenceThicknessTextureTransformOffset = get_iridescenceThicknessTextureTransformOffset(materialSID, 0);
    float iridescenceThicknessTextureTransformRotation = get_iridescenceThicknessTextureTransformRotation(materialSID, 0);
    int iridescenceThicknessTexcoordIndex = get_iridescenceThicknessTexcoordIndex(materialSID, 0);
    vec2 iridescenceThicknessTexcoord = getTexcoord(iridescenceThicknessTexcoordIndex);
    vec2 iridescenceThicknessTexUv = uvTransform(iridescenceThicknessTextureTransformScale, iridescenceThicknessTextureTransformOffset, iridescenceThicknessTextureTransformRotation, iridescenceThicknessTexcoord);
    float thicknessRatio = texture(u_iridescenceThicknessTexture, iridescenceThicknessTexUv).g;
    float iridescenceThicknessMinimum = get_iridescenceThicknessMinimum(materialSID, 0);
    float iridescenceThicknessMaximum = get_iridescenceThicknessMaximum(materialSID, 0);
    float iridescenceThickness = mix(iridescenceThicknessMinimum, iridescenceThicknessMaximum, thicknessRatio);

    float iridescenceIor = get_iridescenceIor(materialSID, 0);
    vec3 iridescenceFresnel = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, F0);
    vec3 iridescenceFresnel_dielectric = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, dielectricSpecularF0);
    vec3 iridescenceFresnel_metal = calcIridescence(1.0, iridescenceIor, NdotV, iridescenceThickness, baseColor.rgb);
    vec3 iridescenceF0 = Schlick_to_F0(iridescenceFresnel, NdotV);

    if (iridescenceThickness == 0.0) {
      iridescence = 0.0;
    }
  #else
    float iridescence = 0.0;
    vec3 iridescenceFresnel = vec3(0.0);
    vec3 iridescenceFresnel_dielectric = vec3(0.0);
    vec3 iridescenceFresnel_metal = vec3(0.0);
    vec3 iridescenceF0 = F0;
  #endif // RN_USE_IRIDESCENCE

  #ifdef RN_USE_CLEARCOAT
    // Clearcoat
    float clearcoatFactor = get_clearcoatFactor(materialSID, 0);
    vec2 clearcoatTextureTransformScale = get_clearcoatTextureTransformScale(materialSID, 0);
    vec2 clearcoatTextureTransformOffset = get_clearcoatTextureTransformOffset(materialSID, 0);
    float clearcoatTextureTransformRotation = get_clearcoatTextureTransformRotation(materialSID, 0);
    int clearcoatTexcoordIndex = get_clearcoatTexcoordIndex(materialSID, 0);
    vec2 clearcoatTexcoord = getTexcoord(clearcoatTexcoordIndex);
    vec2 clearcoatTexUv = uvTransform(clearcoatTextureTransformScale, clearcoatTextureTransformOffset, clearcoatTextureTransformRotation, clearcoatTexcoord);
    float clearcoatTexture = texture(u_clearcoatTexture, clearcoatTexUv).r;
    float clearcoat = clearcoatFactor * clearcoatTexture;

    float clearcoatRoughnessFactor = get_clearcoatRoughnessFactor(materialSID, 0);
    int clearcoatRoughnessTexcoordIndex = get_clearcoatRoughnessTexcoordIndex(materialSID, 0);
    vec2 clearcoatRoughnessTexcoord = getTexcoord(clearcoatRoughnessTexcoordIndex);
    vec2 clearcoatRoughnessTextureTransformScale = get_clearcoatRoughnessTextureTransformScale(materialSID, 0);
    vec2 clearcoatRoughnessTextureTransformOffset = get_clearcoatRoughnessTextureTransformOffset(materialSID, 0);
    float clearcoatRoughnessTextureTransformRotation = get_clearcoatRoughnessTextureTransformRotation(materialSID, 0);
    vec2 clearcoatRoughnessTexUv = uvTransform(clearcoatRoughnessTextureTransformScale, clearcoatRoughnessTextureTransformOffset, clearcoatRoughnessTextureTransformRotation, clearcoatRoughnessTexcoord);
    float textureRoughnessTexture = texture(u_clearcoatRoughnessTexture, clearcoatRoughnessTexUv).g;
    float clearcoatRoughness = clearcoatRoughnessFactor * textureRoughnessTexture;

    int clearcoatNormalTexcoordIndex = get_clearcoatNormalTexcoordIndex(materialSID, 0);
    vec2 clearcoatNormalTexcoord = getTexcoord(clearcoatNormalTexcoordIndex);
    vec2 clearcoatNormalTextureTransformScale = get_clearcoatNormalTextureTransformScale(materialSID, 0);
    vec2 clearcoatNormalTextureTransformOffset = get_clearcoatNormalTextureTransformOffset(materialSID, 0);
    float clearcoatNormalTextureTransformRotation = get_clearcoatNormalTextureTransformRotation(materialSID, 0);
    vec2 clearcoatNormalTexUv = uvTransform(clearcoatNormalTextureTransformScale, clearcoatNormalTextureTransformOffset, clearcoatNormalTextureTransformRotation, clearcoatNormalTexcoord);
    vec3 textureNormal_tangent = texture(u_clearcoatNormalTexture, clearcoatNormalTexUv).xyz * vec3(2.0) - vec3(1.0);
    vec3 clearcoatNormal_inWorld = normalize(TBN * textureNormal_tangent);
    float VdotNc = saturateEpsilonToOne(dot(viewDirection, clearcoatNormal_inWorld));

    vec3 clearcoatF0 = vec3(pow((ior - 1.0) / (ior + 1.0), 2.0));
    vec3 clearcoatF90 = vec3(1.0);
    vec3 clearcoatFresnel = fresnelSchlick(clearcoatF0, clearcoatF90, VdotNc);
  #else
    float clearcoat = 0.0;
    float clearcoatRoughness = 0.0;
    vec3 clearcoatNormal_inWorld = vec3(0.0);
    float VdotNc = 0.0;
    vec3 clearcoatF0 = vec3(0.0);
    vec3 clearcoatF90 = vec3(0.0);
    vec3 clearcoatFresnel = vec3(0.0);
  #endif // RN_USE_CLEARCOAT

  #ifdef RN_USE_VOLUME
    // Volume
    float thicknessFactor = get_thicknessFactor(materialSID, 0);
    vec2 thicknessTextureTransformScale = get_thicknessTextureTransformScale(materialSID, 0);
    vec2 thicknessTextureTransformOffset = get_thicknessTextureTransformOffset(materialSID, 0);
    float thicknessTextureTransformRotation = get_thicknessTextureTransformRotation(materialSID, 0);
    int thicknessTexcoordIndex = get_thicknessTexcoordIndex(materialSID, 0);
    vec2 thicknessTexcoord = getTexcoord(thicknessTexcoordIndex);
    vec2 thicknessTexUv = uvTransform(thicknessTextureTransformScale, thicknessTextureTransformOffset, thicknessTextureTransformRotation, thicknessTexcoord);
    float thicknessTexture = texture(u_thicknessTexture, thicknessTexUv).g;
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
    vec2 sheenColorTextureTransformScale = get_sheenColorTextureTransformScale(materialSID, 0);
    vec2 sheenColorTextureTransformOffset = get_sheenColorTextureTransformOffset(materialSID, 0);
    float sheenColorTextureTransformRotation = get_sheenColorTextureTransformRotation(materialSID, 0);
    int sheenColorTexcoordIndex = get_sheenColorTexcoordIndex(materialSID, 0);
    vec2 sheenColorTexcoord = getTexcoord(sheenColorTexcoordIndex);
    vec2 sheenColorTexUv = uvTransform(sheenColorTextureTransformScale, sheenColorTextureTransformOffset, sheenColorTextureTransformRotation, sheenColorTexcoord);
    vec3 sheenColorTexture = texture(u_sheenColorTexture, sheenColorTexUv).rgb;

    float sheenRoughnessFactor = get_sheenRoughnessFactor(materialSID, 0);
    vec2 sheenRoughnessTextureTransformScale = get_sheenRoughnessTextureTransformScale(materialSID, 0);
    vec2 sheenRoughnessTextureTransformOffset = get_sheenRoughnessTextureTransformOffset(materialSID, 0);
    float sheenRoughnessTextureTransformRotation = get_sheenRoughnessTextureTransformRotation(materialSID, 0);
    int sheenRoughnessTexcoordIndex = get_sheenRoughnessTexcoordIndex(materialSID, 0);
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

  rt0 = vec4(0.0, 0.0, 0.0, alpha);

  // Punctual Lights
  for (int i = 0; i < lightNumber; i++) {
    Light light = getLight(i, v_position_inWorld.xyz);
    vec3 lighting = lightingWithPunctualLight(light, normal_inWorld, viewDirection, NdotV, baseColor.rgb, albedo,
                        perceptualRoughness, metallic, dielectricSpecularF0, dielectricSpecularF90, F0, F90, ior, transmission, thickness,
                        clearcoat, clearcoatRoughness, clearcoatF0, clearcoatF90, clearcoatFresnel, clearcoatNormal_inWorld, VdotNc,
                        attenuationColor, attenuationDistance,
                        anisotropy, anisotropicT, anisotropicB, BdotV, TdotV,
                        sheenColor, sheenRoughness, albedoSheenScalingNdotV,
                        iridescence, iridescenceFresnel_dielectric, iridescenceFresnel_metal, specular);

  #ifdef RN_USE_SHADOW_MAPPING
    int depthTextureIndex = get_depthTextureIndexList(materialSID, i);
    if (light.type == 1 && depthTextureIndex >= 0) { // Point Light
      float pointLightFarPlane = get_pointLightFarPlane(materialSID, 0);
      float pointLightShadowMapUvScale = get_pointLightShadowMapUvScale(materialSID, 0);
      float shadowContribution = varianceShadowContributionParaboloid(v_position_inWorld.xyz, light.position, pointLightFarPlane, pointLightShadowMapUvScale, depthTextureIndex);
      lighting *= shadowContribution;
    } else if ((light.type == 0 || light.type == 2) && depthTextureIndex >= 0) { // Spot Light
      vec4 v_shadowCoord = get_depthBiasPV(materialSID, i) * v_position_inWorld;
      float bias = 0.001;
      vec2 shadowCoord = v_shadowCoord.xy / v_shadowCoord.w;
      vec3 lightDirection = normalize(get_lightDirection(0.0, i));
      vec3 lightPosToWorldPos = normalize(v_position_inWorld.xyz - light.position);
      float dotProduct = dot(lightPosToWorldPos, lightDirection);
      float shadowContribution = 1.0;
      if (dotProduct > 0.0 && shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0) {
        shadowContribution = varianceShadowContribution(shadowCoord, (v_shadowCoord.z - bias)/v_shadowCoord.w, depthTextureIndex);
      }
      lighting *= shadowContribution;
    }
  #endif

    rt0.rgb += lighting;
  }

  // Image-based Lighting
  vec3 ibl = IBLContribution(materialSID, normal_inWorld, NdotV, viewDirection,
    albedo, F0, perceptualRoughness, clearcoatRoughness, clearcoatNormal_inWorld,
    clearcoat, VdotNc, geomNormal_inWorld, cameraSID, transmission, v_position_inWorld.xyz, thickness,
    sheenColor, sheenRoughness, albedoSheenScalingNdotV,
    ior, iridescenceFresnel, iridescenceF0, iridescence,
    anisotropy, anisotropicB, specular);

  int occlusionTexcoordIndex = get_occlusionTexcoordIndex(materialSID, 0);
  vec2 occlusionTexcoord = getTexcoord(occlusionTexcoordIndex);
  vec2 occlusionTextureTransformScale = get_occlusionTextureTransformScale(materialSID, 0);
  vec2 occlusionTextureTransformOffset = get_occlusionTextureTransformOffset(materialSID, 0);
  float occlusionTextureTransformRotation = get_occlusionTextureTransformRotation(materialSID, 0);
  vec2 occlusionTexUv = uvTransform(occlusionTextureTransformScale, occlusionTextureTransformOffset, occlusionTextureTransformRotation, occlusionTexcoord);
  float occlusion = texture(u_occlusionTexture, occlusionTexUv).r;
  float occlusionStrength = get_occlusionStrength(materialSID, 0);

  // Occlusion to Indirect Lights
  rt0.xyz += mix(ibl, ibl * occlusion, occlusionStrength);
#else
  rt0 = vec4(baseColor, alpha);
#endif // RN_IS_LIGHTING

  // Emissive
  vec3 emissiveFactor = get_emissiveFactor(materialSID, 0);
  int emissiveTexcoordIndex = get_emissiveTexcoordIndex(materialSID, 0);
  vec2 emissiveTexcoord = getTexcoord(emissiveTexcoordIndex);
  vec2 emissiveTextureTransformScale = get_emissiveTextureTransformScale(materialSID, 0);
  vec2 emissiveTextureTransformOffset = get_emissiveTextureTransformOffset(materialSID, 0);
  float emissiveTextureTransformRotation = get_emissiveTextureTransformRotation(materialSID, 0);
  vec2 emissiveTexUv = uvTransform(emissiveTextureTransformScale, emissiveTextureTransformOffset, emissiveTextureTransformRotation, emissiveTexcoord);
  float emissiveStrength = get_emissiveStrength(materialSID, 0);
  vec3 emissive = emissiveFactor * srgbToLinear(texture(u_emissiveTexture, emissiveTexUv).xyz) * emissiveStrength;

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


#ifdef RN_IS_ALPHA_MODE_BLEND
#else
  rt0.a = 1.0;
#endif

#pragma shaderity: require(../common/outputSrgb.glsl)
rt0.rgb = rt0.rgb * rt0.a; // alpha premultiplied
rt1 = rt0;
rt2 = rt0;
rt3 = rt0;
#pragma shaderity: require(../common/glFragColor.glsl)

}
