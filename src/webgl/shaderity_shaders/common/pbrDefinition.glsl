const float M_PI = 3.141592653589793;
const float c_MinRoughness = 0.04;

float angular_n_h(float NH) {
  return acos(NH);
}

float sqr(float x) {
  return x*x;
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
float d_ggx(float NH, float alphaRoughness) {
  float roughnessSqr = alphaRoughness * alphaRoughness;
  float f = (roughnessSqr - 1.0) * NH * NH + 1.0;
  return roughnessSqr / (M_PI * f * f);
}

float d_torrance_reiz(float NH, float c3) {
  float CosSquared = NH*NH;
  float TanSquared = (1.0 - CosSquared)/CosSquared;
  //return (1.0/M_PI) * sqr(c3/(CosSquared * (c3*c3 + TanSquared)));  // gamma = 2, aka GGX
  return (1.0/sqrt(M_PI)) * (sqr(c3)/(CosSquared * (c3*c3 + TanSquared))); // gamma = 1, D_Berry
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
float v_SmithGGXCorrelated(float NL, float NV, float alphaRoughness) {
  float a2 = alphaRoughness * alphaRoughness;
  float GGXV = NL * sqrt(NV * NV * (1.0 - a2) + a2);
  float GGXL = NV * sqrt(NL * NL * (1.0 - a2) + a2);
  return 0.5 / (GGXV + GGXL);
}

float v_SmithGGXCorrelatedFast(float NL, float NV, float alphaRoughness) {
  float a = alphaRoughness;
  float GGXV = NL * (NV * (1.0 - a) + a);
  float GGXL = NV * (NL * (1.0 - a) + a);
  return 0.5 / (GGXV + GGXL);
}

// The Schlick Approximation to Fresnel
vec3 fresnel(vec3 f0, float VH) {
  return vec3(f0) + (vec3(1.0) - f0) * pow(1.0 - VH, 5.0);
}

vec3 cook_torrance_specular_brdf(float NH, float NL, float NV, vec3 F, float alphaRoughness) {
  float D = d_ggx(NH, alphaRoughness);
  float V = v_SmithGGXCorrelated(NL, NV, alphaRoughness);
  return vec3(D)*vec3(V)*F;
//      float G = g_shielding(NL, NV, alphaRoughness);
//      return vec3(D)*vec3(G)*F/vec3(4.0*NL*NV);

}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#diffuse-brdf
vec3 diffuse_brdf(vec3 albedo)
{
  // (1/pi) * diffuseAlbedo
  return albedo / M_PI;
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#specular-brdf
float specular_brdf(float alphaRoughness, float NdotL, float NdotV, float NdotH) {
  float V = v_SmithGGXCorrelated(NdotL, NdotV, alphaRoughness);
  float D = d_ggx(NdotH, alphaRoughness);
  return V * D;
}

// https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#fresnel
vec3 conductor_fresnel(vec3 f0, float brdf, float alphaRoughness, float VdotH) {
  return vec3(brdf) * (f0.rgb + (vec3(1.0) - f0.rgb) * vec3(pow(1.0 - abs(VdotH), 5.0)));
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
  return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - cosTheta, 5.0);
}

vec3 normalBlendingUDN(sampler2D baseMap, sampler2D detailMap, vec2 baseUv, vec2 detailUv) {
  vec3 t = texture2D(baseMap,   baseUv).xyz * 2.0 - 1.0;
  vec3 u = texture2D(detailMap, detailUv).xyz * 2.0 - 1.0;
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
