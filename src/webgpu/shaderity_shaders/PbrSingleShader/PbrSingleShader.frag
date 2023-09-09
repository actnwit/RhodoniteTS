/* shaderity: @{definitions} */
#pragma shaderity: require(./PbrSingleVertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

// #param baseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  var Normal = input.normal * 0.5 + 0.5;

  var baseColor = vec4<f32>(1, 1, 1, 1);
  var baseColorFactor = get_baseColorFactor(materialSID, 0u);

#ifdef RN_USE_COLOR_0
  baseColor = input.color_0;
#endif

  baseColor *= baseColorFactor;

#ifdef RN_USE_TEXCOORD_0
  baseColor *= textureSample(baseColorTexture, baseColorSampler, input.texcoord_0);
#endif
  return baseColor;

}
