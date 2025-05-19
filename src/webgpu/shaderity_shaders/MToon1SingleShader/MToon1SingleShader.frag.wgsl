/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

const EPS_COL: f32 = 0.00001;

/* shaderity: @{opticalDefinition} */

/* shaderity: @{pbrDefinition} */

// #param baseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)
@group(1) @binding(1) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(1) var baseColorSampler: sampler;
// #param baseColorTexcoordIndex: f32; // initialValue=0
// #param baseColorTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param baseColorTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param baseColorTextureTransformRotation: f32; // initialValue=0

@group(1) @binding(2) var normalTexture: texture_2d<f32>; // initialValue=black
@group(2) @binding(2) var normalSampler: sampler;
// #param normalTexcoordIndex: f32; // initialValue=0
// #param normalTextureTransformScale: vec2<f32>; // initialValue=(1,1)
// #param normalTextureTransformOffset: vec2<f32>; // initialValue=(0,0)
// #param normalTextureTransformRotation: f32; // initialValue=0
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

@group(1) @binding(16) var diffuseEnvTexture: texture_cube<f32>; // initialValue=black, isInternalSetting=true
@group(2) @binding(16) var diffuseEnvSampler: sampler;
@group(1) @binding(17) var specularEnvTexture: texture_cube<f32>; // initialValue=black, isInternalSetting=true
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

/* shaderity: @{iblDefinition} */

fn linearstep(a: f32, b: f32, t: f32) -> f32 {
  return clamp((t - a) / (b - a), 0.0, 1.0);
}

fn uvAnimation(origUv: vec2f, time: f32, uvAnimMask: f32, uvAnimationScrollXSpeedFactor: f32, uvAnimationScrollYSpeedFactor: f32, uvAnimationRotationSpeedFactor: f32) -> vec2f {
  let scrollX = uvAnimationScrollXSpeedFactor * time;
  let scrollY = uvAnimationScrollYSpeedFactor * time;
  let rotation = uvAnimationRotationSpeedFactor * time;
  let rotationCos = cos(rotation * uvAnimMask);
  let rotationSin = sin(rotation * uvAnimMask);
  var uv = mat2x2f(rotationCos, -rotationSin, rotationSin, rotationCos) * (origUv - vec2f(0.5)) + vec2f(0.5);
  uv += vec2f(scrollX, scrollY) * uvAnimMask;
  return uv;
}

