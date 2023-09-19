/* shaderity: @{definitions} */
#pragma shaderity: require(./PbrSingleVertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/opticalDefinition.wgsl)

// #param baseColorFactor: vec4<f32>; // initialValue=(1,1,1,1)

@group(1) @binding(0) var baseColorTexture: texture_2d<f32>; // initialValue=white
@group(2) @binding(0) var baseColorSampler: sampler;

@fragment
fn main(
  input: VertexOutput
) -> @location(0) vec4<f32> {
#pragma shaderity: require(../common/mainPrerequisites.wgsl)

  let normal_inWorld = normalize(input.normal_inWorld);

  var baseColor = vec4<f32>(1, 1, 1, 1);
  var baseColorFactor = get_baseColorFactor(materialSID, 0u);

#ifdef RN_USE_COLOR_0
  baseColor = input.color_0;
#endif

  baseColor *= baseColorFactor;

#ifdef RN_USE_TEXCOORD_0
  baseColor *= textureSample(baseColorTexture, baseColorSampler, input.texcoord_0);
#endif

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
