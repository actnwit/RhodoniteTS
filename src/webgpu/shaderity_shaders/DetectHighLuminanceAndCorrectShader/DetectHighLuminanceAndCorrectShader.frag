/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var baseColor = textureSample(baseColorTexture, baseColorSampler, input.texcoord_0);

  let luminance = length(baseColor);

  let luminanceCriterion: f32 = get_luminanceCriterion(materialSID, 0);
  baseColor = vec4f(mix(vec3f(0.0), baseColor.rgb, (luminance - luminanceCriterion) / luminanceCriterion), 1.0);

  return baseColor;
}
