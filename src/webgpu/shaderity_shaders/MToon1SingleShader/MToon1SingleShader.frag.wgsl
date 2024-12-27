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

@group(1) @binding(2) var normalTexture: texture_2d<f32>; // initialValue=black
@group(2) @binding(2) var normalSampler: sampler;
// #param normalTexcoordIndex: f32; // initialValue=0
// #param normalTextureTransform: vec4<f32>; // initialValue=(1,1,0,0)
// #param normalTextureRotation: f32; // initialValue=0
// #param normalScale: f32; // initialValue=1

// #param shadingShiftFactor: f32; // initialValue=0.0
@group(1) @binding(3) var shadingShiftTexture: texture_2d<f32>; // initialValue=black
@group(2) @binding(3) var shadingShiftSampler: sampler;
// #param shadingShiftTexcoordIndex: f32; // initialValue=0
// #param shadingShiftTextureScale: f32; // initialValue=1.0

// #param shadingToonyFactor: f32; // initialValue=0.9
// #param shadeColorFactor: vec3<f32>; // initialValue=(0,0,0)
@group(1) @binding(4) var shadeMultiplyTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(4) var shadeMultiplySampler: sampler;
// #param shadeMultiplyTexcoordIndex: f32; // initialValue=0

@group(1) @binding(16) var diffuseEnvTexture: texture_cube<f32>; // initialValue=black
@group(2) @binding(16) var diffuseEnvSampler: sampler;
@group(1) @binding(17) var specularEnvTexture: texture_cube<f32>; // initialValue=black
@group(2) @binding(17) var specularEnvSampler: sampler;

// #param giEqualizationFactor: f32; // initialValue=0.9

@group(1) @binding(5) var matcapTexture: texture_2d<f32>; // initialValue=black
@group(2) @binding(5) var matcapSampler: sampler;
// #param matcapFactor: vec3<f32>; // initialValue=(1,1,1)
// #param parametricRimColorFactor: vec3<f32>; // initialValue=(0,0,0)
// #param parametricRimFresnelPowerFactor: f32; // initialValue=5.0
// #param parametricRimLiftFactor: f32; // initialValue=0.0
@group(1) @binding(6) var rimMultiplyTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(6) var rimMultiplySampler: sampler;
// #param rimMultiplyTexcoordIndex: f32; // initialValue=0
// #param rimLightingMixFactor: f32; // initialValue=1.0

// #param emissiveFactor: vec3<f32>; // initialValue=(0,0,0)
@group(1) @binding(7) var emissiveTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(7) var emissiveSampler: sampler;
// #param emissiveTexcoordIndex: f32; // initialValue=0

// #param outlineColorFactor: vec3<f32>; // initialValue=(0,0,0)
// #param outlineLightingMixFactor: f32; // initialValue=1.0

@group(1) @binding(8) var uvAnimationMaskTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(8) var uvAnimationMaskSampler: sampler;
// #param uvAnimationMaskTexcoordIndex: f32; // initialValue=0
// #param uvAnimationScrollXSpeedFactor: f32; // initialValue=0.0
// #param uvAnimationScrollYSpeedFactor: f32; // initialValue=0.0
// #param uvAnimationRotationSpeedFactor: f32; // initialValue=0.0

// #param inverseEnvironment: bool; // initialValue=false
// #param iblParameter: vec4<f32>; // initialValue=(1,1,1,1), isInternalSetting=true
// #param hdriFormat: vec2<i32>; // initialValue=(0,0), isInternalSetting=true
// #param alphaCutoff: f32; // initialValue=0.5
// #param makeOutputSrgb: bool; // initialValue=false

#pragma shaderity: require(../common/iblDefinition.wgsl)

fn linearstep(a: f32, b: f32, t: f32) -> f32 {
  return clamp((t - a) / (b - a), 0.0, 1.0);
}

