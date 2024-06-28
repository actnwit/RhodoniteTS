#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord_0;

uniform sampler2D u_baseColorTexture; // initialValue=(0,white)
uniform bool u_enableLinearToSrgb; // initialValue=true

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/correspondenceBetweenLinearAndSrgb.glsl)


#ifdef RN_USE_KHRONOS_PBR_NEUTRAL
// Input color is non-negative and resides in the Linear Rec. 709 color space.
// Output color is also Linear Rec. 709, but in the [0, 1] range.
// See: https://github.com/KhronosGroup/ToneMapping/tree/main/PBR_Neutral
vec3 PBRNeutralToneMapping( vec3 color ) {
  const float startCompression = 0.8 - 0.04;
  const float desaturation = 0.15;

  float x = min(color.r, min(color.g, color.b));
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;

  float peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) return color;

  const float d = 1. - startCompression;
  float newPeak = 1. - d * d / (peak + d - startCompression);
  color *= newPeak / peak;

  float g = 1. - 1. / (desaturation * (peak - newPeak) + 1.);
  return mix(color, newPeak * vec3(1, 1, 1), g);
}
#endif

#ifdef RN_USE_REINHARD
vec3 ReinhardToneMapping( vec3 color ) {
  return color / (vec3(1.0) + color);
}
#endif

#ifdef RN_USE_ACES_NARKOWICZ
// ACES tone map (faster approximation)
// see: https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
vec3 ACES_Narkowicz_ToneMapping(vec3 color)
{
    const float A = 2.51;
    const float B = 0.03;
    const float C = 2.43;
    const float D = 0.59;
    const float E = 0.14;
    return clamp((color * (A * color + B)) / (color * (C * color + D) + E), 0.0, 1.0);
}
#endif

#ifdef RN_USE_GT_TONEMAP
float W_f(float x, float e0, float e1) {
  return smoothstep(e0, e1, x);
}
float H_f(float x, float e0, float e1) {
  if (x <= e0)
    return 0.;
  if (x >= e1)
    return 1.;
  return (x - e0) / (e1 - e0);
}

const float e = 2.71828;

float GT_ToneMaping(float x) {
  float P = 1.; // peak luminance
  float a = 1.; // contrast parameter
  float m = 0.22; // beginning of the linear part
  float l = 0.4; // length of the linear part
  float c = 1.33; // parameter of black color
  float b = 0.; // parameter of black color
  float l0 = (P - m) * l / a;
  float T_x = m * pow(x / m, c) + b;
  float L_x = m + a * (x - m);
  float S0 = m + l0;
  float S1 = m + a * l0;
  float C2 = a * P / (P - S1);
  float S_x = P - (P - S1) * pow(e, -(C2 * (x - S0) / P));
  float w0_x = 1. - W_f(x, 0., m);
  float w2_x = H_f(x, m + l0, m + l0);
  float w1_x = 1. - w0_x - w2_x;
  float f_x = T_x * w0_x + L_x * w1_x + S_x * w2_x;
  return f_x;
}
#endif

void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

vec4 baseColor = texture(u_baseColorTexture, v_texcoord_0);

// Apply Tone Mapping
#ifdef RN_USE_KHRONOS_PBR_NEUTRAL
baseColor.rgb = PBRNeutralToneMapping(baseColor.rgb);
#endif

#ifdef RN_USE_REINHARD
baseColor.rgb = ReinhardToneMapping(baseColor.rgb);
#endif

#ifdef RN_USE_ACES_NARKOWICZ
baseColor.rgb = ACES_Narkowicz_ToneMapping(baseColor.rgb);
#endif

#ifdef RN_USE_GT_TONEMAP
baseColor.r = GT_ToneMaping(baseColor.r);
baseColor.g = GT_ToneMaping(baseColor.g);
baseColor.b = GT_ToneMaping(baseColor.b);
#endif


// Convert linear color to sRGB color space.
if (get_enableLinearToSrgb(materialSID, 0)) {
  baseColor.rgb = linearToSrgb(baseColor.rgb);
}

rt0 = baseColor;

#pragma shaderity: require(../common/glFragColor.glsl)

}
