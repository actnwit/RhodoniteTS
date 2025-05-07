
// https://github.com/KhronosGroup/glTF-Sample-Renderer
// Modified by Yuki Shimada

const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.00001;

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
    return 0.5 / GGX;
  }
  return 0.0;
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

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

float srgbToLinear(float value) {
  return pow(value, 2.2);
}

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

float linearToSrgb(float value) {
  return pow(value, 1.0/2.2);
}

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

vec2 uvTransform(vec2 scale, vec2 offset, float rotation, vec2 uv) {
  mat3 translationMat = mat3(1,0,0, 0,1,0, offset.x, offset.y, 1);
  mat3 rotationMat = mat3(
      cos(rotation), -sin(rotation), 0,
      sin(rotation), cos(rotation), 0,
                  0,             0, 1
  );
  mat3 scaleMat = mat3(scale.x,0,0, 0,scale.y,0, 0,0,1);

  mat3 matrix = translationMat * rotationMat * scaleMat;
  vec2 uvTransformed = ( matrix * vec3(uv.xy, 1) ).xy;

  return uvTransformed;
}

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
  mat4 worldMatrix = get_worldMatrix(v_instanceInfo);

  vec3 modelScale;
  modelScale.x = length(vec3(worldMatrix[0].xyz));
  modelScale.y = length(vec3(worldMatrix[1].xyz));
  modelScale.z = length(vec3(worldMatrix[2].xyz));

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
    float v = 0.5 / (GGXV + GGXL);
    return clamp(v, 0.0, 1.0);
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
  return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * PI);
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
  // than the IOR of the previous material (outsideIor or iridescenceIor) and π otherwise.
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





