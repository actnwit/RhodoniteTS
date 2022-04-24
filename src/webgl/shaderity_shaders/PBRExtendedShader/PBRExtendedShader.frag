#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

#define PI 3.141592

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec3 v_normal_inView;
in vec3 v_tangent_inWorld;
in vec3 v_binormal_inWorld;
in vec4 v_position_inWorld;
in vec2 v_texcoord;
in vec3 v_baryCentricCoord;
#pragma shaderity: require(../common/rt0.glsl)

#pragma shaderity: require(../common/prerequisites.glsl)

#pragma shaderity: require(../common/deliot2019SeamlessTexture.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/pbrDefinition.glsl)

float d_Charlie(float alphaRoughness, float NoH) {
  // Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
  float invAlpha  = 1.0 / alphaRoughness;
  float cos2h = NoH * NoH;
  float sin2h = max(1.0 - cos2h, 0.0078125);
  return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * PI);
}

// https://google.github.io/filament/Filament.html#materialsystem/anisotropicmodel/anisotropicspecularbrdf
float d_GGX_Anisotropic(float NoH, const vec3 h, const vec3 t, const vec3 b, float at, float ab) {
  float ToH = dot(t, h);
  float BoH = dot(b, h);
  float a2 = at * ab;
  highp vec3 v = vec3(ab * ToH, at * BoH, a2 * NoH);
  highp float v2 = dot(v, v);
  float w2 = a2 / v2;
  return a2 * w2 * w2 * (1.0 / PI);
}

float v_SmithGGXCorrelated_Anisotropic(float ToV, float BoV, float ToL, float BoL, float NoV, float NoL, float at, float ab) {
  float lambdaV = NoL * length(vec3(at * ToV, ab * BoV, NoV));
  float lambdaL = NoV * length(vec3(at * ToL, ab * BoL, NoL));
  float v = 0.5 / (lambdaV + lambdaL);
  return v;
}

float v_Neubelt(float NoV, float NoL) {
  // Neubelt and Pettineo 2013, "Crafting a Next-gen Material Pipeline for The Order: 1886"
  return 1.0 / (4.0 * (NoL + NoV - NoL * NoV));
}

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

vec3 baseSpecularLayer(float NH, float NL, float NV, vec3 F, vec3 l, vec3 h, vec3 v, const vec3 t, const vec3 b, float alphaRoughness, float anisotropy) {
  float at = max(alphaRoughness * (1.0 + anisotropy), 0.001);
  float ab = max(alphaRoughness * (1.0 - anisotropy), 0.001);

  float D = d_GGX_Anisotropic(NH, h, t, b, at, ab);
  float V = v_SmithGGXCorrelated_Anisotropic(dot(t,v), dot(b,v), dot(t,l), dot(b,l), NV, NL, at, ab);
  return vec3(D) * vec3(V) * F;
}

vec3 clearcoatLayer(float NH, float NL, float NV, vec3 F, vec3 l, vec3 h, vec3 v, const vec3 t, const vec3 b, float alphaRoughness, float anisotropy) {
  float at = max(alphaRoughness * (1.0 + anisotropy), 0.001);
  float ab = max(alphaRoughness * (1.0 - anisotropy), 0.001);

  float D = d_GGX_Anisotropic(NH, h, t, b, at, ab);
  float V = v_SmithGGXCorrelated_Anisotropic(dot(t,v), dot(b,v), dot(t,l), dot(b,l), NV, NL, at, ab);
  return vec3(D) * vec3(V) * F;
}

vec3 sheenLayer(float NH, float NL, float NV, vec3 F, float alphaRoughness) {
  float D = d_Charlie(alphaRoughness, NH);
  float V = v_Neubelt(NV, NL);

  vec3 specular = vec3(D) * vec3(V) * F;
  return specular;
}

