/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

const EPS_COL: f32 = 0.00001;

#pragma shaderity: require(../common/opticalDefinition.wgsl)

#pragma shaderity: require(../common/perturbedNormal.wgsl)

// #param baseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(1) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(1) var baseColorSampler: sampler;
// #param baseColorTexcoordIndex: f32; // initialValue=0
// #param baseColorTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param baseColorTextureRotation: f32; // initialValue=0


@fragment
fn main (
  input: VertexOutput,
  @builtin(front_facing) isFront: bool
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  let baseColorTextureTransform = get_baseColorTextureTransform(materialSID, 0);
  let baseColorTextureRotation = get_baseColorTextureRotation(materialSID, 0);
  let baseColorTexcoordIndex = u32(get_baseColorTexcoordIndex(materialSID, 0));
  let baseColorTexcoord = getTexcoord(baseColorTexcoordIndex, input);
  // let baseColorTexUv = uvTransform(baseColorTextureTransform.xy, baseColorTextureTransform.zw, baseColorTextureRotation, baseColorTexcoord);
  // let textureColor = textureSample(baseColorTexture, baseColorSampler, baseColorTexUv);
  // baseColor *= vec4(srgbToLinear(textureColor.rgb), textureColor.a);


  var rt0 = vec4f(1.0, 0.0, 0.0, 1.0);

  return rt0;
}
