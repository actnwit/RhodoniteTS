/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

// #param enableLinearToSrgb: bool; // initialValue=true

#pragma shaderity: require(../common/correspondenceBetweenLinearAndSrgb.wgsl)

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

@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var baseColor = textureSample(baseColorTexture, baseColorSampler, input.texcoord_0);

  baseColor = vec4f(PBRNeutralToneMapping(baseColor.rgb), baseColor.a);

  if (get_enableLinearToSrgb(materialSID, 0)) {
    baseColor = vec4f(linearToSrgb(baseColor.rgb), baseColor.a);
  }

  return baseColor;
}