vec3 baseSpecularLayerWithoutD(float NH, float NL, float NV, vec3 F, vec3 l, vec3 h, vec3 v, const vec3 t, const vec3 b, float alphaRoughness, float anisotropy) {
  float at = max(alphaRoughness * (1.0 + anisotropy), 0.001);
  float ab = max(alphaRoughness * (1.0 - anisotropy), 0.001);

  float V = v_SmithGGXCorrelated_Anisotropic(dot(t,v), dot(b,v), dot(t,l), dot(b,l), NV, NL, at, ab);
  return vec3(V) * F;
}

vec3 clearcoatLayerWithoutD(float NH, float NL, float NV, vec3 F, vec3 l, vec3 h, vec3 v, const vec3 t, const vec3 b, float alphaRoughness, float anisotropy) {
  float at = max(alphaRoughness * (1.0 + anisotropy), 0.001);
  float ab = max(alphaRoughness * (1.0 - anisotropy), 0.001);

  float V = v_SmithGGXCorrelated_Anisotropic(dot(t,v), dot(b,v), dot(t,l), dot(b,l), NV, NL, at, ab);
  return vec3(V) * F;
}

vec3 sheenLayerWithoutD(float NH, float NL, float NV, vec3 F, float alphaRoughness) {
  float V = v_Neubelt(NV, NL);

  vec3 specular = vec3(V) * F;
  return specular;
}

vec3 surfaceShading(float materialSID, float NH, float NL, float NV, float VH, vec3 F0, vec3 lightDirection, vec3 halfVector, vec3 viewDirection, const vec3 t, const vec3 b, vec3 albedo, vec3 incidentLight,
  float alphaRoughness, float clearcoatRoughness, float clearcoatFactor, float baseAnisotropy, float clearcoatAnisotropy) {

  // Fresnel
  vec3 F_diffuse = fresnel(F0, NL);
  vec3 F_specular = fresnel(F0, VH);
  vec3 F_clearcoat = fresnel(vec3(0.04), VH) * clearcoatFactor;
  vec3 sheenColor = get_sheenParameter(materialSID, 0);
  vec3 F_sheen = sheenColor;

  // Diffuse
  vec3 diffuseContrib = (vec3(1.0) - F_diffuse) * diffuse_brdf(albedo);

  float clearcoatAlphaRoughness = clearcoatRoughness * clearcoatRoughness;
  vec3 baseSpecularContrib = baseSpecularLayer(NH, NL, NV, F_specular, lightDirection, halfVector, viewDirection, t, b, alphaRoughness, baseAnisotropy);
  vec3 clearcoatContrib = clearcoatLayer(NH, NL, NV, F_clearcoat, lightDirection, halfVector, viewDirection, t, b, clearcoatAlphaRoughness, clearcoatAnisotropy);
  vec3 sheenContrib = sheenLayer(NH, NL, NV, F_sheen, alphaRoughness);

  vec3 diffuseAndBaseSpecular = diffuseContrib + baseSpecularContrib;
  vec3 diffuse_baseSpecular_clearcoat = diffuseAndBaseSpecular * (1.0 - F_clearcoat) + clearcoatContrib;
  vec3 diffuse_baseSpecular_clearcoat_sheen = diffuse_baseSpecular_clearcoat * (1.0 - F_sheen) + sheenContrib;
  vec3 totalContrib = diffuse_baseSpecular_clearcoat_sheen * vec3(NL) * incidentLight.rgb;

  return totalContrib;
  // return baseSpecularContrib * vec3(NL) * incidentLight.rgb;
}

