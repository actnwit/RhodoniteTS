/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

// #param enableLinearToSrgb: bool; // initialValue=true



@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  var baseColor = textureSampleLevel(baseColorTexture, baseColorSampler, input.texcoord_0, 0.0);

  if (get_enableLinearToSrgb(materialSID, 0)) {
    baseColor = vec4f(linearToSrgb(baseColor.rgb), baseColor.a);
  }

  return baseColor;

}
