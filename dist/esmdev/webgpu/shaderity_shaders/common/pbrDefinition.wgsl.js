// shaderity:/Users/emadurandal/ghq/github.com/actnwit/RhodoniteEditor2/submodules/RhodoniteTS/src/webgpu/shaderity_shaders/common/pbrDefinition.wgsl
var code = `// This file includes portions of code from the glTF-Sample-Renderer project by Khronos Group (Apache License 2.0).
// https://github.com/KhronosGroup/glTF-Sample-Renderer
// Modified by Yuki Shimada

// From: https://github.com/KhronosGroup/glTF-Sample-Viewer/blob/e2c7b8c8bd12916c1a387cd41f9ef061edc718df/source/Renderer/shaders/brdf.glsl#L44-L66

#ifdef RN_USE_PBR

fn Schlick_to_F0_F90(f: vec3f, f90: vec3f, VdotH: f32) -> vec3f {
    let x = clamp(1.0 - VdotH, 0.0, 1.0);
    let x2 = x * x;
    let x5 = clamp(x * x2 * x2, 0.0, 0.9999);

    return (f - f90 * x5) / (1.0 - x5);
}

fn Schlick_to_F0_F90_F32(f: f32, f90: f32, VdotH: f32) -> f32 {
    let x = clamp(1.0 - VdotH, 0.0, 1.0);
    let x2 = x * x;
    let x5 = clamp(x * x2 * x2, 0.0, 0.9999);

    return (f - f90 * x5) / (1.0 - x5);
}

fn Schlick_to_F0(f: vec3f, VdotH: f32) -> vec3f {
    return Schlick_to_F0_F90(f, vec3(1.0), VdotH);
}

fn Schlick_to_F0_F32(f: f32, VdotH: f32) -> f32 {
    return Schlick_to_F0_F90_F32(f, 1.0, VdotH);
}


// The Schlick Approximation to Fresnel
fn fresnelSchlick(f0 : vec3f, f90 : vec3f, VdotH : f32) -> vec3f {
    let x = clamp(1.0 - VdotH, 0.0, 1.0);
    let x2 = x * x;
    let x5 = x * x2 * x2;
    return f0 + (f90 - f0) * x5;
}

fn fresnelSchlickF32(f0 : f32, f90 : f32, VdotH : f32) -> f32 {
    let x = clamp(1.0 - VdotH, 0.0, 1.0);
    let x2 = x * x;
    let x5 = x * x2 * x2;
    return f0 + (f90 - f0) * x5;
}

fn fresnelSchlick2(f0: vec3f, VdotH: f32) -> vec3f
{
  let f90 = vec3f(1.0); //clamp(50.0 * f0, 0.0, 1.0);
  return fresnelSchlick(f0, f90, VdotH);
}

fn fresnel2F32(f0: f32, VdotH: f32) -> f32
{
  let f90 = 1.0; //clamp(50.0 * f0, 0.0, 1.0);
  return fresnelSchlickF32(f0, f90, VdotH);
}

// Roughness Dependent Fresnel
// https://www.jcgt.org/published/0008/01/03/paper.pdf
fn fresnelSchlickRoughness(F0: vec3f, cosTheta: f32, roughness: f32) -> vec3f
{
  let Fr = max(vec3f(1.0 - roughness), F0) - F0;
  let k_S = F0 + Fr * pow(1.0 - cosTheta, 5.0);
  return k_S;
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#diffuse-brdf
fn BRDF_lambertian(diffuseAlbedo: vec3f) -> vec3f
{
  return diffuseAlbedo * RECIPROCAL_PI;
}


// GGX NDF
fn d_GGX(NH: f32, alphaRoughness: f32) -> f32 {
  let roughnessSqr = alphaRoughness * alphaRoughness;
  let f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (M_PI * f * f);
}

// The code from https://google.github.io/filament/Filament.html#listing_approximatedspecularv
// The idea is from [Heitz14] Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs.
fn v_GGXCorrelated(NL: f32, NV: f32, alphaRoughness: f32) -> f32 {
  let a2 = alphaRoughness * alphaRoughness;
  let GGXV = NL * sqrt(NV * NV * (1.0 - a2) + a2);
  let GGXL = NV * sqrt(NL * NL * (1.0 - a2) + a2);
  let GGX = GGXV + GGXL;
  if (GGX > 0.0) {
    return clamp(0.5 / GGX, 0.0, 1.0);
  }
  return 1.0;
}

fn BRDF_specularGGX(NH: f32, NL: f32, NV: f32, alphaRoughness: f32) -> vec3f {
  let D = d_GGX(NH, alphaRoughness);
  let V = v_GGXCorrelated(NL, NV, alphaRoughness);
  return vec3f(D) * vec3f(V);
}

// Variants used by the punctual light loop: the caller hoists the fragment-invariant terms
// (roughnessSqr and the NdotV term of v_GGXCorrelated) out of the loop, so they are not
// recomputed for every light. The arithmetic is the same as d_GGX / v_GGXCorrelated.
fn d_GGXWithRoughnessSquared(NH: f32, roughnessSqr: f32) -> f32 {
  let f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (M_PI * f * f);
}

fn BRDF_specularGGXWithTerms(NH: f32, NL: f32, NV: f32, roughnessSqr: f32, sqrtNdotVTerm: f32) -> vec3f {
  let D = d_GGXWithRoughnessSquared(NH, roughnessSqr);
  let GGXV = NL * sqrtNdotVTerm;
  let GGXL = NV * sqrt(NL * NL * (1.0 - roughnessSqr) + roughnessSqr);
  let GGX = GGXV + GGXL;
  var V = 1.0;
  if (GGX > 0.0) {
    V = clamp(0.5 / GGX, 0.0, 1.0);
  }
  return vec3f(D * V);
}

// this is from https://www.unrealengine.com/blog/physically-based-shading-on-mobile
fn envBRDFApprox( Roughness: f32, NoV: f32 ) -> vec2f {
  let c0 = vec4f(-1, -0.0275, -0.572, 0.022 );
  let c1 = vec4f(1, 0.0425, 1.04, -0.04 );
  let r = Roughness * c0 + c1;
  let a004 = min( r.x * r.x, exp2( -9.28 * NoV ) ) * r.x + r.y;
  let AB = vec2f( -1.04, 1.04 ) * a004 + r.zw;

  return AB;
}


// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission#implementation-notes
fn specular_btdf(alphaRoughness: f32, NdotL: f32, NdotV: f32, NdotHt: f32) -> f32 {
  let V = v_GGXCorrelated(NdotL, NdotV, alphaRoughness);
  let D = d_GGX(NdotHt, alphaRoughness);
  return V * D;
}

fn IsotropicNDFFiltering(normal: vec3f, roughness2: f32) -> f32 {
  let SIGMA2 = 0.15915494;
  let KAPPA = 0.18;
  let dndu  = dpdx(normal);
  let dndv = dpdy(normal);
  let kernelRoughness2 = SIGMA2 * (dot(dndu, dndu) + dot(dndv, dndv));
  let clampedKernelRoughness2 = min(kernelRoughness2, KAPPA);
  let filteredRoughness2 = saturate(roughness2 + clampedKernelRoughness2);
  return filteredRoughness2;
}

////////////////////////////////////////
// glTF KHR_materials_transmission
////////////////////////////////////////

#ifdef RN_USE_TRANSMISSION

// https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md#attenuation
fn volumeAttenuation(attenuationColor: vec3f, attenuationDistance: f32, intensity: vec3f, transmissionDistance: f32) -> vec3f
{
  if (attenuationDistance == 0.0) { // means Infinite distance
    return intensity; // No attenuation
  } else {
    // let attenuationCo: vec3f = -log(attenuationColor) / attenuationDistance;
    // let attenuatedTransmittance: vec3f = exp(-attenuationCo * transmissionDistance);
    let attenuatedTransmittance: vec3f = pow(attenuationColor, vec3f(transmissionDistance / attenuationDistance));
    return intensity * attenuatedTransmittance;
  }
}

// from glTF Sample Viewer: https://github.com/KhronosGroup/glTF-Sample-Viewer
fn getVolumeTransmissionRay(n: vec3f, v: vec3f, thickness: f32, ior: f32) -> vec3f
{
  let refractionVector = refract(-v, normalize(n), 1.0 / ior);
#ifdef RN_RAYMARCHING_SHADING
  // The raymarching draw has no per-instance mesh transform, and SDF thickness is
  // authored in world units.
  let modelScale = vec3f(1.0);
#else
  let worldMatrix = get_worldMatrix(g_instanceIds.x);

  var modelScale: vec3f;
  modelScale.x = length(vec3f(worldMatrix[0].xyz));
  modelScale.y = length(vec3f(worldMatrix[1].xyz));
  modelScale.z = length(vec3f(worldMatrix[2].xyz));
#endif

  return normalize(refractionVector) * thickness * modelScale;
}
#endif

fn applyIorToRoughness(roughness: f32, ior: f32) -> f32
{
    return clamp(roughness * clamp(ior * 2.0 - 2.0, 0.0, 1.0), c_MinRoughness, 1.0);
}

fn calculateRadianceTransmission(normal: vec3f, view: vec3f, pointToLight: vec3f, alphaRoughness: f32, baseColor: vec3f, ior: f32) -> vec3f
{
    let transmissionRoughness = applyIorToRoughness(alphaRoughness, ior);

    let n = normalize(normal);
    let v = normalize(view);
    let l = normalize(pointToLight);
    let mirrorL = normalize(l + 2.0 * n * dot(-l, n));
    let h = normalize(mirrorL + v);

    let D = d_GGX(clamp(dot(n, h), 0.0, 1.0), transmissionRoughness);
    let V = v_GGXCorrelated(clamp(dot(n, mirrorL), 0.0, 1.0), clamp(dot(n, v), 0.0, 1.0), transmissionRoughness);

    return baseColor * D * V;
}




////////////////////////////////////////
// glTF KHR_materials_anisotropy
////////////////////////////////////////
#ifdef RN_USE_ANISOTROPY
// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_anisotropy
fn D_GGX_anisotropic(NdotH: f32, TdotH: f32, BdotH: f32, at: f32, ab: f32) -> f32
{
    let a2 = at * ab;
    let f = vec3f(ab * TdotH, at * BdotH, a2 * NdotH);
    let w2 = a2 / dot(f, f);
    return a2 * w2 * w2 / M_PI;
}

fn V_GGX_anisotropic(NdotL: f32, NdotV: f32, BdotV: f32, TdotV: f32, TdotL: f32, BdotL: f32,
    at: f32, ab: f32) -> f32
{
    let GGXV = NdotL * length(vec3(at * TdotV, ab * BdotV, NdotV));
    let GGXL = NdotV * length(vec3(at * TdotL, ab * BdotL, NdotL));
    let GGX = GGXV + GGXL;
    if (GGX > 0.0) {
      return clamp(0.5 / GGX, 0.0, 1.0);
    }
    return 1.0;
}

fn BRDF_specularAnisotropicGGX(alphaRoughness: f32,
    VdotH: f32, NdotL: f32, NdotV: f32, NdotH: f32, BdotV: f32, TdotV: f32,
    TdotL: f32, BdotL: f32, TdotH: f32, BdotH: f32, anisotropy: f32) -> vec3f
{
    let at = mix(alphaRoughness, 1.0, anisotropy * anisotropy);
    let ab = clamp(alphaRoughness, 0.001, 1.0);

    let V = V_GGX_anisotropic(NdotL, NdotV, BdotV, TdotV, TdotL, BdotL, at, ab);
    let D = D_GGX_anisotropic(NdotH, TdotH, BdotH, at, ab);

    return vec3f(V * D);
}
#endif

////////////////////////////////////////
// glTF KHR_materials_sheen
////////////////////////////////////////

#ifdef RN_USE_SHEEN
fn d_Charlie(sheenPerceptualRoughness: f32, NoH: f32) -> f32 {
  // Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
  let sheenRoughness = max(sheenPerceptualRoughness, 0.000001);
  let alphaG = sheenRoughness * sheenRoughness;
  let invAlpha  = 1.0 / alphaG;
  let cos2h = NoH * NoH;
  let sin2h = 1.0 - cos2h;
  return (2.0 + invAlpha) * pow(sin2h, invAlpha * 0.5) / (2.0 * M_PI);
}

// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen#sheen-visibility
fn sheenSimpleVisibility(NdotL: f32, NdotV: f32) -> f32 {
  return 1.0 / (4.0 * (NdotL + NdotV - NdotL * NdotV));
}

// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen#sheen-visibility
fn charlieL(x: f32, alphaG: f32) -> f32 {
  let oneMinusAlphaSq = (1.0 - alphaG) * (1.0 - alphaG);
  let a = mix(21.5473, 25.3245, oneMinusAlphaSq);
  let b = mix(3.82987, 3.32435, oneMinusAlphaSq);
  let c = mix(0.19823, 0.16801, oneMinusAlphaSq);
  let d = mix(-1.97760, -1.27393, oneMinusAlphaSq);
  let e = mix(-4.32054, -4.85967, oneMinusAlphaSq);
  return a / (1.0 + b * pow(x, c)) + d * x + e;
}

fn lambdaSheen(cosTheta: f32, alphaG: f32) -> f32
{
  return select(exp(2.0 * charlieL(0.5, alphaG) - charlieL(1.0 - cosTheta, alphaG)), exp(charlieL(cosTheta, alphaG)), abs(cosTheta) < 0.5);
}

fn sheenCharlieVisibility(NdotL: f32, NdotV: f32, sheenPerceptualRoughness: f32) -> f32 {
  let sheenRoughness = max(sheenPerceptualRoughness, 0.000001);
  let alphaG = sheenRoughness * sheenRoughness;
  let sheenVisibility = clamp(1.0 / ((1.0 + lambdaSheen(NdotV, alphaG) + lambdaSheen(NdotL, alphaG)) * (4.0 * NdotV * NdotL)), 0.0, 1.0);
  return sheenVisibility;
}

fn BRDF_specularSheen(sheenColor: vec3f, sheenPerceptualRoughness: f32, NdotL: f32, NdotV: f32, NdotH: f32) -> vec3f {
  let sheenDistribution = d_Charlie(sheenPerceptualRoughness, NdotH);
  let sheenVisibility = sheenCharlieVisibility(NdotL, NdotV, sheenPerceptualRoughness);
  return sheenColor * sheenDistribution * sheenVisibility;
}
#endif // RN_USE_SHEEN

////////////////////////////////////////
// glTF KHR_materials_irirdescence
////////////////////////////////////////

#ifdef RN_USE_IRIDESCENCE
// XYZ to REC709(sRGB) conversion matrix
const XYZ_TO_REC709 = mat3x3<f32>(
     3.2404542, -0.9692660,  0.0556434,
    -1.5371385,  1.8760108, -0.2040259,
    -0.4985314,  0.0415560,  1.0572252
);

fn fresnelSchlickRoughnessWithIridescence(
  F0: vec3f, cosTheta: f32, roughness: f32,
  iridescenceFresnel: vec3f, iridescence: f32
  ) -> vec3f
{
  let Fr = max(vec3f(1.0 - roughness), F0) - F0;
  let k_S = mix(F0 + Fr * pow(1.0 - cosTheta, 5.0), iridescenceFresnel, iridescence);
  return k_S;
}

// Assume air interface for top
fn Fresnel0ToIor(F0: vec3f) -> vec3f {
    let sqrtF0 = sqrt(F0);
    return (vec3(1.0) + sqrtF0) / (vec3(1.0) - sqrtF0);
}

// Conversion from IOR to F0
// ior is a value between 1.0 and 3.0. 1.0 is air interface
fn IorToFresnel0Vec3f(transmittedIor: vec3f, incidentIor: f32) -> vec3f {
    return sqVec3f((transmittedIor - vec3f(incidentIor)) / (transmittedIor + vec3(incidentIor)));
}
fn IorToFresnel0F32(transmittedIor: f32, incidentIor: f32) -> f32 {
    return sqF32((transmittedIor - incidentIor) / (transmittedIor + incidentIor));
}

/**
 * From: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence#analytic-spectral-integration
 */
fn evalSensitivity(OPD: f32, shift: vec3f) -> vec3f {
    let phase = 2.0 * M_PI * OPD * 1.0e-9;
    let val = vec3f(5.4856e-13, 4.4201e-13, 5.2481e-13);
    let pos = vec3f(1.6810e+06, 1.7953e+06, 2.2084e+06);
    let var_ = vec3f(4.3278e+09, 9.3046e+09, 6.6121e+09);

    var xyz = val * sqrt(2.0 * M_PI * var_) * cos(pos * phase + shift) * exp(-(phase * phase) * var_);
    xyz.x += 9.7470e-14 * sqrt(2.0 * M_PI * 4.5282e+09) * cos(2.2399e+06 * phase + shift[0]) * exp(-4.5282e+09 * (phase * phase));
    xyz /= 1.0685e-7;

    let rgb = XYZ_TO_REC709 * xyz;
    return rgb;
}

/**
 * From: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_iridescence#iridescence-fresnel
 */
fn calcIridescence(outsideIor: f32, eta2: f32, cosTheta1: f32, thinFilmThickness: f32, baseF0: vec3f) -> vec3f {


  // iridescenceIor is the index of refraction of the thin-film layer
  // Force iridescenceIor -> outsideIOR when thinFilmThickness -> 0.0
  let iridescenceIor = mix(outsideIor, eta2, smoothstep(0.0, 0.03, thinFilmThickness));

  // To calculate the reflectances R12 and R23 at the viewing angles (angle hitting the thin-film layer)
  // and (angle after refraction in the thin-film) Schlick Fresnel is again used.
  // This approximation allows to eliminate the split into S and P polarization for the exact Fresnel equations.
  // can be calculated using Snell's law (with  being outsideIor and being iridescenceIor):
  let sinTheta2Sq = sqF32(outsideIor / iridescenceIor) * (1.0 - sqF32(cosTheta1));
  let cosTheta2Sq = 1.0 - sinTheta2Sq;

  // Handle total internal reflection
  if (cosTheta2Sq < 0.0) {
      return vec3f(1.0);
  }

  let cosTheta2 = sqrt(cosTheta2Sq);

  /// Material Interfaces
  // The iridescence model defined by Belcour/Barla models two material interfaces
  // - one from the outside to the thin-film layer
  // and another one from the thin-film to the base material. These two interfaces are defined as follows:

  // First interface (from the outside to the thin-film layer)
  let R0 = IorToFresnel0F32(iridescenceIor, outsideIor);
  let R12 = fresnel2F32(R0, cosTheta1);
  let R21 = R12;
  let T121 = 1.0 - R12;

  // Second interface (from the thin-film to the base material)
  let baseIor = Fresnel0ToIor(baseF0 + 0.0001); // guard against 1.0
  let R1 = IorToFresnel0Vec3f(baseIor, iridescenceIor);
  let R23 = fresnelSchlick2(R1, cosTheta2);

  // phi12 and phi23 define the base phases per interface and are approximated with 0.0
  // if the IOR of the hit material (iridescenceIor or baseIor) is higher
  // than the IOR of the previous material (outsideIor or iridescenceIor) and \u03C0 otherwise.
  // Also here, polarization is ignored.  float phi12 = 0.0;

  // First interface (from the outside to the thin-film layer)
  var phi12 = 0.0;
  if (iridescenceIor < outsideIor) { phi12 = M_PI; }
  let phi21 = M_PI - phi12;

  // Second interface (from the thin-film to the base material)
  var phi23 = vec3f(0.0);
  if (baseIor[0] < iridescenceIor) { phi23[0] = M_PI; }
  if (baseIor[1] < iridescenceIor) { phi23[1] = M_PI; }
  if (baseIor[2] < iridescenceIor) { phi23[2] = M_PI; }

  // OPD (optical path difference)
  let OPD = 2.0 * iridescenceIor * thinFilmThickness * cosTheta2;
  // Phase shift
  let phi = vec3f(phi21) + phi23;

  // Compound terms
  let R123 = clamp(R12 * R23, vec3f(1e-5), vec3f(0.9999));
  let r123 = sqrt(R123);
  let Rs = (T121 * T121) * R23 / (vec3f(1.0) - R123);

  // Reflectance term for m = 0 (DC term amplitude)
  let C0 = R12 + Rs;
  var I = C0;

  // Reflectance term for m > 0 (pairs of diracs)
  var Cm = Rs - T121;
  for (var m = 1; m <= 2; m++)
  {
      Cm *= r123;
      let Sm = 2.0 * evalSensitivity(f32(m) * OPD, f32(m) * phi);
      I += Cm * Sm;
  }

  let F_iridescence = max(I, vec3f(0.0));

  return F_iridescence;
}

//https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#acknowledgments AppendixB
fn BRDF_lambertianIridescence(f0: vec3f, f90: vec3f, iridescenceFresnel: vec3f, iridescenceFactor: f32, diffuseColor: vec3f, specularWeight: f32, VdotH: f32) -> vec3f
{
    let iridescenceFresnelMax = vec3f(max(max(iridescenceFresnel.r, iridescenceFresnel.g), iridescenceFresnel.b));

    let schlickFresnel = Schlick_to_F0_F90(f0, f90, VdotH);

    let F = mix(schlickFresnel, iridescenceFresnelMax, iridescenceFactor);

    // see https://seblagarde.wordpress.com/2012/01/08/pi-or-not-to-pi-in-game-lighting-equation/
    return (1.0 - specularWeight * F) * (diffuseColor / M_PI);
}

fn BRDF_specularGGXIridescence(f0: vec3f, f90: vec3f, iridescenceFresnel: vec3f, alphaRoughness: f32, iridescenceFactor: f32, specularWeight: f32, VdotH: f32, NdotL: f32, NdotV: f32, NdotH: f32) -> vec3f
{
    let F = mix(Schlick_to_F0_F90(f0, f90, VdotH), iridescenceFresnel, iridescenceFactor);
    let Vis = v_GGXCorrelated(NdotL, NdotV, alphaRoughness);
    let D = d_GGX(NdotH, alphaRoughness);

    return specularWeight * F * Vis * D;
}

fn rgb_mix(base: vec3f, specular_brdf: vec3f, rgb_alpha: vec3f) -> vec3f
{
    let rgb_alpha_max = max(rgb_alpha.r, max(rgb_alpha.g, rgb_alpha.b));
    return (1.0 - rgb_alpha_max) * base + rgb_alpha * specular_brdf;
}

#endif // RN_USE_IRIDESCENCE

struct OcclusionProps
{
  occlusionTexture: vec4<f32>,
  occlusionStrength: f32,
};

struct EmissiveProps
{
  emissive: vec3f,
  emissiveStrength: f32,
};

struct ClearcoatProps
{
  clearcoat: f32,
  clearcoatRoughness: f32,
  clearcoatF0: vec3f,
  clearcoatF90: vec3f,
  clearcoatFresnel: vec3f,
  clearcoatNormal_inTangent: vec3f,
  clearcoatNormal_inWorld: vec3f,
  VdotNc: f32,
};

struct SheenProps
{
  sheenColor: vec3f,
  sheenRoughness: f32,
  albedoSheenScalingNdotV: f32,
};

struct IridescenceProps
{
  iridescence: f32,
  iridescenceIor: f32,
  iridescenceThickness: f32,
  fresnelDielectric: vec3f,
  fresnelMetal: vec3f,
};

struct AnisotropyProps
{
  anisotropy: f32,
  anisotropicT: vec3f,
  anisotropicB: vec3f,
  BdotV: f32,
  TdotV: f32,
  direction: vec2f,
};

struct VolumeProps
{
  thickness: f32,
  attenuationColor: vec3f,
  attenuationDistance: f32,
};

struct DiffuseTransmissionProps
{
  diffuseTransmission: f32,
  diffuseTransmissionColor: vec3f,
  diffuseTransmissionThickness: f32,
};

struct SpecularProps
{
  specularWeight: f32,
  specularColor: vec3f,
};

////////////////////////////////////////
// lighting with a punctual light
////////////////////////////////////////
fn lightingWithPunctualLight(
  light_: Light,
  normal_inWorld: vec3f,
  viewDirection: vec3f,
  NdotV: f32,
  baseColor: vec3f,
  alphaRoughness: f32,
  alphaRoughness2: f32,
  sqrtNdotVTerm: f32,
  diffuseBrdf: vec3f,
  metallic: f32,
  specularWeight: f32,
  dielectricF0: vec3f,
  dielectricF90: vec3f,
  ior: f32,
  transmission: f32,
  volumeProps: VolumeProps,
  clearcoatProps: ClearcoatProps,
  anisotropyProps: AnisotropyProps,
  sheenProps: SheenProps,
  iridescenceProps: IridescenceProps,
  diffuseTransmissionProps: DiffuseTransmissionProps
  ) -> vec3f
{
  var light = light_;

  // Fresnel
  let halfVector = normalize(light.direction + viewDirection);
  let VdotH = saturate(dot(viewDirection, halfVector));
  // Both Schlick terms share the same polynomial in VdotH.
  let schlickX = clamp(1.0 - VdotH, 0.0, 1.0);
  let schlickX2 = schlickX * schlickX;
  let schlickX5 = schlickX * schlickX2 * schlickX2;
  var dielectricFresnel = dielectricF0 + (dielectricF90 - dielectricF0) * schlickX5;
  let metalFresnel = baseColor + (vec3f(1.0) - baseColor) * schlickX5;

  let NdotL = saturateEpsilonToOne(dot(normal_inWorld, light.direction));

  // Diffuse
  var diffuseContrib = diffuseBrdf * vec3f(NdotL) * light.attenuatedIntensity;

#ifdef RN_USE_DIFFUSE_TRANSMISSION
  diffuseContrib = diffuseContrib * (vec3f(1.0) - diffuseTransmissionProps.diffuseTransmission);
  if (dot(normal_inWorld, light.direction) < 0.0) {
    let diffuseNdotL = saturate(dot(normal_inWorld, -light.direction));
    var diffuseBtdf = BRDF_lambertian(diffuseTransmissionProps.diffuseTransmissionColor) * vec3f(diffuseNdotL) * light.attenuatedIntensity;
    let mirrorL = normalize(light.direction + 2.0 * normal_inWorld * dot(normal_inWorld, -light.direction));
    let diffuseVdotH = saturate(dot(viewDirection, normalize(mirrorL + viewDirection)));
    dielectricFresnel = fresnelSchlick(dielectricF0 * specularWeight, dielectricF90, abs(diffuseVdotH));
#ifdef RN_USE_VOLUME
    diffuseBtdf = volumeAttenuation(volumeProps.attenuationColor, volumeProps.attenuationDistance, diffuseBtdf, diffuseTransmissionProps.diffuseTransmissionThickness);
#endif // RN_USE_VOLUME
    diffuseContrib += diffuseBtdf * diffuseTransmissionProps.diffuseTransmission;
  }
#endif // RN_USE_DIFFUSE_TRANSMISSION

#ifdef RN_USE_TRANSMISSION
  let transmittionRay = getVolumeTransmissionRay(normal_inWorld, viewDirection, volumeProps.thickness, ior);
  light.pointToLight -= transmittionRay;
  light.direction = normalize(light.pointToLight);
  var transmittedContrib = calculateRadianceTransmission(normal_inWorld, viewDirection, light.direction, alphaRoughness, baseColor, ior) * light.attenuatedIntensity;

#ifdef RN_USE_VOLUME
  transmittedContrib = volumeAttenuation(volumeProps.attenuationColor, volumeProps.attenuationDistance, transmittedContrib, length(transmittionRay));
#endif // RN_USE_VOLUME

  diffuseContrib = mix(diffuseContrib, vec3f(transmittedContrib), transmission);
#endif // RN_USE_TRANSMISSION

  // Specular
  let NdotH = saturate(dot(normal_inWorld, halfVector));

#ifdef RN_USE_ANISOTROPY
  let TdotL = dot(anisotropyProps.anisotropicT, light.direction);
  let BdotL = dot(anisotropyProps.anisotropicB, light.direction);
  let TdotH = dot(anisotropyProps.anisotropicT, halfVector);
  let BdotH = dot(anisotropyProps.anisotropicB, halfVector);
  let specularMetalContrib = BRDF_specularAnisotropicGGX(alphaRoughness, VdotH, NdotL, NdotV, NdotH, anisotropyProps.BdotV, anisotropyProps.TdotV, TdotL, BdotL, TdotH, BdotH, anisotropyProps.anisotropy) * vec3f(NdotL) * light.attenuatedIntensity;
  let specularDielectricContrib = specularMetalContrib;
#else
  let specularMetalContrib = BRDF_specularGGXWithTerms(NdotH, NdotL, NdotV, alphaRoughness2, sqrtNdotVTerm) * vec3f(NdotL) * light.attenuatedIntensity;
  let specularDielectricContrib = specularMetalContrib;
#endif

  // Base Layer
  var metal = specularMetalContrib * metalFresnel;
  var dielectric = mix(diffuseContrib, specularDielectricContrib, dielectricFresnel);

#ifdef RN_USE_IRIDESCENCE
  metal = mix(metal, specularMetalContrib * iridescenceProps.fresnelMetal, iridescenceProps.iridescence);
  dielectric = mix(dielectric, rgb_mix(diffuseContrib, specularDielectricContrib, iridescenceProps.fresnelDielectric), iridescenceProps.iridescence);
#endif // RN_USE_IRIDESCENCE

#ifdef RN_USE_CLEARCOAT
  // Clear Coat Layer
  let NdotHc = saturate(dot(clearcoatProps.clearcoatNormal_inWorld, halfVector));
  let LdotNc = saturate(dot(light.direction, clearcoatProps.clearcoatNormal_inWorld));
  let clearcoatContrib = BRDF_specularGGX(NdotHc, LdotNc, clearcoatProps.VdotNc, clearcoatProps.clearcoatRoughness * clearcoatProps.clearcoatRoughness) * vec3f(LdotNc) * light.attenuatedIntensity;
#else
  let clearcoatContrib = vec3f(0.0);
#endif // RN_USE_CLEARCOAT

#ifdef RN_USE_SHEEN
  // Sheen
  let sheenContrib = BRDF_specularSheen(sheenProps.sheenColor, sheenProps.sheenRoughness, NdotL, NdotV, NdotH) * NdotL * light.attenuatedIntensity;
  // This runs in the light loop, whose trip count is not uniform with Clustered Forward rendering,
  // so the LUT (which has no mipmaps) is sampled with an explicit level.
  let albedoSheenScaling = min(
    sheenProps.albedoSheenScalingNdotV,
    1.0 - max3(sheenProps.sheenColor) * textureSampleLevel(sheenLutTexture, sheenLutSampler, vec2(NdotL, sheenProps.sheenRoughness), 0.0).r);
#else
  let sheenContrib = vec3f(0.0);
  let albedoSheenScaling = 1.0;
#endif // RN_USE_SHEEN

  var color = mix(dielectric, metal, metallic);
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic2hhZGVyaXR5Oi9Vc2Vycy9lbWFkdXJhbmRhbC9naHEvZ2l0aHViLmNvbS9hY3Rud2l0L1Job2Rvbml0ZUVkaXRvcjIvc3VibW9kdWxlcy9SaG9kb25pdGVUUy9zcmMvd2ViZ3B1L3NoYWRlcml0eV9zaGFkZXJzL2NvbW1vbi9wYnJEZWZpbml0aW9uLndnc2wiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIntcImNvZGVcIjpcIi8vIFRoaXMgZmlsZSBpbmNsdWRlcyBwb3J0aW9ucyBvZiBjb2RlIGZyb20gdGhlIGdsVEYtU2FtcGxlLVJlbmRlcmVyIHByb2plY3QgYnkgS2hyb25vcyBHcm91cCAoQXBhY2hlIExpY2Vuc2UgMi4wKS5cXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYtU2FtcGxlLVJlbmRlcmVyXFxuLy8gTW9kaWZpZWQgYnkgWXVraSBTaGltYWRhXFxuXFxuLy8gRnJvbTogaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGLVNhbXBsZS1WaWV3ZXIvYmxvYi9lMmM3YjhjOGJkMTI5MTZjMWEzODdjZDQxZjllZjA2MWVkYzcxOGRmL3NvdXJjZS9SZW5kZXJlci9zaGFkZXJzL2JyZGYuZ2xzbCNMNDQtTDY2XFxuXFxuI2lmZGVmIFJOX1VTRV9QQlJcXG5cXG5mbiBTY2hsaWNrX3RvX0YwX0Y5MChmOiB2ZWMzZiwgZjkwOiB2ZWMzZiwgVmRvdEg6IGYzMikgLT4gdmVjM2Yge1xcbiAgICBsZXQgeCA9IGNsYW1wKDEuMCAtIFZkb3RILCAwLjAsIDEuMCk7XFxuICAgIGxldCB4MiA9IHggKiB4O1xcbiAgICBsZXQgeDUgPSBjbGFtcCh4ICogeDIgKiB4MiwgMC4wLCAwLjk5OTkpO1xcblxcbiAgICByZXR1cm4gKGYgLSBmOTAgKiB4NSkgLyAoMS4wIC0geDUpO1xcbn1cXG5cXG5mbiBTY2hsaWNrX3RvX0YwX0Y5MF9GMzIoZjogZjMyLCBmOTA6IGYzMiwgVmRvdEg6IGYzMikgLT4gZjMyIHtcXG4gICAgbGV0IHggPSBjbGFtcCgxLjAgLSBWZG90SCwgMC4wLCAxLjApO1xcbiAgICBsZXQgeDIgPSB4ICogeDtcXG4gICAgbGV0IHg1ID0gY2xhbXAoeCAqIHgyICogeDIsIDAuMCwgMC45OTk5KTtcXG5cXG4gICAgcmV0dXJuIChmIC0gZjkwICogeDUpIC8gKDEuMCAtIHg1KTtcXG59XFxuXFxuZm4gU2NobGlja190b19GMChmOiB2ZWMzZiwgVmRvdEg6IGYzMikgLT4gdmVjM2Yge1xcbiAgICByZXR1cm4gU2NobGlja190b19GMF9GOTAoZiwgdmVjMygxLjApLCBWZG90SCk7XFxufVxcblxcbmZuIFNjaGxpY2tfdG9fRjBfRjMyKGY6IGYzMiwgVmRvdEg6IGYzMikgLT4gZjMyIHtcXG4gICAgcmV0dXJuIFNjaGxpY2tfdG9fRjBfRjkwX0YzMihmLCAxLjAsIFZkb3RIKTtcXG59XFxuXFxuXFxuLy8gVGhlIFNjaGxpY2sgQXBwcm94aW1hdGlvbiB0byBGcmVzbmVsXFxuZm4gZnJlc25lbFNjaGxpY2soZjAgOiB2ZWMzZiwgZjkwIDogdmVjM2YsIFZkb3RIIDogZjMyKSAtPiB2ZWMzZiB7XFxuICAgIGxldCB4ID0gY2xhbXAoMS4wIC0gVmRvdEgsIDAuMCwgMS4wKTtcXG4gICAgbGV0IHgyID0geCAqIHg7XFxuICAgIGxldCB4NSA9IHggKiB4MiAqIHgyO1xcbiAgICByZXR1cm4gZjAgKyAoZjkwIC0gZjApICogeDU7XFxufVxcblxcbmZuIGZyZXNuZWxTY2hsaWNrRjMyKGYwIDogZjMyLCBmOTAgOiBmMzIsIFZkb3RIIDogZjMyKSAtPiBmMzIge1xcbiAgICBsZXQgeCA9IGNsYW1wKDEuMCAtIFZkb3RILCAwLjAsIDEuMCk7XFxuICAgIGxldCB4MiA9IHggKiB4O1xcbiAgICBsZXQgeDUgPSB4ICogeDIgKiB4MjtcXG4gICAgcmV0dXJuIGYwICsgKGY5MCAtIGYwKSAqIHg1O1xcbn1cXG5cXG5mbiBmcmVzbmVsU2NobGljazIoZjA6IHZlYzNmLCBWZG90SDogZjMyKSAtPiB2ZWMzZlxcbntcXG4gIGxldCBmOTAgPSB2ZWMzZigxLjApOyAvL2NsYW1wKDUwLjAgKiBmMCwgMC4wLCAxLjApO1xcbiAgcmV0dXJuIGZyZXNuZWxTY2hsaWNrKGYwLCBmOTAsIFZkb3RIKTtcXG59XFxuXFxuZm4gZnJlc25lbDJGMzIoZjA6IGYzMiwgVmRvdEg6IGYzMikgLT4gZjMyXFxue1xcbiAgbGV0IGY5MCA9IDEuMDsgLy9jbGFtcCg1MC4wICogZjAsIDAuMCwgMS4wKTtcXG4gIHJldHVybiBmcmVzbmVsU2NobGlja0YzMihmMCwgZjkwLCBWZG90SCk7XFxufVxcblxcbi8vIFJvdWdobmVzcyBEZXBlbmRlbnQgRnJlc25lbFxcbi8vIGh0dHBzOi8vd3d3LmpjZ3Qub3JnL3B1Ymxpc2hlZC8wMDA4LzAxLzAzL3BhcGVyLnBkZlxcbmZuIGZyZXNuZWxTY2hsaWNrUm91Z2huZXNzKEYwOiB2ZWMzZiwgY29zVGhldGE6IGYzMiwgcm91Z2huZXNzOiBmMzIpIC0+IHZlYzNmXFxue1xcbiAgbGV0IEZyID0gbWF4KHZlYzNmKDEuMCAtIHJvdWdobmVzcyksIEYwKSAtIEYwO1xcbiAgbGV0IGtfUyA9IEYwICsgRnIgKiBwb3coMS4wIC0gY29zVGhldGEsIDUuMCk7XFxuICByZXR1cm4ga19TO1xcbn1cXG5cXG4vLyBodHRwczovL3d3dy5raHJvbm9zLm9yZy9yZWdpc3RyeS9nbFRGL3NwZWNzLzIuMC9nbFRGLTIuMC5odG1sI2RpZmZ1c2UtYnJkZlxcbmZuIEJSREZfbGFtYmVydGlhbihkaWZmdXNlQWxiZWRvOiB2ZWMzZikgLT4gdmVjM2ZcXG57XFxuICByZXR1cm4gZGlmZnVzZUFsYmVkbyAqIFJFQ0lQUk9DQUxfUEk7XFxufVxcblxcblxcbi8vIEdHWCBOREZcXG5mbiBkX0dHWChOSDogZjMyLCBhbHBoYVJvdWdobmVzczogZjMyKSAtPiBmMzIge1xcbiAgbGV0IHJvdWdobmVzc1NxciA9IGFscGhhUm91Z2huZXNzICogYWxwaGFSb3VnaG5lc3M7XFxuICBsZXQgZiA9IChyb3VnaG5lc3NTcXIgLSAxLjApICogTkggKiBOSCArIDEuMDtcXG4gIHJldHVybiByb3VnaG5lc3NTcXIgLyAoTV9QSSAqIGYgKiBmKTtcXG59XFxuXFxuLy8gVGhlIGNvZGUgZnJvbSBodHRwczovL2dvb2dsZS5naXRodWIuaW8vZmlsYW1lbnQvRmlsYW1lbnQuaHRtbCNsaXN0aW5nX2FwcHJveGltYXRlZHNwZWN1bGFydlxcbi8vIFRoZSBpZGVhIGlzIGZyb20gW0hlaXR6MTRdIEVyaWMgSGVpdHouIDIwMTQuIFVuZGVyc3RhbmRpbmcgdGhlIE1hc2tpbmctU2hhZG93aW5nIEZ1bmN0aW9uIGluIE1pY3JvZmFjZXQtQmFzZWQgQlJERnMuXFxuZm4gdl9HR1hDb3JyZWxhdGVkKE5MOiBmMzIsIE5WOiBmMzIsIGFscGhhUm91Z2huZXNzOiBmMzIpIC0+IGYzMiB7XFxuICBsZXQgYTIgPSBhbHBoYVJvdWdobmVzcyAqIGFscGhhUm91Z2huZXNzO1xcbiAgbGV0IEdHWFYgPSBOTCAqIHNxcnQoTlYgKiBOViAqICgxLjAgLSBhMikgKyBhMik7XFxuICBsZXQgR0dYTCA9IE5WICogc3FydChOTCAqIE5MICogKDEuMCAtIGEyKSArIGEyKTtcXG4gIGxldCBHR1ggPSBHR1hWICsgR0dYTDtcXG4gIGlmIChHR1ggPiAwLjApIHtcXG4gICAgcmV0dXJuIGNsYW1wKDAuNSAvIEdHWCwgMC4wLCAxLjApO1xcbiAgfVxcbiAgcmV0dXJuIDEuMDtcXG59XFxuXFxuZm4gQlJERl9zcGVjdWxhckdHWChOSDogZjMyLCBOTDogZjMyLCBOVjogZjMyLCBhbHBoYVJvdWdobmVzczogZjMyKSAtPiB2ZWMzZiB7XFxuICBsZXQgRCA9IGRfR0dYKE5ILCBhbHBoYVJvdWdobmVzcyk7XFxuICBsZXQgViA9IHZfR0dYQ29ycmVsYXRlZChOTCwgTlYsIGFscGhhUm91Z2huZXNzKTtcXG4gIHJldHVybiB2ZWMzZihEKSAqIHZlYzNmKFYpO1xcbn1cXG5cXG4vLyBWYXJpYW50cyB1c2VkIGJ5IHRoZSBwdW5jdHVhbCBsaWdodCBsb29wOiB0aGUgY2FsbGVyIGhvaXN0cyB0aGUgZnJhZ21lbnQtaW52YXJpYW50IHRlcm1zXFxuLy8gKHJvdWdobmVzc1NxciBhbmQgdGhlIE5kb3RWIHRlcm0gb2Ygdl9HR1hDb3JyZWxhdGVkKSBvdXQgb2YgdGhlIGxvb3AsIHNvIHRoZXkgYXJlIG5vdFxcbi8vIHJlY29tcHV0ZWQgZm9yIGV2ZXJ5IGxpZ2h0LiBUaGUgYXJpdGhtZXRpYyBpcyB0aGUgc2FtZSBhcyBkX0dHWCAvIHZfR0dYQ29ycmVsYXRlZC5cXG5mbiBkX0dHWFdpdGhSb3VnaG5lc3NTcXVhcmVkKE5IOiBmMzIsIHJvdWdobmVzc1NxcjogZjMyKSAtPiBmMzIge1xcbiAgbGV0IGYgPSAocm91Z2huZXNzU3FyIC0gMS4wKSAqIE5IICogTkggKyAxLjA7XFxuICByZXR1cm4gcm91Z2huZXNzU3FyIC8gKE1fUEkgKiBmICogZik7XFxufVxcblxcbmZuIEJSREZfc3BlY3VsYXJHR1hXaXRoVGVybXMoTkg6IGYzMiwgTkw6IGYzMiwgTlY6IGYzMiwgcm91Z2huZXNzU3FyOiBmMzIsIHNxcnROZG90VlRlcm06IGYzMikgLT4gdmVjM2Yge1xcbiAgbGV0IEQgPSBkX0dHWFdpdGhSb3VnaG5lc3NTcXVhcmVkKE5ILCByb3VnaG5lc3NTcXIpO1xcbiAgbGV0IEdHWFYgPSBOTCAqIHNxcnROZG90VlRlcm07XFxuICBsZXQgR0dYTCA9IE5WICogc3FydChOTCAqIE5MICogKDEuMCAtIHJvdWdobmVzc1NxcikgKyByb3VnaG5lc3NTcXIpO1xcbiAgbGV0IEdHWCA9IEdHWFYgKyBHR1hMO1xcbiAgdmFyIFYgPSAxLjA7XFxuICBpZiAoR0dYID4gMC4wKSB7XFxuICAgIFYgPSBjbGFtcCgwLjUgLyBHR1gsIDAuMCwgMS4wKTtcXG4gIH1cXG4gIHJldHVybiB2ZWMzZihEICogVik7XFxufVxcblxcbi8vIHRoaXMgaXMgZnJvbSBodHRwczovL3d3dy51bnJlYWxlbmdpbmUuY29tL2Jsb2cvcGh5c2ljYWxseS1iYXNlZC1zaGFkaW5nLW9uLW1vYmlsZVxcbmZuIGVudkJSREZBcHByb3goIFJvdWdobmVzczogZjMyLCBOb1Y6IGYzMiApIC0+IHZlYzJmIHtcXG4gIGxldCBjMCA9IHZlYzRmKC0xLCAtMC4wMjc1LCAtMC41NzIsIDAuMDIyICk7XFxuICBsZXQgYzEgPSB2ZWM0ZigxLCAwLjA0MjUsIDEuMDQsIC0wLjA0ICk7XFxuICBsZXQgciA9IFJvdWdobmVzcyAqIGMwICsgYzE7XFxuICBsZXQgYTAwNCA9IG1pbiggci54ICogci54LCBleHAyKCAtOS4yOCAqIE5vViApICkgKiByLnggKyByLnk7XFxuICBsZXQgQUIgPSB2ZWMyZiggLTEuMDQsIDEuMDQgKSAqIGEwMDQgKyByLnp3O1xcblxcbiAgcmV0dXJuIEFCO1xcbn1cXG5cXG5cXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYWluL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX21hdGVyaWFsc190cmFuc21pc3Npb24jaW1wbGVtZW50YXRpb24tbm90ZXNcXG5mbiBzcGVjdWxhcl9idGRmKGFscGhhUm91Z2huZXNzOiBmMzIsIE5kb3RMOiBmMzIsIE5kb3RWOiBmMzIsIE5kb3RIdDogZjMyKSAtPiBmMzIge1xcbiAgbGV0IFYgPSB2X0dHWENvcnJlbGF0ZWQoTmRvdEwsIE5kb3RWLCBhbHBoYVJvdWdobmVzcyk7XFxuICBsZXQgRCA9IGRfR0dYKE5kb3RIdCwgYWxwaGFSb3VnaG5lc3MpO1xcbiAgcmV0dXJuIFYgKiBEO1xcbn1cXG5cXG5mbiBJc290cm9waWNOREZGaWx0ZXJpbmcobm9ybWFsOiB2ZWMzZiwgcm91Z2huZXNzMjogZjMyKSAtPiBmMzIge1xcbiAgbGV0IFNJR01BMiA9IDAuMTU5MTU0OTQ7XFxuICBsZXQgS0FQUEEgPSAwLjE4O1xcbiAgbGV0IGRuZHUgID0gZHBkeChub3JtYWwpO1xcbiAgbGV0IGRuZHYgPSBkcGR5KG5vcm1hbCk7XFxuICBsZXQga2VybmVsUm91Z2huZXNzMiA9IFNJR01BMiAqIChkb3QoZG5kdSwgZG5kdSkgKyBkb3QoZG5kdiwgZG5kdikpO1xcbiAgbGV0IGNsYW1wZWRLZXJuZWxSb3VnaG5lc3MyID0gbWluKGtlcm5lbFJvdWdobmVzczIsIEtBUFBBKTtcXG4gIGxldCBmaWx0ZXJlZFJvdWdobmVzczIgPSBzYXR1cmF0ZShyb3VnaG5lc3MyICsgY2xhbXBlZEtlcm5lbFJvdWdobmVzczIpO1xcbiAgcmV0dXJuIGZpbHRlcmVkUm91Z2huZXNzMjtcXG59XFxuXFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xcbi8vIGdsVEYgS0hSX21hdGVyaWFsc190cmFuc21pc3Npb25cXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXFxuXFxuI2lmZGVmIFJOX1VTRV9UUkFOU01JU1NJT05cXG5cXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvYmxvYi9tYWluL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX21hdGVyaWFsc192b2x1bWUvUkVBRE1FLm1kI2F0dGVudWF0aW9uXFxuZm4gdm9sdW1lQXR0ZW51YXRpb24oYXR0ZW51YXRpb25Db2xvcjogdmVjM2YsIGF0dGVudWF0aW9uRGlzdGFuY2U6IGYzMiwgaW50ZW5zaXR5OiB2ZWMzZiwgdHJhbnNtaXNzaW9uRGlzdGFuY2U6IGYzMikgLT4gdmVjM2ZcXG57XFxuICBpZiAoYXR0ZW51YXRpb25EaXN0YW5jZSA9PSAwLjApIHsgLy8gbWVhbnMgSW5maW5pdGUgZGlzdGFuY2VcXG4gICAgcmV0dXJuIGludGVuc2l0eTsgLy8gTm8gYXR0ZW51YXRpb25cXG4gIH0gZWxzZSB7XFxuICAgIC8vIGxldCBhdHRlbnVhdGlvbkNvOiB2ZWMzZiA9IC1sb2coYXR0ZW51YXRpb25Db2xvcikgLyBhdHRlbnVhdGlvbkRpc3RhbmNlO1xcbiAgICAvLyBsZXQgYXR0ZW51YXRlZFRyYW5zbWl0dGFuY2U6IHZlYzNmID0gZXhwKC1hdHRlbnVhdGlvbkNvICogdHJhbnNtaXNzaW9uRGlzdGFuY2UpO1xcbiAgICBsZXQgYXR0ZW51YXRlZFRyYW5zbWl0dGFuY2U6IHZlYzNmID0gcG93KGF0dGVudWF0aW9uQ29sb3IsIHZlYzNmKHRyYW5zbWlzc2lvbkRpc3RhbmNlIC8gYXR0ZW51YXRpb25EaXN0YW5jZSkpO1xcbiAgICByZXR1cm4gaW50ZW5zaXR5ICogYXR0ZW51YXRlZFRyYW5zbWl0dGFuY2U7XFxuICB9XFxufVxcblxcbi8vIGZyb20gZ2xURiBTYW1wbGUgVmlld2VyOiBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYtU2FtcGxlLVZpZXdlclxcbmZuIGdldFZvbHVtZVRyYW5zbWlzc2lvblJheShuOiB2ZWMzZiwgdjogdmVjM2YsIHRoaWNrbmVzczogZjMyLCBpb3I6IGYzMikgLT4gdmVjM2ZcXG57XFxuICBsZXQgcmVmcmFjdGlvblZlY3RvciA9IHJlZnJhY3QoLXYsIG5vcm1hbGl6ZShuKSwgMS4wIC8gaW9yKTtcXG4jaWZkZWYgUk5fUkFZTUFSQ0hJTkdfU0hBRElOR1xcbiAgLy8gVGhlIHJheW1hcmNoaW5nIGRyYXcgaGFzIG5vIHBlci1pbnN0YW5jZSBtZXNoIHRyYW5zZm9ybSwgYW5kIFNERiB0aGlja25lc3MgaXNcXG4gIC8vIGF1dGhvcmVkIGluIHdvcmxkIHVuaXRzLlxcbiAgbGV0IG1vZGVsU2NhbGUgPSB2ZWMzZigxLjApO1xcbiNlbHNlXFxuICBsZXQgd29ybGRNYXRyaXggPSBnZXRfd29ybGRNYXRyaXgoZ19pbnN0YW5jZUlkcy54KTtcXG5cXG4gIHZhciBtb2RlbFNjYWxlOiB2ZWMzZjtcXG4gIG1vZGVsU2NhbGUueCA9IGxlbmd0aCh2ZWMzZih3b3JsZE1hdHJpeFswXS54eXopKTtcXG4gIG1vZGVsU2NhbGUueSA9IGxlbmd0aCh2ZWMzZih3b3JsZE1hdHJpeFsxXS54eXopKTtcXG4gIG1vZGVsU2NhbGUueiA9IGxlbmd0aCh2ZWMzZih3b3JsZE1hdHJpeFsyXS54eXopKTtcXG4jZW5kaWZcXG5cXG4gIHJldHVybiBub3JtYWxpemUocmVmcmFjdGlvblZlY3RvcikgKiB0aGlja25lc3MgKiBtb2RlbFNjYWxlO1xcbn1cXG4jZW5kaWZcXG5cXG5mbiBhcHBseUlvclRvUm91Z2huZXNzKHJvdWdobmVzczogZjMyLCBpb3I6IGYzMikgLT4gZjMyXFxue1xcbiAgICByZXR1cm4gY2xhbXAocm91Z2huZXNzICogY2xhbXAoaW9yICogMi4wIC0gMi4wLCAwLjAsIDEuMCksIGNfTWluUm91Z2huZXNzLCAxLjApO1xcbn1cXG5cXG5mbiBjYWxjdWxhdGVSYWRpYW5jZVRyYW5zbWlzc2lvbihub3JtYWw6IHZlYzNmLCB2aWV3OiB2ZWMzZiwgcG9pbnRUb0xpZ2h0OiB2ZWMzZiwgYWxwaGFSb3VnaG5lc3M6IGYzMiwgYmFzZUNvbG9yOiB2ZWMzZiwgaW9yOiBmMzIpIC0+IHZlYzNmXFxue1xcbiAgICBsZXQgdHJhbnNtaXNzaW9uUm91Z2huZXNzID0gYXBwbHlJb3JUb1JvdWdobmVzcyhhbHBoYVJvdWdobmVzcywgaW9yKTtcXG5cXG4gICAgbGV0IG4gPSBub3JtYWxpemUobm9ybWFsKTtcXG4gICAgbGV0IHYgPSBub3JtYWxpemUodmlldyk7XFxuICAgIGxldCBsID0gbm9ybWFsaXplKHBvaW50VG9MaWdodCk7XFxuICAgIGxldCBtaXJyb3JMID0gbm9ybWFsaXplKGwgKyAyLjAgKiBuICogZG90KC1sLCBuKSk7XFxuICAgIGxldCBoID0gbm9ybWFsaXplKG1pcnJvckwgKyB2KTtcXG5cXG4gICAgbGV0IEQgPSBkX0dHWChjbGFtcChkb3QobiwgaCksIDAuMCwgMS4wKSwgdHJhbnNtaXNzaW9uUm91Z2huZXNzKTtcXG4gICAgbGV0IFYgPSB2X0dHWENvcnJlbGF0ZWQoY2xhbXAoZG90KG4sIG1pcnJvckwpLCAwLjAsIDEuMCksIGNsYW1wKGRvdChuLCB2KSwgMC4wLCAxLjApLCB0cmFuc21pc3Npb25Sb3VnaG5lc3MpO1xcblxcbiAgICByZXR1cm4gYmFzZUNvbG9yICogRCAqIFY7XFxufVxcblxcblxcblxcblxcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cXG4vLyBnbFRGIEtIUl9tYXRlcmlhbHNfYW5pc290cm9weVxcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cXG4jaWZkZWYgUk5fVVNFX0FOSVNPVFJPUFlcXG4vLyBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYWluL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX21hdGVyaWFsc19hbmlzb3Ryb3B5XFxuZm4gRF9HR1hfYW5pc290cm9waWMoTmRvdEg6IGYzMiwgVGRvdEg6IGYzMiwgQmRvdEg6IGYzMiwgYXQ6IGYzMiwgYWI6IGYzMikgLT4gZjMyXFxue1xcbiAgICBsZXQgYTIgPSBhdCAqIGFiO1xcbiAgICBsZXQgZiA9IHZlYzNmKGFiICogVGRvdEgsIGF0ICogQmRvdEgsIGEyICogTmRvdEgpO1xcbiAgICBsZXQgdzIgPSBhMiAvIGRvdChmLCBmKTtcXG4gICAgcmV0dXJuIGEyICogdzIgKiB3MiAvIE1fUEk7XFxufVxcblxcbmZuIFZfR0dYX2FuaXNvdHJvcGljKE5kb3RMOiBmMzIsIE5kb3RWOiBmMzIsIEJkb3RWOiBmMzIsIFRkb3RWOiBmMzIsIFRkb3RMOiBmMzIsIEJkb3RMOiBmMzIsXFxuICAgIGF0OiBmMzIsIGFiOiBmMzIpIC0+IGYzMlxcbntcXG4gICAgbGV0IEdHWFYgPSBOZG90TCAqIGxlbmd0aCh2ZWMzKGF0ICogVGRvdFYsIGFiICogQmRvdFYsIE5kb3RWKSk7XFxuICAgIGxldCBHR1hMID0gTmRvdFYgKiBsZW5ndGgodmVjMyhhdCAqIFRkb3RMLCBhYiAqIEJkb3RMLCBOZG90TCkpO1xcbiAgICBsZXQgR0dYID0gR0dYViArIEdHWEw7XFxuICAgIGlmIChHR1ggPiAwLjApIHtcXG4gICAgICByZXR1cm4gY2xhbXAoMC41IC8gR0dYLCAwLjAsIDEuMCk7XFxuICAgIH1cXG4gICAgcmV0dXJuIDEuMDtcXG59XFxuXFxuZm4gQlJERl9zcGVjdWxhckFuaXNvdHJvcGljR0dYKGFscGhhUm91Z2huZXNzOiBmMzIsXFxuICAgIFZkb3RIOiBmMzIsIE5kb3RMOiBmMzIsIE5kb3RWOiBmMzIsIE5kb3RIOiBmMzIsIEJkb3RWOiBmMzIsIFRkb3RWOiBmMzIsXFxuICAgIFRkb3RMOiBmMzIsIEJkb3RMOiBmMzIsIFRkb3RIOiBmMzIsIEJkb3RIOiBmMzIsIGFuaXNvdHJvcHk6IGYzMikgLT4gdmVjM2ZcXG57XFxuICAgIGxldCBhdCA9IG1peChhbHBoYVJvdWdobmVzcywgMS4wLCBhbmlzb3Ryb3B5ICogYW5pc290cm9weSk7XFxuICAgIGxldCBhYiA9IGNsYW1wKGFscGhhUm91Z2huZXNzLCAwLjAwMSwgMS4wKTtcXG5cXG4gICAgbGV0IFYgPSBWX0dHWF9hbmlzb3Ryb3BpYyhOZG90TCwgTmRvdFYsIEJkb3RWLCBUZG90ViwgVGRvdEwsIEJkb3RMLCBhdCwgYWIpO1xcbiAgICBsZXQgRCA9IERfR0dYX2FuaXNvdHJvcGljKE5kb3RILCBUZG90SCwgQmRvdEgsIGF0LCBhYik7XFxuXFxuICAgIHJldHVybiB2ZWMzZihWICogRCk7XFxufVxcbiNlbmRpZlxcblxcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cXG4vLyBnbFRGIEtIUl9tYXRlcmlhbHNfc2hlZW5cXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXFxuXFxuI2lmZGVmIFJOX1VTRV9TSEVFTlxcbmZuIGRfQ2hhcmxpZShzaGVlblBlcmNlcHR1YWxSb3VnaG5lc3M6IGYzMiwgTm9IOiBmMzIpIC0+IGYzMiB7XFxuICAvLyBFc3RldmV6IGFuZCBLdWxsYSAyMDE3LCBcXFwiUHJvZHVjdGlvbiBGcmllbmRseSBNaWNyb2ZhY2V0IFNoZWVuIEJSREZcXFwiXFxuICBsZXQgc2hlZW5Sb3VnaG5lc3MgPSBtYXgoc2hlZW5QZXJjZXB0dWFsUm91Z2huZXNzLCAwLjAwMDAwMSk7XFxuICBsZXQgYWxwaGFHID0gc2hlZW5Sb3VnaG5lc3MgKiBzaGVlblJvdWdobmVzcztcXG4gIGxldCBpbnZBbHBoYSAgPSAxLjAgLyBhbHBoYUc7XFxuICBsZXQgY29zMmggPSBOb0ggKiBOb0g7XFxuICBsZXQgc2luMmggPSAxLjAgLSBjb3MyaDtcXG4gIHJldHVybiAoMi4wICsgaW52QWxwaGEpICogcG93KHNpbjJoLCBpbnZBbHBoYSAqIDAuNSkgLyAoMi4wICogTV9QSSk7XFxufVxcblxcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21haW4vZXh0ZW5zaW9ucy8yLjAvS2hyb25vcy9LSFJfbWF0ZXJpYWxzX3NoZWVuI3NoZWVuLXZpc2liaWxpdHlcXG5mbiBzaGVlblNpbXBsZVZpc2liaWxpdHkoTmRvdEw6IGYzMiwgTmRvdFY6IGYzMikgLT4gZjMyIHtcXG4gIHJldHVybiAxLjAgLyAoNC4wICogKE5kb3RMICsgTmRvdFYgLSBOZG90TCAqIE5kb3RWKSk7XFxufVxcblxcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21haW4vZXh0ZW5zaW9ucy8yLjAvS2hyb25vcy9LSFJfbWF0ZXJpYWxzX3NoZWVuI3NoZWVuLXZpc2liaWxpdHlcXG5mbiBjaGFybGllTCh4OiBmMzIsIGFscGhhRzogZjMyKSAtPiBmMzIge1xcbiAgbGV0IG9uZU1pbnVzQWxwaGFTcSA9ICgxLjAgLSBhbHBoYUcpICogKDEuMCAtIGFscGhhRyk7XFxuICBsZXQgYSA9IG1peCgyMS41NDczLCAyNS4zMjQ1LCBvbmVNaW51c0FscGhhU3EpO1xcbiAgbGV0IGIgPSBtaXgoMy44Mjk4NywgMy4zMjQzNSwgb25lTWludXNBbHBoYVNxKTtcXG4gIGxldCBjID0gbWl4KDAuMTk4MjMsIDAuMTY4MDEsIG9uZU1pbnVzQWxwaGFTcSk7XFxuICBsZXQgZCA9IG1peCgtMS45Nzc2MCwgLTEuMjczOTMsIG9uZU1pbnVzQWxwaGFTcSk7XFxuICBsZXQgZSA9IG1peCgtNC4zMjA1NCwgLTQuODU5NjcsIG9uZU1pbnVzQWxwaGFTcSk7XFxuICByZXR1cm4gYSAvICgxLjAgKyBiICogcG93KHgsIGMpKSArIGQgKiB4ICsgZTtcXG59XFxuXFxuZm4gbGFtYmRhU2hlZW4oY29zVGhldGE6IGYzMiwgYWxwaGFHOiBmMzIpIC0+IGYzMlxcbntcXG4gIHJldHVybiBzZWxlY3QoZXhwKDIuMCAqIGNoYXJsaWVMKDAuNSwgYWxwaGFHKSAtIGNoYXJsaWVMKDEuMCAtIGNvc1RoZXRhLCBhbHBoYUcpKSwgZXhwKGNoYXJsaWVMKGNvc1RoZXRhLCBhbHBoYUcpKSwgYWJzKGNvc1RoZXRhKSA8IDAuNSk7XFxufVxcblxcbmZuIHNoZWVuQ2hhcmxpZVZpc2liaWxpdHkoTmRvdEw6IGYzMiwgTmRvdFY6IGYzMiwgc2hlZW5QZXJjZXB0dWFsUm91Z2huZXNzOiBmMzIpIC0+IGYzMiB7XFxuICBsZXQgc2hlZW5Sb3VnaG5lc3MgPSBtYXgoc2hlZW5QZXJjZXB0dWFsUm91Z2huZXNzLCAwLjAwMDAwMSk7XFxuICBsZXQgYWxwaGFHID0gc2hlZW5Sb3VnaG5lc3MgKiBzaGVlblJvdWdobmVzcztcXG4gIGxldCBzaGVlblZpc2liaWxpdHkgPSBjbGFtcCgxLjAgLyAoKDEuMCArIGxhbWJkYVNoZWVuKE5kb3RWLCBhbHBoYUcpICsgbGFtYmRhU2hlZW4oTmRvdEwsIGFscGhhRykpICogKDQuMCAqIE5kb3RWICogTmRvdEwpKSwgMC4wLCAxLjApO1xcbiAgcmV0dXJuIHNoZWVuVmlzaWJpbGl0eTtcXG59XFxuXFxuZm4gQlJERl9zcGVjdWxhclNoZWVuKHNoZWVuQ29sb3I6IHZlYzNmLCBzaGVlblBlcmNlcHR1YWxSb3VnaG5lc3M6IGYzMiwgTmRvdEw6IGYzMiwgTmRvdFY6IGYzMiwgTmRvdEg6IGYzMikgLT4gdmVjM2Yge1xcbiAgbGV0IHNoZWVuRGlzdHJpYnV0aW9uID0gZF9DaGFybGllKHNoZWVuUGVyY2VwdHVhbFJvdWdobmVzcywgTmRvdEgpO1xcbiAgbGV0IHNoZWVuVmlzaWJpbGl0eSA9IHNoZWVuQ2hhcmxpZVZpc2liaWxpdHkoTmRvdEwsIE5kb3RWLCBzaGVlblBlcmNlcHR1YWxSb3VnaG5lc3MpO1xcbiAgcmV0dXJuIHNoZWVuQ29sb3IgKiBzaGVlbkRpc3RyaWJ1dGlvbiAqIHNoZWVuVmlzaWJpbGl0eTtcXG59XFxuI2VuZGlmIC8vIFJOX1VTRV9TSEVFTlxcblxcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cXG4vLyBnbFRGIEtIUl9tYXRlcmlhbHNfaXJpcmRlc2NlbmNlXFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xcblxcbiNpZmRlZiBSTl9VU0VfSVJJREVTQ0VOQ0VcXG4vLyBYWVogdG8gUkVDNzA5KHNSR0IpIGNvbnZlcnNpb24gbWF0cml4XFxuY29uc3QgWFlaX1RPX1JFQzcwOSA9IG1hdDN4MzxmMzI+KFxcbiAgICAgMy4yNDA0NTQyLCAtMC45NjkyNjYwLCAgMC4wNTU2NDM0LFxcbiAgICAtMS41MzcxMzg1LCAgMS44NzYwMTA4LCAtMC4yMDQwMjU5LFxcbiAgICAtMC40OTg1MzE0LCAgMC4wNDE1NTYwLCAgMS4wNTcyMjUyXFxuKTtcXG5cXG5mbiBmcmVzbmVsU2NobGlja1JvdWdobmVzc1dpdGhJcmlkZXNjZW5jZShcXG4gIEYwOiB2ZWMzZiwgY29zVGhldGE6IGYzMiwgcm91Z2huZXNzOiBmMzIsXFxuICBpcmlkZXNjZW5jZUZyZXNuZWw6IHZlYzNmLCBpcmlkZXNjZW5jZTogZjMyXFxuICApIC0+IHZlYzNmXFxue1xcbiAgbGV0IEZyID0gbWF4KHZlYzNmKDEuMCAtIHJvdWdobmVzcyksIEYwKSAtIEYwO1xcbiAgbGV0IGtfUyA9IG1peChGMCArIEZyICogcG93KDEuMCAtIGNvc1RoZXRhLCA1LjApLCBpcmlkZXNjZW5jZUZyZXNuZWwsIGlyaWRlc2NlbmNlKTtcXG4gIHJldHVybiBrX1M7XFxufVxcblxcbi8vIEFzc3VtZSBhaXIgaW50ZXJmYWNlIGZvciB0b3BcXG5mbiBGcmVzbmVsMFRvSW9yKEYwOiB2ZWMzZikgLT4gdmVjM2Yge1xcbiAgICBsZXQgc3FydEYwID0gc3FydChGMCk7XFxuICAgIHJldHVybiAodmVjMygxLjApICsgc3FydEYwKSAvICh2ZWMzKDEuMCkgLSBzcXJ0RjApO1xcbn1cXG5cXG4vLyBDb252ZXJzaW9uIGZyb20gSU9SIHRvIEYwXFxuLy8gaW9yIGlzIGEgdmFsdWUgYmV0d2VlbiAxLjAgYW5kIDMuMC4gMS4wIGlzIGFpciBpbnRlcmZhY2VcXG5mbiBJb3JUb0ZyZXNuZWwwVmVjM2YodHJhbnNtaXR0ZWRJb3I6IHZlYzNmLCBpbmNpZGVudElvcjogZjMyKSAtPiB2ZWMzZiB7XFxuICAgIHJldHVybiBzcVZlYzNmKCh0cmFuc21pdHRlZElvciAtIHZlYzNmKGluY2lkZW50SW9yKSkgLyAodHJhbnNtaXR0ZWRJb3IgKyB2ZWMzKGluY2lkZW50SW9yKSkpO1xcbn1cXG5mbiBJb3JUb0ZyZXNuZWwwRjMyKHRyYW5zbWl0dGVkSW9yOiBmMzIsIGluY2lkZW50SW9yOiBmMzIpIC0+IGYzMiB7XFxuICAgIHJldHVybiBzcUYzMigodHJhbnNtaXR0ZWRJb3IgLSBpbmNpZGVudElvcikgLyAodHJhbnNtaXR0ZWRJb3IgKyBpbmNpZGVudElvcikpO1xcbn1cXG5cXG4vKipcXG4gKiBGcm9tOiBodHRwczovL2dpdGh1Yi5jb20vS2hyb25vc0dyb3VwL2dsVEYvdHJlZS9tYWluL2V4dGVuc2lvbnMvMi4wL0tocm9ub3MvS0hSX21hdGVyaWFsc19pcmlkZXNjZW5jZSNhbmFseXRpYy1zcGVjdHJhbC1pbnRlZ3JhdGlvblxcbiAqL1xcbmZuIGV2YWxTZW5zaXRpdml0eShPUEQ6IGYzMiwgc2hpZnQ6IHZlYzNmKSAtPiB2ZWMzZiB7XFxuICAgIGxldCBwaGFzZSA9IDIuMCAqIE1fUEkgKiBPUEQgKiAxLjBlLTk7XFxuICAgIGxldCB2YWwgPSB2ZWMzZig1LjQ4NTZlLTEzLCA0LjQyMDFlLTEzLCA1LjI0ODFlLTEzKTtcXG4gICAgbGV0IHBvcyA9IHZlYzNmKDEuNjgxMGUrMDYsIDEuNzk1M2UrMDYsIDIuMjA4NGUrMDYpO1xcbiAgICBsZXQgdmFyXyA9IHZlYzNmKDQuMzI3OGUrMDksIDkuMzA0NmUrMDksIDYuNjEyMWUrMDkpO1xcblxcbiAgICB2YXIgeHl6ID0gdmFsICogc3FydCgyLjAgKiBNX1BJICogdmFyXykgKiBjb3MocG9zICogcGhhc2UgKyBzaGlmdCkgKiBleHAoLShwaGFzZSAqIHBoYXNlKSAqIHZhcl8pO1xcbiAgICB4eXoueCArPSA5Ljc0NzBlLTE0ICogc3FydCgyLjAgKiBNX1BJICogNC41MjgyZSswOSkgKiBjb3MoMi4yMzk5ZSswNiAqIHBoYXNlICsgc2hpZnRbMF0pICogZXhwKC00LjUyODJlKzA5ICogKHBoYXNlICogcGhhc2UpKTtcXG4gICAgeHl6IC89IDEuMDY4NWUtNztcXG5cXG4gICAgbGV0IHJnYiA9IFhZWl9UT19SRUM3MDkgKiB4eXo7XFxuICAgIHJldHVybiByZ2I7XFxufVxcblxcbi8qKlxcbiAqIEZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9LaHJvbm9zR3JvdXAvZ2xURi90cmVlL21haW4vZXh0ZW5zaW9ucy8yLjAvS2hyb25vcy9LSFJfbWF0ZXJpYWxzX2lyaWRlc2NlbmNlI2lyaWRlc2NlbmNlLWZyZXNuZWxcXG4gKi9cXG5mbiBjYWxjSXJpZGVzY2VuY2Uob3V0c2lkZUlvcjogZjMyLCBldGEyOiBmMzIsIGNvc1RoZXRhMTogZjMyLCB0aGluRmlsbVRoaWNrbmVzczogZjMyLCBiYXNlRjA6IHZlYzNmKSAtPiB2ZWMzZiB7XFxuXFxuXFxuICAvLyBpcmlkZXNjZW5jZUlvciBpcyB0aGUgaW5kZXggb2YgcmVmcmFjdGlvbiBvZiB0aGUgdGhpbi1maWxtIGxheWVyXFxuICAvLyBGb3JjZSBpcmlkZXNjZW5jZUlvciAtPiBvdXRzaWRlSU9SIHdoZW4gdGhpbkZpbG1UaGlja25lc3MgLT4gMC4wXFxuICBsZXQgaXJpZGVzY2VuY2VJb3IgPSBtaXgob3V0c2lkZUlvciwgZXRhMiwgc21vb3Roc3RlcCgwLjAsIDAuMDMsIHRoaW5GaWxtVGhpY2tuZXNzKSk7XFxuXFxuICAvLyBUbyBjYWxjdWxhdGUgdGhlIHJlZmxlY3RhbmNlcyBSMTIgYW5kIFIyMyBhdCB0aGUgdmlld2luZyBhbmdsZXMgKGFuZ2xlIGhpdHRpbmcgdGhlIHRoaW4tZmlsbSBsYXllcilcXG4gIC8vIGFuZCAoYW5nbGUgYWZ0ZXIgcmVmcmFjdGlvbiBpbiB0aGUgdGhpbi1maWxtKSBTY2hsaWNrIEZyZXNuZWwgaXMgYWdhaW4gdXNlZC5cXG4gIC8vIFRoaXMgYXBwcm94aW1hdGlvbiBhbGxvd3MgdG8gZWxpbWluYXRlIHRoZSBzcGxpdCBpbnRvIFMgYW5kIFAgcG9sYXJpemF0aW9uIGZvciB0aGUgZXhhY3QgRnJlc25lbCBlcXVhdGlvbnMuXFxuICAvLyBjYW4gYmUgY2FsY3VsYXRlZCB1c2luZyBTbmVsbCdzIGxhdyAod2l0aCAgYmVpbmcgb3V0c2lkZUlvciBhbmQgYmVpbmcgaXJpZGVzY2VuY2VJb3IpOlxcbiAgbGV0IHNpblRoZXRhMlNxID0gc3FGMzIob3V0c2lkZUlvciAvIGlyaWRlc2NlbmNlSW9yKSAqICgxLjAgLSBzcUYzMihjb3NUaGV0YTEpKTtcXG4gIGxldCBjb3NUaGV0YTJTcSA9IDEuMCAtIHNpblRoZXRhMlNxO1xcblxcbiAgLy8gSGFuZGxlIHRvdGFsIGludGVybmFsIHJlZmxlY3Rpb25cXG4gIGlmIChjb3NUaGV0YTJTcSA8IDAuMCkge1xcbiAgICAgIHJldHVybiB2ZWMzZigxLjApO1xcbiAgfVxcblxcbiAgbGV0IGNvc1RoZXRhMiA9IHNxcnQoY29zVGhldGEyU3EpO1xcblxcbiAgLy8vIE1hdGVyaWFsIEludGVyZmFjZXNcXG4gIC8vIFRoZSBpcmlkZXNjZW5jZSBtb2RlbCBkZWZpbmVkIGJ5IEJlbGNvdXIvQmFybGEgbW9kZWxzIHR3byBtYXRlcmlhbCBpbnRlcmZhY2VzXFxuICAvLyAtIG9uZSBmcm9tIHRoZSBvdXRzaWRlIHRvIHRoZSB0aGluLWZpbG0gbGF5ZXJcXG4gIC8vIGFuZCBhbm90aGVyIG9uZSBmcm9tIHRoZSB0aGluLWZpbG0gdG8gdGhlIGJhc2UgbWF0ZXJpYWwuIFRoZXNlIHR3byBpbnRlcmZhY2VzIGFyZSBkZWZpbmVkIGFzIGZvbGxvd3M6XFxuXFxuICAvLyBGaXJzdCBpbnRlcmZhY2UgKGZyb20gdGhlIG91dHNpZGUgdG8gdGhlIHRoaW4tZmlsbSBsYXllcilcXG4gIGxldCBSMCA9IElvclRvRnJlc25lbDBGMzIoaXJpZGVzY2VuY2VJb3IsIG91dHNpZGVJb3IpO1xcbiAgbGV0IFIxMiA9IGZyZXNuZWwyRjMyKFIwLCBjb3NUaGV0YTEpO1xcbiAgbGV0IFIyMSA9IFIxMjtcXG4gIGxldCBUMTIxID0gMS4wIC0gUjEyO1xcblxcbiAgLy8gU2Vjb25kIGludGVyZmFjZSAoZnJvbSB0aGUgdGhpbi1maWxtIHRvIHRoZSBiYXNlIG1hdGVyaWFsKVxcbiAgbGV0IGJhc2VJb3IgPSBGcmVzbmVsMFRvSW9yKGJhc2VGMCArIDAuMDAwMSk7IC8vIGd1YXJkIGFnYWluc3QgMS4wXFxuICBsZXQgUjEgPSBJb3JUb0ZyZXNuZWwwVmVjM2YoYmFzZUlvciwgaXJpZGVzY2VuY2VJb3IpO1xcbiAgbGV0IFIyMyA9IGZyZXNuZWxTY2hsaWNrMihSMSwgY29zVGhldGEyKTtcXG5cXG4gIC8vIHBoaTEyIGFuZCBwaGkyMyBkZWZpbmUgdGhlIGJhc2UgcGhhc2VzIHBlciBpbnRlcmZhY2UgYW5kIGFyZSBhcHByb3hpbWF0ZWQgd2l0aCAwLjBcXG4gIC8vIGlmIHRoZSBJT1Igb2YgdGhlIGhpdCBtYXRlcmlhbCAoaXJpZGVzY2VuY2VJb3Igb3IgYmFzZUlvcikgaXMgaGlnaGVyXFxuICAvLyB0aGFuIHRoZSBJT1Igb2YgdGhlIHByZXZpb3VzIG1hdGVyaWFsIChvdXRzaWRlSW9yIG9yIGlyaWRlc2NlbmNlSW9yKSBhbmQgXHUwM0MwIG90aGVyd2lzZS5cXG4gIC8vIEFsc28gaGVyZSwgcG9sYXJpemF0aW9uIGlzIGlnbm9yZWQuICBmbG9hdCBwaGkxMiA9IDAuMDtcXG5cXG4gIC8vIEZpcnN0IGludGVyZmFjZSAoZnJvbSB0aGUgb3V0c2lkZSB0byB0aGUgdGhpbi1maWxtIGxheWVyKVxcbiAgdmFyIHBoaTEyID0gMC4wO1xcbiAgaWYgKGlyaWRlc2NlbmNlSW9yIDwgb3V0c2lkZUlvcikgeyBwaGkxMiA9IE1fUEk7IH1cXG4gIGxldCBwaGkyMSA9IE1fUEkgLSBwaGkxMjtcXG5cXG4gIC8vIFNlY29uZCBpbnRlcmZhY2UgKGZyb20gdGhlIHRoaW4tZmlsbSB0byB0aGUgYmFzZSBtYXRlcmlhbClcXG4gIHZhciBwaGkyMyA9IHZlYzNmKDAuMCk7XFxuICBpZiAoYmFzZUlvclswXSA8IGlyaWRlc2NlbmNlSW9yKSB7IHBoaTIzWzBdID0gTV9QSTsgfVxcbiAgaWYgKGJhc2VJb3JbMV0gPCBpcmlkZXNjZW5jZUlvcikgeyBwaGkyM1sxXSA9IE1fUEk7IH1cXG4gIGlmIChiYXNlSW9yWzJdIDwgaXJpZGVzY2VuY2VJb3IpIHsgcGhpMjNbMl0gPSBNX1BJOyB9XFxuXFxuICAvLyBPUEQgKG9wdGljYWwgcGF0aCBkaWZmZXJlbmNlKVxcbiAgbGV0IE9QRCA9IDIuMCAqIGlyaWRlc2NlbmNlSW9yICogdGhpbkZpbG1UaGlja25lc3MgKiBjb3NUaGV0YTI7XFxuICAvLyBQaGFzZSBzaGlmdFxcbiAgbGV0IHBoaSA9IHZlYzNmKHBoaTIxKSArIHBoaTIzO1xcblxcbiAgLy8gQ29tcG91bmQgdGVybXNcXG4gIGxldCBSMTIzID0gY2xhbXAoUjEyICogUjIzLCB2ZWMzZigxZS01KSwgdmVjM2YoMC45OTk5KSk7XFxuICBsZXQgcjEyMyA9IHNxcnQoUjEyMyk7XFxuICBsZXQgUnMgPSAoVDEyMSAqIFQxMjEpICogUjIzIC8gKHZlYzNmKDEuMCkgLSBSMTIzKTtcXG5cXG4gIC8vIFJlZmxlY3RhbmNlIHRlcm0gZm9yIG0gPSAwIChEQyB0ZXJtIGFtcGxpdHVkZSlcXG4gIGxldCBDMCA9IFIxMiArIFJzO1xcbiAgdmFyIEkgPSBDMDtcXG5cXG4gIC8vIFJlZmxlY3RhbmNlIHRlcm0gZm9yIG0gPiAwIChwYWlycyBvZiBkaXJhY3MpXFxuICB2YXIgQ20gPSBScyAtIFQxMjE7XFxuICBmb3IgKHZhciBtID0gMTsgbSA8PSAyOyBtKyspXFxuICB7XFxuICAgICAgQ20gKj0gcjEyMztcXG4gICAgICBsZXQgU20gPSAyLjAgKiBldmFsU2Vuc2l0aXZpdHkoZjMyKG0pICogT1BELCBmMzIobSkgKiBwaGkpO1xcbiAgICAgIEkgKz0gQ20gKiBTbTtcXG4gIH1cXG5cXG4gIGxldCBGX2lyaWRlc2NlbmNlID0gbWF4KEksIHZlYzNmKDAuMCkpO1xcblxcbiAgcmV0dXJuIEZfaXJpZGVzY2VuY2U7XFxufVxcblxcbi8vaHR0cHM6Ly9naXRodWIuY29tL0tocm9ub3NHcm91cC9nbFRGL3RyZWUvbWFzdGVyL3NwZWNpZmljYXRpb24vMi4wI2Fja25vd2xlZGdtZW50cyBBcHBlbmRpeEJcXG5mbiBCUkRGX2xhbWJlcnRpYW5JcmlkZXNjZW5jZShmMDogdmVjM2YsIGY5MDogdmVjM2YsIGlyaWRlc2NlbmNlRnJlc25lbDogdmVjM2YsIGlyaWRlc2NlbmNlRmFjdG9yOiBmMzIsIGRpZmZ1c2VDb2xvcjogdmVjM2YsIHNwZWN1bGFyV2VpZ2h0OiBmMzIsIFZkb3RIOiBmMzIpIC0+IHZlYzNmXFxue1xcbiAgICBsZXQgaXJpZGVzY2VuY2VGcmVzbmVsTWF4ID0gdmVjM2YobWF4KG1heChpcmlkZXNjZW5jZUZyZXNuZWwuciwgaXJpZGVzY2VuY2VGcmVzbmVsLmcpLCBpcmlkZXNjZW5jZUZyZXNuZWwuYikpO1xcblxcbiAgICBsZXQgc2NobGlja0ZyZXNuZWwgPSBTY2hsaWNrX3RvX0YwX0Y5MChmMCwgZjkwLCBWZG90SCk7XFxuXFxuICAgIGxldCBGID0gbWl4KHNjaGxpY2tGcmVzbmVsLCBpcmlkZXNjZW5jZUZyZXNuZWxNYXgsIGlyaWRlc2NlbmNlRmFjdG9yKTtcXG5cXG4gICAgLy8gc2VlIGh0dHBzOi8vc2VibGFnYXJkZS53b3JkcHJlc3MuY29tLzIwMTIvMDEvMDgvcGktb3Itbm90LXRvLXBpLWluLWdhbWUtbGlnaHRpbmctZXF1YXRpb24vXFxuICAgIHJldHVybiAoMS4wIC0gc3BlY3VsYXJXZWlnaHQgKiBGKSAqIChkaWZmdXNlQ29sb3IgLyBNX1BJKTtcXG59XFxuXFxuZm4gQlJERl9zcGVjdWxhckdHWElyaWRlc2NlbmNlKGYwOiB2ZWMzZiwgZjkwOiB2ZWMzZiwgaXJpZGVzY2VuY2VGcmVzbmVsOiB2ZWMzZiwgYWxwaGFSb3VnaG5lc3M6IGYzMiwgaXJpZGVzY2VuY2VGYWN0b3I6IGYzMiwgc3BlY3VsYXJXZWlnaHQ6IGYzMiwgVmRvdEg6IGYzMiwgTmRvdEw6IGYzMiwgTmRvdFY6IGYzMiwgTmRvdEg6IGYzMikgLT4gdmVjM2ZcXG57XFxuICAgIGxldCBGID0gbWl4KFNjaGxpY2tfdG9fRjBfRjkwKGYwLCBmOTAsIFZkb3RIKSwgaXJpZGVzY2VuY2VGcmVzbmVsLCBpcmlkZXNjZW5jZUZhY3Rvcik7XFxuICAgIGxldCBWaXMgPSB2X0dHWENvcnJlbGF0ZWQoTmRvdEwsIE5kb3RWLCBhbHBoYVJvdWdobmVzcyk7XFxuICAgIGxldCBEID0gZF9HR1goTmRvdEgsIGFscGhhUm91Z2huZXNzKTtcXG5cXG4gICAgcmV0dXJuIHNwZWN1bGFyV2VpZ2h0ICogRiAqIFZpcyAqIEQ7XFxufVxcblxcbmZuIHJnYl9taXgoYmFzZTogdmVjM2YsIHNwZWN1bGFyX2JyZGY6IHZlYzNmLCByZ2JfYWxwaGE6IHZlYzNmKSAtPiB2ZWMzZlxcbntcXG4gICAgbGV0IHJnYl9hbHBoYV9tYXggPSBtYXgocmdiX2FscGhhLnIsIG1heChyZ2JfYWxwaGEuZywgcmdiX2FscGhhLmIpKTtcXG4gICAgcmV0dXJuICgxLjAgLSByZ2JfYWxwaGFfbWF4KSAqIGJhc2UgKyByZ2JfYWxwaGEgKiBzcGVjdWxhcl9icmRmO1xcbn1cXG5cXG4jZW5kaWYgLy8gUk5fVVNFX0lSSURFU0NFTkNFXFxuXFxuc3RydWN0IE9jY2x1c2lvblByb3BzXFxue1xcbiAgb2NjbHVzaW9uVGV4dHVyZTogdmVjNDxmMzI+LFxcbiAgb2NjbHVzaW9uU3RyZW5ndGg6IGYzMixcXG59O1xcblxcbnN0cnVjdCBFbWlzc2l2ZVByb3BzXFxue1xcbiAgZW1pc3NpdmU6IHZlYzNmLFxcbiAgZW1pc3NpdmVTdHJlbmd0aDogZjMyLFxcbn07XFxuXFxuc3RydWN0IENsZWFyY29hdFByb3BzXFxue1xcbiAgY2xlYXJjb2F0OiBmMzIsXFxuICBjbGVhcmNvYXRSb3VnaG5lc3M6IGYzMixcXG4gIGNsZWFyY29hdEYwOiB2ZWMzZixcXG4gIGNsZWFyY29hdEY5MDogdmVjM2YsXFxuICBjbGVhcmNvYXRGcmVzbmVsOiB2ZWMzZixcXG4gIGNsZWFyY29hdE5vcm1hbF9pblRhbmdlbnQ6IHZlYzNmLFxcbiAgY2xlYXJjb2F0Tm9ybWFsX2luV29ybGQ6IHZlYzNmLFxcbiAgVmRvdE5jOiBmMzIsXFxufTtcXG5cXG5zdHJ1Y3QgU2hlZW5Qcm9wc1xcbntcXG4gIHNoZWVuQ29sb3I6IHZlYzNmLFxcbiAgc2hlZW5Sb3VnaG5lc3M6IGYzMixcXG4gIGFsYmVkb1NoZWVuU2NhbGluZ05kb3RWOiBmMzIsXFxufTtcXG5cXG5zdHJ1Y3QgSXJpZGVzY2VuY2VQcm9wc1xcbntcXG4gIGlyaWRlc2NlbmNlOiBmMzIsXFxuICBpcmlkZXNjZW5jZUlvcjogZjMyLFxcbiAgaXJpZGVzY2VuY2VUaGlja25lc3M6IGYzMixcXG4gIGZyZXNuZWxEaWVsZWN0cmljOiB2ZWMzZixcXG4gIGZyZXNuZWxNZXRhbDogdmVjM2YsXFxufTtcXG5cXG5zdHJ1Y3QgQW5pc290cm9weVByb3BzXFxue1xcbiAgYW5pc290cm9weTogZjMyLFxcbiAgYW5pc290cm9waWNUOiB2ZWMzZixcXG4gIGFuaXNvdHJvcGljQjogdmVjM2YsXFxuICBCZG90VjogZjMyLFxcbiAgVGRvdFY6IGYzMixcXG4gIGRpcmVjdGlvbjogdmVjMmYsXFxufTtcXG5cXG5zdHJ1Y3QgVm9sdW1lUHJvcHNcXG57XFxuICB0aGlja25lc3M6IGYzMixcXG4gIGF0dGVudWF0aW9uQ29sb3I6IHZlYzNmLFxcbiAgYXR0ZW51YXRpb25EaXN0YW5jZTogZjMyLFxcbn07XFxuXFxuc3RydWN0IERpZmZ1c2VUcmFuc21pc3Npb25Qcm9wc1xcbntcXG4gIGRpZmZ1c2VUcmFuc21pc3Npb246IGYzMixcXG4gIGRpZmZ1c2VUcmFuc21pc3Npb25Db2xvcjogdmVjM2YsXFxuICBkaWZmdXNlVHJhbnNtaXNzaW9uVGhpY2tuZXNzOiBmMzIsXFxufTtcXG5cXG5zdHJ1Y3QgU3BlY3VsYXJQcm9wc1xcbntcXG4gIHNwZWN1bGFyV2VpZ2h0OiBmMzIsXFxuICBzcGVjdWxhckNvbG9yOiB2ZWMzZixcXG59O1xcblxcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cXG4vLyBsaWdodGluZyB3aXRoIGEgcHVuY3R1YWwgbGlnaHRcXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXFxuZm4gbGlnaHRpbmdXaXRoUHVuY3R1YWxMaWdodChcXG4gIGxpZ2h0XzogTGlnaHQsXFxuICBub3JtYWxfaW5Xb3JsZDogdmVjM2YsXFxuICB2aWV3RGlyZWN0aW9uOiB2ZWMzZixcXG4gIE5kb3RWOiBmMzIsXFxuICBiYXNlQ29sb3I6IHZlYzNmLFxcbiAgYWxwaGFSb3VnaG5lc3M6IGYzMixcXG4gIGFscGhhUm91Z2huZXNzMjogZjMyLFxcbiAgc3FydE5kb3RWVGVybTogZjMyLFxcbiAgZGlmZnVzZUJyZGY6IHZlYzNmLFxcbiAgbWV0YWxsaWM6IGYzMixcXG4gIHNwZWN1bGFyV2VpZ2h0OiBmMzIsXFxuICBkaWVsZWN0cmljRjA6IHZlYzNmLFxcbiAgZGllbGVjdHJpY0Y5MDogdmVjM2YsXFxuICBpb3I6IGYzMixcXG4gIHRyYW5zbWlzc2lvbjogZjMyLFxcbiAgdm9sdW1lUHJvcHM6IFZvbHVtZVByb3BzLFxcbiAgY2xlYXJjb2F0UHJvcHM6IENsZWFyY29hdFByb3BzLFxcbiAgYW5pc290cm9weVByb3BzOiBBbmlzb3Ryb3B5UHJvcHMsXFxuICBzaGVlblByb3BzOiBTaGVlblByb3BzLFxcbiAgaXJpZGVzY2VuY2VQcm9wczogSXJpZGVzY2VuY2VQcm9wcyxcXG4gIGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wczogRGlmZnVzZVRyYW5zbWlzc2lvblByb3BzXFxuICApIC0+IHZlYzNmXFxue1xcbiAgdmFyIGxpZ2h0ID0gbGlnaHRfO1xcblxcbiAgLy8gRnJlc25lbFxcbiAgbGV0IGhhbGZWZWN0b3IgPSBub3JtYWxpemUobGlnaHQuZGlyZWN0aW9uICsgdmlld0RpcmVjdGlvbik7XFxuICBsZXQgVmRvdEggPSBzYXR1cmF0ZShkb3Qodmlld0RpcmVjdGlvbiwgaGFsZlZlY3RvcikpO1xcbiAgLy8gQm90aCBTY2hsaWNrIHRlcm1zIHNoYXJlIHRoZSBzYW1lIHBvbHlub21pYWwgaW4gVmRvdEguXFxuICBsZXQgc2NobGlja1ggPSBjbGFtcCgxLjAgLSBWZG90SCwgMC4wLCAxLjApO1xcbiAgbGV0IHNjaGxpY2tYMiA9IHNjaGxpY2tYICogc2NobGlja1g7XFxuICBsZXQgc2NobGlja1g1ID0gc2NobGlja1ggKiBzY2hsaWNrWDIgKiBzY2hsaWNrWDI7XFxuICB2YXIgZGllbGVjdHJpY0ZyZXNuZWwgPSBkaWVsZWN0cmljRjAgKyAoZGllbGVjdHJpY0Y5MCAtIGRpZWxlY3RyaWNGMCkgKiBzY2hsaWNrWDU7XFxuICBsZXQgbWV0YWxGcmVzbmVsID0gYmFzZUNvbG9yICsgKHZlYzNmKDEuMCkgLSBiYXNlQ29sb3IpICogc2NobGlja1g1O1xcblxcbiAgbGV0IE5kb3RMID0gc2F0dXJhdGVFcHNpbG9uVG9PbmUoZG90KG5vcm1hbF9pbldvcmxkLCBsaWdodC5kaXJlY3Rpb24pKTtcXG5cXG4gIC8vIERpZmZ1c2VcXG4gIHZhciBkaWZmdXNlQ29udHJpYiA9IGRpZmZ1c2VCcmRmICogdmVjM2YoTmRvdEwpICogbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eTtcXG5cXG4jaWZkZWYgUk5fVVNFX0RJRkZVU0VfVFJBTlNNSVNTSU9OXFxuICBkaWZmdXNlQ29udHJpYiA9IGRpZmZ1c2VDb250cmliICogKHZlYzNmKDEuMCkgLSBkaWZmdXNlVHJhbnNtaXNzaW9uUHJvcHMuZGlmZnVzZVRyYW5zbWlzc2lvbik7XFxuICBpZiAoZG90KG5vcm1hbF9pbldvcmxkLCBsaWdodC5kaXJlY3Rpb24pIDwgMC4wKSB7XFxuICAgIGxldCBkaWZmdXNlTmRvdEwgPSBzYXR1cmF0ZShkb3Qobm9ybWFsX2luV29ybGQsIC1saWdodC5kaXJlY3Rpb24pKTtcXG4gICAgdmFyIGRpZmZ1c2VCdGRmID0gQlJERl9sYW1iZXJ0aWFuKGRpZmZ1c2VUcmFuc21pc3Npb25Qcm9wcy5kaWZmdXNlVHJhbnNtaXNzaW9uQ29sb3IpICogdmVjM2YoZGlmZnVzZU5kb3RMKSAqIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHk7XFxuICAgIGxldCBtaXJyb3JMID0gbm9ybWFsaXplKGxpZ2h0LmRpcmVjdGlvbiArIDIuMCAqIG5vcm1hbF9pbldvcmxkICogZG90KG5vcm1hbF9pbldvcmxkLCAtbGlnaHQuZGlyZWN0aW9uKSk7XFxuICAgIGxldCBkaWZmdXNlVmRvdEggPSBzYXR1cmF0ZShkb3Qodmlld0RpcmVjdGlvbiwgbm9ybWFsaXplKG1pcnJvckwgKyB2aWV3RGlyZWN0aW9uKSkpO1xcbiAgICBkaWVsZWN0cmljRnJlc25lbCA9IGZyZXNuZWxTY2hsaWNrKGRpZWxlY3RyaWNGMCAqIHNwZWN1bGFyV2VpZ2h0LCBkaWVsZWN0cmljRjkwLCBhYnMoZGlmZnVzZVZkb3RIKSk7XFxuI2lmZGVmIFJOX1VTRV9WT0xVTUVcXG4gICAgZGlmZnVzZUJ0ZGYgPSB2b2x1bWVBdHRlbnVhdGlvbih2b2x1bWVQcm9wcy5hdHRlbnVhdGlvbkNvbG9yLCB2b2x1bWVQcm9wcy5hdHRlbnVhdGlvbkRpc3RhbmNlLCBkaWZmdXNlQnRkZiwgZGlmZnVzZVRyYW5zbWlzc2lvblByb3BzLmRpZmZ1c2VUcmFuc21pc3Npb25UaGlja25lc3MpO1xcbiNlbmRpZiAvLyBSTl9VU0VfVk9MVU1FXFxuICAgIGRpZmZ1c2VDb250cmliICs9IGRpZmZ1c2VCdGRmICogZGlmZnVzZVRyYW5zbWlzc2lvblByb3BzLmRpZmZ1c2VUcmFuc21pc3Npb247XFxuICB9XFxuI2VuZGlmIC8vIFJOX1VTRV9ESUZGVVNFX1RSQU5TTUlTU0lPTlxcblxcbiNpZmRlZiBSTl9VU0VfVFJBTlNNSVNTSU9OXFxuICBsZXQgdHJhbnNtaXR0aW9uUmF5ID0gZ2V0Vm9sdW1lVHJhbnNtaXNzaW9uUmF5KG5vcm1hbF9pbldvcmxkLCB2aWV3RGlyZWN0aW9uLCB2b2x1bWVQcm9wcy50aGlja25lc3MsIGlvcik7XFxuICBsaWdodC5wb2ludFRvTGlnaHQgLT0gdHJhbnNtaXR0aW9uUmF5O1xcbiAgbGlnaHQuZGlyZWN0aW9uID0gbm9ybWFsaXplKGxpZ2h0LnBvaW50VG9MaWdodCk7XFxuICB2YXIgdHJhbnNtaXR0ZWRDb250cmliID0gY2FsY3VsYXRlUmFkaWFuY2VUcmFuc21pc3Npb24obm9ybWFsX2luV29ybGQsIHZpZXdEaXJlY3Rpb24sIGxpZ2h0LmRpcmVjdGlvbiwgYWxwaGFSb3VnaG5lc3MsIGJhc2VDb2xvciwgaW9yKSAqIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHk7XFxuXFxuI2lmZGVmIFJOX1VTRV9WT0xVTUVcXG4gIHRyYW5zbWl0dGVkQ29udHJpYiA9IHZvbHVtZUF0dGVudWF0aW9uKHZvbHVtZVByb3BzLmF0dGVudWF0aW9uQ29sb3IsIHZvbHVtZVByb3BzLmF0dGVudWF0aW9uRGlzdGFuY2UsIHRyYW5zbWl0dGVkQ29udHJpYiwgbGVuZ3RoKHRyYW5zbWl0dGlvblJheSkpO1xcbiNlbmRpZiAvLyBSTl9VU0VfVk9MVU1FXFxuXFxuICBkaWZmdXNlQ29udHJpYiA9IG1peChkaWZmdXNlQ29udHJpYiwgdmVjM2YodHJhbnNtaXR0ZWRDb250cmliKSwgdHJhbnNtaXNzaW9uKTtcXG4jZW5kaWYgLy8gUk5fVVNFX1RSQU5TTUlTU0lPTlxcblxcbiAgLy8gU3BlY3VsYXJcXG4gIGxldCBOZG90SCA9IHNhdHVyYXRlKGRvdChub3JtYWxfaW5Xb3JsZCwgaGFsZlZlY3RvcikpO1xcblxcbiNpZmRlZiBSTl9VU0VfQU5JU09UUk9QWVxcbiAgbGV0IFRkb3RMID0gZG90KGFuaXNvdHJvcHlQcm9wcy5hbmlzb3Ryb3BpY1QsIGxpZ2h0LmRpcmVjdGlvbik7XFxuICBsZXQgQmRvdEwgPSBkb3QoYW5pc290cm9weVByb3BzLmFuaXNvdHJvcGljQiwgbGlnaHQuZGlyZWN0aW9uKTtcXG4gIGxldCBUZG90SCA9IGRvdChhbmlzb3Ryb3B5UHJvcHMuYW5pc290cm9waWNULCBoYWxmVmVjdG9yKTtcXG4gIGxldCBCZG90SCA9IGRvdChhbmlzb3Ryb3B5UHJvcHMuYW5pc290cm9waWNCLCBoYWxmVmVjdG9yKTtcXG4gIGxldCBzcGVjdWxhck1ldGFsQ29udHJpYiA9IEJSREZfc3BlY3VsYXJBbmlzb3Ryb3BpY0dHWChhbHBoYVJvdWdobmVzcywgVmRvdEgsIE5kb3RMLCBOZG90ViwgTmRvdEgsIGFuaXNvdHJvcHlQcm9wcy5CZG90ViwgYW5pc290cm9weVByb3BzLlRkb3RWLCBUZG90TCwgQmRvdEwsIFRkb3RILCBCZG90SCwgYW5pc290cm9weVByb3BzLmFuaXNvdHJvcHkpICogdmVjM2YoTmRvdEwpICogbGlnaHQuYXR0ZW51YXRlZEludGVuc2l0eTtcXG4gIGxldCBzcGVjdWxhckRpZWxlY3RyaWNDb250cmliID0gc3BlY3VsYXJNZXRhbENvbnRyaWI7XFxuI2Vsc2VcXG4gIGxldCBzcGVjdWxhck1ldGFsQ29udHJpYiA9IEJSREZfc3BlY3VsYXJHR1hXaXRoVGVybXMoTmRvdEgsIE5kb3RMLCBOZG90ViwgYWxwaGFSb3VnaG5lc3MyLCBzcXJ0TmRvdFZUZXJtKSAqIHZlYzNmKE5kb3RMKSAqIGxpZ2h0LmF0dGVudWF0ZWRJbnRlbnNpdHk7XFxuICBsZXQgc3BlY3VsYXJEaWVsZWN0cmljQ29udHJpYiA9IHNwZWN1bGFyTWV0YWxDb250cmliO1xcbiNlbmRpZlxcblxcbiAgLy8gQmFzZSBMYXllclxcbiAgdmFyIG1ldGFsID0gc3BlY3VsYXJNZXRhbENvbnRyaWIgKiBtZXRhbEZyZXNuZWw7XFxuICB2YXIgZGllbGVjdHJpYyA9IG1peChkaWZmdXNlQ29udHJpYiwgc3BlY3VsYXJEaWVsZWN0cmljQ29udHJpYiwgZGllbGVjdHJpY0ZyZXNuZWwpO1xcblxcbiNpZmRlZiBSTl9VU0VfSVJJREVTQ0VOQ0VcXG4gIG1ldGFsID0gbWl4KG1ldGFsLCBzcGVjdWxhck1ldGFsQ29udHJpYiAqIGlyaWRlc2NlbmNlUHJvcHMuZnJlc25lbE1ldGFsLCBpcmlkZXNjZW5jZVByb3BzLmlyaWRlc2NlbmNlKTtcXG4gIGRpZWxlY3RyaWMgPSBtaXgoZGllbGVjdHJpYywgcmdiX21peChkaWZmdXNlQ29udHJpYiwgc3BlY3VsYXJEaWVsZWN0cmljQ29udHJpYiwgaXJpZGVzY2VuY2VQcm9wcy5mcmVzbmVsRGllbGVjdHJpYyksIGlyaWRlc2NlbmNlUHJvcHMuaXJpZGVzY2VuY2UpO1xcbiNlbmRpZiAvLyBSTl9VU0VfSVJJREVTQ0VOQ0VcXG5cXG4jaWZkZWYgUk5fVVNFX0NMRUFSQ09BVFxcbiAgLy8gQ2xlYXIgQ29hdCBMYXllclxcbiAgbGV0IE5kb3RIYyA9IHNhdHVyYXRlKGRvdChjbGVhcmNvYXRQcm9wcy5jbGVhcmNvYXROb3JtYWxfaW5Xb3JsZCwgaGFsZlZlY3RvcikpO1xcbiAgbGV0IExkb3ROYyA9IHNhdHVyYXRlKGRvdChsaWdodC5kaXJlY3Rpb24sIGNsZWFyY29hdFByb3BzLmNsZWFyY29hdE5vcm1hbF9pbldvcmxkKSk7XFxuICBsZXQgY2xlYXJjb2F0Q29udHJpYiA9IEJSREZfc3BlY3VsYXJHR1goTmRvdEhjLCBMZG90TmMsIGNsZWFyY29hdFByb3BzLlZkb3ROYywgY2xlYXJjb2F0UHJvcHMuY2xlYXJjb2F0Um91Z2huZXNzICogY2xlYXJjb2F0UHJvcHMuY2xlYXJjb2F0Um91Z2huZXNzKSAqIHZlYzNmKExkb3ROYykgKiBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5O1xcbiNlbHNlXFxuICBsZXQgY2xlYXJjb2F0Q29udHJpYiA9IHZlYzNmKDAuMCk7XFxuI2VuZGlmIC8vIFJOX1VTRV9DTEVBUkNPQVRcXG5cXG4jaWZkZWYgUk5fVVNFX1NIRUVOXFxuICAvLyBTaGVlblxcbiAgbGV0IHNoZWVuQ29udHJpYiA9IEJSREZfc3BlY3VsYXJTaGVlbihzaGVlblByb3BzLnNoZWVuQ29sb3IsIHNoZWVuUHJvcHMuc2hlZW5Sb3VnaG5lc3MsIE5kb3RMLCBOZG90ViwgTmRvdEgpICogTmRvdEwgKiBsaWdodC5hdHRlbnVhdGVkSW50ZW5zaXR5O1xcbiAgLy8gVGhpcyBydW5zIGluIHRoZSBsaWdodCBsb29wLCB3aG9zZSB0cmlwIGNvdW50IGlzIG5vdCB1bmlmb3JtIHdpdGggQ2x1c3RlcmVkIEZvcndhcmQgcmVuZGVyaW5nLFxcbiAgLy8gc28gdGhlIExVVCAod2hpY2ggaGFzIG5vIG1pcG1hcHMpIGlzIHNhbXBsZWQgd2l0aCBhbiBleHBsaWNpdCBsZXZlbC5cXG4gIGxldCBhbGJlZG9TaGVlblNjYWxpbmcgPSBtaW4oXFxuICAgIHNoZWVuUHJvcHMuYWxiZWRvU2hlZW5TY2FsaW5nTmRvdFYsXFxuICAgIDEuMCAtIG1heDMoc2hlZW5Qcm9wcy5zaGVlbkNvbG9yKSAqIHRleHR1cmVTYW1wbGVMZXZlbChzaGVlbkx1dFRleHR1cmUsIHNoZWVuTHV0U2FtcGxlciwgdmVjMihOZG90TCwgc2hlZW5Qcm9wcy5zaGVlblJvdWdobmVzcyksIDAuMCkucik7XFxuI2Vsc2VcXG4gIGxldCBzaGVlbkNvbnRyaWIgPSB2ZWMzZigwLjApO1xcbiAgbGV0IGFsYmVkb1NoZWVuU2NhbGluZyA9IDEuMDtcXG4jZW5kaWYgLy8gUk5fVVNFX1NIRUVOXFxuXFxuICB2YXIgY29sb3IgPSBtaXgoZGllbGVjdHJpYywgbWV0YWwsIG1ldGFsbGljKTtcXG4gIGNvbG9yID0gc2hlZW5Db250cmliICsgY29sb3IgKiBhbGJlZG9TaGVlblNjYWxpbmc7XFxuICBjb2xvciA9IG1peChjb2xvciwgY2xlYXJjb2F0Q29udHJpYiwgY2xlYXJjb2F0UHJvcHMuY2xlYXJjb2F0ICogY2xlYXJjb2F0UHJvcHMuY2xlYXJjb2F0RnJlc25lbCk7XFxuXFxuICByZXR1cm4gY29sb3I7XFxufVxcblxcbiNlbmRpZiAvLyBSTl9VU0VfUEJSXFxuXCIsXCJzaGFkZXJTdGFnZVwiOlwiZnJhZ21lbnRcIixcImlzRnJhZ21lbnRTaGFkZXJcIjp0cnVlfSJdLAogICJtYXBwaW5ncyI6ICI7QUFBQyxXQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQW1neEIsa0JBQWM7QUFBVyx1QkFBbUI7QUFBdmp4Qiw4QkFBQyxNQUEwZ3hCLGFBQXlCLGlCQUF1QjsiLAogICJuYW1lcyI6IFtdCn0K
