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

void main ()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

vec4 baseColor = texture(u_baseColorTexture, v_texcoord_0);

// Apply Tone Mapping
baseColor.rgb = PBRNeutralToneMapping(baseColor.rgb);

// Convert linear color to sRGB color space.
if (get_enableLinearToSrgb(materialSID, 0)) {
  baseColor.rgb = linearToSrgb(baseColor.rgb);
}

rt0 = baseColor;

#pragma shaderity: require(../common/glFragColor.glsl)

}
