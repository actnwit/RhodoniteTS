#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableExtensions.glsl)
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

#ifdef RN_USE_TANGENT_ATTRIBUTE
  in vec3 v_tangent_inWorld;
  in vec3 v_binormal_inWorld;
#endif

uniform vec4 u_baseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_baseColorTexture; // initialValue=(0,white)
uniform vec2 u_metallicRoughnessFactor; // initialValue=(1,1)
uniform sampler2D u_metallicRoughnessTexture; // initialValue=(1,white)
uniform sampler2D u_occlusionTexture; // initialValue=(3,white)
uniform sampler2D u_emissiveTexture; // initialValue=(4,black)
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
uniform int u_emissiveTexcoordIndex; // initialValue=0
uniform float u_occlusionStrength; // initialValue=1
uniform bool u_inverseEnvironment; // initialValue=true

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
#endif

#ifdef RN_USE_TRANSMISSION
  uniform float u_transmissionFactor; // initialValue=(0)
#endif

#ifdef RN_USE_VOLUME
  uniform float u_thicknessFactor; // initialValue=(0)
  uniform float u_attenuationDistance; // initialValue=(0.000001)
  uniform vec3 u_attenuationColor; // initialValue=(1,1,1)
#endif

uniform float u_alphaCutoff; // initialValue=(0.01)

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/pbrDefinition.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/opticalDefinition.glsl)

vec3 get_irradiance(vec3 normal_forEnv, float materialSID, ivec2 hdriFormat) {
  vec4 diffuseTexel = textureCube(u_diffuseEnvTexture, normal_forEnv);

  vec3 irradiance;
  if (hdriFormat.x == 0) {
    // LDR_SRGB
    irradiance = srgbToLinear(diffuseTexel.rgb);
  }
  else if (hdriFormat.x == 3) {
    // RGBE
    irradiance = diffuseTexel.rgb * pow(2.0, diffuseTexel.a*255.0-128.0);
  }
  else {
    irradiance = diffuseTexel.rgb;
  }

  return irradiance;
}

float scaleForLod(float perceptualRoughness, float ior)
{
  // Scale roughness to the range [0, 1],
  // ior=1.0 will be scale 0,
  // ior=1.5 will be scale 1.0,
  // ior=2 will be scale 1.0 (clamped),
  float scale = clamp(ior * 2.0 - 2.0, 0.0, 1.0);
  return perceptualRoughness * scale;
}

#ifdef RN_USE_TRANSMISSION
vec3 get_sample_from_backbuffer(float materialSID, vec2 sampleCoord, float perceptualRoughness, float ior) {
  ivec2 vrState = get_vrState(0.0, 0);
  vec2 backBufferTextureSize = get_backBufferTextureSize(materialSID, 0);
  float backBufferTextureLength = max(backBufferTextureSize.x, backBufferTextureSize.y);
  if (vrState.x == 1) { // For VR
    backBufferTextureLength = max(backBufferTextureSize.x / 2.0, backBufferTextureSize.y);
    sampleCoord.x = sampleCoord.x * 0.5;
    if (vrState.y == 1) { // For right eye
      sampleCoord.x += 0.5;
    }
  }
  float framebufferLod = log2(backBufferTextureLength) * scaleForLod(perceptualRoughness, ior);

  #ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
    vec3 transmittedLight = texture2DLodEXT(u_backBufferTexture, sampleCoord, framebufferLod).rgb;
  #elif defined(GLSL_ES3)
    vec3 transmittedLight = textureLod(u_backBufferTexture, sampleCoord, framebufferLod).rgb;
  #else
    vec3 transmittedLight = texture2D(u_backBufferTexture, sampleCoord).rgb;
  #endif

  return transmittedLight;
}
#endif