vec3 surfaceShadingIBL(float NH, float NL, float NV, float VH, vec3 F0, vec3 lightDirection, vec3 halfVector, vec3 viewDirection, const vec3 t, const vec3 b, vec3 albedo, vec3 diffuseLight, vec3 specularLight,
  float alphaRoughness, float clearcoatRoughness, float clearcoatFactor, float baseAnisotropy, float clearcoatAnisotropy) {

  // Fresnel
  vec3 F_diffuse = fresnel(F0, NL);
  vec3 F_specular = fresnel(F0, VH);
  vec3 F_clearcoat = fresnel(vec3(0.04), VH) * clearcoatFactor;
  vec3 F_sheen = vec3(0.04);

  // Diffuse
  // vec3 diffuseContrib = (vec3(1.0) - F_diffuse) * diffuse_brdf(albedo);
  vec3 diffuseContrib = diffuse_brdf(albedo);

  float clearcoatAlphaRoughness = clearcoatRoughness * clearcoatRoughness;
  vec3 baseSpecularContrib = baseSpecularLayer(NH, NL, NV, F_specular, lightDirection, halfVector, viewDirection, t, b, alphaRoughness, baseAnisotropy);
  vec3 clearcoatContrib = clearcoatLayer(NH, NL, NV, F_clearcoat, lightDirection, halfVector, viewDirection, t, b, clearcoatAlphaRoughness, clearcoatAnisotropy);
  vec3 sheenContrib = sheenLayer(NH, NL, NV, F_sheen, alphaRoughness);

  vec3 diffuse = diffuseContrib * diffuseLight; // Note that NoL is 1.0 because light direction is geometry normal in diffuse IBL
  vec3 specularLightCos = specularLight;
  vec3 baseSpecular = baseSpecularContrib * specularLightCos;
  vec3 clearcoat = clearcoatContrib * specularLightCos;
  vec3 sheen = sheenContrib * specularLightCos;

  // vec3 diffuseAndBaseSpecular = diffuse + baseSpecular;
  vec3 diffuse_baseSpecular_clearcoat = (diffuse + baseSpecular * (1.0 - F_clearcoat)) * (1.0 - F_clearcoat) + clearcoat;
  vec3 diffuse_baseSpecular_clearcoat_sheen = diffuse_baseSpecular_clearcoat * (1.0) + sheen;
  vec3 totalContrib = diffuse_baseSpecular_clearcoat_sheen;

  return totalContrib;
  // return baseSpecular;
}

vec3 getReflectedVector(const vec3 v, const vec3 n, float anisotropy, vec3 t, vec3 b, float userRoughness) {
  vec3  anisotropyDirection = anisotropy >= 0.0 ? b : t;
  vec3  anisotropyDirectionPerp = anisotropy <= 0.0 ? b : t;
  vec3  anisotropicTangent  = cross(anisotropyDirection, v);
  vec3  anisotropicTangentPerp  = cross(anisotropyDirectionPerp, v);
  vec3  anisotropicNormal   = cross(anisotropicTangent, anisotropyDirection);
  vec3  anisotropicNormalPerp   = cross(anisotropicTangentPerp, anisotropyDirectionPerp);
  float bendFactor          = abs(anisotropy) * clamp(5.0 * userRoughness, 0.0, 1.0);
  vec3  bentNormal          = normalize(mix(n, anisotropicNormal, bendFactor));
  bentNormal          = normalize(mix(bentNormal, anisotropicNormalPerp, -bendFactor));

  vec3 r = reflect(-v, bentNormal);

  return r;
}