@fragment
fn main (
  input: VertexOutput,
  @builtin(front_facing) isFront: bool
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  // uv animation
  let uvAnimationScrollXSpeedFactor = get_uvAnimationScrollXSpeedFactor(materialSID, 0);
  let uvAnimationScrollYSpeedFactor = get_uvAnimationScrollYSpeedFactor(materialSID, 0);
  let uvAnimationRotationSpeedFactor = get_uvAnimationRotationSpeedFactor(materialSID, 0);
  let uvAnimationMaskTexcoordIndex = u32(get_uvAnimationMaskTexcoordIndex(materialSID, 0));
  let uvAnimationMaskTexcoord = getTexcoord(uvAnimationMaskTexcoordIndex, input);
  let uvAnimMask = textureSample(uvAnimationMaskTexture, uvAnimationMaskSampler, uvAnimationMaskTexcoord).b;
  let time = get_time(0, 0);

  // base color
  let baseColorTextureTransformScale = get_baseColorTextureTransformScale(materialSID, 0);
  let baseColorTextureTransformOffset = get_baseColorTextureTransformOffset(materialSID, 0);
  let baseColorTextureTransformRotation = get_baseColorTextureTransformRotation(materialSID, 0);
  let baseColorTexcoordIndex = u32(get_baseColorTexcoordIndex(materialSID, 0));
  var baseColorTexcoord = getTexcoord(baseColorTexcoordIndex, input);
  baseColorTexcoord = uvAnimation(baseColorTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  let baseColorTexUv = uvTransform(baseColorTextureTransformScale, baseColorTextureTransformOffset, baseColorTextureTransformRotation, baseColorTexcoord);
  var baseColorTexture = textureSample(baseColorTexture, baseColorSampler, baseColorTexUv);
  baseColorTexture = vec4(srgbToLinear(baseColorTexture.rgb), baseColorTexture.a);
  let baseColorFactor = get_baseColorFactor(materialSID, 0);
  let baseColorTerm = baseColorTexture.rgb * baseColorFactor.rgb;

  // shade color
  let shadeColorFactor = get_shadeColorFactor(materialSID, 0);
  let shadeMultiplyTexcoordIndex = u32(get_shadeMultiplyTexcoordIndex(materialSID, 0));
  var shadeMultiplyTexcoord = getTexcoord(shadeMultiplyTexcoordIndex, input);
  shadeMultiplyTexcoord = uvAnimation(shadeMultiplyTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  var shadeMultiplyTexture = textureSample(shadeMultiplyTexture, shadeMultiplySampler, shadeMultiplyTexcoord);
  shadeMultiplyTexture = vec4(srgbToLinear(shadeMultiplyTexture.rgb), shadeMultiplyTexture.a);
  let shadeColorTerm = shadeColorFactor * shadeMultiplyTexture.rgb;

  // shading shift
  let shadingShiftTexcoordIndex = u32(get_shadingShiftTexcoordIndex(materialSID, 0));
  var shadingShiftTexcoord = getTexcoord(shadingShiftTexcoordIndex, input);
  shadingShiftTexcoord = uvAnimation(shadingShiftTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  var shadingShiftTexture = textureSample(shadingShiftTexture, shadingShiftSampler, shadingShiftTexcoord).r;
  let shadingShiftTextureScale = get_shadingShiftTextureScale(materialSID, 0);

  // emissive
  let emissiveFactor = get_emissiveFactor(materialSID, 0);
  let emissiveTexcoordIndex = u32(get_emissiveTexcoordIndex(materialSID, 0));
  var emissiveTexcoord = getTexcoord(emissiveTexcoordIndex, input);
  emissiveTexcoord = uvAnimation(emissiveTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
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
  let normalTextureTransformScale = get_normalTextureTransformScale(materialSID, 0);
  let normalTextureTransformOffset = get_normalTextureTransformOffset(materialSID, 0);
  let normalTextureTransformRotation = get_normalTextureTransformRotation(materialSID, 0);
  let normalTexcoordIndex = u32(get_normalTexcoordIndex(materialSID, 0));
  var normalTexcoord = getTexcoord(normalTexcoordIndex, input);
  normalTexcoord = uvAnimation(normalTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  let normalTexUv = uvTransform(normalTextureTransformScale, normalTextureTransformOffset, normalTextureTransformRotation, normalTexcoord);
  let normal: vec3f = textureSample(normalTexture, normalSampler, normalTexUv).xyz * 2.0 - 1.0;
  let TBN: mat3x3<f32> = getTBN(normal_inWorld, input, viewDirection, normalTexUv, isFront);
  normal_inWorld = normalize(TBN * normal);
#endif

#ifdef RN_MTOON_IS_OUTLINE
  normal_inWorld *= -1.0;
#endif

  // direct lighting
  // https://github.com/vrm-c/vrm-specification/blob/282edef7b8de6044d782afdab12b14bd8ccf0630/specification/VRMC_materials_mtoon-1.0/README.ja.md#implementation
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

  // indirect lighting
  // https://github.com/vrm-c/vrm-specification/blob/282edef7b8de6044d782afdab12b14bd8ccf0630/specification/VRMC_materials_mtoon-1.0/README.ja.md#implementation-1
  let giEqualizationFactor = get_giEqualizationFactor(materialSID, 0);
  let worldUpVector = vec3f(0.0, 1.0, 0.0);
  let worldDownVector = vec3f(0.0, -1.0, 0.0);
  let iblParameter = get_iblParameter(materialSID, 0);
  let rot = iblParameter.w;
  let IBLDiffuseContribution = iblParameter.y;
  let rotEnvMatrix = mat3x3f(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  let normal_forEnv = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  let hdriFormat = get_hdriFormat(materialSID, 0);
  let rawGiUp = getIBLIrradiance(worldUpVector, iblParameter, hdriFormat) * IBLDiffuseContribution;
  let rawGiDown = getIBLIrradiance(worldDownVector, iblParameter, hdriFormat) * IBLDiffuseContribution;
  let rawGiNormal = getIBLIrradiance(normal_forEnv, iblParameter, hdriFormat) * IBLDiffuseContribution;
  let uniformedGi = (rawGiUp + rawGiDown) / 2.0;
  let passthroughGi = rawGiNormal;
  let gi = mix(uniformedGi, passthroughGi, giEqualizationFactor);
  rt0 += vec4f(gi * baseColorTerm * RECIPROCAL_PI, rt0.a);

  // rim lighting
  // https://github.com/vrm-c/vrm-specification/blob/282edef7b8de6044d782afdab12b14bd8ccf0630/specification/VRMC_materials_mtoon-1.0/README.ja.md#implementation-2
  var rim = vec3f(0.0);
  let worldViewX = normalize(vec3f(viewDirection.z, 0.0, -viewDirection.x));
  let worldViewY = cross(viewDirection, worldViewX);
  let matcapUv = vec2f( dot(worldViewX, normal_inWorld), dot(worldViewY, normal_inWorld)) * 0.495 + 0.5;
  let epsilon = 0.00001;
  let matcapFactor = srgbToLinear(get_matcapFactor(materialSID, 0));
  rim = matcapFactor * textureSample(matcapTexture, matcapSampler, matcapUv).rgb;
  let parametricRimLiftFactor = get_parametricRimLiftFactor(materialSID, 0);
  var parametricRim = clamp( 1.0 - dot(normal_inWorld, viewVector) + parametricRimLiftFactor, 0.0, 1.0);
  let parametricRimFresnelPowerFactor = get_parametricRimFresnelPowerFactor(materialSID, 0);
  parametricRim = pow(parametricRim, max(parametricRimFresnelPowerFactor, epsilon));
  let parametricRimColorFactor = get_parametricRimColorFactor(materialSID, 0);
  rim += parametricRim * parametricRimColorFactor;
  let rimMultiplyTexcoordIndex = u32(get_rimMultiplyTexcoordIndex(materialSID, 0));
  var rimMultiplyTexcoord = getTexcoord(rimMultiplyTexcoordIndex, input);
  rimMultiplyTexcoord = uvAnimation(rimMultiplyTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  rim *= srgbToLinear(textureSample(rimMultiplyTexture, rimMultiplySampler, rimMultiplyTexcoord).rgb);
  let rimLightingMixFactor = get_rimLightingMixFactor(materialSID, 0);
  rim *= mix(vec3(1.0), directLighting + gi, rimLightingMixFactor);
  rt0 += vec4f(rim, rt0.a);

  // emissive
  rt0 += vec4f(emissive, rt0.a);

#ifdef RN_MTOON_IS_OUTLINE
  let outlineColorFactor = get_outlineColorFactor(materialSID, 0);
  let outlineLightingMixFactor = get_outlineLightingMixFactor(materialSID, 0);
  rt0 = vec4f(outlineColorFactor * mix(vec3f(1.0), rt0.xyz, outlineLightingMixFactor), rt0.a);
#endif

  let makeOutputSrgb = get_makeOutputSrgb(materialSID, 0);
  rt0 = vec4f(select(rt0.rgb, linearToSrgb(rt0.rgb), makeOutputSrgb), rt0.a);

  rt0.a = alpha;
  rt0 *= vec4f(alpha, alpha, alpha, 1.0);

  return rt0;
}