////////////////////////////////////////
// lighting with a punctual light
////////////////////////////////////////
vec3 lightingWithPunctualLight(
  Light light,
  vec3 normal_inWorld,
  vec3 viewDirection,
  float NdotV,
  vec3 baseColor,
  float perceptualRoughness,
  float metallic,
  vec3 dielectricF0,
  vec3 dielectricF90,
  float ior,
  float transmission,
  float thickness,
  float clearcoat,
  float clearcoatRoughness,
  vec3 clearcoatF0,
  vec3 clearcoatF90,
  vec3 clearcoatFresnel,
  vec3 clearcoatNormal_inWorld,
  float VdotNc,
  vec3 attenuationColor,
  float attenuationDistance,
  float anisotropy,
  vec3 anisotropicT,
  vec3 anisotropicB,
  float BdotV,
  float TdotV,
  vec3 sheenColor,
  float sheenRoughness,
  float albedoSheenScalingNdotV,
  float iridescence,
  vec3 iridescenceFresnel_dielectric,
  vec3 iridescenceFresnel_metal,
  float specularWeight,
  float diffuseTransmission,
  vec3 diffuseTransmissionColor,
  float diffuseTransmissionThickness
  )
{
  float alphaRoughness = perceptualRoughness * perceptualRoughness;

  // Fresnel
  vec3 halfVector = normalize(light.direction + viewDirection);
  float VdotH = saturate(dot(viewDirection, halfVector));
  vec3 dielectricFresnel = fresnelSchlick(dielectricF0, dielectricF90, VdotH);
  vec3 metalFresnel = fresnelSchlick(baseColor, vec3(1.0), VdotH);

  float NdotL = saturateEpsilonToOne(dot(normal_inWorld, light.direction));

  // Diffuse
  vec3 diffuseBrdf = BRDF_lambertian(baseColor);
  vec3 diffuseContrib = diffuseBrdf * vec3(NdotL) * light.attenuatedIntensity;

#ifdef RN_USE_DIFFUSE_TRANSMISSION
  diffuseContrib = diffuseContrib * (vec3(1.0) - diffuseTransmission);
  if (dot(normal_inWorld, light.direction) < 0.0) {
    float diffuseNdotL = saturate(dot(normal_inWorld, -light.direction));
    vec3 diffuseBtdf = BRDF_lambertian(diffuseTransmissionColor) * vec3(diffuseNdotL) * light.attenuatedIntensity;
    vec3 mirrorL = normalize(light.direction + 2.0 * normal_inWorld * dot(normal_inWorld, -light.direction));
    float diffuseVdotH = saturate(dot(viewDirection, normalize(mirrorL + viewDirection)));
    dielectricFresnel = fresnelSchlick(dielectricF0 * specularWeight, dielectricF90, abs(diffuseVdotH));
#ifdef RN_USE_VOLUME
    diffuseBtdf = volumeAttenuation(attenuationColor, attenuationDistance, diffuseBtdf, diffuseTransmissionThickness);
#endif // RN_USE_VOLUME
    diffuseContrib += diffuseBtdf * diffuseTransmission;
  }
#endif // RN_USE_DIFFUSE_TRANSMISSION


#ifdef RN_USE_TRANSMISSION
  vec3 transmittionRay = getVolumeTransmissionRay(normal_inWorld, viewDirection, thickness, ior);
  light.pointToLight -= transmittionRay;
  light.direction = normalize(light.pointToLight);
  vec3 transmittedContrib = calculateRadianceTransmission(normal_inWorld, viewDirection, light.direction, alphaRoughness, baseColor, ior) * light.attenuatedIntensity;

#ifdef RN_USE_VOLUME
  transmittedContrib = volumeAttenuation(attenuationColor, attenuationDistance, transmittedContrib, length(transmittionRay));
#endif // RN_USE_VOLUME

  diffuseContrib = mix(diffuseContrib, vec3(transmittedContrib), transmission);
#endif // RN_USE_TRANSMISSION

  light.attenuatedIntensity = getLightAttenuated(light);
  // Specular
  float NdotH = saturate(dot(normal_inWorld, halfVector));

#ifdef RN_USE_ANISOTROPY
  float TdotL = dot(anisotropicT, light.direction);
  float BdotL = dot(anisotropicB, light.direction);
  float TdotH = dot(anisotropicT, halfVector);
  float BdotH = dot(anisotropicB, halfVector);
  vec3 specularMetalContrib = BRDF_specularAnisotropicGGX(alphaRoughness, VdotH, NdotL, NdotV, NdotH, BdotV, TdotV, TdotL, BdotL, TdotH, BdotH, anisotropy) * vec3(NdotL) * light.attenuatedIntensity;
  vec3 specularDielectricContrib = specularMetalContrib;
#else
  vec3 specularMetalContrib = BRDF_specularGGX(NdotH, NdotL, NdotV, alphaRoughness) * vec3(NdotL) * light.attenuatedIntensity;
  vec3 specularDielectricContrib = specularMetalContrib;
#endif // RN_USE_ANISOTROPY

  // Base Layer
  vec3 metal = specularMetalContrib * metalFresnel;
  vec3 dielectric = mix(diffuseContrib, specularDielectricContrib, dielectricFresnel);

#ifdef RN_USE_IRIDESCENCE
  metal = mix(metal, specularMetalContrib * iridescenceFresnel_metal, iridescence);
  dielectric = mix(dielectric, rgb_mix(diffuseContrib, specularDielectricContrib, iridescenceFresnel_dielectric), iridescence);
#endif // RN_USE_IRIDESCENCE

#ifdef RN_USE_CLEARCOAT
  // Clear Coat Layer
  float NdotHc = saturate(dot(clearcoatNormal_inWorld, halfVector));
  float LdotNc = saturate(dot(light.direction, clearcoatNormal_inWorld));
  vec3 clearcoatContrib = BRDF_specularGGX(NdotHc, LdotNc, VdotNc, clearcoatRoughness * clearcoatRoughness) * vec3(LdotNc) * light.attenuatedIntensity;
#else
  vec3 clearcoatContrib = vec3(0.0);
#endif // RN_USE_CLEARCOAT

#ifdef RN_USE_SHEEN
  // Sheen
  vec3 sheenContrib = BRDF_specularSheen(sheenColor, sheenRoughness, NdotL, NdotV, NdotH) * NdotL * light.attenuatedIntensity;
  float albedoSheenScaling = min(
    albedoSheenScalingNdotV,
    1.0 - max3(sheenColor) * texture(u_sheenLutTexture, vec2(NdotL, sheenRoughness)).r);
#else
  vec3 sheenContrib = vec3(0.0);
  float albedoSheenScaling = 1.0;
#endif // RN_USE_SHEEN

  vec3 color = mix(dielectric, metal, metallic);
  color = sheenContrib + color * albedoSheenScaling;
  color = mix(color, clearcoatContrib, clearcoat * clearcoatFresnel);

  return color;
}
