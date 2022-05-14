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
in vec3 v_baryCentricCoord;

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
uniform int u_isOutputHDR; // initialValue=0
uniform float u_makeOutputSrgb; // initialValue=1
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
uniform float u_clearCoatFactor; // initialValue=0
uniform sampler2D u_clearCoatTexture; // initialValue=(8,white)
uniform float u_clearCoatRoughnessFactor; // initialValue=0
uniform sampler2D u_clearCoatRoughnessTexture; // initialValue=(9,white)
uniform sampler2D u_clearCoatNormalTexture; // initialValue=(10,blue)

#ifdef RN_USE_NORMAL_TEXTURE
  uniform sampler2D u_normalTexture; // initialValue=(2,black)
  uniform vec4 u_normalTextureTransform; // initialValue=(1,1,0,0)
  uniform float u_normalTextureRotation; // initialValue=(0)
  uniform int u_normalTexcoordIndex; // initialValue=(0)
  uniform float u_normalScale; // initialValue=(1)
#endif

uniform float u_alphaCutoff; // initialValue=(0.01)

#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/pbrDefinition.glsl)

/* shaderity: @{getters} */

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

vec3 IBL(float materialSID, vec3 normal_inWorld, float NdotV, vec3 viewDirection, vec3 albedo, vec3 F0,
  float perceptualRoughness, vec4 iblParameter, ivec2 hdriFormat, mat3 rotEnvMatrix)
{
    // get irradiance
  vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;
  normal_forEnv.x *= -1.0;
  vec3 irradiance = get_irradiance(normal_forEnv, materialSID, hdriFormat);

  // get radiance
  vec3 reflection = rotEnvMatrix * reflect(-viewDirection, normal_inWorld);
  reflection.x *= -1.0;
  float mipCount = iblParameter.x;
  float lod = (perceptualRoughness * (mipCount - 1.0));
  vec3 radiance = get_radiance(reflection, lod, hdriFormat);

  // Roughness dependent fresnel
  vec3 kS = fresnelSchlickRoughness(F0, NdotV, perceptualRoughness);
  // vec3 f_ab = texture2D(u_brdfLutTexture, vec2(1.0 - NdotV, 1.0 - perceptualRoughness)).rgb;
  vec2 f_ab = envBRDFApprox(perceptualRoughness, NdotV);
  vec3 FssEss = kS * f_ab.x + f_ab.y;


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

  vec3 base = diffuse + specular;

  return base;
}

