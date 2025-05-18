/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

@fragment
fn main (
  input: VertexOutput,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  let synthesizeCoefficient0 = get_synthesizeCoefficient(materialSID, 0);
  var color: vec4f = synthesizeCoefficient0 * textureSample(synthesizeTexture0, synthesizeSampler0, input.texcoord_0);

  let synthesizeCoefficient1 = get_synthesizeCoefficient(materialSID, 1);
  let synthesizeCoefficient2 = get_synthesizeCoefficient(materialSID, 2);
  let synthesizeCoefficient3 = get_synthesizeCoefficient(materialSID, 3);
  let synthesizeCoefficient4 = get_synthesizeCoefficient(materialSID, 4);
  let synthesizeCoefficient5 = get_synthesizeCoefficient(materialSID, 5);

  color += synthesizeCoefficient1 * textureSample(synthesizeTexture1, synthesizeSampler0, input.texcoord_0);
  color += synthesizeCoefficient2 * textureSample(synthesizeTexture2, synthesizeSampler0, input.texcoord_0);
  color += synthesizeCoefficient3 * textureSample(synthesizeTexture3, synthesizeSampler0, input.texcoord_0);
  color += synthesizeCoefficient4 * textureSample(synthesizeTexture4, synthesizeSampler0, input.texcoord_0);
  color += synthesizeCoefficient5 * textureSample(synthesizeTexture5, synthesizeSampler0, input.texcoord_0);

  return color;
}

