/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  let synthesizeCoefficient0 = get_synthesizeCoefficient(materialSID, 0);
  var color: vec4f = synthesizeCoefficient0 * textureSample(synthesize0Texture, synthesize0Sampler, input.texcoord_0);

  let synthesizeCoefficient1 = get_synthesizeCoefficient(materialSID, 1);
  let synthesizeCoefficient2 = get_synthesizeCoefficient(materialSID, 2);
  let synthesizeCoefficient3 = get_synthesizeCoefficient(materialSID, 3);
  let synthesizeCoefficient4 = get_synthesizeCoefficient(materialSID, 4);
  let synthesizeCoefficient5 = get_synthesizeCoefficient(materialSID, 5);

  color += synthesizeCoefficient1 * textureSample(synthesize1Texture, synthesize1Sampler, input.texcoord_0);
  color += synthesizeCoefficient2 * textureSample(synthesize2Texture, synthesize2Sampler, input.texcoord_0);
  color += synthesizeCoefficient3 * textureSample(synthesize3Texture, synthesize3Sampler, input.texcoord_0);
  color += synthesizeCoefficient4 * textureSample(synthesize4Texture, synthesize4Sampler, input.texcoord_0);
  color += synthesizeCoefficient5 * textureSample(synthesize5Texture, synthesize5Sampler, input.texcoord_0);

  return color;
}