/*
vec3 IBLContribution2(vec3 n, vec3 reflection, float NV, vec3 F0, vec3 viewDirection, const vec3 t, const vec3 b, vec3 albedo,
  float userRoughness, float alphaRoughness, float clearcoatRoughness, float clearcoatFactor, float baseAnisotropy, float clearcoatAnisotropy)
{
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float mipCount = iblParameter.x;
  float lod = userRoughness * (mipCount - 1.0);

  vec3 brdf = texture2D(u_brdfLutTexture, vec2(NV, 1.0 - userRoughness)).rgb;
  vec4 diffuseTexel = textureCube(u_diffuseEnvTexture, n);
  vec3 diffuseLight;

  ivec2 hdriFormat = get_hdriFormat(materialSID, 0);

  if (hdriFormat.x == 0) { // LDR_SRGB
    diffuseLight = srgbToLinear(diffuseTexel.rgb);
  } else if (hdriFormat.x == 3) { // RGBE
    diffuseLight = diffuseTexel.rgb * pow(2.0, diffuseTexel.a*255.0-128.0);
  } else {
    diffuseLight = diffuseTexel.rgb;
  }

  vec3 specularLightDir = mix(reflection, n, lod/(mipCount - 1.0));
#pragma shaderity: require(./../common/fetchCubeTexture.glsl)

  vec3 specularLight;
  if (hdriFormat.y == 0) { // LDR_SRGB
    specularLight = srgbToLinear(specularTexel.rgb);
  } else if (hdriFormat.y == 3) { // RGBE
    specularLight = specularTexel.rgb * pow(2.0, specularTexel.a*255.0-128.0);
  } else {
    specularLight = specularTexel.rgb;
  }

  vec3 halfVector = normalize(specularLightDir + viewDirection);
//  float LH = clamp(dot(specularLightDir, halfVector), 0.0, 1.0);
  float NL = clamp(dot(n, specularLightDir), 0.0, 1.0);
  float NH = clamp(dot(n, halfVector), 0.0, 1.0);
  float VH = clamp(dot(viewDirection, halfVector), 0.0, 1.0);

  vec3 totalContrib = surfaceShadingIBL(NH, NL, NV, VH, F0, specularLightDir, halfVector, viewDirection, t, b, albedo, diffuseLight, specularLight,
    alphaRoughness, clearcoatRoughness, clearcoatFactor, baseAnisotropy, clearcoatAnisotropy);

  return totalContrib;
}
*/

vec3 prefilteredRadiance(float materialSID, vec3 v, vec3 n, float NV, float anisotropy, vec3 t, vec3 b, float userRoughness, vec3 F0) {
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float mipCount = iblParameter.x;
  float lod = (userRoughness * mipCount);

  vec3 reflectedVecAnisotropy = getReflectedVector(v, n, anisotropy, t, b, userRoughness);
  vec3 specularLightDir = mix(reflectedVecAnisotropy, n, lod/(mipCount - 1.0));

#ifdef WEBGL1_EXT_SHADER_TEXTURE_LOD
  vec4 specularTexel = textureCubeLodEXT(u_specularEnvTexture, specularLightDir, lod);
#elif defined(GLSL_ES3)
  vec4 specularTexel = textureLod(u_specularEnvTexture, specularLightDir, lod);
#else
  float specularCubeSize = pow(2.0, mipCount - 1.0);
  float emulatedLod = mipmapLevel((specularLightDir) * specularCubeSize);
  vec4 specularTexel = textureCube(u_specularEnvTexture, specularLightDir, lod - emulatedLod);
#endif

  vec3 specularLight;
  ivec2 hdriFormat = get_hdriFormat(materialSID, 0);
  if (hdriFormat.y == 0) { // LDR_SRGB
    specularLight = srgbToLinear(specularTexel.rgb);
  } else if (hdriFormat.y == 3) { // RGBE
    specularLight = specularTexel.rgb * pow(2.0, specularTexel.a*255.0-128.0);
  } else {
    specularLight = specularTexel.rgb;
  }


  return specularLight;
}