vec3 get_radiance(vec3 reflection, float lod, ivec2 hdriFormat) {
  #ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
    vec4 specularTexel = textureCubeLodEXT(u_specularEnvTexture, reflection, lod);
  #elif defined(GLSL_ES3)
    vec4 specularTexel = textureLod(u_specularEnvTexture, reflection, lod);
  #else
    vec4 specularTexel = textureCube(u_specularEnvTexture, reflection);
  #endif

// #pragma shaderity: require(./../common/fetchCubeTexture.glsl)

  vec3 radiance;
  if (hdriFormat.y == 0) {
    // LDR_SRGB
    radiance = srgbToLinear(specularTexel.rgb);
  }
  else if (hdriFormat.y == 3) {
    // RGBE
    radiance = specularTexel.rgb * pow(2.0, specularTexel.a*255.0-128.0);
  }
  else {
    radiance = specularTexel.rgb;
  }

  return radiance;
}

// from glTF Sample Viewer: https://github.com/KhronosGroup/glTF-Sample-Viewer
vec3 getVolumeTransmissionRay(vec3 n, vec3 v, float thickness, float ior)
{
  vec3 refractionVector = refract(-v, normalize(n), 1.0 / ior);
  mat4 worldMatrix = get_worldMatrix(v_instanceInfo);

  vec3 modelScale;
  modelScale.x = length(vec3(worldMatrix[0].xyz));
  modelScale.y = length(vec3(worldMatrix[1].xyz));
  modelScale.z = length(vec3(worldMatrix[2].xyz));

  return normalize(refractionVector) * thickness * modelScale;
}

struct IblResult
{
  vec3 specular;
  vec3 diffuse;
  vec3 FssEss;
};

IblResult IBL(float materialSID, vec3 normal_inWorld, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix)
{
  // get irradiance
  vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;
  if (get_inverseEnvironment(materialSID, 0)) {
    normal_forEnv.x *= -1.0;
  }
  vec3 irradiance = get_irradiance(normal_forEnv, materialSID, hdriFormat);

  // get radiance
  vec3 reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);
  if (get_inverseEnvironment(materialSID, 0)) {
    reflection.x *= -1.0;
  }
  float mipCount = iblParameter.x;
  float lod = (perceptualRoughness * (mipCount - 1.0));
  vec3 radiance = get_radiance(reflection, lod, hdriFormat);

  // Roughness dependent fresnel
  vec3 kS = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  // vec3 f_ab = texture2D(u_brdfLutTexture, vec2(1.0 - NdotV, 1.0 - perceptualRoughness)).rgb;
  vec2 f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  vec3 FssEss = kS * f_ab.x + f_ab.y;
  IblResult result;
  result.FssEss = FssEss;

  // Multiple scattering, Fdez-Aguera's approach
  float Ems = (1.0 - (f_ab.x + f_ab.y));
  vec3 F_avg = F0 + (1.0 - F0) / 21.0;
  vec3 FmsEms = Ems * FssEss * F_avg / (1.0 - F_avg * Ems);
  vec3 k_D = albedo * (1.0 - FssEss - FmsEms);

  // Diffuse IBL
  vec3 diffuse = (FmsEms + k_D) * irradiance;

  // Specular IBL
  vec3 specular = FssEss * radiance;

  // scale with user parameters
  float IBLDiffuseContribution = iblParameter.y;
  float IBLSpecularContribution = iblParameter.z;
  diffuse *= IBLDiffuseContribution;
  specular *= IBLSpecularContribution;

  result.diffuse = diffuse;
  result.specular = specular;

  return result;
}