@fragment
fn main (
  input: VertexOutput,
  @builtin(front_facing) isFront: bool
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  // uv animation
  let uvAnimationScrollXSpeedFactor = get_uvAnimationScrollXSpeedFactor(materialSID, 0);
  let uvAnimationScrollYSpeedFactor = get_uvAnimationScrollYSpeedFactor(materialSID, 0);
  let uvAnimationRotationSpeedFactor = get_uvAnimationRotationSpeedFactor(materialSID, 0);
  let uvAnimationMaskTexcoordIndex = u32(get_uvAnimationMaskTexcoordIndex(materialSID, 0));
  let uvAnimationMaskTexcoord = getTexcoord(uvAnimationMaskTexcoordIndex, input);
  let uvAnimMask = textureSample(uvAnimationMaskTexture, uvAnimationMaskSampler, uvAnimationMaskTexcoord).b;
  let time = get_time(0, 0);

  // base color
  let baseColorTextureTransform = get_baseColorTextureTransform(materialSID, 0);
  let baseColorTextureRotation = get_baseColorTextureRotation(materialSID, 0);
  let baseColorTexcoordIndex = u32(get_baseColorTexcoordIndex(materialSID, 0));
  let baseColorTexcoord = getTexcoord(baseColorTexcoordIndex, input);
  let baseColorTexUv = uvTransform(baseColorTextureTransform.xy, baseColorTextureTransform.zw, baseColorTextureRotation, baseColorTexcoord);
  var baseColorTexture = textureSample(baseColorTexture, baseColorSampler, baseColorTexUv);
  baseColorTexture = vec4(srgbToLinear(baseColorTexture.rgb), baseColorTexture.a);
  let baseColorFactor = get_baseColorFactor(materialSID, 0);
  let baseColorTerm = baseColorTexture.rgb * baseColorFactor.rgb;

  // shade color
  let shadeColorFactor = get_shadeColorFactor(materialSID, 0);
  let shadeMultiplyTexcoordIndex = u32(get_shadeMultiplyTexcoordIndex(materialSID, 0));
  let shadeMultiplyTexcoord = getTexcoord(shadeMultiplyTexcoordIndex, input);
  var shadeMultiplyTexture = textureSample(shadeMultiplyTexture, shadeMultiplySampler, shadeMultiplyTexcoord);
  shadeMultiplyTexture = vec4(srgbToLinear(shadeMultiplyTexture.rgb), shadeMultiplyTexture.a);
  let shadeColorTerm = shadeColorFactor * shadeMultiplyTexture.rgb;

  // shading shift
  let shadingShiftTexcoordIndex = u32(get_shadingShiftTexcoordIndex(materialSID, 0));
  let shadingShiftTexcoord = getTexcoord(shadingShiftTexcoordIndex, input);
  var shadingShiftTexture = textureSample(shadingShiftTexture, shadingShiftSampler, shadingShiftTexcoord).r;
  let shadingShiftTextureScale = get_shadingShiftTextureScale(materialSID, 0);

  // emissive
  let emissiveFactor = get_emissiveFactor(materialSID, 0);
  let emissiveTexcoordIndex = u32(get_emissiveTexcoordIndex(materialSID, 0));
  let emissiveTexcoord = getTexcoord(emissiveTexcoordIndex, input);
  var emissiveTexture = textureSample(emissiveTexture, emissiveSampler, emissiveTexcoord);
  emissiveTexture = vec4(srgbToLinear(emissiveTexture.rgb), emissiveTexture.a);
  let emissive = emissiveFactor * emissiveTexture.rgb;

  // alpha
  let alpha = baseColorTexture.a * baseColorFactor.a;
#ifdef RN_ALPHATEST_ON
  let cutoff = get_alphaCutoff(materialSID, 0);
  if(alpha < cutoff) { discard; }
#endif

  // view vector
  let viewPosition = get_viewPosition(cameraSID, 0);
  let viewVector = viewPosition - input.position_inWorld.xyz;
  let viewDirection = normalize(viewVector);

  // Normal
  var normal_inWorld = normalize(input.normal_inWorld);
#ifdef RN_USE_NORMAL_TEXTURE
  let normalTextureTransform = get_normalTextureTransform(materialSID, 0);
  let normalTextureRotation = get_normalTextureRotation(materialSID, 0);
  let normalTexcoordIndex = u32(get_normalTexcoordIndex(materialSID, 0));
  let normalTexcoord = getTexcoord(normalTexcoordIndex, input);
  let normalTexUv = uvTransform(normalTextureTransform.xy, normalTextureTransform.zw, normalTextureRotation, normalTexcoord);
  let normal: vec3f = textureSample(normalTexture, normalSampler, normalTexUv).xyz * 2.0 - 1.0;
  let TBN: mat3x3<f32> = getTBN(normal_inWorld, input, viewVector, input.texcoord_0, isFront);
  normal_inWorld = normalize(TBN * normal);
#endif

#ifdef RN_MTOON_IS_OUTLINE
  normal_inWorld *= -1.0;
#endif

  var rt0 = vec4f(0.0, 0.0, 0.0, 1.0);
  var directLighting = vec3f(0.0);
  let lightNumber = u32(get_lightNumber(0u, 0u));
  for (var i = 0u; i < lightNumber; i++) {
    let light: Light = getLight(i, input.position_inWorld.xyz);
    var shading = dot(light.direction, normal_inWorld);
    let shadingShiftFactor = get_shadingShiftFactor(materialSID, 0);
    shading += shadingShiftFactor + shadingShiftTexture * shadingShiftTextureScale;
    let shadingToonyFactor = get_shadingToonyFactor(materialSID, 0);
    shading = linearstep(-1.0 + shadingToonyFactor, 1.0 - shadingToonyFactor, shading);

    var color = mix(shadeColorTerm, baseColorTerm, shading);
    color = color * light.attenuatedIntensity * RECIPROCAL_PI;
    directLighting += light.attenuatedIntensity;
    rt0 += vec4f(color, rt0.a);
  }


  rt0.a = alpha;
  rt0 *= vec4f(alpha, alpha, alpha, 1.0);

  return rt0;
}