vec3 IBLContribution(float materialSID, vec3 normal_inWorld, float NdotV, vec3 viewDirection,
  vec3 albedo, vec3 F0, float perceptualRoughness, float clearcoatRoughness, vec3 clearcoatNormal_inWorld,
  float clearcoat, float VdotNc, vec3 geomNormal_inWorld)
{
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float rot = iblParameter.w + 3.1415;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  ivec2 hdriFormat = get_hdriFormat(materialSID, 0);


  vec3 base = IBL(materialSID, normal_inWorld, NdotV, viewDirection, albedo, F0,
    perceptualRoughness, iblParameter, hdriFormat, rotEnvMatrix);

  float VdotNg = dot(geomNormal_inWorld, viewDirection);
  vec3 coatLayer = IBL(materialSID, clearcoatNormal_inWorld, VdotNc, viewDirection, vec3(0.0), F0,
    clearcoatRoughness, iblParameter, hdriFormat, rotEnvMatrix);

  // vec3 clearcoatNormal_forEnv = rotEnvMatrix * clearcoatNormal_inWorld;
  // clearcoatNormal_forEnv.x *= -1.0;

  float clearcoatFresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - abs(VdotNc), 5.0);
  vec3 coated = base * vec3(1.0 - clearcoat * clearcoatFresnel) + vec3(coatLayer * clearcoat);

  return coated;
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
  if(texcoordIndex == 1){
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
  float clearcoatFactor = get_clearCoatFactor(materialSID, 0);
  float clearcoatTexture = texture2D(u_clearCoatTexture, baseColorTexUv).r;
  float clearcoat = clearcoatFactor * clearcoatTexture;

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

  // Clearcoat
  float clearcoatRoughnessFactor = get_clearCoatRoughnessFactor(materialSID, 0);
  float textureRoughnessTexture = texture2D(u_clearCoatRoughnessTexture, baseColorTexUv).g;
  float clearcoatRoughness = clearcoatRoughnessFactor * textureRoughnessTexture;
  vec3 textureNormal_tangent = texture2D(u_clearCoatNormalTexture, baseColorTexUv).xyz * vec3(2.0) - vec3(1.0);

  vec3 clearcoatNormal_inWorld = perturb_normal(geomNormal_inWorld, viewVector, normalTexUv, textureNormal_tangent);
  float VdotNc = saturateEpsilonToOne(dot(viewDirection, clearcoatNormal_inWorld));

  // Lighting
  vec3 diffuse = vec3(0.0, 0.0, 0.0);
  for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Light
    vec4 gotLightDirection = get_lightDirection(0.0, i);
    vec4 gotLightPosition = get_lightPosition(0.0, i);
    vec4 gotLightIntensity = get_lightIntensity(0.0, i);
    vec3 lightDirection = gotLightDirection.xyz;
    vec3 lightIntensity = gotLightIntensity.xyz;
    vec3 lightPosition = gotLightPosition.xyz;
    float lightType = gotLightPosition.w;
    float spotCosCutoff = gotLightDirection.w;
    float spotExponent = gotLightIntensity.w;

    if (0.75 < lightType) { // is pointlight or spotlight
      lightDirection = normalize(lightPosition.xyz - v_position_inWorld.xyz);
    }
    float spotEffect = 1.0;
    if (lightType > 1.75) { // is spotlight
      spotEffect = dot(gotLightDirection.xyz, lightDirection);
      if (spotEffect > spotCosCutoff) {
        spotEffect = pow(spotEffect, spotExponent);
      } else {
        spotEffect = 0.0;
      }
    }
    //diffuse += 1.0 * max(0.0, dot(normal_inWorld, lightDirection)) * spotEffect * lightIntensity.xyz;

    // IncidentLight
    vec3 incidentLight = spotEffect * lightIntensity.xyz;
    incidentLight *= M_PI;

    // Fresnel
    vec3 halfVector = normalize(lightDirection + viewDirection);
    float VH = dot(viewDirection, halfVector);
    vec3 F = fresnel(F0, VH);

    // Diffuse
    vec3 diffuseContrib = (vec3(1.0) - F) * diffuse_brdf(albedo);

    // Specular
    float NH = dot(normal_inWorld, halfVector);
    float satNH = saturateEpsilonToOne(NH);
    float NL = dot(normal_inWorld, lightDirection);
    float satNL = saturateEpsilonToOne(NL);

    // Base Layer
    vec3 specularContrib = cook_torrance_specular_brdf(satNH, satNL, NdotV, F, alphaRoughness);
    vec3 baseLayer = (diffuseContrib + specularContrib) * vec3(satNL) * incidentLight.rgb;

    // Clear Coat Layer
    float NdotHc = saturateEpsilonToOne(dot(clearcoatNormal_inWorld, halfVector));
    float LdotNc = saturateEpsilonToOne(dot(lightDirection, clearcoatNormal_inWorld));
    vec3 coated = coated_material_s(baseLayer, perceptualRoughness,
      clearcoatRoughness, clearcoat, VdotNc, LdotNc, NdotHc);

    rt0.xyz += coated;
  }

  vec3 ibl = IBLContribution(materialSID, normal_inWorld, NdotV, viewDirection,
    albedo, F0, perceptualRoughness, clearcoatRoughness, clearcoatNormal_inWorld,
    clearcoat, VdotNc, geomNormal_inWorld);

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
  vec3 coated_emissive = emissive * mix(vec3(1.0), vec3(0.04 + (1.0 - 0.04) * pow(1.0 - NdotV, 5.0)), clearcoat);
  rt0.xyz += coated_emissive;

  int isOutputHDR = get_isOutputHDR(materialSID, 0);
  if(isOutputHDR == 1){
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

#pragma shaderity: require(../common/outputSrgb.glsl)
// rt0.xyz = texture2D(u_clearcoatRoughnessTexture, baseColorTexUv).xyz;
#pragma shaderity: require(../common/glFragColor.glsl)

}
