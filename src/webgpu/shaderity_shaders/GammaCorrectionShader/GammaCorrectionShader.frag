/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

// #param enableLinearToSrgb: bool; // initialValue=true

#pragma shaderity: require(../common/correspondenceBetweenLinearAndSrgb.wgsl)

@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var baseColor = textureSample(baseColorTexture, baseColorSampler, input.texcoord_0);

  if (get_enableLinearToSrgb(materialSID, 0)) {
    baseColor = vec4f(linearToSrgb(baseColor.rgb), baseColor.a);
  }

  return baseColor;

}
