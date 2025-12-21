// This file includes portions of code from the glTF-Sample-Renderer project by Khronos Group (Apache License 2.0).
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
  let worldMatrix = get_worldMatrix(g_instanceIds.x);

  var modelScale: vec3f;
  modelScale.x = length(vec3f(worldMatrix[0].xyz));
  modelScale.y = length(vec3f(worldMatrix[1].xyz));
  modelScale.z = length(vec3f(worldMatrix[2].xyz));

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
  // than the IOR of the previous material (outsideIor or iridescenceIor) and π otherwise.
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
  attenuationColor: vec3f,
  attenuationDistance: f32,
  thickness: f32,
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
  perceptualRoughness: f32,
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
  let alphaRoughness = perceptualRoughness * perceptualRoughness;

  // Fresnel
  let halfVector = normalize(light.direction + viewDirection);
  let VdotH = saturate(dot(viewDirection, halfVector));
  var dielectricFresnel = fresnelSchlick(dielectricF0, dielectricF90, VdotH);
  let metalFresnel = fresnelSchlick(baseColor, vec3f(1.0), VdotH);

  let NdotL = saturateEpsilonToOne(dot(normal_inWorld, light.direction));

  // Diffuse
  let diffuseBrdf = BRDF_lambertian(baseColor);
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
  let specularMetalContrib = BRDF_specularGGX(NdotH, NdotL, NdotV, alphaRoughness) * vec3f(NdotL) * light.attenuatedIntensity;
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
  let albedoSheenScaling = min(
    sheenProps.albedoSheenScalingNdotV,
    1.0 - max3(sheenProps.sheenColor) * textureSample(sheenLutTexture, sheenLutSampler, vec2(NdotL, sheenProps.sheenRoughness)).r);
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
