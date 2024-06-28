/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

// #param enableLinearToSrgb: bool; // initialValue=true

#pragma shaderity: require(../common/correspondenceBetweenLinearAndSrgb.wgsl)

#ifdef RN_USE_KHRONOS_PBR_NEUTRAL
// Input color is non-negative and resides in the Linear Rec. 709 color space.
// Output color is also Linear Rec. 709, but in the [0, 1] range.
// See: https://github.com/KhronosGroup/ToneMapping/tree/main/PBR_Neutral
fn PBRNeutralToneMapping( inColor: vec3f ) -> vec3f {
  let startCompression = 0.8 - 0.04;
  let desaturation = 0.15;

  let x = min(inColor.r, min(inColor.g, inColor.b));
  let offset = select(0.04, x - 6.25 * x * x, x < 0.08);
  var color = inColor - offset;

  let peak = max(color.r, max(color.g, color.b));
  if (peak < startCompression) {
    return color;
  }

  let d = 1.0 - startCompression;
  let newPeak = 1.0 - d * d / (peak + d - startCompression);
  color *= newPeak / peak;

  let g = 1.0 - 1.0 / (desaturation * (peak - newPeak) + 1.0);
  return mix(color, newPeak * vec3f(1.0, 1.0, 1.0), g);
}
#endif

#ifdef RN_USE_REINHARD
fn ReinhardToneMapping(color: vec3<f32> ) -> vec3<f32> {
  return color / (vec3<f32>(1.0) + color);
}
#endif


#ifdef RN_USE_GT_TONEMAP
  fn W_f(x: f32, e0: f32, e1: f32) -> f32 {
    return smoothstep(e0, e1, x);
  }
  fn H_f(x: f32, e0: f32, e1: f32) -> f32 {
    if (x <= e0) { return 0.; }
    if (x >= e1) { return 1.; }
    return (x - e0) / (e1 - e0);
  }

  const e = 2.71828;

  fn GT_ToneMaping(x: f32) -> f32 {
    let P = 1.; // peak luminance
    let a = 1.; // contrast parameter
    let m = 0.22; // beginning of the linear part
    let l = 0.4; // length of the linear part
    let c = 1.33; // parameter of black color
    let b = 0.; // parameter of black color
    let l0 = (P - m) * l / a;
    let T_x = m * pow(x / m, c) + b;
    let L_x = m + a * (x - m);
    let S0 = m + l0;
    let S1 = m + a * l0;
    let C2 = a * P / (P - S1);
    let S_x = P - (P - S1) * pow(e, -(C2 * (x - S0) / P));
    let w0_x = 1. - W_f(x, 0., m);
    let w2_x = H_f(x, m + l0, m + l0);
    let w1_x = 1. - w0_x - w2_x;
    let f_x = T_x * w0_x + L_x * w1_x + S_x * w2_x;
    return f_x;
  }
#endif

@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var baseColor = textureSample(baseColorTexture, baseColorSampler, input.texcoord_0);

#ifdef RN_USE_KHRONOS_PBR_NEUTRAL
  baseColor = vec4f(PBRNeutralToneMapping(baseColor.rgb), baseColor.a);
#endif

#ifdef RN_USE_REINHARD
  baseColor = vec4f(ReinhardToneMapping(baseColor.rgb), baseColor.a);
#endif

#ifdef RN_USE_GT_TONEMAP
  baseColor.r = GT_ToneMaping(baseColor.r);
  baseColor.g = GT_ToneMaping(baseColor.g);
  baseColor.b = GT_ToneMaping(baseColor.b);
#endif

  if (get_enableLinearToSrgb(materialSID, 0)) {
    baseColor = vec4f(linearToSrgb(baseColor.rgb), baseColor.a);
  }

  return baseColor;
}
