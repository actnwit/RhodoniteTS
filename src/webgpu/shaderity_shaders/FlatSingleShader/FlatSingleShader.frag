/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

// #param diffuseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
// #param diffuseColorTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param diffuseColorTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param diffuseColorTextureRotation: f32; // initialValue=0

#pragma shaderity: require(../nodes/FlatShader.wgsl)

@group(1) @binding(0) var diffuseColorTexture: texture_2d<f32>; // initialValue=blue
@group(2) @binding(0) var diffuseColorSampler: sampler;

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  let diffuseColorFactor = get_diffuseColorFactor(materialSID, 0);

  // diffuseColorTexture (Considered to be premultiplied alpha)
  let diffuseColorTextureTransformScale = get_diffuseColorTextureTransformScale(materialSID, 0);
  let diffuseColorTextureTransformOffset = get_diffuseColorTextureTransformOffset(materialSID, 0);
  let diffuseColorTextureRotation = get_diffuseColorTextureRotation(materialSID, 0);
  let diffuseColorTexUv = uvTransform(diffuseColorTextureTransformScale, diffuseColorTextureTransformOffset, diffuseColorTextureRotation, input.texcoord_0);
  let textureColor = textureSample(diffuseColorTexture, diffuseColorSampler, diffuseColorTexUv);

  var diffuseColor = vec4<f32>(0.0, 0.0, 0.0, 1.0);
  flatShader(input.color_0, diffuseColorFactor, textureColor, &diffuseColor);

  var alpha = diffuseColor.a;
  /* shaderity: @{alphaProcess} */
  diffuseColor.a = alpha;

  return vec4<f32>(diffuseColor.rgb * diffuseColor.a, diffuseColor.a);
}