vec3 IBLContribution(float materialSID, vec3 n, vec3 v, float NV, vec3 reflection, vec3 albedo, vec3 F0, float userRoughness, float clearcoatFactor, float clearcoatRoughness, float baseAnisotropy, float clearcoatAnisotropy, vec3 t, vec3 b)
{
  vec4 diffuseTexel = textureCube(u_diffuseEnvTexture, n);
  vec3 diffuseLight;
  ivec2 hdriFormat = get_hdriFormat(materialSID, 0);
  if (hdriFormat.x == 0) { // LDR_SRGB
    diffuseLight = srgbToLinear(diffuseTexel.rgb);
  } else if (hdriFormat.x == 3) { // RGBE
    diffuseLight = diffuseTexel.rgb * pow(2.0, diffuseTexel.a*255.0-128.0);
  } else {
    diffuseLight = diffuseTexel.rgb;
  }

  vec4 iblParameter = get_iblParameter(materialSID, 0);
  vec3 diffuse = diffuseLight * albedo * iblParameter.y;

  vec3 specularLight = prefilteredRadiance(materialSID, v, n, NV, baseAnisotropy, t, b, userRoughness, F0) * iblParameter.z;
  // vec3 brdf = texture2D(u_brdfLutTexture, vec2(NV, 1.0 - userRoughness)).rgb;
  // vec3 baseSpecular = specularLight * (F0 * brdf.x + brdf.y);
  vec2 f_ab = envBRDFApprox(userRoughness, NV);
  vec3 baseSpecular = specularLight * (F0 * f_ab.x + f_ab.y);
  vec3 clearcoatSpecular = prefilteredRadiance(materialSID, v, n, NV, clearcoatAnisotropy, t, b, clearcoatRoughness, vec3(0.04));
  // vec3 sheenSpecular = specularLight * (F0 * brdf.z);
  vec3 sheenSpecular = specularLight * (F0 * 1.0);

  vec3 sheenParameter = get_sheenParameter(materialSID, 0);
  vec3 sheenColor = sheenParameter;
  vec3 Fs = sheenColor;
  vec3 Fc = fresnel(vec3(0.04), NV) * clearcoatFactor;
  vec3 Fb = fresnel(F0, NV);
  vec3 attenuationC = 1.0 - Fc;
  vec3 attenuationB = 1.0 - Fb;

  return ((diffuse + baseSpecular * attenuationC) * attenuationC + clearcoatSpecular * Fc) *
    vec3(1.0) + sheenSpecular * Fs;

}


