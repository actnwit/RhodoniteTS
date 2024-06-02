/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  let synthesizeCoefficients = get_synthesizeCoefficient(materialSID, 0);
  let synthesizeCoefficient0 = synthesizeCoefficients[0];
  var color: vec3f = synthesizeCoefficient0 * textureSample(synthesizeTexture0, synthesizeSampler0, input.texcoord_0).rgb;

  let synthesizeCoefficient1 = synthesizeCoefficients[1];
  let synthesizeCoefficient2 = synthesizeCoefficients[2];
  let synthesizeCoefficient3 = synthesizeCoefficients[3];
  let synthesizeCoefficient4 = synthesizeCoefficients[4];
  let synthesizeCoefficient5 = synthesizeCoefficients[5];

  color += synthesizeCoefficient1 * textureSample(synthesizeTexture1, synthesizeSampler0, input.texcoord_0).rgb;
  color += synthesizeCoefficient2 * textureSample(synthesizeTexture2, synthesizeSampler0, input.texcoord_0).rgb;
  color += synthesizeCoefficient3 * textureSample(synthesizeTexture3, synthesizeSampler0, input.texcoord_0).rgb;
  color += synthesizeCoefficient4 * textureSample(synthesizeTexture4, synthesizeSampler0, input.texcoord_0).rgb;
  color += synthesizeCoefficient5 * textureSample(synthesizeTexture5, synthesizeSampler0, input.texcoord_0).rgb;

  let rt0 = vec4f(color, 1.0);

  return rt0;
}

