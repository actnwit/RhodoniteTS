/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  var baseColor = textureSampleLevel(baseColorTexture, baseColorSampler, input.texcoord_0, 0.0);

  let luminance = dot(baseColor.rgb, vec3f(0.2126, 0.7152, 0.0722));

  let luminanceCriterion: f32 = get_luminanceCriterion(materialSID, 0);
  baseColor = vec4f(mix(vec3f(0.0), baseColor.rgb, (luminance - luminanceCriterion) / luminanceCriterion), 1.0);

  return baseColor;
}
