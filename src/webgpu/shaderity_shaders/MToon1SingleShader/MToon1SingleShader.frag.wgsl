/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

const EPS_COL: f32 = 0.00001;

#pragma shaderity: require(../common/opticalDefinition.wgsl)
#pragma shaderity: require(../common/perturbedNormal.wgsl)
#pragma shaderity: require(../common/pbrDefinition.wgsl)

// #param baseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(1) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(1) var baseColorSampler: sampler;
// #param baseColorTexcoordIndex: f32; // initialValue=0
// #param baseColorTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param baseColorTextureRotation: f32; // initialValue=0

@group(1) @binding(16) var diffuseEnvTexture: texture_cube<f32>; // initialValue=black
@group(2) @binding(16) var diffuseEnvSampler: sampler;
@group(1) @binding(17) var specularEnvTexture: texture_cube<f32>; // initialValue=black
@group(2) @binding(17) var specularEnvSampler: sampler;

// #param iblParameter: vec4<f32>; // initialValue=(1,1,1,1), isInternalSetting=true
// #param hdriFormat: vec2<i32>; // initialValue=(0,0), isInternalSetting=true
// #param inverseEnvironment: bool; // initialValue=false
#pragma shaderity: require(../common/iblDefinition.wgsl)

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
  let baseColorTexUv = uvTransform(baseColorTextureTransform.xy, baseColorTextureTransform.zw, baseColorTextureRotation, baseColorTexcoord);
  var baseColorTexture = textureSample(baseColorTexture, baseColorSampler, baseColorTexUv);
  baseColorTexture = vec4(srgbToLinear(baseColorTexture.rgb), baseColorTexture.a);
  let baseColorFactor = get_baseColorFactor(materialSID, 0);
  let baseColorTerm = baseColorTexture.rgb * baseColorFactor.rgb;

  var rt0 = vec4f(baseColorTerm, 1.0);

  return rt0;
}
