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

  let diffuseContrib = pureDiffuse;

  // Specular
  let NdotH = clamp(dot(normal_inWorld, halfVector), Epsilon, 1.0);
  let specularContrib = BRDF_specularGGX(NdotH, NdotL, NdotV, F, alphaRoughness) * vec3(NdotL) * light.attenuatedIntensity;

  // Base Layer
  let baseLayer = diffuseContrib + specularContrib;
  let color = baseLayer;
  let finalColor = color;

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
