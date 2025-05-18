/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

// #param diffuseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=blue
@group(2) @binding(0) var baseColorSampler: sampler;

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  var Normal = input.normal_inWorld * 0.5 + 0.5;
  // return vec4<f32>(Normal.x, Normal.y, Normal.z, 1);

#ifdef RN_USE_TEXCOORD_0
  var baseColor = textureSample(baseColorTexture, baseColorSampler, input.texcoord_0);
  return baseColor;
#else
  return vec4<f32>(1, 0, 0, 1);
#endif

}