void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float rot = iblParameter.w + 3.1415;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));

  vec3 tangent_inWorld = vec3(0.0);
  vec3 binormal_inWorld = vec3(0.0);
  vec4 normalTextureTransform = get_normalTextureTransform(materialSID, 0);
  float normalTextureRotation = get_normalTextureRotation(materialSID, 0);
  vec2 baseUv = uvTransform(normalTextureTransform.xy, normalTextureTransform.zw, normalTextureRotation, v_texcoord);
  vec4 detailNormalTextureTransform = get_detailNormalTextureTransform(materialSID, 0);
  float detailNormalTextureRotation = get_detailNormalTextureRotation(materialSID, 0);
  vec2 detailUv = uvTransform(detailNormalTextureTransform.xy, detailNormalTextureTransform.zw, detailNormalTextureRotation, v_texcoord);
  if (abs(length(v_tangent_inWorld)) > 0.01) {
    vec3 normal = normalBlendingUDN(u_normalTexture, u_detailNormalTexture, baseUv, detailUv);
    // vec3 normal = texture2D(u_normalTexture, baseUv).xyz * 2.0 - 1.0;
    tangent_inWorld = normalize(v_tangent_inWorld);
    binormal_inWorld = normalize(v_binormal_inWorld);
    normal_inWorld = normalize(v_normal_inWorld);

    mat3 tbnMat_tangent_to_world = mat3(
      tangent_inWorld.x, tangent_inWorld.y, tangent_inWorld.z,
      binormal_inWorld.x, binormal_inWorld.y, binormal_inWorld.z,
      normal_inWorld.x, normal_inWorld.y, normal_inWorld.z
    );

    normal = normalize(tbnMat_tangent_to_world * normal);
    normal_inWorld = normal;
  }
  vec3 normal_forEnv = rotEnvMatrix * normal_inWorld;
  normal_forEnv.x *= -1.0;
  vec3 tangent_forEnv = rotEnvMatrix * tangent_inWorld;
  tangent_forEnv.x *= -1.0;
  vec3 binormal_forEnv = rotEnvMatrix * binormal_inWorld;
  binormal_forEnv.x *= -1.0;
  if (v_normal_inView.z < 0.0) {
    normal_forEnv = -normal_forEnv;
    tangent_forEnv = -tangent_forEnv;
    binormal_forEnv = -binormal_forEnv;
  }

  // BaseColorFactor
  vec3 baseColor = vec3(0.0, 0.0, 0.0);
  float alpha = 1.0;
  vec4 diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);
  if (v_color != baseColor && diffuseColorFactor.rgb != baseColor) {
    baseColor = v_color * diffuseColorFactor.rgb;
    alpha = diffuseColorFactor.a;
  } else if (v_color == baseColor) {
    baseColor = diffuseColorFactor.rgb;
    alpha = diffuseColorFactor.a;
  } else if (diffuseColorFactor.rgb == baseColor) {
    baseColor = v_color;
  } else {
    baseColor = vec3(1.0, 1.0, 1.0);
  }


  // Diffuse Color (take account for BaseColorTexture)
  vec2 baseTexUv = uvTransform(u_diffuseTextureTransform.xy, u_diffuseTextureTransform.zw, u_diffuseTextureRotation, v_texcoord);
  vec2 detailTexUv = uvTransform(u_detailColorTextureTransform.xy, u_detailColorTextureTransform.zw, u_detailColorTextureRotation, v_texcoord);
  vec4 textureColor = texture2D(u_diffuseColorTexture, baseTexUv);
  textureColor.rgb = pow(textureColor.rgb, vec3(2.2));
  vec4 baseDiffuseColor = textureColor;
  vec4 detailColor = texture2D(u_detailColorTexture, detailTexUv);
  detailColor.rgb = pow(detailColor.rgb, vec3(2.2));
  textureColor.xyz += clamp(detailColor.xyz - vec3(0.5, 0.5, 0.5), vec3(-0.5), vec3(0.5));
  baseColor *= textureColor.rgb;
  alpha *= textureColor.a;

  if (alpha < 0.01) {
    discard;
  }

  // Specular & Glossiness
  vec4 specularGlossinessFactor = get_specularGlossinessFactor(materialSID, 0);
  float userGlossiness = specularGlossinessFactor.a;
  vec3 specular = specularGlossinessFactor.rgb;

  vec4 specularGlossiness = texture2D(u_specularGlossinessTexture, v_texcoord);
  specularGlossiness = pow(specularGlossiness, vec4(2.2)); // sRGB to Linear
  userGlossiness = specularGlossiness.a * userGlossiness;
  specular = specularGlossiness.rgb * specular;

  float userRoughness = max(1.0 - userGlossiness, 0.04);
  float alphaRoughness = userRoughness * userRoughness;
  alphaRoughness = max(alphaRoughness, 0.0078125);

  // F0
  vec3 F0 = specular;

  // Albedo
  vec3 albedo = baseColor;

  // Anisotropy
  vec2 anisotropy = get_anisotropy(materialSID, 0);
  float baseAnisotropy = anisotropy.x;
  float clearcoatAnisotropy = anisotropy.y;

  // ViewDirection
  vec3 viewPosition = get_viewPosition(materialSID, 0);
  vec3 viewDirection = normalize(viewPosition - v_position_inWorld.xyz);
  vec3 env_viewDirection = rotEnvMatrix * normalize(viewPosition - v_position_inWorld.xyz);
  env_viewDirection.x *= -1.0;

  // NV
  float NV = clamp(dot(normal_inWorld, viewDirection), 0.0078125, 1.0);

  rt0 = vec4(0.0, 0.0, 0.0, alpha);

  vec2 clearcoatParameter = get_clearcoatParameter(materialSID, 0);
  float clearcoatFactor = clearcoatParameter.x;
  float clearcoatRoughness = max(1.0 - clearcoatParameter.y, 0.04);


  // Lighting
  if (length(normal_inWorld) > 0.02) {
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
        lightDirection = normalize(lightPosition - v_position_inWorld.xyz);
      }
      float spotEffect = 1.0;
      if (lightType > 1.75) { // is spotlight
        spotEffect = dot(lightDirection, lightDirection);
        if (spotEffect > spotCosCutoff) {
          spotEffect = pow(spotEffect, spotExponent);
        } else {
          spotEffect = 0.0;
        }
      }

      // IncidentLight
      vec3 incidentLight = spotEffect * lightIntensity.xyz;
      incidentLight *= M_PI;

      vec3 halfVector = normalize(lightDirection + viewDirection);
      float LH = clamp(dot(lightDirection, halfVector), 0.0, 1.0);

      // Specular
      float NL = clamp(dot(normal_inWorld, lightDirection), 0.0078125, 1.0);
      float NH = clamp(dot(normal_inWorld, halfVector), 0.0, 1.0);
      float VH = clamp(dot(viewDirection, halfVector), 0.0, 1.0);

      vec3 totalContrib = surfaceShading(materialSID, NH, NL, NV, VH, F0, lightDirection, halfVector, viewDirection, tangent_inWorld, binormal_inWorld, albedo, incidentLight,
        alphaRoughness, clearcoatRoughness, clearcoatFactor, baseAnisotropy, clearcoatAnisotropy);

      rt0.xyz += totalContrib;
