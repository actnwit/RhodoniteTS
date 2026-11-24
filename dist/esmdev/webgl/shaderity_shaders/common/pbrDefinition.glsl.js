// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgl/shaderity_shaders/common/pbrDefinition.glsl
var code = `
// https://github.com/KhronosGroup/glTF-Sample-Renderer
// Modified by Yuki Shimada

#ifdef RN_USE_PBR


const float c_MinRoughness = 0.04;

float angular_n_h(float NH) {
  return acos(NH);
}

float d_phong(float NH, float c1) {
  return pow(
    cos(acos(NH))
    , c1
  );
}

// this is from https://www.unrealengine.com/blog/physically-based-shading-on-mobile
vec2 envBRDFApprox( float Roughness, float NoV ) {
  const vec4 c0 = vec4(-1, -0.0275, -0.572, 0.022 );
  const vec4 c1 = vec4(1, 0.0425, 1.04, -0.04 );
  vec4 r = Roughness * c0 + c1;
  float a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;
  vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;

  return AB;
}

// GGX NDF
float d_GGX(float NH, float alphaRoughness) {
  float roughnessSqr = alphaRoughness * alphaRoughness;
  float f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (M_PI * f * f);
}

float d_torrance_reiz(float NH, float c3) {
  float CosSquared = NH*NH;
  float TanSquared = (1.0 - CosSquared)/CosSquared;
  //return (1.0/M_PI) * sq(c3/(CosSquared * (c3*c3 + TanSquared)));  // gamma = 2, aka GGX
  return (1.0/sqrt(M_PI)) * (sq(c3)/(CosSquared * (c3*c3 + TanSquared))); // gamma = 1, D_Berry
}

float d_beckmann(float NH, float m) {
  float co = 1.0 / (4.0 * m * m * NH * NH * NH * NH);
  float expx = exp((NH * NH - 1.0) / (m * m * NH * NH));
  return co * expx;
}

// the same as glTF WebGL sample
// https://github.com/KhronosGroup/glTF-WebGL-PBR/blob/88eda8c5358efe03128b72b6c5f5f6e5b6d023e1/shaders/pbr-frag.glsl#L188
// That is, Unreal Engine based approach, but modified to use alphaRoughness (squared artist's roughness parameter),
// and based on 'Separable Masking and Shadowing' approximation (propesed by Christophe Schlick)
// https://www.cs.virginia.edu/~jdl/bib/appearance/analytic%20models/schlick94b.pdf
float g_shielding(float NL, float NV, float alphaRoughness) {
  float r = alphaRoughness;

  // Local Shadowing using "Schlick-Smith" Masking Function
  float localShadowing = 2.0 * NL / (NL + sqrt(r * r + (1.0 - r * r) * (NL * NL)));

  // Local Masking using "Schlick-Smith" Masking Function
  float localMasking = 2.0 * NV / (NV + sqrt(r * r + (1.0 - r * r) * (NV * NV)));

  return localShadowing * localMasking;
}

// The code from https://google.github.io/filament/Filament.html#listing_approximatedspecularv
// The idea is from [Heitz14] Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs.
float v_GGXCorrelated(float NL, float NV, float alphaRoughness) {
  float a2 = alphaRoughness * alphaRoughness;
  float GGXV = NL * sqrt(NV * NV * (1.0 - a2) + a2);
  float GGXL = NV * sqrt(NL * NL * (1.0 - a2) + a2);
  float GGX = GGXV + GGXL;
  if (GGX > 0.0) {
    return clamp(0.5 / GGX, 0.0, 1.0);
  }
  return 1.0;
}

float v_GGXCorrelatedFast(float NL, float NV, float alphaRoughness) {
  float a = alphaRoughness;
  float GGXV = NL * (NV * (1.0 - a) + a);
  float GGXL = NV * (NL * (1.0 - a) + a);
  float GGX = GGXV + GGXL;
  if (GGX > 0.0) {
    return 0.5 / GGX;
  }
  return 0.0;
}

// The Schlick Approximation to Fresnel
float fresnelSchlick(float f0, float f90, float VdotH) {
  float x = clamp(1.0 - VdotH, 0.0, 1.0);
  float x2 = x * x;
  float x5 = x * x2 * x2;
  return f0 + (f90 - f0) * x5;
}

vec3 fresnelSchlick(vec3 f0, vec3 f90, float VdotH) {
  float x = clamp(1.0 - VdotH, 0.0, 1.0);
  float x2 = x * x;
  float x5 = x * x2 * x2;
  return f0 + (f90 - f0) * x5;
}

vec3 fresnelSchlick(vec3 f0, float f90, float VdotH)
{
  float x = clamp(1.0 - VdotH, 0.0, 1.0);
  float x2 = x * x;
  float x5 = x * x2 * x2;
  return f0 + (f90 - f0) * x5;
}

float fresnelSchlick(float f0, float VdotH)
{
  float f90 = 1.0; //clamp(50.0 * f0, 0.0, 1.0);
  return fresnelSchlick(f0, f90, VdotH);
}
vec3 fresnelSchlick(vec3 f0, float VdotH)
{
  float f90 = 1.0; //clamp(50.0 * f0, 0.0, 1.0);
  return fresnelSchlick(f0, f90, VdotH);
}

vec3 BRDF_specularGGX(float NH, float NL, float NV, float alphaRoughness) {
  float D = d_GGX(NH, alphaRoughness);
  float V = v_GGXCorrelated(NL, NV, alphaRoughness);
  return vec3(D) * vec3(V);
}

// Variants used by the punctual light loop: the caller hoists the fragment-invariant terms
// (roughnessSqr and the NdotV term of v_GGXCorrelated) out of the loop, so they are not
// recomputed for every light. The arithmetic is the same as d_GGX / v_GGXCorrelated.
float d_GGXWithRoughnessSquared(float NH, float roughnessSqr) {
  float f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (M_PI * f * f);
}

vec3 BRDF_specularGGXWithTerms(float NH, float NL, float NV, float roughnessSqr, float sqrtNdotVTerm) {
  float D = d_GGXWithRoughnessSquared(NH, roughnessSqr);
  float GGXV = NL * sqrtNdotVTerm;
  float GGXL = NV * sqrt(NL * NL * (1.0 - roughnessSqr) + roughnessSqr);
  float GGX = GGXV + GGXL;
  float V = 1.0;
  if (GGX > 0.0) {
    V = clamp(0.5 / GGX, 0.0, 1.0);
  }
  return vec3(D * V);
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#diffuse-brdf
vec3 BRDF_lambertian(vec3 diffuseAlbedo)
{
  // (1/pi) * diffuseAlbedo
  return diffuseAlbedo * RECIPROCAL_PI;
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#specular-brdf
float specular_brdf(float alphaRoughness, float NdotL, float NdotV, float NdotH) {
  float V = v_GGXCorrelated(NdotL, NdotV, alphaRoughness);
  float D = d_GGX(NdotH, alphaRoughness);
  return V * D;
}

// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission#implementation-notes
float specular_btdf(float alphaRoughness, float NdotL, float NdotV, float NdotHt) {
  float V = v_GGXCorrelated(NdotL, NdotV, alphaRoughness);
  float D = d_GGX(NdotHt, alphaRoughness);
  return V * D;
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#fresnel
vec3 conductor_fresnel(vec3 f0, float brdf, float alphaRoughness, float VdotH) {
  return vec3(brdf) * (f0.rgb + (vec3(1.0) - f0.rgb) * vec3(pow(1.0 - abs(VdotH), 5.0)));
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#fresnel
vec3 fresnel_mix(float ior, vec3 base, vec3 layer, float VdotH) {
  float f0 = pow((1.0 - ior)/(1.0 + ior), 2.0);
  float fr = f0 + (1.0 - f0) * pow(1.0 - abs(VdotH), 5.0);
  return mix(base, layer, fr);
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#metal-brdf-and-dielectric-brdf
vec3 metal_brdf(float perceptualRoughness, vec3 baseColor, float NdotL, float NdotV, float NdotH, float VdotH) {
  float alphaRoughness = perceptualRoughness * perceptualRoughness;
  return conductor_fresnel(
    baseColor,
    specular_brdf(alphaRoughness, NdotL, NdotV, NdotH),
    alphaRoughness,
    VdotH
  );
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#metal-brdf-and-dielectric-brdf
// vec3 dielectric_brdf(float ior, vec3 baseColor, float perceptualRoughness, float NdotL, float NdotV, float NdotH, float VdotH) {
//   vec3 base = BRDF_lambertian(baseColor);
//   float alphaRoughness = perceptualRoughness * perceptualRoughness;
//   vec3 layer = vec3(specular_brdf(alphaRoughness, NdotL, NdotV, NdotH));
//   return fresnel_mix(ior, base, layer, VdotH);
// }

// Roughness Dependent Fresnel
// https://www.jcgt.org/published/0008/01/03/paper.pdf
vec3 fresnelSchlickRoughness(vec3 F0, float cosTheta, float roughness)
{
  vec3 Fr = max(vec3(1.0 - roughness), F0) - F0;
  vec3 k_S = F0 + Fr * pow(1.0 - cosTheta, 5.0);
  return k_S;
}

// From: https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/e2c7b8c8bd12916c1a387cd41f9ef061edc718df/source/Renderer/shaders/brdf.glsl#L44-L66
vec3 Schlick_to_F0(vec3 f, vec3 f90, float VdotH) {
    float x = clamp(1.0 - VdotH, 0.0, 1.0);
    float x2 = x * x;
    float x5 = clamp(x * x2 * x2, 0.0, 0.9999);

    return (f - f90 * x5) / (1.0 - x5);
}

float Schlick_to_F0(float f, float f90, float VdotH) {
    float x = clamp(1.0 - VdotH, 0.0, 1.0);
    float x2 = x * x;
    float x5 = clamp(x * x2 * x2, 0.0, 0.9999);

    return (f - f90 * x5) / (1.0 - x5);
}

vec3 Schlick_to_F0(vec3 f, float VdotH) {
    return Schlick_to_F0(f, vec3(1.0), VdotH);
}

float Schlick_to_F0(float f, float VdotH) {
    return Schlick_to_F0(f, 1.0, VdotH);
}

vec3 normalBlendingUDN(sampler2D baseMap, sampler2D detailMap, vec2 baseUv, vec2 detailUv) {
  vec3 t = texture(baseMap,   baseUv).xyz * 2.0 - 1.0;
  vec3 u = texture(detailMap, detailUv).xyz * 2.0 - 1.0;
  vec3 r = normalize(vec3(t.xy + u.xy, t.z));
  return r;
}

#ifdef RN_IS_PIXEL_SHADER
float IsotropicNDFFiltering(vec3 normal, float roughness2) {
  float SIGMA2 = 0.15915494;
  float KAPPA = 0.18;
  vec3 dndu = dFdx(normal);
  vec3 dndv = dFdy(normal);
  float kernelRoughness2 = SIGMA2 * (dot(dndu, dndu) + dot(dndv, dndv));
  float clampedKernelRoughness2 = min(kernelRoughness2, KAPPA);
  float filteredRoughness2 = saturate(roughness2 + clampedKernelRoughness2);
  return filteredRoughness2;
}
#endif

////////////////////////////////////////
// glTF KHR_materials_transmission
////////////////////////////////////////

#ifdef RN_USE_TRANSMISSION
// https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md#attenuation
vec3 volumeAttenuation(vec3 attenuationColor, float attenuationDistance, vec3 intensity, float transmissionDistance)
{
  if (attenuationDistance == 0.0) { // means Infinite distance
    return intensity; // No attenuation
  } else {
    // vec3 attenuationCo = -log(attenuationColor) / attenuationDistance;
    // vec3 attenuatedTransmittance = exp(-attenuationCo * transmissionDistance);
    vec3 attenuatedTransmittance = pow(attenuationColor, vec3(transmissionDistance / attenuationDistance));
    return intensity * attenuatedTransmittance;
  }
}

// from glTF Sample Viewer: https://github.com/KhronosGroup/glTF-Sample-Viewer
vec3 getVolumeTransmissionRay(vec3 n, vec3 v, float thickness, float ior)
{
  vec3 refractionVector = refract(-v, normalize(n), 1.0 / ior);
#ifdef RN_RAYMARCHING_SHADING
  // The raymarching draw has no per-instance mesh transform (v_instanceIds is not
  // declared there), and SDF thickness is authored in world units.
  vec3 modelScale = vec3(1.0);
#else
  mat4 worldMatrix = get_worldMatrix(v_instanceIds.x);

  vec3 modelScale;
  modelScale.x = length(vec3(worldMatrix[0].xyz));
  modelScale.y = length(vec3(worldMatrix[1].xyz));
  modelScale.z = length(vec3(worldMatrix[2].xyz));
#endif

  return normalize(refractionVector) * thickness * modelScale;
}

float applyIorToRoughness(float roughness, float ior)
{
  return clamp(roughness * clamp(ior * 2.0 - 2.0, 0.0, 1.0), c_MinRoughness, 1.0);
}

vec3 calculateRadianceTransmission(vec3 normal, vec3 view, vec3 pointToLight, float alphaRoughness, vec3 baseColor, float ior)
{
  float transmissionRoughness = applyIorToRoughness(alphaRoughness, ior);

  vec3 n = normalize(normal);
  vec3 v = normalize(view);
  vec3 l = normalize(pointToLight);
  vec3 mirrorL = normalize(l + 2.0 * n * dot(-l, n));
  vec3 h = normalize(mirrorL + v);

  float D = d_GGX(clamp(dot(n, h), 0.0, 1.0), transmissionRoughness);
  float V = v_GGXCorrelated(clamp(dot(n, mirrorL), 0.0, 1.0), clamp(dot(n, v), 0.0, 1.0), transmissionRoughness);

  return baseColor * D * V;
}

#endif


////////////////////////////////////////
// glTF KHR_materials_anisotropy
////////////////////////////////////////
#ifdef RN_USE_ANISOTROPY
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy
float D_GGX_anisotropic(float NdotH, float TdotH, float BdotH, float at, float ab)
{
    float a2 = at * ab;
    vec3 f = vec3(ab * TdotH, at * BdotH, a2 * NdotH);
    float w2 = a2 / dot(f, f);
    return a2 * w2 * w2 / M_PI;
}

float V_GGX_anisotropic(float NdotL, float NdotV, float BdotV, float TdotV, float TdotL, float BdotL,
    float at, float ab)
{
    float GGXV = NdotL * length(vec3(at * TdotV, ab * BdotV, NdotV));
    float GGXL = NdotV * length(vec3(at * TdotL, ab * BdotL, NdotL));
    float GGX = GGXV + GGXL;
    if (GGX > 0.0) {
      return clamp(0.5 / GGX, 0.0, 1.0);
    }
    return 1.0;
}

vec3 BRDF_specularAnisotropicGGX(float alphaRoughness,
    float VdotH, float NdotL, float NdotV, float NdotH, float BdotV, float TdotV,
    float TdotL, float BdotL, float TdotH, float BdotH, float anisotropy)
{
    float at = mix(alphaRoughness, 1.0, anisotropy * anisotropy);
    float ab = clamp(alphaRoughness, 0.001, 1.0);

    float V = V_GGX_anisotropic(NdotL, NdotV, BdotV, TdotV, TdotL, BdotL, at, ab);
    float D = D_GGX_anisotropic(NdotH, TdotH, BdotH, at, ab);

    return vec3(V * D);
}
#endif



////////////////////////////////////////
// glTF KHR_materials_sheen
////////////////////////////////////////

#ifdef RN_USE_SHEEN
float d_Charlie(float sheenPerceptualRoughness, float NoH) {
  // Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
  float sheenRoughness = max(sheenPerceptualRoughness, 0.000001);
  float alphaG = sheenRoughness * sheenRoughness;
  float invAlpha  = 1.0 / alphaG;
  float cos2h = NoH * NoH;
  float sin2h = 1.0 - cos2h;
  return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * M_PI);
}

// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen#sheen-visibility
float sheenSimpleVisibility(float NdotL, float NdotV) {
  return 1.0 / (4.0 * (NdotL + NdotV - NdotL * NdotV));
}

// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen#sheen-visibility
float charlieL(float x, float alphaG) {
  float oneMinusAlphaSq = (1.0 - alphaG) * (1.0 - alphaG);
  float a = mix(21.5473, 25.3245, oneMinusAlphaSq);
  float b = mix(3.82987, 3.32435, oneMinusAlphaSq);
  float c = mix(0.19823, 0.16801, oneMinusAlphaSq);
  float d = mix(-1.97760, -1.27393, oneMinusAlphaSq);
  float e = mix(-4.32054, -4.85967, oneMinusAlphaSq);
  return a / (1.0 + b * pow(x, c)) + d * x + e;
}

float lambdaSheen(float cosTheta, float alphaG)
{
  return abs(cosTheta) < 0.5 ? exp(charlieL(cosTheta, alphaG)) : exp(2.0 * charlieL(0.5, alphaG) - charlieL(1.0 - cosTheta, alphaG));
}

float sheenCharlieVisibility(float NdotL, float NdotV, float sheenPerceptualRoughness) {
  float sheenRoughness = max(sheenPerceptualRoughness, 0.000001);
  float alphaG = sheenRoughness * sheenRoughness;
  float sheenVisibility = clamp(1.0 / ((1.0 + lambdaSheen(NdotV, alphaG) + lambdaSheen(NdotL, alphaG)) * (4.0 * NdotV * NdotL)), 0.0, 1.0);
  return sheenVisibility;
}

vec3 BRDF_specularSheen(vec3 sheenColor, float sheenPerceptualRoughness, float NdotL, float NdotV, float NdotH) {
  float sheenDistribution = d_Charlie(sheenPerceptualRoughness, NdotH);
  float sheenVisibility = sheenCharlieVisibility(NdotL, NdotV, sheenPerceptualRoughness);
  return sheenColor * sheenDistribution * sheenVisibility;
}
#endif









////////////////////////////////////////
// glTF KHR_materials_irirdescence
////////////////////////////////////////

#ifdef RN_USE_IRIDESCENCE
// XYZ to REC709(sRGB) conversion matrix
const mat3 XYZ_TO_REC709 = mat3(
     3.2404542, -0.9692660,  0.0556434,
    -1.5371385,  1.8760108, -0.2040259,
    -0.4985314,  0.0415560,  1.0572252
);

vec3 fresnelSchlickRoughnessWithIridescence(
  vec3 F0, float cosTheta, float roughness,
  vec3 iridescenceFresnel, float iridescence
  )
{
  vec3 Fr = max(vec3(1.0 - roughness), F0) - F0;
  vec3 k_S = mix(F0 + Fr * pow(1.0 - cosTheta, 5.0), iridescenceFresnel, iridescence);
  return k_S;
}

// Assume air interface for top
vec3 Fresnel0ToIor(vec3 F0) {
    vec3 sqrtF0 = sqrt(F0);
    return (vec3(1.0) + sqrtF0) / (vec3(1.0) - sqrtF0);
}

// Conversion from IOR to F0
// ior is a value between 1.0 and 3.0. 1.0 is air interface
vec3 IorToFresnel0(vec3 transmittedIor, float incidentIor) {
    return sq((transmittedIor - vec3(incidentIor)) / (transmittedIor + vec3(incidentIor)));
}
float IorToFresnel0(float transmittedIor, float incidentIor) {
    return sq((transmittedIor - incidentIor) / (transmittedIor + incidentIor));
}

/**
 * From: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence#analytic-spectral-integration
 */
vec3 evalSensitivity(float OPD, vec3 shift) {
    float phase = 2.0 * M_PI * OPD * 1.0e-9;
    vec3 val = vec3(5.4856e-13, 4.4201e-13, 5.2481e-13);
    vec3 pos = vec3(1.6810e+06, 1.7953e+06, 2.2084e+06);
    vec3 var = vec3(4.3278e+09, 9.3046e+09, 6.6121e+09);

    vec3 xyz = val * sqrt(2.0 * M_PI * var) * cos(pos * phase + shift) * exp(-(phase * phase) * var);
    xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e+09) * cos(2.2399e+06 * phase + shift[0]) * exp(-4.5282e+09 * (phase * phase));
    xyz /= 1.0685e-7;

    vec3 rgb = XYZ_TO_REC709 * xyz;
    return rgb;
}

/**
 * From: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence#iridescence-fresnel
 */
vec3 calcIridescence(float outsideIor, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0) {


  // iridescenceIor is the index of refraction of the thin-film layer
  // Force iridescenceIor -> outsideIOR when thinFilmThickness -> 0.0
  float iridescenceIor = mix(outsideIor, eta2, smoothstep(0.0, 0.03, thinFilmThickness));

  // To calculate the reflectances R12 and R23 at the viewing angles (angle hitting the thin-film layer)
  // and (angle after refraction in the thin-film) Schlick Fresnel is again used.
  // This approximation allows to eliminate the split into S and P polarization for the exact Fresnel equations.
  // can be calculated using Snell's law (with  being outsideIor and being iridescenceIor):
  float sinTheta2Sq = sq(outsideIor / iridescenceIor) * (1.0 - sq(cosTheta1));
  float cosTheta2Sq = 1.0 - sinTheta2Sq;

  // Handle total internal reflection
  if (cosTheta2Sq < 0.0) {
      return vec3(1.0);
  }

  float cosTheta2 = sqrt(cosTheta2Sq);

  /// Material Interfaces
  // The iridescence model defined by Belcour/Barla models two material interfaces
  // - one from the outside to the thin-film layer
  // and another one from the thin-film to the base material. These two interfaces are defined as follows:

  // First interface (from the outside to the thin-film layer)
  float R0 = IorToFresnel0(iridescenceIor, outsideIor);
  float R12 = fresnelSchlick(R0, cosTheta1);
  float R21 = R12;
  float T121 = 1.0 - R12;

  // Second interface (from the thin-film to the base material)
  vec3 baseIor = Fresnel0ToIor(baseF0 + 0.0001); // guard against 1.0
  vec3 R1 = IorToFresnel0(baseIor, iridescenceIor);
  vec3 R23 = fresnelSchlick(R1, cosTheta2);

  // phi12 and phi23 define the base phases per interface and are approximated with 0.0
  // if the IOR of the hit material (iridescenceIor or baseIor) is higher
  // than the IOR of the previous material (outsideIor or iridescenceIor) and \u03C0 otherwise.
  // Also here, polarization is ignored.  float phi12 = 0.0;

  // First interface (from the outside to the thin-film layer)
  float phi12 = 0.0;
  if (iridescenceIor < outsideIor) phi12 = M_PI;
  float phi21 = M_PI - phi12;

  // Second interface (from the thin-film to the base material)
  vec3 phi23 = vec3(0.0);
  if (baseIor[0] < iridescenceIor) phi23[0] = M_PI;
  if (baseIor[1] < iridescenceIor) phi23[1] = M_PI;
  if (baseIor[2] < iridescenceIor) phi23[2] = M_PI;

  // OPD (optical path difference)
  float OPD = 2.0 * iridescenceIor * thinFilmThickness * cosTheta2;
  // Phase shift
  vec3 phi = vec3(phi21) + phi23;

  // Compound terms
  vec3 R123 = clamp(R12 * R23, 1e-5, 0.9999);
  vec3 r123 = sqrt(R123);
  vec3 Rs = (T121 * T121) * R23 / (vec3(1.0) - R123);

  // Reflectance term for m = 0 (DC term amplitude)
  vec3 C0 = R12 + Rs;
  vec3 I = C0;

  // Reflectance term for m > 0 (pairs of diracs)
  vec3 Cm = Rs - T121;
  for (int m = 1; m <= 2; ++m)
  {
      Cm *= r123;
      vec3 Sm = 2.0 * evalSensitivity(float(m) * OPD, float(m) * phi);
      I += Cm * Sm;
  }

  vec3 F_iridescence = max(I, vec3(0.0));

  return F_iridescence;
}

//https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
vec3 BRDF_lambertianIridescence(vec3 f0, vec3 f90, vec3 iridescenceFresnel, float iridescenceFactor, vec3 diffuseColor, float specularWeight, float VdotH)
{
    vec3 iridescenceFresnelMax = vec3(max(max(iridescenceFresnel.r, iridescenceFresnel.g), iridescenceFresnel.b));
    vec3 schlickFresnel = Schlick_to_F0(f0, f90, VdotH);
    vec3 F = mix(schlickFresnel, iridescenceFresnelMax, iridescenceFactor);

    // see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
    return (1.0 - specularWeight * F) * (diffuseColor / M_PI);
}

vec3 BRDF_specularGGXIridescence(vec3 f0, vec3 f90, vec3 iridescenceFresnel, float alphaRoughness, float iridescenceFactor, float specularWeight, float VdotH, float NdotL, float NdotV, float NdotH)
{
    vec3 F = mix(Schlick_to_F0(f0, f90, VdotH), iridescenceFresnel, iridescenceFactor);
    float Vis = v_GGXCorrelated(NdotL, NdotV, alphaRoughness);
    float D = d_GGX(NdotH, alphaRoughness);

    return specularWeight * F * Vis * D;
}

vec3 rgb_mix(vec3 base, vec3 specular_brdf, vec3 rgb_alpha)
{
    float rgb_alpha_max = max(rgb_alpha.r, max(rgb_alpha.g, rgb_alpha.b));
    return (1.0 - rgb_alpha_max) * base + rgb_alpha * specular_brdf;
}

#endif // RN_USE_IRIDESCENCE


struct OcclusionProps
{
  vec4 occlusionTexture;
  float occlusionStrength;
};

struct EmissiveProps
{
  vec3 emissive;
  float emissiveStrength;
};

struct ClearcoatProps
{
  float clearcoat;
  float clearcoatRoughness;
  vec3 clearcoatF0;
  vec3 clearcoatF90;
  vec3 clearcoatFresnel;
  vec3 clearcoatNormal_inTangent;
  vec3 clearcoatNormal_inWorld;
  float VdotNc;
};

struct SheenProps
{
  vec3 sheenColor;
  float sheenRoughness;
  float albedoSheenScalingNdotV;
};

struct IridescenceProps
{
  float iridescence;
  float iridescenceIor;
  float iridescenceThickness;
  vec3 fresnelDielectric;
  vec3 fresnelMetal;
};

struct AnisotropyProps
{
  float anisotropy;
  vec3 anisotropicT;
  vec3 anisotropicB;
  float BdotV;
  float TdotV;
  vec2 direction;
};

struct VolumeProps
{
  float thickness;
  vec3 attenuationColor;
  float attenuationDistance;
};

struct DiffuseTransmissionProps
{
  float diffuseTransmission;
  vec3 diffuseTransmissionColor;
  float diffuseTransmissionThickness;
};

struct SpecularProps
{
  float specularWeight;
  vec3 specularColor;
};

////////////////////////////////////////
// lighting with a punctual light
////////////////////////////////////////
vec3 lightingWithPunctualLight(
  Light light,
  vec3 normal_inWorld,
  vec3 viewDirection,
  float NdotV,
  vec3 baseColor,
  float alphaRoughness,
  float alphaRoughness2,
  float sqrtNdotVTerm,
  vec3 diffuseBrdf,
  float metallic,
  float specularWeight,
  vec3 dielectricF0,
  vec3 dielectricF90,
  float ior,
  float transmission,
  VolumeProps volumeProps,
  ClearcoatProps clearcoatProps,
  AnisotropyProps anisotropyProps,
  SheenProps sheenProps,
  IridescenceProps iridescenceProps,
  DiffuseTransmissionProps diffuseTransmissionProps
  )
{
  // Fresnel
  vec3 halfVector = normalize(light.direction + viewDirection);
  float VdotH = saturate(dot(viewDirection, halfVector));
  // Both Schlick terms share the same polynomial in VdotH.
  float schlickX = clamp(1.0 - VdotH, 0.0, 1.0);
  float schlickX2 = schlickX * schlickX;
  float schlickX5 = schlickX * schlickX2 * schlickX2;
  vec3 dielectricFresnel = dielectricF0 + (dielectricF90 - dielectricF0) * schlickX5;
  vec3 metalFresnel = baseColor + (vec3(1.0) - baseColor) * schlickX5;

  float NdotL = saturateEpsilonToOne(dot(normal_inWorld, light.direction));

  // Diffuse
  vec3 diffuseContrib = diffuseBrdf * vec3(NdotL) * light.attenuatedIntensity;

#ifdef RN_USE_DIFFUSE_TRANSMISSION
  diffuseContrib = diffuseContrib * (vec3(1.0) - diffuseTransmissionProps.diffuseTransmission);
  if (dot(normal_inWorld, light.direction) < 0.0) {
    float diffuseNdotL = saturate(dot(normal_inWorld, -light.direction));
    vec3 diffuseBtdf = BRDF_lambertian(diffuseTransmissionProps.diffuseTransmissionColor) * vec3(diffuseNdotL) * light.attenuatedIntensity;
    vec3 mirrorL = normalize(light.direction + 2.0 * normal_inWorld * dot(normal_inWorld, -light.direction));
    float diffuseVdotH = saturate(dot(viewDirection, normalize(mirrorL + viewDirection)));
    dielectricFresnel = fresnelSchlick(dielectricF0 * specularWeight, dielectricF90, abs(diffuseVdotH));
#ifdef RN_USE_VOLUME
    diffuseBtdf = volumeAttenuation(volumeProps.attenuationColor, volumeProps.attenuationDistance, diffuseBtdf, diffuseTransmissionProps.diffuseTransmissionThickness);
#endif // RN_USE_VOLUME
    diffuseContrib += diffuseBtdf * diffuseTransmissionProps.diffuseTransmission;
  }
#endif // RN_USE_DIFFUSE_TRANSMISSION


#ifdef RN_USE_TRANSMISSION
  vec3 transmittionRay = getVolumeTransmissionRay(normal_inWorld, viewDirection, volumeProps.thickness, ior);
  light.pointToLight -= transmittionRay;
  light.direction = normalize(light.pointToLight);
  vec3 transmittedContrib = calculateRadianceTransmission(normal_inWorld, viewDirection, light.direction, alphaRoughness, baseColor, ior) * light.attenuatedIntensity;

#ifdef RN_USE_VOLUME
  transmittedContrib = volumeAttenuation(volumeProps.attenuationColor, volumeProps.attenuationDistance, transmittedContrib, length(transmittionRay));
#endif // RN_USE_VOLUME

  diffuseContrib = mix(diffuseContrib, vec3(transmittedContrib), transmission);
#endif // RN_USE_TRANSMISSION

  light.attenuatedIntensity = getLightAttenuated(light);
  // Specular
  float NdotH = saturate(dot(normal_inWorld, halfVector));

#ifdef RN_USE_ANISOTROPY
  float TdotL = dot(anisotropyProps.anisotropicT, light.direction);
  float BdotL = dot(anisotropyProps.anisotropicB, light.direction);
  float TdotH = dot(anisotropyProps.anisotropicT, halfVector);
  float BdotH = dot(anisotropyProps.anisotropicB, halfVector);
  vec3 specularMetalContrib = BRDF_specularAnisotropicGGX(alphaRoughness, VdotH, NdotL, NdotV, NdotH, anisotropyProps.BdotV, anisotropyProps.TdotV, TdotL, BdotL, TdotH, BdotH, anisotropyProps.anisotropy) * vec3(NdotL) * light.attenuatedIntensity;
  vec3 specularDielectricContrib = specularMetalContrib;
#else
  vec3 specularMetalContrib = BRDF_specularGGXWithTerms(NdotH, NdotL, NdotV, alphaRoughness2, sqrtNdotVTerm) * vec3(NdotL) * light.attenuatedIntensity;
  vec3 specularDielectricContrib = specularMetalContrib;
#endif // RN_USE_ANISOTROPY

  // Base Layer
  vec3 metal = specularMetalContrib * metalFresnel;
  vec3 dielectric = mix(diffuseContrib, specularDielectricContrib, dielectricFresnel);

#ifdef RN_USE_IRIDESCENCE
  metal = mix(metal, specularMetalContrib * iridescenceProps.fresnelMetal, iridescenceProps.iridescence);
  dielectric = mix(dielectric, rgb_mix(diffuseContrib, specularDielectricContrib, iridescenceProps.fresnelDielectric), iridescenceProps.iridescence);
#endif // RN_USE_IRIDESCENCE

#ifdef RN_USE_CLEARCOAT
  // Clear Coat Layer
  float NdotHc = saturate(dot(clearcoatProps.clearcoatNormal_inWorld, halfVector));
  float LdotNc = saturate(dot(light.direction, clearcoatProps.clearcoatNormal_inWorld));
  vec3 clearcoatContrib = BRDF_specularGGX(NdotHc, LdotNc, clearcoatProps.VdotNc, clearcoatProps.clearcoatRoughness * clearcoatProps.clearcoatRoughness) * vec3(LdotNc) * light.attenuatedIntensity;
#else
  vec3 clearcoatContrib = vec3(0.0);
#endif // RN_USE_CLEARCOAT

#ifdef RN_USE_SHEEN
  // Sheen
  vec3 sheenContrib = BRDF_specularSheen(sheenProps.sheenColor, sheenProps.sheenRoughness, NdotL, NdotV, NdotH) * NdotL * light.attenuatedIntensity;
  // This runs in the light loop, whose trip count is not uniform with Clustered Forward rendering,
  // so the LUT (which has no mipmaps) is sampled with an explicit level.
  float albedoSheenScaling = min(
    sheenProps.albedoSheenScalingNdotV,
    1.0 - max3(sheenProps.sheenColor) * textureLod(u_sheenLutTexture, vec2(NdotL, sheenProps.sheenRoughness), 0.0).r);
#else
  vec3 sheenContrib = vec3(0.0);
  float albedoSheenScaling = 1.0;
#endif // RN_USE_SHEEN

  vec3 color = mix(dielectric, metal, metallic);
  color = sheenContrib + color * albedoSheenScaling;
  color = mix(color, clearcoatContrib, clearcoatProps.clearcoat * clearcoatProps.clearcoatFresnel);

  return color;
}

#endif // RN_USE_PBR
`;
var shaderStage = "fragment";
var isFragmentShader = true;
var pbrDefinition_default = { code, shaderStage, isFragmentShader };
export {
  code,
  pbrDefinition_default as default,
  isFragmentShader,
  shaderStage
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ2wvc2hhZGVyaXR5X3NoYWRlcnMvY29tbW9uL3BickRlZmluaXRpb24uZ2xzbCJdLAogICJzb3VyY2VzQ29udGVudCI6IFsie1wiY29kZVwiOlwiXFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGLVNhbXBsZS1SZW5kZXJlclxcbi8vIE1vZGlmaWVkIGJ5IFl1a2kgU2hpbWFkYVxcblxcbiNpZmRlZiBSTl9VU0VfUEJSXFxuXFxuXFxuY29uc3QgZmxvYXQgY19NaW5Sb3VnaG5lc3MgPSAwLjA0O1xcblxcbmZsb2F0IGFuZ3VsYXJfbl9oKGZsb2F0IE5IKSB7XFxuICByZXR1cm4gYWNvcyhOSCk7XFxufVxcblxcbmZsb2F0IGRfcGhvbmcoZmxvYXQgTkgsIGZsb2F0IGMxKSB7XFxuICByZXR1cm4gcG93KFxcbiAgICBjb3MoYWNvcyhOSCkpXFxuICAgICwgYzFcXG4gICk7XFxufVxcblxcbi8vIHRoaXMgaXMgZnJvbSBodHRwczovL3d3dy51bnJlYWxlbmdpbmUuY29tL2Jsb2cvcGh5c2ljYWxseS1iYXNlZC1zaGFkaW5nLW9uLW1vYmlsZVxcbnZlYzIgZW52QlJERkFwcHJveCggZmxvYXQgUm91Z2huZXNzLCBmbG9hdCBOb1YgKSB7XFxuICBjb25zdCB2ZWM0IGMwID0gdmVjNCgtMSwgLTAuMDI3NSwgLTAuNTcyLCAwLjAyMiApO1xcbiAgY29uc3QgdmVjNCBjMSA9IHZlYzQoMSwgMC4wNDI1LCAxLjA0LCAtMC4wNCApO1xcbiAgdmVjNCByID0gUm91Z2huZXNzICogYzAgKyBjMTtcXG4gIGZsb2F0IGEwMDQgPSBtaW4oIHIueCAqIHIueCwgZXhwMiggLTkuMjggKiBOb1YgKSApICogci54ICsgci55O1xcbiAgdmVjMiBBQiA9IHZlYzIoIC0xLjA0LCAxLjA0ICkgKiBhMDA0ICsgci56dztcXG5cXG4gIHJldHVybiBBQjtcXG59XFxuXFxuLy8gR0dYIE5ERlxcbmZsb2F0IGRfR0dYKGZsb2F0IE5ILCBmbG9hdCBhbHBoYVJvdWdobmVzcykge1xcbiAgZmxvYXQgcm91Z2huZXNzU3FyID0gYWxwaGFSb3VnaG5lc3MgKiBhbHBoYVJvdWdobmVzcztcXG4gIGZsb2F0IGYgPSAocm91Z2huZXNzU3FyIC0gMS4wKSAqIE5IICogTkggKyAxLjA7XFxuICByZXR1cm4gcm91Z2huZXNzU3FyIC8gKE1fUEkgKiBmICogZik7XFxufVxcblxcbmZsb2F0IGRfdG9ycmFuY2VfcmVpeihmbG9hdCBOSCwgZmxvYXQgYzMpIHtcXG4gIGZsb2F0IENvc1NxdWFyZWQgPSBOSCpOSDtcXG4gIGZsb2F0IFRhblNxdWFyZWQgPSAoMS4wIC0gQ29zU3F1YXJlZCkvQ29zU3F1YXJlZDtcXG4gIC8vcmV0dXJuICgxLjAvTV9QSSkgKiBzcShjMy8oQ29zU3F1YXJlZCAqIChjMypjMyArIFRhblNxdWFyZWQpKSk7ICAvLyBnYW1tYSA9IDIsIGFrYSBHR1hcXG4gIHJldHVybiAoMS4wL3NxcnQoTV9QSSkpICogKHNxKGMzKS8oQ29zU3F1YXJlZCAqIChjMypjMyArIFRhblNxdWFyZWQpKSk7IC8vIGdhbW1hID0gMSwgRF9CZXJyeVxcbn1cXG5cXG5mbG9hdCBkX2JlY2ttYW5uKGZsb2F0IE5ILCBmbG9hdCBtKSB7XFxuICBmbG9hdCBjbyA9IDEuMCAvICg0LjAgKiBtICogbSAqIE5IICogTkggKiBOSCAqIE5IKTtcXG4gIGZsb2F0IGV4cHggPSBleHAoKE5IICogTkggLSAxLjApIC8gKG0gKiBtICogTkggKiBOSCkpO1xcbiAgcmV0dXJuIGNvICogZXhweDtcXG59XFxuXFxuLy8gdGhlIHNhbWUgYXMgZ2xURiBXZWJHTCBzYW1wbGVcXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYtV2ViR0wtUEJSL2Jsb2IvODhlZGE4YzUzNThlZmUwMzEyOGI3MmI2YzVmNWY2ZTViNmQwMjNlMS9zaGFkZXJzL3Bici1mcmFnLmdsc2wjTDE4OFxcbi8vIFRoYXQgaXMsIFVucmVhbCBFbmdpbmUgYmFzZWQgYXBwcm9hY2gsIGJ1dCBtb2RpZmllZCB0byB1c2UgYWxwaGFSb3VnaG5lc3MgKHNxdWFyZWQgYXJ0aXN0J3Mgcm91Z2huZXNzIHBhcmFtZXRlciksXFxuLy8gYW5kIGJhc2VkIG9uICdTZXBhcmFibGUgTWFza2luZyBhbmQgU2hhZG93aW5nJyBhcHByb3hpbWF0aW9uIChwcm9wZXNlZCBieSBDaHJpc3RvcGhlIFNjaGxpY2spXFxuLy8gaHR0cHM6Ly93d3cuY3MudmlyZ2luaWEuZWR1L35qZGwvYmliL2FwcGVhcmFuY2UvYW5hbHl0aWMlMjBtb2RlbHMvc2NobGljazk0Yi5wZGZcXG5mbG9hdCBnX3NoaWVsZGluZyhmbG9hdCBOTCwgZmxvYXQgTlYsIGZsb2F0IGFscGhhUm91Z2huZXNzKSB7XFxuICBmbG9hdCByID0gYWxwaGFSb3VnaG5lc3M7XFxuXFxuICAvLyBMb2NhbCBTaGFkb3dpbmcgdXNpbmcgXFxcIlNjaGxpY2stU21pdGhcXFwiIE1hc2tpbmcgRnVuY3Rpb25cXG4gIGZsb2F0IGxvY2FsU2hhZG93aW5nID0gMi4wICogTkwgLyAoTkwgKyBzcXJ0KHIgKiByICsgKDEuMCAtIHIgKiByKSAqIChOTCAqIE5MKSkpO1xcblxcbiAgLy8gTG9jYWwgTWFza2luZyB1c2luZyBcXFwiU2NobGljay1TbWl0aFxcXCIgTWFza2luZyBGdW5jdGlvblxcbiAgZmxvYXQgbG9jYWxNYXNraW5nID0gMi4wICogTlYgLyAoTlYgKyBzcXJ0KHIgKiByICsgKDEuMCAtIHIgKiByKSAqIChOViAqIE5WKSkpO1xcblxcbiAgcmV0dXJuIGxvY2FsU2hhZG93aW5nICogbG9jYWxNYXNraW5nO1xcbn1cXG5cXG4vLyBUaGUgY29kZSBmcm9tIGh0dHBzOi8vZ29vZ2xlLmdpdGh1Yi5pby9maWxhbWVudC9GaWxhbWVudC5odG1sI2xpc3RpbmdfYXBwcm94aW1hdGVkc3BlY3VsYXJ2XFxuLy8gVGhlIGlkZWEgaXMgZnJvbSBbSGVpdHoxNF0gRXJpYyBIZWl0ei4gMjAxNC4gVW5kZXJzdGFuZGluZyB0aGUgTWFza2luZy1TaGFkb3dpbmcgRnVuY3Rpb24gaW4gTWljcm9mYWNldC1CYXNlZCBCUkRGcy5cXG5mbG9hdCB2X0dHWENvcnJlbGF0ZWQoZmxvYXQgTkwsIGZsb2F0IE5WLCBmbG9hdCBhbHBoYVJvdWdobmVzcykge1xcbiAgZmxvYXQgYTIgPSBhbHBoYVJvdWdobmVzcyAqIGFscGhhUm91Z2huZXNzO1xcbiAgZmxvYXQgR0dYViA9IE5MICogc3FydChOViAqIE5WICogKDEuMCAtIGEyKSArIGEyKTtcXG4gIGZsb2F0IEdHWEwgPSBOViAqIHNxcnQoTkwgKiBOTCAqICgxLjAgLSBhMikgKyBhMik7XFxuICBmbG9hdCBHR1ggPSBHR1hWICsgR0dYTDtcXG4gIGlmIChHR1ggPiAwLjApIHtcXG4gICAgcmV0dXJuIGNsYW1wKDAuNSAvIEdHWCwgMC4wLCAxLjApO1xcbiAgfVxcbiAgcmV0dXJuIDEuMDtcXG59XFxuXFxuZmxvYXQgdl9HR1hDb3JyZWxhdGVkRmFzdChmbG9hdCBOTCwgZmxvYXQgTlYsIGZsb2F0IGFscGhhUm91Z2huZXNzKSB7XFxuICBmbG9hdCBhID0gYWxwaGFSb3VnaG5lc3M7XFxuICBmbG9hdCBHR1hWID0gTkwgKiAoTlYgKiAoMS4wIC0gYSkgKyBhKTtcXG4gIGZsb2F0IEdHWEwgPSBOViAqIChOTCAqICgxLjAgLSBhKSArIGEpO1xcbiAgZmxvYXQgR0dYID0gR0dYViArIEdHWEw7XFxuICBpZiAoR0dYID4gMC4wKSB7XFxuICAgIHJldHVybiAwLjUgLyBHR1g7XFxuICB9XFxuICByZXR1cm4gMC4wO1xcbn1cXG5cXG4vLyBUaGUgU2NobGljayBBcHByb3hpbWF0aW9uIHRvIEZyZXNuZWxcXG5mbG9hdCBmcmVzbmVsU2NobGljayhmbG9hdCBmMCwgZmxvYXQgZjkwLCBmbG9hdCBWZG90SCkge1xcbiAgZmxvYXQgeCA9IGNsYW1wKDEuMCAtIFZkb3RILCAwLjAsIDEuMCk7XFxuICBmbG9hdCB4MiA9IHggKiB4O1xcbiAgZmxvYXQgeDUgPSB4ICogeDIgKiB4MjtcXG4gIHJldHVybiBmMCArIChmOTAgLSBmMCkgKiB4NTtcXG59XFxuXFxudmVjMyBmcmVzbmVsU2NobGljayh2ZWMzIGYwLCB2ZWMzIGY5MCwgZmxvYXQgVmRvdEgpIHtcXG4gIGZsb2F0IHggPSBjbGFtcCgxLjAgLSBWZG90SCwgMC4wLCAxLjApO1xcbiAgZmxvYXQgeDIgPSB4ICogeDtcXG4gIGZsb2F0IHg1ID0geCAqIHgyICogeDI7XFxuICByZXR1cm4gZjAgKyAoZjkwIC0gZjApICogeDU7XFxufVxcblxcbnZlYzMgZnJlc25lbFNjaGxpY2sodmVjMyBmMCwgZmxvYXQgZjkwLCBmbG9hdCBWZG90SClcXG57XFxuICBmbG9hdCB4ID0gY2xhbXAoMS4wIC0gVmRvdEgsIDAuMCwgMS4wKTtcXG4gIGZsb2F0IHgyID0geCAqIHg7XFxuICBmbG9hdCB4NSA9IHggKiB4MiAqIHgyO1xcbiAgcmV0dXJuIGYwICsgKGY5MCAtIGYwKSAqIHg1O1xcbn1cXG5cXG5mbG9hdCBmcmVzbmVsU2NobGljayhmbG9hdCBmMCwgZmxvYXQgVmRvdEgpXFxue1xcbiAgZmxvYXQgZjkwID0gMS4wOyAvL2NsYW1wKDUwLjAgKiBmMCwgMC4wLCAxLjApO1xcbiAgcmV0dXJuIGZyZXNuZWxTY2hsaWNrKGYwLCBmOTAsIFZkb3RIKTtcXG59XFxudmVjMyBmcmVzbmVsU2NobGljayh2ZWMzIGYwLCBmbG9hdCBWZG90SClcXG57XFxuICBmbG9hdCBmOTAgPSAxLjA7IC8vY2xhbXAoNTAuMCAqIGYwLCAwLjAsIDEuMCk7XFxuICByZXR1cm4gZnJlc25lbFNjaGxpY2soZjAsIGY5MCwgVmRvdEgpO1xcbn1cXG5cXG52ZWMzIEJSREZfc3BlY3VsYXJHR1goZmxvYXQgTkgsIGZsb2F0IE5MLCBmbG9hdCBOViwgZmxvYXQgYWxwaGFSb3VnaG5lc3MpIHtcXG4gIGZsb2F0IEQgPSBkX0dHWChOSCwgYWxwaGFSb3VnaG5lc3MpO1xcbiAgZmxvYXQgViA9IHZfR0dYQ29ycmVsYXRlZChOTCwgTlYsIGFscGhhUm91Z2huZXNzKTtcXG4gIHJldHVybiB2ZWMzKEQpICogdmVjMyhWKTtcXG59XFxuXFxuLy8gVmFyaWFudHMgdXNlZCBieSB0aGUgcHVuY3R1YWwgbGlnaHQgbG9vcDogdGhlIGNhbGxlciBob2lzdHMgdGhlIGZyYWdtZW50LWludmFyaWFudCB0ZXJtc1xcbi8vIChyb3VnaG5lc3NTcXIgYW5kIHRoZSBOZG90ViB0ZXJtIG9mIHZfR0dYQ29ycmVsYXRlZCkgb3V0IG9mIHRoZSBsb29wLCBzbyB0aGV5IGFyZSBub3RcXG4vLyByZWNvbXB1dGVkIGZvciBldmVyeSBsaWdodC4gVGhlIGFyaXRobWV0aWMgaXMgdGhlIHNhbWUgYXMgZF9HR1ggLyB2X0dHWENvcnJlbGF0ZWQuXFxuZmxvYXQgZF9HR1hXaXRoUm91Z2huZXNzU3F1YXJlZChmbG9hdCBOSCwgZmxvYXQgcm91Z2huZXNzU3FyKSB7XFxuICBmbG9hdCBmID0gKHJvdWdobmVzc1NxciAtIDEuMCkgKiBOSCAqIE5IICsgMS4wO1xcbiAgcmV0dXJuIHJvdWdobmVzc1NxciAvIChNX1BJICogZiAqIGYpO1xcbn1cXG5cXG52ZWMzIEJSREZfc3BlY3VsYXJHR1hXaXRoVGVybXMoZmxvYXQgTkgsIGZsb2F0IE5MLCBmbG9hdCBOViwgZmxvYXQgcm91Z2huZXNzU3FyLCBmbG9hdCBzcXJ0TmRvdFZUZXJtKSB7XFxuICBmbG9hdCBEID0gZF9HR1hXaXRoUm91Z2huZXNzU3F1YXJlZChOSCwgcm91Z2huZXNzU3FyKTtcXG4gIGZsb2F0IEdHWFYgPSBOTCAqIHNxcnROZG90VlRlcm07XFxuICBmbG9hdCBHR1hMID0gTlYgKiBzcXJ0KE5MICogTkwgKiAoMS4wIC0gcm91Z2huZXNzU3FyKSArIHJvdWdobmVzc1Nxcik7XFxuICBmbG9hdCBHR1ggPSBHR1hWICsgR0dYTDtcXG4gIGZsb2F0IFYgPSAxLjA7XFxuICBpZiAoR0dYID4gMC4wKSB7XFxuICAgIFYgPSBjbGFtcCgwLjUgLyBHR1gsIDAuMCwgMS4wKTtcXG4gIH1cXG4gIHJldHVybiB2ZWMzKEQgKiBWKTtcXG59XFxuXFxuLy8gaHR0cHM6Ly93d3cua2hyb25vcy5vcmcvcmVnaXN0cnkvZ2xURi9zcGVjcy8yLjAvZ2xURi0yLjAuaHRtbCNkaWZmdXNlLWJyZGZcXG52ZWMzIEJSREZfbGFtYmVydGlhbih2ZWMzIGRpZmZ1c2VBbGJlZG8pXFxue1xcbiAgLy8gKDEvcGkpICogZGlmZnVzZUFsYmVkb1xcbiAgcmV0dXJuIGRpZmZ1c2VBbGJlZG8gKiBSRUNJUFJPQ0FMX1BJO1xcbn1cXG5cXG4vLyBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS9nbFRGL3NwZWNzLzIuMC9nbFRGLTIuMC5odG1sI3NwZWN1bGFyLWJyZGZcXG5mbG9hdCBzcGVjdWxhcl9icmRmKGZsb2F0IGFscGhhUm91Z2huZXNzLCBmbG9hdCBOZG90TCwgZmxvYXQgTmRvdFYsIGZsb2F0IE5kb3RIKSB7XFxuICBmbG9hdCBWID0gdl9HR1hDb3JyZWxhdGVkKE5kb3RMLCBOZG90ViwgYWxwaGFSb3VnaG5lc3MpO1xcbiAgZmxvYXQgRCA9IGRfR0dYKE5kb3RILCBhbHBoYVJvdWdobmVzcyk7XFxuICByZXR1cm4gViAqIEQ7XFxufVxcblxcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21haW4vZXh0ZW5zaW9ucy8yLjAvS2hyb25vcy9LSFJfbWF0ZXJpYWxzX3RyYW5zbWlzc2lvbiNpbXBsZW1lbnRhdGlvbi1ub3Rlc1xcbmZsb2F0IHNwZWN1bGFyX2J0ZGYoZmxvYXQgYWxwaGFSb3VnaG5lc3MsIGZsb2F0IE5kb3RMLCBmbG9hdCBOZG90ViwgZmxvYXQgTmRvdEh0KSB7XFxuICBmbG9hdCBWID0gdl9HR1hDb3JyZWxhdGVkKE5kb3RMLCBOZG90ViwgYWxwaGFSb3VnaG5lc3MpO1xcbiAgZmxvYXQgRCA9IGRfR0dYKE5kb3RIdCwgYWxwaGFSb3VnaG5lc3MpO1xcbiAgcmV0dXJuIFYgKiBEO1xcbn1cXG5cXG4vLyBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS9nbFRGL3NwZWNzLzIuMC9nbFRGLTIuMC5odG1sI2ZyZXNuZWxcXG52ZWMzIGNvbmR1Y3Rvcl9mcmVzbmVsKHZlYzMgZjAsIGZsb2F0IGJyZGYsIGZsb2F0IGFscGhhUm91Z2huZXNzLCBmbG9hdCBWZG90SCkge1xcbiAgcmV0dXJuIHZlYzMoYnJkZikgKiAoZjAucmdiICsgKHZlYzMoMS4wKSAtIGYwLnJnYikgKiB2ZWMzKHBvdygxLjAgLSBhYnMoVmRvdEgpLCA1LjApKSk7XFxufVxcblxcbi8vIGh0dHBzOi8vd3d3Lmtocm9ub3Mub3JnL3JlZ2lzdHJ5L2dsVEYvc3BlY3MvMi4wL2dsVEYtMi4wLmh0bWwjZnJlc25lbFxcbnZlYzMgZnJlc25lbF9taXgoZmxvYXQgaW9yLCB2ZWMzIGJhc2UsIHZlYzMgbGF5ZXIsIGZsb2F0IFZkb3RIKSB7XFxuICBmbG9hdCBmMCA9IHBvdygoMS4wIC0gaW9yKS8oMS4wICsgaW9yKSwgMi4wKTtcXG4gIGZsb2F0IGZyID0gZjAgKyAoMS4wIC0gZjApICogcG93KDEuMCAtIGFicyhWZG90SCksIDUuMCk7XFxuICByZXR1cm4gbWl4KGJhc2UsIGxheWVyLCBmcik7XFxufVxcblxcbi8vIGh0dHBzOi8vd3d3Lmtocm9ub3Mub3JnL3JlZ2lzdHJ5L2dsVEYvc3BlY3MvMi4wL2dsVEYtMi4wLmh0bWwjbWV0YWwtYnJkZi1hbmQtZGllbGVjdHJpYy1icmRmXFxudmVjMyBtZXRhbF9icmRmKGZsb2F0IHBlcmNlcHR1YWxSb3VnaG5lc3MsIHZlYzMgYmFzZUNvbG9yLCBmbG9hdCBOZG90TCwgZmxvYXQgTmRvdFYsIGZsb2F0IE5kb3RILCBmbG9hdCBWZG90SCkge1xcbiAgZmxvYXQgYWxwaGFSb3VnaG5lc3MgPSBwZXJjZXB0dWFsUm91Z2huZXNzICogcGVyY2VwdHVhbFJvdWdobmVzcztcXG4gIHJldHVybiBjb25kdWN0b3JfZnJlc25lbChcXG4gICAgYmFzZUNvbG9yLFxcbiAgICBzcGVjdWxhcl9icmRmKGFscGhhUm91Z2huZXNzLCBOZG90TCwgTmRvdFYsIE5kb3RIKSxcXG4gICAgYWxwaGFSb3VnaG5lc3MsXFxuICAgIFZkb3RIXFxuICApO1xcbn1cXG5cXG4vLyBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS9nbFRGL3NwZWNzLzIuMC9nbFRGLTIuMC5odG1sI21ldGFsLWJyZGYtYW5kLWRpZWxlY3RyaWMtYnJkZlxcbi8vIHZlYzMgZGllbGVjdHJpY19icmRmKGZsb2F0IGlvciwgdmVjMyBiYXNlQ29sb3IsIGZsb2F0IHBlcmNlcHR1YWxSb3VnaG5lc3MsIGZsb2F0IE5kb3RMLCBmbG9hdCBOZG90ViwgZmxvYXQgTmRvdEgsIGZsb2F0IFZkb3RIKSB7XFxuLy8gICB2ZWMzIGJhc2UgPSBCUkRGX2xhbWJlcnRpYW4oYmFzZUNvbG9yKTtcXG4vLyAgIGZsb2F0IGFscGhhUm91Z2huZXNzID0gcGVyY2VwdHVhbFJvdWdobmVzcyAqIHBlcmNlcHR1YWxSb3VnaG5lc3M7XFxuLy8gICB2ZWMzIGxheWVyID0gdmVjMyhzcGVjdWxhcl9icmRmKGFscGhhUm91Z2huZXNzLCBOZG90TCwgTmRvdFYsIE5kb3RIKSk7XFxuLy8gICByZXR1cm4gZnJlc25lbF9taXgoaW9yLCBiYXNlLCBsYXllciwgVmRvdEgpO1xcbi8vIH1cXG5cXG4vLyBSb3VnaG5lc3MgRGVwZW5kZW50IEZyZXNuZWxcXG4vLyBodHRwczovL3d3dy5qY2d0Lm9yZy9wdWJsaXNoZWQvMDAwOC8wMS8wMy9wYXBlci5wZGZcXG52ZWMzIGZyZXNuZWxTY2hsaWNrUm91Z2huZXNzKHZlYzMgRjAsIGZsb2F0IGNvc1RoZXRhLCBmbG9hdCByb3VnaG5lc3MpXFxue1xcbiAgdmVjMyBGciA9IG1heCh2ZWMzKDEuMCAtIHJvdWdobmVzcyksIEYwKSAtIEYwO1xcbiAgdmVjMyBrX1MgPSBGMCArIEZyICogcG93KDEuMCAtIGNvc1RoZXRhLCA1LjApO1xcbiAgcmV0dXJuIGtfUztcXG59XFxuXFxuLy8gRnJvbTogaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGLVNhbXBsZS1WaWV3ZXIvYmxvYi9lMmM3YjhjOGJkMTI5MTZjMWEzODdjZDQxZjllZjA2MWVkYzcxOGRmL3NvdXJjZS9SZW5kZXJlci9zaGFkZXJzL2JyZGYuZ2xzbCNMNDQtTDY2XFxudmVjMyBTY2hsaWNrX3RvX0YwKHZlYzMgZiwgdmVjMyBmOTAsIGZsb2F0IFZkb3RIKSB7XFxuICAgIGZsb2F0IHggPSBjbGFtcCgxLjAgLSBWZG90SCwgMC4wLCAxLjApO1xcbiAgICBmbG9hdCB4MiA9IHggKiB4O1xcbiAgICBmbG9hdCB4NSA9IGNsYW1wKHggKiB4MiAqIHgyLCAwLjAsIDAuOTk5OSk7XFxuXFxuICAgIHJldHVybiAoZiAtIGY5MCAqIHg1KSAvICgxLjAgLSB4NSk7XFxufVxcblxcbmZsb2F0IFNjaGxpY2tfdG9fRjAoZmxvYXQgZiwgZmxvYXQgZjkwLCBmbG9hdCBWZG90SCkge1xcbiAgICBmbG9hdCB4ID0gY2xhbXAoMS4wIC0gVmRvdEgsIDAuMCwgMS4wKTtcXG4gICAgZmxvYXQgeDIgPSB4ICogeDtcXG4gICAgZmxvYXQgeDUgPSBjbGFtcCh4ICogeDIgKiB4MiwgMC4wLCAwLjk5OTkpO1xcblxcbiAgICByZXR1cm4gKGYgLSBmOTAgKiB4NSkgLyAoMS4wIC0geDUpO1xcbn1cXG5cXG52ZWMzIFNjaGxpY2tfdG9fRjAodmVjMyBmLCBmbG9hdCBWZG90SCkge1xcbiAgICByZXR1cm4gU2NobGlja190b19GMChmLCB2ZWMzKDEuMCksIFZkb3RIKTtcXG59XFxuXFxuZmxvYXQgU2NobGlja190b19GMChmbG9hdCBmLCBmbG9hdCBWZG90SCkge1xcbiAgICByZXR1cm4gU2NobGlja190b19GMChmLCAxLjAsIFZkb3RIKTtcXG59XFxuXFxudmVjMyBub3JtYWxCbGVuZGluZ1VETihzYW1wbGVyMkQgYmFzZU1hcCwgc2FtcGxlcjJEIGRldGFpbE1hcCwgdmVjMiBiYXNlVXYsIHZlYzIgZGV0YWlsVXYpIHtcXG4gIHZlYzMgdCA9IHRleHR1cmUoYmFzZU1hcCwgICBiYXNlVXYpLnh5eiAqIDIuMCAtIDEuMDtcXG4gIHZlYzMgdSA9IHRleHR1cmUoZGV0YWlsTWFwLCBkZXRhaWxVdikueHl6ICogMi4wIC0gMS4wO1xcbiAgdmVjMyByID0gbm9ybWFsaXplKHZlYzModC54eSArIHUueHksIHQueikpO1xcbiAgcmV0dXJuIHI7XFxufVxcblxcbiNpZmRlZiBSTl9JU19QSVhFTF9TSEFERVJcXG5mbG9hdCBJc290cm9waWNOREZGaWx0ZXJpbmcodmVjMyBub3JtYWwsIGZsb2F0IHJvdWdobmVzczIpIHtcXG4gIGZsb2F0IFNJR01BMiA9IDAuMTU5MTU0OTQ7XFxuICBmbG9hdCBLQVBQQSA9IDAuMTg7XFxuICB2ZWMzIGRuZHUgPSBkRmR4KG5vcm1hbCk7XFxuICB2ZWMzIGRuZHYgPSBkRmR5KG5vcm1hbCk7XFxuICBmbG9hdCBrZXJuZWxSb3VnaG5lc3MyID0gU0lHTUEyICogKGRvdChkbmR1LCBkbmR1KSArIGRvdChkbmR2LCBkbmR2KSk7XFxuICBmbG9hdCBjbGFtcGVkS2VybmVsUm91Z2huZXNzMiA9IG1pbihrZXJuZWxSb3VnaG5lc3MyLCBLQVBQQSk7XFxuICBmbG9hdCBmaWx0ZXJlZFJvdWdobmVzczIgPSBzYXR1cmF0ZShyb3VnaG5lc3MyICsgY2xhbXBlZEtlcm5lbFJvdWdobmVzczIpO1xcbiAgcmV0dXJuIGZpbHRlcmVkUm91Z2huZXNzMjtcXG59XFxuI2VuZGlmXFxuXFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xcbi8vIGdsVEYgS0hSX21hdGVyaWFsc190cmFuc21pc3Npb25cXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXFxuXFxuI2lmZGVmIFJOX1VTRV9UUkFOU01JU1NJT05cXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvYmxvYi9tYWluL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX21hdGVyaWFsc192b2x1bWUvUkVBRE1FLm1kI2F0dGVudWF0aW9uXFxudmVjMyB2b2x1bWVBdHRlbnVhdGlvbih2ZWMzIGF0dGVudWF0aW9uQ29sb3IsIGZsb2F0IGF0dGVudWF0aW9uRGlzdGFuY2UsIHZlYzMgaW50ZW5zaXR5LCBmbG9hdCB0cmFuc21pc3Npb25EaXN0YW5jZSlcXG57XFxuICBpZiAoYXR0ZW51YXRpb25EaXN0YW5jZSA9PSAwLjApIHsgLy8gbWVhbnMgSW5maW5pdGUgZGlzdGFuY2VcXG4gICAgcmV0dXJuIGludGVuc2l0eTsgLy8gTm8gYXR0ZW51YXRpb25cXG4gIH0gZWxzZSB7XFxuICAgIC8vIHZlYzMgYXR0ZW51YXRpb25DbyA9IC1sb2coYXR0ZW51YXRpb25Db2xvcikgLyBhdHRlbnVhdGlvbkRpc3RhbmNlO1xcbiAgICAvLyB2ZWMzIGF0dGVudWF0ZWRUcmFuc21pdHRhbmNlID0gZXhwKC1hdHRlbnVhdGlvbkNvICogdHJhbnNtaXNzaW9uRGlzdGFuY2UpO1xcbiAgICB2ZWMzIGF0dGVudWF0ZWRUcmFuc21pdHRhbmNlID0gcG93KGF0dGVudWF0aW9uQ29sb3IsIHZlYzModHJhbnNtaXNzaW9uRGlzdGFuY2UgLyBhdHRlbnVhdGlvbkRpc3RhbmNlKSk7XFxuICAgIHJldHVybiBpbnRlbnNpdHkgKiBhdHRlbnVhdGVkVHJhbnNtaXR0YW5jZTtcXG4gIH1cXG59XFxuXFxuLy8gZnJvbSBnbFRGIFNhbXBsZSBWaWV3ZXI6IGh0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi1TYW1wbGUtVmlld2VyXFxudmVjMyBnZXRWb2x1bWVUcmFuc21pc3Npb25SYXkodmVjMyBuLCB2ZWMzIHYsIGZsb2F0IHRoaWNrbmVzcywgZmxvYXQgaW9yKVxcbntcXG4gIHZlYzMgcmVmcmFjdGlvblZlY3RvciA9IHJlZnJhY3QoLXYsIG5vcm1hbGl6ZShuKSwgMS4wIC8gaW9yKTtcXG4jaWZkZWYgUk5fUkFZTUFSQ0hJTkdfU0hBRElOR1xcbiAgLy8gVGhlIHJheW1hcmNoaW5nIGRyYXcgaGFzIG5vIHBlci1pbnN0YW5jZSBtZXNoIHRyYW5zZm9ybSAodl9pbnN0YW5jZUlkcyBpcyBub3RcXG4gIC8vIGRlY2xhcmVkIHRoZXJlKSwgYW5kIFNERiB0aGlja25lc3MgaXMgYXV0aG9yZWQgaW4gd29ybGQgdW5pdHMuXFxuICB2ZWMzIG1vZGVsU2NhbGUgPSB2ZWMzKDEuMCk7XFxuI2Vsc2VcXG4gIG1hdDQgd29ybGRNYXRyaXggPSBnZXRfd29ybGRNYXRyaXgodl9pbnN0YW5jZUlkcy54KTtcXG5cXG4gIHZlYzMgbW9kZWxTY2FsZTtcXG4gIG1vZGVsU2NhbGUueCA9IGxlbmd0aCh2ZWMzKHdvcmxkTWF0cml4WzBdLnh5eikpO1xcbiAgbW9kZWxTY2FsZS55ID0gbGVuZ3RoKHZlYzMod29ybGRNYXRyaXhbMV0ueHl6KSk7XFxuICBtb2RlbFNjYWxlLnogPSBsZW5ndGgodmVjMyh3b3JsZE1hdHJpeFsyXS54eXopKTtcXG4jZW5kaWZcXG5cXG4gIHJldHVybiBub3JtYWxpemUocmVmcmFjdGlvblZlY3RvcikgKiB0aGlja25lc3MgKiBtb2RlbFNjYWxlO1xcbn1cXG5cXG5mbG9hdCBhcHBseUlvclRvUm91Z2huZXNzKGZsb2F0IHJvdWdobmVzcywgZmxvYXQgaW9yKVxcbntcXG4gIHJldHVybiBjbGFtcChyb3VnaG5lc3MgKiBjbGFtcChpb3IgKiAyLjAgLSAyLjAsIDAuMCwgMS4wKSwgY19NaW5Sb3VnaG5lc3MsIDEuMCk7XFxufVxcblxcbnZlYzMgY2FsY3VsYXRlUmFkaWFuY2VUcmFuc21pc3Npb24odmVjMyBub3JtYWwsIHZlYzMgdmlldywgdmVjMyBwb2ludFRvTGlnaHQsIGZsb2F0IGFscGhhUm91Z2huZXNzLCB2ZWMzIGJhc2VDb2xvciwgZmxvYXQgaW9yKVxcbntcXG4gIGZsb2F0IHRyYW5zbWlzc2lvblJvdWdobmVzcyA9IGFwcGx5SW9yVG9Sb3VnaG5lc3MoYWxwaGFSb3VnaG5lc3MsIGlvcik7XFxuXFxuICB2ZWMzIG4gPSBub3JtYWxpemUobm9ybWFsKTtcXG4gIHZlYzMgdiA9IG5vcm1hbGl6ZSh2aWV3KTtcXG4gIHZlYzMgbCA9IG5vcm1hbGl6ZShwb2ludFRvTGlnaHQpO1xcbiAgdmVjMyBtaXJyb3JMID0gbm9ybWFsaXplKGwgKyAyLjAgKiBuICogZG90KC1sLCBuKSk7XFxuICB2ZWMzIGggPSBub3JtYWxpemUobWlycm9yTCArIHYpO1xcblxcbiAgZmxvYXQgRCA9IGRfR0dYKGNsYW1wKGRvdChuLCBoKSwgMC4wLCAxLjApLCB0cmFuc21pc3Npb25Sb3VnaG5lc3MpO1xcbiAgZmxvYXQgViA9IHZfR0dYQ29ycmVsYXRlZChjbGFtcChkb3QobiwgbWlycm9yTCksIDAuMCwgMS4wKSwgY2xhbXAoZG90KG4sIHYpLCAwLjAsIDEuMCksIHRyYW5zbWlzc2lvblJvdWdobmVzcyk7XFxuXFxuICByZXR1cm4gYmFzZUNvbG9yICogRCAqIFY7XFxufVxcblxcbiNlbmRpZlxcblxcblxcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cXG4vLyBnbFRGIEtIUl9tYXRlcmlhbHNfYW5pc290cm9weVxcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cXG4jaWZkZWYgUk5fVVNFX0FOSVNPVFJPUFlcXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYWluL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5XFxuZmxvYXQgRF9HR1hfYW5pc290cm9waWMoZmxvYXQgTmRvdEgsIGZsb2F0IFRkb3RILCBmbG9hdCBCZG90SCwgZmxvYXQgYXQsIGZsb2F0IGFiKVxcbntcXG4gICAgZmxvYXQgYTIgPSBhdCAqIGFiO1xcbiAgICB2ZWMzIGYgPSB2ZWMzKGFiICogVGRvdEgsIGF0ICogQmRvdEgsIGEyICogTmRvdEgpO1xcbiAgICBmbG9hdCB3MiA9IGEyIC8gZG90KGYsIGYpO1xcbiAgICByZXR1cm4gYTIgKiB3MiAqIHcyIC8gTV9QSTtcXG59XFxuXFxuZmxvYXQgVl9HR1hfYW5pc290cm9waWMoZmxvYXQgTmRvdEwsIGZsb2F0IE5kb3RWLCBmbG9hdCBCZG90ViwgZmxvYXQgVGRvdFYsIGZsb2F0IFRkb3RMLCBmbG9hdCBCZG90TCxcXG4gICAgZmxvYXQgYXQsIGZsb2F0IGFiKVxcbntcXG4gICAgZmxvYXQgR0dYViA9IE5kb3RMICogbGVuZ3RoKHZlYzMoYXQgKiBUZG90ViwgYWIgKiBCZG90ViwgTmRvdFYpKTtcXG4gICAgZmxvYXQgR0dYTCA9IE5kb3RWICogbGVuZ3RoKHZlYzMoYXQgKiBUZG90TCwgYWIgKiBCZG90TCwgTmRvdEwpKTtcXG4gICAgZmxvYXQgR0dYID0gR0dYViArIEdHWEw7XFxuICAgIGlmIChHR1ggPiAwLjApIHtcXG4gICAgICByZXR1cm4gY2xhbXAoMC41IC8gR0dYLCAwLjAsIDEuMCk7XFxuICAgIH1cXG4gICAgcmV0dXJuIDEuMDtcXG59XFxuXFxudmVjMyBCUkRGX3NwZWN1bGFyQW5pc290cm9waWNHR1goZmxvYXQgYWxwaGFSb3VnaG5lc3MsXFxuICAgIGZsb2F0IFZkb3RILCBmbG9hdCBOZG90TCwgZmxvYXQgTmRvdFYsIGZsb2F0IE5kb3RILCBmbG9hdCBCZG90ViwgZmxvYXQgVGRvdFYsXFxuICAgIGZsb2F0IFRkb3RMLCBmbG9hdCBCZG90TCwgZmxvYXQgVGRvdEgsIGZsb2F0IEJkb3RILCBmbG9hdCBhbmlzb3Ryb3B5KVxcbntcXG4gICAgZmxvYXQgYXQgPSBtaXgoYWxwaGFSb3VnaG5lc3MsIDEuMCwgYW5pc290cm9weSAqIGFuaXNvdHJvcHkpO1xcbiAgICBmbG9hdCBhYiA9IGNsYW1wKGFscGhhUm91Z2huZXNzLCAwLjAwMSwgMS4wKTtcXG5cXG4gICAgZmxvYXQgViA9IFZfR0dYX2FuaXNvdHJvcGljKE5kb3RMLCBOZG90ViwgQmRvdFYsIFRkb3RWLCBUZG90TCwgQmRvdEwsIGF0LCBhYik7XFxuICAgIGZsb2F0IEQgPSBEX0dHWF9hbmlzb3Ryb3BpYyhOZG90SCwgVGRvdEgsIEJkb3RILCBhdCwgYWIpO1xcblxcbiAgICByZXR1cm4gdmVjMyhWICogRCk7XFxufVxcbiNlbmRpZlxcblxcblxcblxcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cXG4vLyBnbFRGIEtIUl9tYXRlcmlhbHNfc2hlZW5cXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXFxuXFxuI2lmZGVmIFJOX1VTRV9TSEVFTlxcbmZsb2F0IGRfQ2hhcmxpZShmbG9hdCBzaGVlblBlcmNlcHR1YWxSb3VnaG5lc3MsIGZsb2F0IE5vSCkge1xcbiAgLy8gRXN0ZXZleiBhbmQgS3VsbGEgMjAxNywgXFxcIlByb2R1Y3Rpb24gRnJpZW5kbHkgTWljcm9mYWNldCBTaGVlbiBCUkRGXFxcIlxcbiAgZmxvYXQgc2hlZW5Sb3VnaG5lc3MgPSBtYXgoc2hlZW5QZXJjZXB0dWFsUm91Z2huZXNzLCAwLjAwMDAwMSk7XFxuICBmbG9hdCBhbHBoYUcgPSBzaGVlblJvdWdobmVzcyAqIHNoZWVuUm91Z2huZXNzO1xcbiAgZmxvYXQgaW52QWxwaGEgID0gMS4wIC8gYWxwaGFHO1xcbiAgZmxvYXQgY29zMmggPSBOb0ggKiBOb0g7XFxuICBmbG9hdCBzaW4yaCA9IDEuMCAtIGNvczJoO1xcbiAgcmV0dXJuICgyLjAgKyBpbnZBbHBoYSkgKiBwb3coc2luMmgsIGludkFscGhhICogMC41KSAvICgyLjAgKiBNX1BJKTtcXG59XFxuXFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFpbi9leHRlbnNpb25zLzIuMC9LaHJvbm9zL0tIUl9tYXRlcmlhbHNfc2hlZW4jc2hlZW4tdmlzaWJpbGl0eVxcbmZsb2F0IHNoZWVuU2ltcGxlVmlzaWJpbGl0eShmbG9hdCBOZG90TCwgZmxvYXQgTmRvdFYpIHtcXG4gIHJldHVybiAxLjAgLyAoNC4wICogKE5kb3RMICsgTmRvdFYgLSBOZG90TCAqIE5kb3RWKSk7XFxufVxcblxcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21haW4vZXh0ZW5zaW9ucy8yLjAvS2hyb25vcy9LSFJfbWF0ZXJpYWxzX3NoZWVuI3NoZWVuLXZpc2liaWxpdHlcXG5mbG9hdCBjaGFybGllTChmbG9hdCB4LCBmbG9hdCBhbHBoYUcpIHtcXG4gIGZsb2F0IG9uZU1pbnVzQWxwaGFTcSA9ICgxLjAgLSBhbHBoYUcpICogKDEuMCAtIGFscGhhRyk7XFxuICBmbG9hdCBhID0gbWl4KDIxLjU0NzMsIDI1LjMyNDUsIG9uZU1pbnVzQWxwaGFTcSk7XFxuICBmbG9hdCBiID0gbWl4KDMuODI5ODcsIDMuMzI0MzUsIG9uZU1pbnVzQWxwaGFTcSk7XFxuICBmbG9hdCBjID0gbWl4KDAuMTk4MjMsIDAuMTY4MDEsIG9uZU1pbnVzQWxwaGFTcSk7XFxuICBmbG9hdCBkID0gbWl4KC0xLjk3NzYwLCAtMS4yNzM5Mywgb25lTWludXNBbHBoYVNxKTtcXG4gIGZsb2F0IGUgPSBtaXgoLTQuMzIwNTQsIC00Ljg1OTY3LCBvbmVNaW51c0FscGhhU3EpO1xcbiAgcmV0dXJuIGEgLyAoMS4wICsgYiAqIHBvdyh4LCBjKSkgKyBkICogeCArIGU7XFxufVxcblxcbmZsb2F0IGxhbWJkYVNoZWVuKGZsb2F0IGNvc1RoZXRhLCBmbG9hdCBhbHBoYUcpXFxue1xcbiAgcmV0dXJuIGFicyhjb3NUaGV0YSkgPCAwLjUgPyBleHAoY2hhcmxpZUwoY29zVGhldGEsIGFscGhhRykpIDogZXhwKDIuMCAqIGNoYXJsaWVMKDAuNSwgYWxwaGFHKSAtIGNoYXJsaWVMKDEuMCAtIGNvc1RoZXRhLCBhbHBoYUcpKTtcXG59XFxuXFxuZmxvYXQgc2hlZW5DaGFybGllVmlzaWJpbGl0eShmbG9hdCBOZG90TCwgZmxvYXQgTmRvdFYsIGZsb2F0IHNoZWVuUGVyY2VwdHVhbFJvdWdobmVzcykge1xcbiAgZmxvYXQgc2hlZW5Sb3VnaG5lc3MgPSBtYXgoc2hlZW5QZXJjZXB0dWFsUm91Z2huZXNzLCAwLjAwMDAwMSk7XFxuICBmbG9hdCBhbHBoYUcgPSBzaGVlblJvdWdobmVzcyAqIHNoZWVuUm91Z2huZXNzO1xcbiAgZmxvYXQgc2hlZW5WaXNpYmlsaXR5ID0gY2xhbXAoMS4wIC8gKCgxLjAgKyBsYW1iZGFTaGVlbihOZG90ViwgYWxwaGFHKSArIGxhbWJkYVNoZWVuKE5kb3RMLCBhbHBoYUcpKSAqICg0LjAgKiBOZG90ViAqIE5kb3RMKSksIDAuMCwgMS4wKTtcXG4gIHJldHVybiBzaGVlblZpc2liaWxpdHk7XFxufVxcblxcbnZlYzMgQlJERl9zcGVjdWxhclNoZWVuKHZlYzMgc2hlZW5Db2xvciwgZmxvYXQgc2hlZW5QZXJjZXB0dWFsUm91Z2huZXNzLCBmbG9hdCBOZG90TCwgZmxvYXQgTmRvdFYsIGZsb2F0IE5kb3RIKSB7XFxuICBmbG9hdCBzaGVlbkRpc3RyaWJ1dGlvbiA9IGRfQ2hhcmxpZShzaGVlblBlcmNlcHR1YWxSb3VnaG5lc3MsIE5kb3RIKTtcXG4gIGZsb2F0IHNoZWVuVmlzaWJpbGl0eSA9IHNoZWVuQ2hhcmxpZVZpc2liaWxpdHkoTmRvdEwsIE5kb3RWLCBzaGVlblBlcmNlcHR1YWxSb3VnaG5lc3MpO1xcbiAgcmV0dXJuIHNoZWVuQ29sb3IgKiBzaGVlbkRpc3RyaWJ1dGlvbiAqIHNoZWVuVmlzaWJpbGl0eTtcXG59XFxuI2VuZGlmXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuXFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xcbi8vIGdsVEYgS0hSX21hdGVyaWFsc19pcmlyZGVzY2VuY2VcXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXFxuXFxuI2lmZGVmIFJOX1VTRV9JUklERVNDRU5DRVxcbi8vIFhZWiB0byBSRUM3MDkoc1JHQikgY29udmVyc2lvbiBtYXRyaXhcXG5jb25zdCBtYXQzIFhZWl9UT19SRUM3MDkgPSBtYXQzKFxcbiAgICAgMy4yNDA0NTQyLCAtMC45NjkyNjYwLCAgMC4wNTU2NDM0LFxcbiAgICAtMS41MzcxMzg1LCAgMS44NzYwMTA4LCAtMC4yMDQwMjU5LFxcbiAgICAtMC40OTg1MzE0LCAgMC4wNDE1NTYwLCAgMS4wNTcyMjUyXFxuKTtcXG5cXG52ZWMzIGZyZXNuZWxTY2hsaWNrUm91Z2huZXNzV2l0aElyaWRlc2NlbmNlKFxcbiAgdmVjMyBGMCwgZmxvYXQgY29zVGhldGEsIGZsb2F0IHJvdWdobmVzcyxcXG4gIHZlYzMgaXJpZGVzY2VuY2VGcmVzbmVsLCBmbG9hdCBpcmlkZXNjZW5jZVxcbiAgKVxcbntcXG4gIHZlYzMgRnIgPSBtYXgodmVjMygxLjAgLSByb3VnaG5lc3MpLCBGMCkgLSBGMDtcXG4gIHZlYzMga19TID0gbWl4KEYwICsgRnIgKiBwb3coMS4wIC0gY29zVGhldGEsIDUuMCksIGlyaWRlc2NlbmNlRnJlc25lbCwgaXJpZGVzY2VuY2UpO1xcbiAgcmV0dXJuIGtfUztcXG59XFxuXFxuLy8gQXNzdW1lIGFpciBpbnRlcmZhY2UgZm9yIHRvcFxcbnZlYzMgRnJlc25lbDBUb0lvcih2ZWMzIEYwKSB7XFxuICAgIHZlYzMgc3FydEYwID0gc3FydChGMCk7XFxuICAgIHJldHVybiAodmVjMygxLjApICsgc3FydEYwKSAvICh2ZWMzKDEuMCkgLSBzcXJ0RjApO1xcbn1cXG5cXG4vLyBDb252ZXJzaW9uIGZyb20gSU9SIHRvIEYwXFxuLy8gaW9yIGlzIGEgdmFsdWUgYmV0d2VlbiAxLjAgYW5kIDMuMC4gMS4wIGlzIGFpciBpbnRlcmZhY2VcXG52ZWMzIElvclRvRnJlc25lbDAodmVjMyB0cmFuc21pdHRlZElvciwgZmxvYXQgaW5jaWRlbnRJb3IpIHtcXG4gICAgcmV0dXJuIHNxKCh0cmFuc21pdHRlZElvciAtIHZlYzMoaW5jaWRlbnRJb3IpKSAvICh0cmFuc21pdHRlZElvciArIHZlYzMoaW5jaWRlbnRJb3IpKSk7XFxufVxcbmZsb2F0IElvclRvRnJlc25lbDAoZmxvYXQgdHJhbnNtaXR0ZWRJb3IsIGZsb2F0IGluY2lkZW50SW9yKSB7XFxuICAgIHJldHVybiBzcSgodHJhbnNtaXR0ZWRJb3IgLSBpbmNpZGVudElvcikgLyAodHJhbnNtaXR0ZWRJb3IgKyBpbmNpZGVudElvcikpO1xcbn1cXG5cXG4vKipcXG4gKiBGcm9tOiBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYWluL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZSNhbmFseXRpYy1zcGVjdHJhbC1pbnRlZ3JhdGlvblxcbiAqL1xcbnZlYzMgZXZhbFNlbnNpdGl2aXR5KGZsb2F0IE9QRCwgdmVjMyBzaGlmdCkge1xcbiAgICBmbG9hdCBwaGFzZSA9IDIuMCAqIE1fUEkgKiBPUEQgKiAxLjBlLTk7XFxuICAgIHZlYzMgdmFsID0gdmVjMyg1LjQ4NTZlLTEzLCA0LjQyMDFlLTEzLCA1LjI0ODFlLTEzKTtcXG4gICAgdmVjMyBwb3MgPSB2ZWMzKDEuNjgxMGUrMDYsIDEuNzk1M2UrMDYsIDIuMjA4NGUrMDYpO1xcbiAgICB2ZWMzIHZhciA9IHZlYzMoNC4zMjc4ZSswOSwgOS4zMDQ2ZSswOSwgNi42MTIxZSswOSk7XFxuXFxuICAgIHZlYzMgeHl6ID0gdmFsICogc3FydCgyLjAgKiBNX1BJICogdmFyKSAqIGNvcyhwb3MgKiBwaGFzZSArIHNoaWZ0KSAqIGV4cCgtKHBoYXNlICogcGhhc2UpICogdmFyKTtcXG4gICAgeHl6LnggKz0gOS43NDcwZS0xNCAqIHNxcnQoMi4wICogTV9QSSAqIDQuNTI4MmUrMDkpICogY29zKDIuMjM5OWUrMDYgKiBwaGFzZSArIHNoaWZ0WzBdKSAqIGV4cCgtNC41MjgyZSswOSAqIChwaGFzZSAqIHBoYXNlKSk7XFxuICAgIHh5eiAvPSAxLjA2ODVlLTc7XFxuXFxuICAgIHZlYzMgcmdiID0gWFlaX1RPX1JFQzcwOSAqIHh5ejtcXG4gICAgcmV0dXJuIHJnYjtcXG59XFxuXFxuLyoqXFxuICogRnJvbTogaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFpbi9leHRlbnNpb25zLzIuMC9LaHJvbm9zL0tIUl9tYXRlcmlhbHNfaXJpZGVzY2VuY2UjaXJpZGVzY2VuY2UtZnJlc25lbFxcbiAqL1xcbnZlYzMgY2FsY0lyaWRlc2NlbmNlKGZsb2F0IG91dHNpZGVJb3IsIGZsb2F0IGV0YTIsIGZsb2F0IGNvc1RoZXRhMSwgZmxvYXQgdGhpbkZpbG1UaGlja25lc3MsIHZlYzMgYmFzZUYwKSB7XFxuXFxuXFxuICAvLyBpcmlkZXNjZW5jZUlvciBpcyB0aGUgaW5kZXggb2YgcmVmcmFjdGlvbiBvZiB0aGUgdGhpbi1maWxtIGxheWVyXFxuICAvLyBGb3JjZSBpcmlkZXNjZW5jZUlvciAtPiBvdXRzaWRlSU9SIHdoZW4gdGhpbkZpbG1UaGlja25lc3MgLT4gMC4wXFxuICBmbG9hdCBpcmlkZXNjZW5jZUlvciA9IG1peChvdXRzaWRlSW9yLCBldGEyLCBzbW9vdGhzdGVwKDAuMCwgMC4wMywgdGhpbkZpbG1UaGlja25lc3MpKTtcXG5cXG4gIC8vIFRvIGNhbGN1bGF0ZSB0aGUgcmVmbGVjdGFuY2VzIFIxMiBhbmQgUjIzIGF0IHRoZSB2aWV3aW5nIGFuZ2xlcyAoYW5nbGUgaGl0dGluZyB0aGUgdGhpbi1maWxtIGxheWVyKVxcbiAgLy8gYW5kIChhbmdsZSBhZnRlciByZWZyYWN0aW9uIGluIHRoZSB0aGluLWZpbG0pIFNjaGxpY2sgRnJlc25lbCBpcyBhZ2FpbiB1c2VkLlxcbiAgLy8gVGhpcyBhcHByb3hpbWF0aW9uIGFsbG93cyB0byBlbGltaW5hdGUgdGhlIHNwbGl0IGludG8gUyBhbmQgUCBwb2xhcml6YXRpb24gZm9yIHRoZSBleGFjdCBGcmVzbmVsIGVxdWF0aW9ucy5cXG4gIC8vIGNhbiBiZSBjYWxjdWxhdGVkIHVzaW5nIFNuZWxsJ3MgbGF3ICh3aXRoICBiZWluZyBvdXRzaWRlSW9yIGFuZCBiZWluZyBpcmlkZXNjZW5jZUlvcik6XFxuICBmbG9hdCBzaW5UaGV0YTJTcSA9IHNxKG91dHNpZGVJb3IgLyBpcmlkZXNjZW5jZUlvcikgKiAoMS4wIC0gc3EoY29zVGhldGExKSk7XFxuICBmbG9hdCBjb3NUaGV0YTJTcSA9IDEuMCAtIHNpblRoZXRhMlNxO1xcblxcbiAgLy8gSGFuZGxlIHRvdGFsIGludGVybmFsIHJlZmxlY3Rpb25cXG4gIGlmIChjb3NUaGV0YTJTcSA8IDAuMCkge1xcbiAgICAgIHJldHVybiB2ZWMzKDEuMCk7XFxuICB9XFxuXFxuICBmbG9hdCBjb3NUaGV0YTIgPSBzcXJ0KGNvc1RoZXRhMlNxKTtcXG5cXG4gIC8vLyBNYXRlcmlhbCBJbnRlcmZhY2VzXFxuICAvLyBUaGUgaXJpZGVzY2VuY2UgbW9kZWwgZGVmaW5lZCBieSBCZWxjb3VyL0JhcmxhIG1vZGVscyB0d28gbWF0ZXJpYWwgaW50ZXJmYWNlc1xcbiAgLy8gLSBvbmUgZnJvbSB0aGUgb3V0c2lkZSB0byB0aGUgdGhpbi1maWxtIGxheWVyXFxuICAvLyBhbmQgYW5vdGhlciBvbmUgZnJvbSB0aGUgdGhpbi1maWxtIHRvIHRoZSBiYXNlIG1hdGVyaWFsLiBUaGVzZSB0d28gaW50ZXJmYWNlcyBhcmUgZGVmaW5lZCBhcyBmb2xsb3dzOlxcblxcbiAgLy8gRmlyc3QgaW50ZXJmYWNlIChmcm9tIHRoZSBvdXRzaWRlIHRvIHRoZSB0aGluLWZpbG0gbGF5ZXIpXFxuICBmbG9hdCBSMCA9IElvclRvRnJlc25lbDAoaXJpZGVzY2VuY2VJb3IsIG91dHNpZGVJb3IpO1xcbiAgZmxvYXQgUjEyID0gZnJlc25lbFNjaGxpY2soUjAsIGNvc1RoZXRhMSk7XFxuICBmbG9hdCBSMjEgPSBSMTI7XFxuICBmbG9hdCBUMTIxID0gMS4wIC0gUjEyO1xcblxcbiAgLy8gU2Vjb25kIGludGVyZmFjZSAoZnJvbSB0aGUgdGhpbi1maWxtIHRvIHRoZSBiYXNlIG1hdGVyaWFsKVxcbiAgdmVjMyBiYXNlSW9yID0gRnJlc25lbDBUb0lvcihiYXNlRjAgKyAwLjAwMDEpOyAvLyBndWFyZCBhZ2FpbnN0IDEuMFxcbiAgdmVjMyBSMSA9IElvclRvRnJlc25lbDAoYmFzZUlvciwgaXJpZGVzY2VuY2VJb3IpO1xcbiAgdmVjMyBSMjMgPSBmcmVzbmVsU2NobGljayhSMSwgY29zVGhldGEyKTtcXG5cXG4gIC8vIHBoaTEyIGFuZCBwaGkyMyBkZWZpbmUgdGhlIGJhc2UgcGhhc2VzIHBlciBpbnRlcmZhY2UgYW5kIGFyZSBhcHByb3hpbWF0ZWQgd2l0aCAwLjBcXG4gIC8vIGlmIHRoZSBJT1Igb2YgdGhlIGhpdCBtYXRlcmlhbCAoaXJpZGVzY2VuY2VJb3Igb3IgYmFzZUlvcikgaXMgaGlnaGVyXFxuICAvLyB0aGFuIHRoZSBJT1Igb2YgdGhlIHByZXZpb3VzIG1hdGVyaWFsIChvdXRzaWRlSW9yIG9yIGlyaWRlc2NlbmNlSW9yKSBhbmQgXHUwM0MwIG90aGVyd2lzZS5cXG4gIC8vIEFsc28gaGVyZSwgcG9sYXJpemF0aW9uIGlzIGlnbm9yZWQuICBmbG9hdCBwaGkxMiA9IDAuMDtcXG5cXG4gIC8vIEZpcnN0IGludGVyZmFjZSAoZnJvbSB0aGUgb3V0c2lkZSB0byB0aGUgdGhpbi1maWxtIGxheWVyKVxcbiAgZmxvYXQgcGhpMTIgPSAwLjA7XFxuICBpZiAoaXJpZGVzY2VuY2VJb3IgPCBvdXRzaWRlSW9yKSBwaGkxMiA9IE1fUEk7XFxuICBmbG9hdCBwaGkyMSA9IE1fUEkgLSBwaGkxMjtcXG5cXG4gIC8vIFNlY29uZCBpbnRlcmZhY2UgKGZyb20gdGhlIHRoaW4tZmlsbSB0byB0aGUgYmFzZSBtYXRlcmlhbClcXG4gIHZlYzMgcGhpMjMgPSB2ZWMzKDAuMCk7XFxuICBpZiAoYmFzZUlvclswXSA8IGlyaWRlc2NlbmNlSW9yKSBwaGkyM1swXSA9IE1fUEk7XFxuICBpZiAoYmFzZUlvclsxXSA8IGlyaWRlc2NlbmNlSW9yKSBwaGkyM1sxXSA9IE1fUEk7XFxuICBpZiAoYmFzZUlvclsyXSA8IGlyaWRlc2NlbmNlSW9yKSBwaGkyM1syXSA9IE1fUEk7XFxuXFxuICAvLyBPUEQgKG9wdGljYWwgcGF0aCBkaWZmZXJlbmNlKVxcbiAgZmxvYXQgT1BEID0gMi4wICogaXJpZGVzY2VuY2VJb3IgKiB0aGluRmlsbVRoaWNrbmVzcyAqIGNvc1RoZXRhMjtcXG4gIC8vIFBoYXNlIHNoaWZ0XFxuICB2ZWMzIHBoaSA9IHZlYzMocGhpMjEpICsgcGhpMjM7XFxuXFxuICAvLyBDb21wb3VuZCB0ZXJtc1xcbiAgdmVjMyBSMTIzID0gY2xhbXAoUjEyICogUjIzLCAxZS01LCAwLjk5OTkpO1xcbiAgdmVjMyByMTIzID0gc3FydChSMTIzKTtcXG4gIHZlYzMgUnMgPSAoVDEyMSAqIFQxMjEpICogUjIzIC8gKHZlYzMoMS4wKSAtIFIxMjMpO1xcblxcbiAgLy8gUmVmbGVjdGFuY2UgdGVybSBmb3IgbSA9IDAgKERDIHRlcm0gYW1wbGl0dWRlKVxcbiAgdmVjMyBDMCA9IFIxMiArIFJzO1xcbiAgdmVjMyBJID0gQzA7XFxuXFxuICAvLyBSZWZsZWN0YW5jZSB0ZXJtIGZvciBtID4gMCAocGFpcnMgb2YgZGlyYWNzKVxcbiAgdmVjMyBDbSA9IFJzIC0gVDEyMTtcXG4gIGZvciAoaW50IG0gPSAxOyBtIDw9IDI7ICsrbSlcXG4gIHtcXG4gICAgICBDbSAqPSByMTIzO1xcbiAgICAgIHZlYzMgU20gPSAyLjAgKiBldmFsU2Vuc2l0aXZpdHkoZmxvYXQobSkgKiBPUEQsIGZsb2F0KG0pICogcGhpKTtcXG4gICAgICBJICs9IENtICogU207XFxuICB9XFxuXFxuICB2ZWMzIEZfaXJpZGVzY2VuY2UgPSBtYXgoSSwgdmVjMygwLjApKTtcXG5cXG4gIHJldHVybiBGX2lyaWRlc2NlbmNlO1xcbn1cXG5cXG4vL2h0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21hc3Rlci9zcGVjaWZpY2F0aW9uLzIuMCNhY2tub3dsZWRnbWVudHMgQXBwZW5kaXhCXFxudmVjMyBCUkRGX2xhbWJlcnRpYW5JcmlkZXNjZW5jZSh2ZWMzIGYwLCB2ZWMzIGY5MCwgdmVjMyBpcmlkZXNjZW5jZUZyZXNuZWwsIGZsb2F0IGlyaWRlc2NlbmNlRmFjdG9yLCB2ZWMzIGRpZmZ1c2VDb2xvciwgZmxvYXQgc3BlY3VsYXJXZWlnaHQsIGZsb2F0IFZkb3RIKVxcbntcXG4gICAgdmVjMyBpcmlkZXNjZW5jZUZyZXNuZWxNYXggPSB2ZWMzKG1heChtYXgoaXJpZGVzY2VuY2VGcmVzbmVsLnIsIGlyaWRlc2NlbmNlRnJlc25lbC5nKSwgaXJpZGVzY2VuY2VGcmVzbmVsLmIpKTtcXG4gICAgdmVjMyBzY2hsaWNrRnJlc25lbCA9IFNjaGxpY2tfdG9fRjAoZjAsIGY5MCwgVmRvdEgpO1xcbiAgICB2ZWMzIEYgPSBtaXgoc2NobGlja0ZyZXNuZWwsIGlyaWRlc2NlbmNlRnJlc25lbE1heCwgaXJpZGVzY2VuY2VGYWN0b3IpO1xcblxcbiAgICAvLyBzZWUgaHR0cHM6Ly9zZWJsYWdhcmRlLndvcmRwcmVzcy5jb20vMjAxMi8wMS8wOC9waS1vci1ub3QtdG8tcGktaW4tZ2FtZS1saWdodGluZy1lcXVhdGlvbi9cXG4gICAgcmV0dXJuICgxLjAgLSBzcGVjdWxhcldlaWdodCAqIEYpICogKGRpZmZ1c2VDb2xvciAvIE1fUEkpO1xcbn1cXG5cXG52ZWMzIEJSREZfc3BlY3VsYXJHR1hJcmlkZXNjZW5jZSh2ZWMzIGYwLCB2ZWMzIGY5MCwgdmVjMyBpcmlkZXNjZW5jZUZyZXNuZWwsIGZsb2F0IGFscGhhUm91Z2huZXNzLCBmbG9hdCBpcmlkZXNjZW5jZUZhY3RvciwgZmxvYXQgc3BlY3VsYXJXZWlnaHQsIGZsb2F0IFZkb3RILCBmbG9hdCBOZG90TCwgZmxvYXQgTmRvdFYsIGZsb2F0IE5kb3RIKVxcbntcXG4gICAgdmVjMyBGID0gbWl4KFNjaGxpY2tfdG9fRjAoZjAsIGY5MCwgVmRvdEgpLCBpcmlkZXNjZW5jZUZyZXNuZWwsIGlyaWRlc2NlbmNlRmFjdG9yKTtcXG4gICAgZmxvYXQgVmlzID0gdl9HR1hDb3JyZWxhdGVkKE5kb3RMLCBOZG90ViwgYWxwaGFSb3VnaG5lc3MpO1xcbiAgICBmbG9hdCBEID0gZF9HR1goTmRvdEgsIGFscGhhUm91Z2huZXNzKTtcXG5cXG4gICAgcmV0dXJuIHNwZWN1bGFyV2VpZ2h0ICogRiAqIFZpcyAqIEQ7XFxufVxcblxcbnZlYzMgcmdiX21peCh2ZWMzIGJhc2UsIHZlYzMgc3BlY3VsYXJfYnJkZiwgdmVjMyByZ2JfYWxwaGEpXFxue1xcbiAgICBmbG9hdCByZ2JfYWxwaGFfbWF4ID0gbWF4KHJnYl9hbHBoYS5yLCBtYXgocmdiX2FscGhhLmcsIHJnYl9hbHBoYS5iKSk7XFxuICAgIHJldHVybiAoMS4wIC0gcmdiX2FscGhhX21heCkgKiBiYXNlICsgcmdiX2FscGhhICogc3BlY3VsYXJfYnJkZjtcXG59XFxuXFxuI2VuZGlmIC8vIFJOX1VTRV9JUklERVNDRU5DRVxcblxcblxcbnN0cnVjdCBPY2NsdXNpb25Qcm9wc1xcbntcXG4gIHZlYzQgb2NjbHVzaW9uVGV4dHVyZTtcXG4gIGZsb2F0IG9jY2x1c2lvblN0cmVuZ3RoO1xcbn07XFxuXFxuc3RydWN0IEVtaXNzaXZlUHJvcHNcXG57XFxuICB2ZWMzIGVtaXNzaXZlO1xcbiAgZmxvYXQgZW1pc3NpdmVTdHJlbmd0aDtcXG59O1xcblxcbnN0cnVjdCBDbGVhcmNvYXRQcm9wc1xcbntcXG4gIGZsb2F0IGNsZWFyY29hdDtcXG4gIGZsb2F0IGNsZWFyY29hdFJvdWdobmVzcztcXG4gIHZlYzMgY2xlYXJjb2F0RjA7XFxuICB2ZWMzIGNsZWFyY29hdEY5MDtcXG4gIHZlYzMgY2xlYXJjb2F0RnJlc25lbDtcXG4gIHZlYzMgY2xlYXJjb2F0Tm9ybWFsX2luVGFuZ2VudDtcXG4gIHZlYzMgY2xlYXJjb2F0Tm9ybWFsX2luV29ybGQ7XFxuICBmbG9hdCBWZG90TmM7XFxufTtcXG5cXG5zdHJ1Y3QgU2hlZW5Qcm9wc1xcbntcXG4gIHZlYzMgc2hlZW5Db2xvcjtcXG4gIGZsb2F0IHNoZWVuUm91Z2huZXNzO1xcbiAgZmxvYXQgYWxiZWRvU2hlZW5TY2FsaW5nTmRvdFY7XFxufTtcXG5cXG5zdHJ1Y3QgSXJpZGVzY2VuY2VQcm9wc1xcbntcXG4gIGZsb2F0IGlyaWRlc2NlbmNlO1xcbiAgZmxvYXQgaXJpZGVzY2VuY2VJb3I7XFxuICBmbG9hdCBpcmlkZXNjZW5jZVRoaWNrbmVzcztcXG4gIHZlYzMgZnJlc25lbERpZWxlY3RyaWM7XFxuICB2ZWMzIGZyZXNuZWxNZXRhbDtcXG59O1xcblxcbnN0cnVjdCBBbmlzb3Ryb3B5UHJvcHNcXG57XFxuICBmbG9hdCBhbmlzb3Ryb3B5O1xcbiAgdmVjMyBhbmlzb3Ryb3BpY1Q7XFxuICB2ZWMzIGFuaXNvdHJvcGljQjtcXG4gIGZsb2F0IEJkb3RWO1xcbiAgZmxvYXQgVGRvdFY7XFxuICB2ZWMyIGRpcmVjdGlvbjtcXG59O1xcblxcbnN0cnVjdCBWb2x1bWVQcm9wc1xcbntcXG4gIGZsb2F0IHRoaWNrbmVzcztcXG4gIHZlYzMgYXR0ZW51YXRpb25Db2xvcjtcXG4gIGZsb2F0IGF0dGVudWF0aW9uRGlzdGFuY2U7XFxufTtcXG5cXG5zdHJ1Y3QgRGlmZnVzZVRyYW5zbWlzc2lvblByb3BzXFxue1xcbiAgZmxvYXQgZGlmZnVzZVRyYW5zbWlzc2lvbjtcXG4gIHZlYzMgZGlmZnVzZVRyYW5zbWlzc2lvbkNvbG9yO1xcbiAgZmxvYXQgZGlmZnVzZVRyYW5zbWlzc2lvblRoaWNrbmVzcztcXG59O1xcblxcbnN0cnVjdCBTcGVjdWxhclByb3BzXFxue1xcbiAgZmxvYXQgc3BlY3VsYXJXZWlnaHQ7XFxuICB2ZWMzIHNwZWN1bGFyQ29sb3I7XFxufTtcXG5cXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXFxuLy8gbGlnaHRpbmcgd2l0aCBhIHB1bmN0dWFsIGxpZ2h0XFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xcbnZlYzMgbGlnaHRpbmdXaXRoUHVuY3R1YWxMaWdodChcXG4gIExpZ2h0IGxpZ2h0LFxcbiAgdmVjMyBub3JtYWxfaW5Xb3JsZCxcXG4gIHZlYzMgdmlld0RpcmVjdGlvbixcXG4gIGZsb2F0IE5kb3RWLFxcbiAgdmVjMyBiYXNlQ29sb3IsXFxuICBmbG9hdCBhbHBoYVJvdWdobmVzcyxcXG4gIGZsb2F0IGFscGhhUm91Z2huZXNzMixcXG4gIGZsb2F0IHNxcnROZG90VlRlcm0sXFxuICB2ZWMzIGRpZmZ1c2VCcmRmLFxcbiAgZmxvYXQgbWV0YWxsaWMsXFxuICBmbG9hdCBzcGVjdWxhcldlaWdodCxcXG4gIHZlYzMgZGllbGVjdHJpY0YwLFxcbiAgdmVjMyBkaWVsZWN0cmljRjkwLFxcbiAgZmxvYXQgaW9yLFxcbiAgZmxvYXQgdHJhbnNtaXNzaW9uLFxcbiAgVm9sdW1lUHJvcHMgdm9sdW1lUHJvcHMsXFxuICBDbGVhcmNvYXRQcm9wcyBjbGVhcmNvYXRQcm9wcyxcXG4gIEFuaXNvdHJvcHlQcm9wcyBhbmlzb3Ryb3B5UHJvcHMsXFxuICBTaGVlblByb3BzIHNoZWVuUHJvcHMsXFxuICBJcmlkZXNjZW5jZVByb3BzIGlyaWRlc2NlbmNlUHJvcHMsXFxuICBEaWZmdXNlVHJhbnNtaXNzaW9uUHJvcHMgZGlmZnVzZVRyYW5zbWlzc2lvblByb3BzXFxuICApXFxue1xcbiAgLy8gRnJlc25lbFxcbiAgdmVjMyBoYWxmVmVjdG9yID0gbm9ybWFsaXplKGxpZ2h0LmRpcmVjdGlvbiArIHZpZXdEaXJlY3Rpb24pO1xcbiAgZmxvYXQgVmRvdEggPSBzYXR1cmF0ZShkb3Qodmlld0RpcmVjdGlvbiwgaGFsZlZlY3RvcikpO1xcbiAgLy8gQm90aCBTY2hsaWNrIHRlcm1zIHNoYXJlIHRoZSBzYW1lIHBvbHlub21pYWwgaW4gVmRvdEguXFxuICBmbG9hdCBzY2hsaWNrWCA9IGNsYW1wKDEuMCAtIFZkb3RILCAwLjAsIDEuMCk7XFxuICBmbG9hdCBzY2hsaWNrWDIgPSBzY2hsaWNrWCAqIHNjaGxpY2tYO1xcbiAgZmxvYXQgc2NobGlja1g1ID0gc2NobGlja1ggKiBzY2hsaWNrWDIgKiBzY2hsaWNrWDI7XFxuICB2ZWMzIGRpZWxlY3RyaWNGcmVzbmVsID0gZGllbGVjdHJpY0YwICsgKGRpZWxlY3RyaWNGOTAgLSBkaWVsZWN0cmljRjApICogc2NobGlja1g1O1xcbiAgdmVjMyBtZXRhbEZyZXNuZWwgPSBiYXNlQ29sb3IgKyAodmVjMygxLjApIC0gYmFzZUNvbG9yKSAqIHNjaGxpY2tYNTtcXG5cXG4gIGZsb2F0IE5kb3RMID0gc2F0dXJhdGVFcHNpbG9uVG9PbmUoZG90KG5vcm1hbF9pbldvcmxkLCBsaWdodC5kaXJlY3Rpb24pKTtcXG5cXG4gIC8vIERpZmZ1c2VcXG4gIHZlYzMgZGlmZnVzZUNvbnRyaWIgPSBkaWZmdXNlQnJkZiAqIHZlYzMoTmRvdEwpICogbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eTtcXG5cXG4jaWZkZWYgUk5fVVNFX0RJRkZVU0VfVFJBTlNNSVNTSU9OXFxuICBkaWZmdXNlQ29udHJpYiA9IGRpZmZ1c2VDb250cmliICogKHZlYzMoMS4wKSAtIGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcy5kaWZmdXNlVHJhbnNtaXNzaW9uKTtcXG4gIGlmIChkb3Qobm9ybWFsX2luV29ybGQsIGxpZ2h0LmRpcmVjdGlvbikgPCAwLjApIHtcXG4gICAgZmxvYXQgZGlmZnVzZU5kb3RMID0gc2F0dXJhdGUoZG90KG5vcm1hbF9pbldvcmxkLCAtbGlnaHQuZGlyZWN0aW9uKSk7XFxuICAgIHZlYzMgZGlmZnVzZUJ0ZGYgPSBCUkRGX2xhbWJlcnRpYW4oZGlmZnVzZVRyYW5zbWlzc2lvblByb3BzLmRpZmZ1c2VUcmFuc21pc3Npb25Db2xvcikgKiB2ZWMzKGRpZmZ1c2VOZG90TCkgKiBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5O1xcbiAgICB2ZWMzIG1pcnJvckwgPSBub3JtYWxpemUobGlnaHQuZGlyZWN0aW9uICsgMi4wICogbm9ybWFsX2luV29ybGQgKiBkb3Qobm9ybWFsX2luV29ybGQsIC1saWdodC5kaXJlY3Rpb24pKTtcXG4gICAgZmxvYXQgZGlmZnVzZVZkb3RIID0gc2F0dXJhdGUoZG90KHZpZXdEaXJlY3Rpb24sIG5vcm1hbGl6ZShtaXJyb3JMICsgdmlld0RpcmVjdGlvbikpKTtcXG4gICAgZGllbGVjdHJpY0ZyZXNuZWwgPSBmcmVzbmVsU2NobGljayhkaWVsZWN0cmljRjAgKiBzcGVjdWxhcldlaWdodCwgZGllbGVjdHJpY0Y5MCwgYWJzKGRpZmZ1c2VWZG90SCkpO1xcbiNpZmRlZiBSTl9VU0VfVk9MVU1FXFxuICAgIGRpZmZ1c2VCdGRmID0gdm9sdW1lQXR0ZW51YXRpb24odm9sdW1lUHJvcHMuYXR0ZW51YXRpb25Db2xvciwgdm9sdW1lUHJvcHMuYXR0ZW51YXRpb25EaXN0YW5jZSwgZGlmZnVzZUJ0ZGYsIGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcy5kaWZmdXNlVHJhbnNtaXNzaW9uVGhpY2tuZXNzKTtcXG4jZW5kaWYgLy8gUk5fVVNFX1ZPTFVNRVxcbiAgICBkaWZmdXNlQ29udHJpYiArPSBkaWZmdXNlQnRkZiAqIGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcy5kaWZmdXNlVHJhbnNtaXNzaW9uO1xcbiAgfVxcbiNlbmRpZiAvLyBSTl9VU0VfRElGRlVTRV9UUkFOU01JU1NJT05cXG5cXG5cXG4jaWZkZWYgUk5fVVNFX1RSQU5TTUlTU0lPTlxcbiAgdmVjMyB0cmFuc21pdHRpb25SYXkgPSBnZXRWb2x1bWVUcmFuc21pc3Npb25SYXkobm9ybWFsX2luV29ybGQsIHZpZXdEaXJlY3Rpb24sIHZvbHVtZVByb3BzLnRoaWNrbmVzcywgaW9yKTtcXG4gIGxpZ2h0LnBvaW50VG9MaWdodCAtPSB0cmFuc21pdHRpb25SYXk7XFxuICBsaWdodC5kaXJlY3Rpb24gPSBub3JtYWxpemUobGlnaHQucG9pbnRUb0xpZ2h0KTtcXG4gIHZlYzMgdHJhbnNtaXR0ZWRDb250cmliID0gY2FsY3VsYXRlUmFkaWFuY2VUcmFuc21pc3Npb24obm9ybWFsX2luV29ybGQsIHZpZXdEaXJlY3Rpb24sIGxpZ2h0LmRpcmVjdGlvbiwgYWxwaGFSb3VnaG5lc3MsIGJhc2VDb2xvciwgaW9yKSAqIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHk7XFxuXFxuI2lmZGVmIFJOX1VTRV9WT0xVTUVcXG4gIHRyYW5zbWl0dGVkQ29udHJpYiA9IHZvbHVtZUF0dGVudWF0aW9uKHZvbHVtZVByb3BzLmF0dGVudWF0aW9uQ29sb3IsIHZvbHVtZVByb3BzLmF0dGVudWF0aW9uRGlzdGFuY2UsIHRyYW5zbWl0dGVkQ29udHJpYiwgbGVuZ3RoKHRyYW5zbWl0dGlvblJheSkpO1xcbiNlbmRpZiAvLyBSTl9VU0VfVk9MVU1FXFxuXFxuICBkaWZmdXNlQ29udHJpYiA9IG1peChkaWZmdXNlQ29udHJpYiwgdmVjMyh0cmFuc21pdHRlZENvbnRyaWIpLCB0cmFuc21pc3Npb24pO1xcbiNlbmRpZiAvLyBSTl9VU0VfVFJBTlNNSVNTSU9OXFxuXFxuICBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5ID0gZ2V0TGlnaHRBdHRlbnVhdGVkKGxpZ2h0KTtcXG4gIC8vIFNwZWN1bGFyXFxuICBmbG9hdCBOZG90SCA9IHNhdHVyYXRlKGRvdChub3JtYWxfaW5Xb3JsZCwgaGFsZlZlY3RvcikpO1xcblxcbiNpZmRlZiBSTl9VU0VfQU5JU09UUk9QWVxcbiAgZmxvYXQgVGRvdEwgPSBkb3QoYW5pc290cm9weVByb3BzLmFuaXNvdHJvcGljVCwgbGlnaHQuZGlyZWN0aW9uKTtcXG4gIGZsb2F0IEJkb3RMID0gZG90KGFuaXNvdHJvcHlQcm9wcy5hbmlzb3Ryb3BpY0IsIGxpZ2h0LmRpcmVjdGlvbik7XFxuICBmbG9hdCBUZG90SCA9IGRvdChhbmlzb3Ryb3B5UHJvcHMuYW5pc290cm9waWNULCBoYWxmVmVjdG9yKTtcXG4gIGZsb2F0IEJkb3RIID0gZG90KGFuaXNvdHJvcHlQcm9wcy5hbmlzb3Ryb3BpY0IsIGhhbGZWZWN0b3IpO1xcbiAgdmVjMyBzcGVjdWxhck1ldGFsQ29udHJpYiA9IEJSREZfc3BlY3VsYXJBbmlzb3Ryb3BpY0dHWChhbHBoYVJvdWdobmVzcywgVmRvdEgsIE5kb3RMLCBOZG90ViwgTmRvdEgsIGFuaXNvdHJvcHlQcm9wcy5CZG90ViwgYW5pc290cm9weVByb3BzLlRkb3RWLCBUZG90TCwgQmRvdEwsIFRkb3RILCBCZG90SCwgYW5pc290cm9weVByb3BzLmFuaXNvdHJvcHkpICogdmVjMyhOZG90TCkgKiBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5O1xcbiAgdmVjMyBzcGVjdWxhckRpZWxlY3RyaWNDb250cmliID0gc3BlY3VsYXJNZXRhbENvbnRyaWI7XFxuI2Vsc2VcXG4gIHZlYzMgc3BlY3VsYXJNZXRhbENvbnRyaWIgPSBCUkRGX3NwZWN1bGFyR0dYV2l0aFRlcm1zKE5kb3RILCBOZG90TCwgTmRvdFYsIGFscGhhUm91Z2huZXNzMiwgc3FydE5kb3RWVGVybSkgKiB2ZWMzKE5kb3RMKSAqIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHk7XFxuICB2ZWMzIHNwZWN1bGFyRGllbGVjdHJpY0NvbnRyaWIgPSBzcGVjdWxhck1ldGFsQ29udHJpYjtcXG4jZW5kaWYgLy8gUk5fVVNFX0FOSVNPVFJPUFlcXG5cXG4gIC8vIEJhc2UgTGF5ZXJcXG4gIHZlYzMgbWV0YWwgPSBzcGVjdWxhck1ldGFsQ29udHJpYiAqIG1ldGFsRnJlc25lbDtcXG4gIHZlYzMgZGllbGVjdHJpYyA9IG1peChkaWZmdXNlQ29udHJpYiwgc3BlY3VsYXJEaWVsZWN0cmljQ29udHJpYiwgZGllbGVjdHJpY0ZyZXNuZWwpO1xcblxcbiNpZmRlZiBSTl9VU0VfSVJJREVTQ0VOQ0VcXG4gIG1ldGFsID0gbWl4KG1ldGFsLCBzcGVjdWxhck1ldGFsQ29udHJpYiAqIGlyaWRlc2NlbmNlUHJvcHMuZnJlc25lbE1ldGFsLCBpcmlkZXNjZW5jZVByb3BzLmlyaWRlc2NlbmNlKTtcXG4gIGRpZWxlY3RyaWMgPSBtaXgoZGllbGVjdHJpYywgcmdiX21peChkaWZmdXNlQ29udHJpYiwgc3BlY3VsYXJEaWVsZWN0cmljQ29udHJpYiwgaXJpZGVzY2VuY2VQcm9wcy5mcmVzbmVsRGllbGVjdHJpYyksIGlyaWRlc2NlbmNlUHJvcHMuaXJpZGVzY2VuY2UpO1xcbiNlbmRpZiAvLyBSTl9VU0VfSVJJREVTQ0VOQ0VcXG5cXG4jaWZkZWYgUk5fVVNFX0NMRUFSQ09BVFxcbiAgLy8gQ2xlYXIgQ29hdCBMYXllclxcbiAgZmxvYXQgTmRvdEhjID0gc2F0dXJhdGUoZG90KGNsZWFyY29hdFByb3BzLmNsZWFyY29hdE5vcm1hbF9pbldvcmxkLCBoYWxmVmVjdG9yKSk7XFxuICBmbG9hdCBMZG90TmMgPSBzYXR1cmF0ZShkb3QobGlnaHQuZGlyZWN0aW9uLCBjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXROb3JtYWxfaW5Xb3JsZCkpO1xcbiAgdmVjMyBjbGVhcmNvYXRDb250cmliID0gQlJERl9zcGVjdWxhckdHWChOZG90SGMsIExkb3ROYywgY2xlYXJjb2F0UHJvcHMuVmRvdE5jLCBjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXRSb3VnaG5lc3MgKiBjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXRSb3VnaG5lc3MpICogdmVjMyhMZG90TmMpICogbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eTtcXG4jZWxzZVxcbiAgdmVjMyBjbGVhcmNvYXRDb250cmliID0gdmVjMygwLjApO1xcbiNlbmRpZiAvLyBSTl9VU0VfQ0xFQVJDT0FUXFxuXFxuI2lmZGVmIFJOX1VTRV9TSEVFTlxcbiAgLy8gU2hlZW5cXG4gIHZlYzMgc2hlZW5Db250cmliID0gQlJERl9zcGVjdWxhclNoZWVuKHNoZWVuUHJvcHMuc2hlZW5Db2xvciwgc2hlZW5Qcm9wcy5zaGVlblJvdWdobmVzcywgTmRvdEwsIE5kb3RWLCBOZG90SCkgKiBOZG90TCAqIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHk7XFxuICAvLyBUaGlzIHJ1bnMgaW4gdGhlIGxpZ2h0IGxvb3AsIHdob3NlIHRyaXAgY291bnQgaXMgbm90IHVuaWZvcm0gd2l0aCBDbHVzdGVyZWQgRm9yd2FyZCByZW5kZXJpbmcsXFxuICAvLyBzbyB0aGUgTFVUICh3aGljaCBoYXMgbm8gbWlwbWFwcykgaXMgc2FtcGxlZCB3aXRoIGFuIGV4cGxpY2l0IGxldmVsLlxcbiAgZmxvYXQgYWxiZWRvU2hlZW5TY2FsaW5nID0gbWluKFxcbiAgICBzaGVlblByb3BzLmFsYmVkb1NoZWVuU2NhbGluZ05kb3RWLFxcbiAgICAxLjAgLSBtYXgzKHNoZWVuUHJvcHMuc2hlZW5Db2xvcikgKiB0ZXh0dXJlTG9kKHVfc2hlZW5MdXRUZXh0dXJlLCB2ZWMyKE5kb3RMLCBzaGVlblByb3BzLnNoZWVuUm91Z2huZXNzKSwgMC4wKS5yKTtcXG4jZWxzZVxcbiAgdmVjMyBzaGVlbkNvbnRyaWIgPSB2ZWMzKDAuMCk7XFxuICBmbG9hdCBhbGJlZG9TaGVlblNjYWxpbmcgPSAxLjA7XFxuI2VuZGlmIC8vIFJOX1VTRV9TSEVFTlxcblxcbiAgdmVjMyBjb2xvciA9IG1peChkaWVsZWN0cmljLCBtZXRhbCwgbWV0YWxsaWMpO1xcbiAgY29sb3IgPSBzaGVlbkNvbnRyaWIgKyBjb2xvciAqIGFsYmVkb1NoZWVuU2NhbGluZztcXG4gIGNvbG9yID0gbWl4KGNvbG9yLCBjbGVhcmNvYXRDb250cmliLCBjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXQgKiBjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXRGcmVzbmVsKTtcXG5cXG4gIHJldHVybiBjb2xvcjtcXG59XFxuXFxuI2VuZGlmIC8vIFJOX1VTRV9QQlJcXG5cIixcInNoYWRlclN0YWdlXCI6XCJmcmFnbWVudFwiLFwiaXNGcmFnbWVudFNoYWRlclwiOnRydWV9Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFDLFdBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQXd6NEIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBNTI0Qiw4QkFBQyxNQUErejRCLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K