vec3 IBLContribution(float materialSID, vec3 normal_inWorld, float NdotV, vec3 viewDirection,
  vec3 albedo, vec3 F0, float perceptualRoughness, float clearcoatRoughness, vec3 clearcoatNormal_inWorld,
  float clearcoat, float VdotNc, vec3 geomNormal_inWorld, float cameraSID, float transmission, vec3 v_position_inWorld, float thickness)
{
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float rot = iblParameter.w + 3.1415;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  ivec2 hdriFormat = get_hdriFormat(materialSID, 0);

  IblResult baseResult = IBL(materialSID, normal_inWorld, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix);

#ifdef RN_USE_TRANSMISSION
  float ior = 1.5;
  vec3 refractedRay = getVolumeTransmissionRay(geomNormal_inWorld, viewDirection, thickness, ior);
  vec3 refractedRayFromVPosition = v_position_inWorld + refractedRay;
  vec4 ndcPoint = get_projectionMatrix(cameraSID, 0) * get_viewMatrix(cameraSID, 0) * vec4(refractedRayFromVPosition, 1.0);
  vec2 refractionCoords = ndcPoint.xy / ndcPoint.w;
  refractionCoords += 1.0;
  refractionCoords /= 2.0;
  vec3 transmittedLight = get_sample_from_backbuffer(materialSID, refractionCoords, perceptualRoughness, ior);

#ifdef RN_USE_VOLUME
  vec3 attenuationColor = get_attenuationColor(materialSID, 0);
  float attenuationDistance = get_attenuationDistance(materialSID, 0);
  transmittedLight = volumeAttenuation(attenuationColor, attenuationDistance, transmittedLight, length(refractedRay));
#endif

  vec3 transmissionComp = (vec3(1.0) - baseResult.FssEss) * transmittedLight * albedo;
  vec3 diffuse = mix(baseResult.diffuse, transmissionComp, transmission);
  vec3 base = diffuse + baseResult.specular;
#else
  vec3 base = baseResult.diffuse + baseResult.specular;
#endif

#ifdef RN_USE_CLEARCOAT
  float VdotNg = dot(geomNormal_inWorld, viewDirection);
  IblResult coatResult = IBL(materialSID, clearcoatNormal_inWorld, VdotNc, viewDirection, vec3(0.0), F0,
    clearcoatRoughness, iblParameter, hdriFormat, rotEnvMatrix);
  vec3 coatLayer = coatResult.diffuse + coatResult.specular;

  float clearcoatFresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - abs(VdotNc), 5.0);
  vec3 coated = base * vec3(1.0 - clearcoat * clearcoatFresnel) + vec3(coatLayer * clearcoat);

  return coated;
#else
  return base;