//      rt0.xyz += specularContrib * vec3(NL) * incidentLight.rgb;
  //    rt0.xyz += diffuseContrib * vec3(NL) * incidentLight.rgb;
  //    rt0.xyz += (vec3(1.0) - F) * diffuse_brdf(albedo);//diffuseContrib;//vec3(NL) * incidentLight.rgb;
    }

    vec3 reflection = reflect(-env_viewDirection, normal_forEnv);

    vec3 ibl = IBLContribution(materialSID, normal_forEnv, env_viewDirection, NV, reflection, albedo, F0, userRoughness, clearcoatFactor, clearcoatRoughness, baseAnisotropy, clearcoatAnisotropy, tangent_forEnv, binormal_forEnv);
    // vec3 ibl = IBLContribution2(normal_forEnv, reflection, NV, F0, viewDirection, tangent_inWorld, binormal_inWorld, albedo,
      // userRoughness, alphaRoughness, clearcoatRoughness, clearcoatFactor, baseAnisotropy, clearcoatAnisotropy);

    // float occlusion = texture2D(u_occlusionTexture, v_texcoord).a;

    // Occlution to Indirect Lights
    rt0.xyz += ibl;
    // rt0.xyz += ibl * occlusion;

  } else {
    rt0 = vec4(baseColor, alpha);
  }

  // Emissive
  // vec3 emissive = srgbToLinear(texture2D(u_emissiveTexture, v_texcoord).xyz);
  // rt0.xyz += emissive;

/*
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
  */

  rt0.rgb *= alpha;
  rt0.a = alpha;
  int debugDisplay = get_debugDisplay(materialSID, 0);
  if (debugDisplay == 1) {
    rt0.rgb = baseDiffuseColor.rgb;
    rt0.a = 1.0;
  } else if (debugDisplay == 2) {
    rt0.rgb = detailColor.rgb;
    rt0.a = 1.0;
  } else if (debugDisplay == 3) {
    rt0.rgb = texture2D(u_normalTexture, baseUv).xyz * 2.0 - 1.0;
    rt0.a = 1.0;
  } else if (debugDisplay == 4) {
    rt0.rgb = texture2D(u_detailNormalTexture, detailUv).xyz * 2.0 - 1.0;
    rt0.a = 1.0;
  } else if (debugDisplay == 5) {
    rt0.rgb = specularGlossiness.rgb;
    rt0.a = 1.0;
  } else if (debugDisplay == 6) {
    rt0.rgb = vec3(specularGlossiness.w);
    rt0.a = 1.0;
  }

#pragma shaderity: require(../common/glFragColor.glsl)
}
