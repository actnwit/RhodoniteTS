/* shaderity: @{definitions} */
#pragma shaderity: require(./PbrSingleVertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/opticalDefinition.wgsl)
#pragma shaderity: require(../common/perturbedNormal.wgsl)

// Color
// #param baseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

#ifdef RN_USE_NORMAL_TEXTURE
  @group(1) @binding(1) var normalTexture: texture_2d<f32>; // initialValue=blue
  @group(2) @binding(1) var normalSampler: sampler;
  // #param normalTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
  // #param normalTextureRotation: f32; // initialValue=(0)
  // #param normalTexcoordIndex: f32; // initialValue=(0)
  // #param normalScale: f32; // initialValue=(1)
#endif

@fragment
fn main(
  input: VertexOutput,
  @builtin(front_facing) isFront: bool,
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

// BaseColor
  var baseColor = vec4<f32>(1, 1, 1, 1);
  var baseColorFactor = get_baseColorFactor(materialSID, 0u);

#ifdef RN_USE_COLOR_0
  baseColor = input.color_0;
#endif

  baseColor *= baseColorFactor;

#ifdef RN_USE_TEXCOORD_0
  baseColor *= textureSample(baseColorTexture, baseColorSampler, input.texcoord_0);
#endif

// Normal
  var normal_inWorld = normalize(input.normal_inWorld);
  let geomnormal_inworld = normal_inWorld;
  let normalTextureTransform: vec4f = get_normalTextureTransform(materialSID, 0);
  let normalTextureRotation: f32 = get_normalTextureRotation(materialSID, 0);
  let normalTexcoordIndex: u32 = u32(get_normalTexcoordIndex(materialSID, 0));
  let normalTexcoord: vec2f = getTexcoord(normalTexcoordIndex, input);
  let normalTexUv: vec2f = uvTransform(normalTextureTransform.xy, normalTextureTransform.zw, normalTextureRotation, normalTexcoord);


  var resultColor = vec3<f32>(0, 0, 0);
  var resultAlpha = 0.0;

  // Lighting
  let lightNumber = u32(get_lightNumber(0u, 0u));
  for (var i = 0u; i < lightNumber; i++) {
    let light: Light = getLight(i, input.position_inWorld);
    let NdotL = dot(normal_inWorld, light.direction);
    if (NdotL > 0.0) {
      resultColor += baseColor.rgb / M_PI * NdotL * light.attenuatedIntensity;
    }
  }

  resultAlpha = baseColor.a;
  return vec4f(resultColor * resultAlpha, resultAlpha);
}
