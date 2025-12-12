/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */
/* shaderity: @{shadowDefinition} */

// #param shadingModel: u32; // initialValue=0
// #param alphaCutoff: f32; // initialValue=0.01
// #param shininess: f32; // initialValue=5
// #param diffuseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(0) var diffuseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var diffuseColorSampler: sampler;
@group(1) @binding(1) var normalTexture: texture_2d<f32>; // initialValue=blue
@group(2) @binding(1) var normalSampler: sampler;
// #param diffuseColorTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param diffuseColorTextureRotation: f32; // initialValue=0

#pragma shaderity: require(../nodes/ClassicShader.wgsl)

@fragment
fn main (
  input: VertexOutput,
  @builtin(front_facing) isFront: bool,
) -> @location(0) vec4<f32> {

/* shaderity: @{mainPrerequisites} */

  // Normal
  let normal_inWorld = normalize(input.normal_inWorld);

  let diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);

  var textureColor = vec4f(1.0, 1.0, 1.0, 1.0);
#ifdef RN_USE_TEXCOORD_0
  // diffuseColorTexture (Considered to be premultiplied alpha)
  let diffuseColorTextureTransform = get_diffuseColorTextureTransform(materialSID, 0);
  let diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0);
  let diffuseColorTexUv = uvTransform(diffuseColorTextureTransform.xy, diffuseColorTextureTransform.zw, diffuseColorTextureRotation, input.texcoord_0);
  textureColor = textureSample(diffuseColorTexture, diffuseColorSampler, diffuseColorTexUv);
#endif

  // Lighting
  var shadingColor = vec4f(0.0, 0.0, 0.0, 1.0);
  let shadingModel = get_shadingModel(materialSID, 0);
  let shininess = get_shininess(materialSID, 0);
  classicShader(input.color_0, diffuseColorFactor, textureColor, shadingModel, shininess, input.position_inWorld, normal_inWorld, &shadingColor);

  // Alpha Test
  var alpha = shadingColor.a;
  /* shaderity: @{alphaProcess} */
  shadingColor.a = alpha;

  // Pre-multiplied alpha
  shadingColor = vec4f(shadingColor.rgb * shadingColor.a, shadingColor.a);

  return shadingColor;
}
