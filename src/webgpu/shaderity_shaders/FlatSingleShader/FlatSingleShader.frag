/* shaderity: @{definitions} */
#pragma shaderity: require(./FlatSingleVertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

// #param diffuseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)

@group(1) @binding(0) var BaseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var BaseColorSampler: sampler;

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
  var Normal = input.Normal * 0.5 + 0.5;
  // return vec4<f32>(Normal.x, Normal.y, Normal.z, 1);
  return vec4<f32>(1, 0, 0, 1);
}