#endif

}

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

  // View vector
  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];
  vec3 viewPosition = get_viewPosition(cameraSID, 0);
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  vec3 geomNormal_inWorld = normal_inWorld;
  vec4 normalTextureTransform = get_normalTextureTransform(materialSID, 0);
  float normalTextureRotation = get_normalTextureRotation(materialSID, 0);
  int normalTexcoordIndex = get_normalTexcoordIndex(materialSID, 0);
  vec2 normalTexcoord = getTexcoord(normalTexcoordIndex);
  vec2 normalTexUv = uvTransform(normalTextureTransform.xy, normalTextureTransform.zw, normalTextureRotation, normalTexcoord);
  #ifdef RN_USE_NORMAL_TEXTURE
    vec3 normalTexValue = texture2D(u_normalTexture, normalTexUv).xyz;
    if(normalTexValue.b >= 128.0 / 255.0) {
      // normal texture is existence
      vec3 normalTex = normalTexValue * 2.0 - 1.0;
      float normalScale = get_normalScale(materialSID, 0);
      vec3 scaledNormal = normalize(normalTex * vec3(normalScale, normalScale, 1.0));
      normal_inWorld = perturb_normal(normal_inWorld, viewVector, normalTexUv, scaledNormal);
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
  vec4 textureColor = texture2D(u_baseColorTexture, baseColorTexUv);
  baseColor *= srgbToLinear(textureColor.rgb);
  alpha *= textureColor.a;

#pragma shaderity: require(../common/alphaMask.glsl)

  // NdotV
  vec3 viewDirection = normalize(viewVector);
  float NdotV = saturateEpsilonToOne(dot(normal_inWorld, viewDirection));

  // Clearcoat
#ifdef RN_USE_CLEARCOAT
  float clearcoatFactor = get_clearCoatFactor(materialSID, 0);
  float clearcoatTexture = texture2D(u_clearCoatTexture, baseColorTexUv).r;
  float clearcoat = clearcoatFactor * clearcoatTexture;
#else
  float clearcoat = 0.0;
#endif

  // Transmission
#ifdef RN_USE_TRANSMISSION
  float transmissionFactor = get_transmissionFactor(materialSID, 0);
  float transmissionTexture = texture2D(u_transmissionTexture, baseColorTexUv).r;
  float transmission = transmissionFactor * transmissionTexture;
  // alpha *= transmission;
#else
  float transmission = 0.0;
#endif

#ifdef RN_IS_LIGHTING
  // Metallic & Roughness
  vec2 metallicRoughnessFactor = get_metallicRoughnessFactor(materialSID, 0);
  float perceptualRoughness = metallicRoughnessFactor.y;
  float metallic = metallicRoughnessFactor.x;

  vec4 metallicRoughnessTextureTransform = get_metallicRoughnessTextureTransform(materialSID, 0);
  float metallicRoughnessTextureRotation = get_metallicRoughnessTextureRotation(materialSID, 0);
  int metallicRoughnessTexcoordIndex = get_metallicRoughnessTexcoordIndex(materialSID, 0);
  vec2 metallicRoughnessTexcoord = getTexcoord(metallicRoughnessTexcoordIndex);
  vec2 metallicRoughnessTexUv = uvTransform(metallicRoughnessTextureTransform.xy, metallicRoughnessTextureTransform.zw, metallicRoughnessTextureRotation, metallicRoughnessTexcoord);
  vec4 ormTexel = texture2D(u_metallicRoughnessTexture, metallicRoughnessTexUv);
  perceptualRoughness = ormTexel.g * perceptualRoughness;
  metallic = ormTexel.b * metallic;

  perceptualRoughness = clamp(perceptualRoughness, c_MinRoughness, 1.0);
  metallic = clamp(metallic, 0.0, 1.0);
  float alphaRoughness = perceptualRoughness * perceptualRoughness;

  // F0
  vec3 diffuseMatAverageF0 = vec3(0.04);
  vec3 F0 = mix(diffuseMatAverageF0, baseColor.rgb, metallic);

  // Albedo
  vec3 black = vec3(0.0);
  vec3 albedo = mix(baseColor.rgb, black, metallic);

  rt0 = vec4(0.0, 0.0, 0.0, alpha);

#ifdef RN_USE_CLEARCOAT
  // Clearcoat
  float clearcoatRoughnessFactor = get_clearCoatRoughnessFactor(materialSID, 0);
  float textureRoughnessTexture = texture2D(u_clearCoatRoughnessTexture, baseColorTexUv).g;
  float clearcoatRoughness = clearcoatRoughnessFactor * textureRoughnessTexture;
  vec3 textureNormal_tangent = texture2D(u_clearCoatNormalTexture, baseColorTexUv).xyz * vec3(2.0) - vec3(1.0);

  vec3 clearcoatNormal_inWorld = perturb_normal(geomNormal_inWorld, viewVector, normalTexUv, textureNormal_tangent);
  float VdotNc = saturateEpsilonToOne(dot(viewDirection, clearcoatNormal_inWorld));
#else
  float clearcoatRoughness = 0.0;
  vec3 clearcoatNormal_inWorld = vec3(0.0);
  float VdotNc = 0.0;
#endif

#ifdef RN_USE_VOLUME
  // Volume
  float thicknessFactor = get_thicknessFactor(materialSID, 0);
  float thicknessTexture = texture2D(u_thicknessTexture, baseColorTexUv).g;
  float attenuationDistance = get_attenuationDistance(materialSID, 0);
  vec3 attenuationColor = get_attenuationColor(materialSID, 0);
  float thickness = thicknessFactor * thicknessTexture;
#else
  float thickness = 0.0;
  vec3 attenuationColor = vec3(0.0);
  float attenuationDistance = 0.000001;
#endif

  // Lighting
  vec3 diffuse = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Light
    Light light = getLight(i, v_position_inWorld.xyz);

    // Fresnel
    vec3 halfVector = normalize(light.direction + viewDirection);
    float VdotH = dot(viewDirection, halfVector);
    vec3 F = fresnel(F0, VdotH);

    float NdotL = saturateEpsilonToOne(dot(normal_inWorld, light.direction));

    // Diffuse
    vec3 diffuseBrdf = diffuse_brdf(albedo);
    vec3 pureDiffuse = (vec3(1.0) - F) * diffuseBrdf * vec3(NdotL) * light.attenuatedIntensity;

#ifdef RN_USE_TRANSMISSION
    float ior = 1.5;
    vec3 refractionVector = refract(-viewDirection, normal_inWorld, 1.0 / ior);
    Light transmittedLightFromUnderSurface = light;
    transmittedLightFromUnderSurface.pointToLight -= refractionVector;
    vec3 transmittedLightDirectionFromUnderSurface = normalize(transmittedLightFromUnderSurface.pointToLight);
    transmittedLightFromUnderSurface.direction = transmittedLightDirectionFromUnderSurface;

    vec3 Ht = normalize(viewDirection + transmittedLightFromUnderSurface.direction);
    float NdotHt = saturateEpsilonToOne(dot(normal_inWorld, Ht));
    float NdotLt = saturateEpsilonToOne(dot(normal_inWorld, transmittedLightFromUnderSurface.direction));

    vec3 transmittedContrib = (vec3(1.0) - F) * specular_btdf(alphaRoughness, NdotLt, NdotV, NdotHt) * albedo * transmittedLightFromUnderSurface.attenuatedIntensity;

#ifdef RN_USE_VOLUME
    vec3 attenuationColor = get_attenuationColor(materialSID, 0);
    float attenuationDistance = get_attenuationDistance(materialSID, 0);
    transmittedContrib = volumeAttenuation(attenuationColor, attenuationDistance, transmittedContrib, length(transmittedLightFromUnderSurface.pointToLight));
#endif

    vec3 diffuseContrib = mix(pureDiffuse, vec3(transmittedContrib), transmission);
#else
    vec3 diffuseContrib = pureDiffuse;
#endif

    // Specular
    float NdotH = saturateEpsilonToOne(dot(normal_inWorld, halfVector));
    vec3 specularContrib = cook_torrance_specular_brdf(NdotH, NdotL, NdotV, F, alphaRoughness) * vec3(NdotL) * light.attenuatedIntensity;

    // Base Layer
    vec3 baseLayer = diffuseContrib + specularContrib;

#ifdef RN_USE_CLEARCOAT
    // Clear Coat Layer
    float NdotHc = saturateEpsilonToOne(dot(clearcoatNormal_inWorld, halfVector));
    float LdotNc = saturateEpsilonToOne(dot(light.direction, clearcoatNormal_inWorld));
    vec3 coated = coated_material_s(baseLayer, perceptualRoughness,
      clearcoatRoughness, clearcoat, VdotNc, LdotNc, NdotHc);
    rt0.xyz += coated;
#else
    rt0.xyz += baseLayer;
#endif
  }

  vec3 ibl = IBLContribution(materialSID, normal_inWorld, NdotV, viewDirection,
    albedo, F0, perceptualRoughness, clearcoatRoughness, clearcoatNormal_inWorld,
    clearcoat, VdotNc, geomNormal_inWorld, cameraSID, transmission, v_position_inWorld.xyz, thickness);

  int occlusionTexcoordIndex = get_occlusionTexcoordIndex(materialSID, 0);
  vec2 occlusionTexcoord = getTexcoord(occlusionTexcoordIndex);
  float occlusion = texture2D(u_occlusionTexture, occlusionTexcoord).r;
  float occlusionStrength = get_occlusionStrength(materialSID, 0);

  // Occlution to Indirect Lights
  rt0.xyz += mix(ibl, ibl * occlusion, occlusionStrength);
#else
  rt0 = vec4(baseColor, alpha);
#endif

  // Emissive
  int emissiveTexcoordIndex = get_emissiveTexcoordIndex(materialSID, 0);
  vec2 emissiveTexcoord = getTexcoord(emissiveTexcoordIndex);
  vec3 emissive = srgbToLinear(texture2D(u_emissiveTexture, emissiveTexcoord).xyz);

#ifdef RN_USE_CLEARCOAT
  vec3 coated_emissive = emissive * mix(vec3(1.0), vec3(0.04 + (1.0 - 0.04) * pow(1.0 - NdotV, 5.0)), clearcoat);
  rt0.xyz += coated_emissive;
#else
  rt0.xyz += emissive;
#endif

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

  // premultiplied alpha
  // rt0.rgb /= alpha;

#pragma shaderity: require(../common/outputSrgb.glsl)
rt1 = rt0;
rt2 = rt0;
rt3 = rt0;
#pragma shaderity: require(../common/glFragColor.glsl)

}
