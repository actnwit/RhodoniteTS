fn srgbToLinear(srgbColor: vec3f) -> vec3f {
  return pow(srgbColor, vec3f(2.2));
}

fn linearToSrgb(linearColor: vec3f) -> vec3f {
  return pow(linearColor, vec3f(1.0/2.2));
}

// The Schlick Approximation to Fresnel
fn fresnel(f0 : vec3f, f90 : vec3f, VdotH : f32) -> vec3f {
    let x = clamp(1.0 - VdotH, 0.0, 1.0);
    let x2 = x * x;
    let x5 = x * x2 * x2;
    return f0 + (f90 - f0) * x5;
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
fn diffuse_brdf(albedo: vec3f) -> vec3f
{
  // (1/pi) * diffuseAlbedo
  return RECIPROCAL_PI * albedo;
}


// GGX NDF
fn d_GGX(NH: f32, alphaRoughness: f32) -> f32 {
  let roughnessSqr = alphaRoughness * alphaRoughness;
  let f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (M_PI * f * f);
}

// The code from https://google.github.io/filament/Filament.html#listing_approximatedspecularv
// The idea is from [Heitz14] Eric Heitz. 2014. Understanding the Masking-Shadowing Function in Microfacet-Based BRDFs.
fn v_SmithGGXCorrelated(NL: f32, NV: f32, alphaRoughness: f32) -> f32 {
  let a2 = alphaRoughness * alphaRoughness;
  let GGXV = NL * sqrt(NV * NV * (1.0 - a2) + a2);
  let GGXL = NV * sqrt(NL * NL * (1.0 - a2) + a2);
  return 0.5 / (GGXV + GGXL);
}

fn BRDF_specularGGX(NH: f32, NL: f32, NV: f32, F: vec3f, alphaRoughness: f32) -> vec3f {
  let D = d_GGX(NH, alphaRoughness);
  let V = v_SmithGGXCorrelated(NL, NV, alphaRoughness);
  return vec3f(D)*vec3f(V)*F;
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


// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat#layering
fn coated_material_s(base: vec3f, perceptualRoughness: f32, clearcoatRoughness: f32, clearcoat: f32, VdotNc: f32, LdotNc: f32, NdotHc: f32) -> vec3f {
  let clearcoatFresnel = 0.04 + (1.0 - 0.04) * pow(1.0 - abs(VdotNc), 5.0);
  let clearcoatAlpha = clearcoatRoughness * clearcoatRoughness;
  let alphaRoughness = perceptualRoughness * perceptualRoughness;
  let D = d_GGX(NdotHc, clearcoatAlpha);
  let V = v_SmithGGXCorrelated(LdotNc, VdotNc, clearcoatAlpha);
  let f_clearcoat = clearcoatFresnel * D * V;

  // base = (f_diffuse + f_specular) in https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_clearcoat#layering
  return base * vec3f(1.0 - clearcoat * clearcoatFresnel) + vec3f(f_clearcoat * clearcoat);
}

// https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_transmission#implementation-notes
fn specular_btdf(alphaRoughness: f32, NdotL: f32, NdotV: f32, NdotHt: f32) -> f32 {
  let V = v_SmithGGXCorrelated(NdotL, NdotV, alphaRoughness);
  let D = d_GGX(NdotHt, alphaRoughness);
  return V * D;
}


////////////////////////////////////////
// glTF KHR_materials_volume
////////////////////////////////////////

#ifdef RN_USE_VOLUME
// https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md#attenuation
fn volumeAttenuation(attenuationColor: vec3f, attenuationDistance: f32, intensity: vec3f, transmissionDistance: f32) -> vec3f
{
  if (attenuationDistance == 0.0) { // means Infinite distance
    return intensity; // No attenuation
  } else {
    let attenuationCo: vec3f = -log(attenuationColor) / attenuationDistance;
    let attenuatedTransmittance: vec3f = exp(-attenuationCo * transmissionDistance);
    return intensity * attenuatedTransmittance;
  }
}
#endif

////////////////////////////////////////
// glTF KHR_materials_sheen
////////////////////////////////////////

#ifdef RN_USE_SHEEN
fn d_Charlie(sheenPerceptualRoughness: f32, NoH: f32) -> f32 {
  // Estevez and Kulla 2017, "Production Friendly Microfacet Sheen BRDF"
  let alphaG = sheenPerceptualRoughness * sheenPerceptualRoughness;
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
  let alphaG = sheenPerceptualRoughness * sheenPerceptualRoughness;
  let sheenVisibility = 1.0 / ((1.0 + lambdaSheen(NdotV, alphaG) + lambdaSheen(NdotL, alphaG)) * (4.0 * NdotV * NdotL));
  return sheenVisibility;
}

fn sheen_brdf(sheenColor: vec3f, sheenPerceptualRoughness: f32, NdotL: f32, NdotV: f32, NdotH: f32) -> vec3f {
  let sheenDistribution = d_Charlie(sheenPerceptualRoughness, NdotH);
  let sheenVisibility = sheenCharlieVisibility(NdotL, NdotV, sheenPerceptualRoughness);
  return sheenColor * sheenDistribution * sheenVisibility;
}
#endif


////////////////////////////////////////
// glTF BRDF for punctual lights
////////////////////////////////////////
fn gltfBRDF(
  light: Light,
  normal_inWorld: vec3f,
  viewDirection: vec3f,
  NdotV: f32,
  albedo: vec3f,
  perceptualRoughness: f32,
  F0: vec3f,
  F90: vec3f,
  transmission: f32,
  ior: f32,
  clearcoat: f32,
  clearcoatRoughness: f32,
  clearcoatNormal_inWorld: vec3f,
  VdotNc: f32,
  attenuationColor: vec3f,
  attenuationDistance: f32,
  sheenColor: vec3f,
  sheenRoughness: f32,
  albedoSheenScalingNdotV: f32
  ) -> vec3f
{
  let alphaRoughness = perceptualRoughness * perceptualRoughness;

  // Fresnel
  let halfVector = normalize(light.direction + viewDirection);
  let VdotH = dot(viewDirection, halfVector);
  let F = fresnel(F0, F90, VdotH);

  let NdotL = clamp(dot(normal_inWorld, light.direction), Epsilon, 1.0);

  // Diffuse
  let diffuseBrdf = diffuse_brdf(albedo);
  let pureDiffuse = (vec3f(1.0) - F) * diffuseBrdf * vec3f(NdotL) * light.attenuatedIntensity;

#ifdef RN_USE_TRANSMISSION
  let refractionVector = refract(-viewDirection, normal_inWorld, 1.0 / ior);
  var transmittedLightFromUnderSurface: Light = light;
  transmittedLightFromUnderSurface.pointToLight -= refractionVector;
  let transmittedLightDirectionFromUnderSurface = normalize(transmittedLightFromUnderSurface.pointToLight);
  transmittedLightFromUnderSurface.direction = transmittedLightDirectionFromUnderSurface;

  let Ht = normalize(viewDirection + transmittedLightFromUnderSurface.direction);
  let NdotHt = saturateEpsilonToOne(dot(normal_inWorld, Ht));
  let NdotLt = saturateEpsilonToOne(dot(normal_inWorld, transmittedLightFromUnderSurface.direction));

  var transmittedContrib = (vec3f(1.0) - F) * specular_btdf(alphaRoughness, NdotLt, NdotV, NdotHt) * albedo * transmittedLightFromUnderSurface.attenuatedIntensity;

#ifdef RN_USE_VOLUME
  transmittedContrib = volumeAttenuation(attenuationColor, attenuationDistance, transmittedContrib, length(transmittedLightFromUnderSurface.pointToLight));
#endif // RN_USE_VOLUME

  let diffuseContrib = mix(pureDiffuse, vec3f(transmittedContrib), transmission);
#else
  let diffuseContrib = pureDiffuse;
#endif // RN_USE_TRANSMISSION

  // Specular
  let NdotH = clamp(dot(normal_inWorld, halfVector), Epsilon, 1.0);
  let specularContrib = BRDF_specularGGX(NdotH, NdotL, NdotV, F, alphaRoughness) * vec3f(NdotL) * light.attenuatedIntensity;

  // Base Layer
  let baseLayer = diffuseContrib + specularContrib;

#ifdef RN_USE_SHEEN
  // Sheen
  let sheenContrib = sheen_brdf(sheenColor, sheenRoughness, NdotL, NdotV, NdotH) * NdotL * light.attenuatedIntensity;
  let albedoSheenScaling = min(
    albedoSheenScalingNdotV,
    1.0 - max3(sheenColor) * textureSample(sheenLutTexture, sheenLutSampler, vec2(NdotL, sheenRoughness)).r);
  let color = sheenContrib + baseLayer * albedoSheenScaling;
#else
  let color = baseLayer;
  let albedoSheenScaling = 1.0;
#endif // RN_USE_SHEEN

#ifdef RN_USE_CLEARCOAT
  // Clear Coat Layer
  let NdotHc = saturateEpsilonToOne(dot(clearcoatNormal_inWorld, halfVector));
  let LdotNc = saturateEpsilonToOne(dot(light.direction, clearcoatNormal_inWorld));
  let coated = coated_material_s(color, perceptualRoughness,
    clearcoatRoughness, clearcoat, VdotNc, LdotNc, NdotHc);
  let finalColor = coated;
#else
  let finalColor = color;
#endif // RN_USE_CLEARCOAT

  return finalColor;
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
