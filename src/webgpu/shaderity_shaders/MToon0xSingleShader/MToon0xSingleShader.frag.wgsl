/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

const EPS_COL: f32 = 0.00001;

/* shaderity: @{opticalDefinition} */

/* shaderity: @{pbrDefinition} */

@group(1) @binding(17) var diffuseEnvTexture: texture_cube<f32>; // initialValue=black, isInternalSetting=true
@group(2) @binding(17) var diffuseEnvSampler: sampler;
@group(1) @binding(18) var specularEnvTexture: texture_cube<f32>; // initialValue=black, isInternalSetting=true
@group(2) @binding(18) var specularEnvSampler: sampler;

// #param inverseEnvironment: bool; // initialValue=false
// #param iblParameter: vec4<f32>; // initialValue=(1,1,1,1), isInternalSetting=true
// #param hdriFormat: vec2<i32>; // initialValue=(0,0), isInternalSetting=true

/* shaderity: @{iblDefinition} */

const PI_2: f32 = 6.28318530718;

fn uvAnimation(origUv: vec2f, time: f32, uvAnimationMask: f32, uvAnimationScrollXSpeedFactor: f32, uvAnimationScrollYSpeedFactor: f32, uvAnimationRotationSpeedFactor: f32) -> vec2f {
  let uvAnim = uvAnimationMask * time;
  var uv = origUv;
  uv += vec2f(uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor) * uvAnim;
  let rotateRad = uvAnimationRotationSpeedFactor * PI_2 * uvAnim;
  let rotatePivot = vec2f(0.5);
  uv = mat2x2f(cos(rotateRad), -sin(rotateRad), sin(rotateRad), cos(rotateRad)) * (uv - rotatePivot) + rotatePivot;
  return uv;
}

@fragment
fn main (
  input: VertexOutput,
  @builtin(front_facing) isFront: bool
) -> @location(0) vec4<f32> {
  var rt0 = vec4f(0.0, 0.0, 0.0, 1.0);

  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      discard;
    #endif
  #endif

  /* shaderity: @{mainPrerequisites} */

  // uv animation
  let uvAnimationMaskTexture = textureSample(uvAnimationMaskTexture, uvAnimationMaskSampler, input.texcoord_0).r;
  let uvAnimationScrollXSpeedFactor = get_uvAnimationScrollXSpeedFactor(materialSID, 0);
  let uvAnimationScrollYSpeedFactor = get_uvAnimationScrollYSpeedFactor(materialSID, 0);
  let uvAnimationRotationSpeedFactor = get_uvAnimationRotationSpeedFactor(materialSID, 0);
  let time = get_time(0, 0);
  let mainUv = uvAnimation(input.texcoord_0, time, uvAnimationMaskTexture, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);

  // main color
  let litTextureColor: vec4f = textureSample(litColorTexture, litColorSampler, mainUv);
  let litColorFactor: vec4f = get_litColor(materialSID, 0);

  // alpha
  var alpha = 1.0;

  #ifdef RN_ALPHATEST_ON
    alpha = litTextureColor.a * litColorFactor.a;
    let cutoff: f32 = get_cutoff(materialSID, 0);
    if (alpha < cutoff) { discard; }
  #elif defined(RN_ALPHABLEND_ON)
    alpha = litTextureColor.a * litColorFactor.a;
  #endif

  if (alpha < 0.01) {
    discard;
  } else {
    rt0.w = alpha;
  }


  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_COLOR_FIXED
      let outlineColor: vec3f = get_outlineColor(materialSID, 0);
      rt0 = vec4f(outlineColor, rt0.w);

      rt0 = vec4(srgbToLinear(rt0.xyz), rt0.w);
      return rt0;
    #endif
  #endif

  // view vector
  let viewPosition: vec3f = get_viewPosition(cameraSID);
  let viewVector: vec3f = viewPosition - input.position_inWorld.xyz;
  let viewDirection: vec3f = normalize(viewVector);

  // Normal
  var normal_inWorld: vec3f = normalize(input.normal_inWorld);
  #ifdef RN_MTOON_HAS_BUMPMAP
    let normal: vec3f = textureSample(normalTexture, normalSampler, mainUv).xyz * 2.0 - 1.0;
    let TBN: mat3x3<f32> = getTBN(normal_inWorld, input.tangent_inWorld, input.binormal_inWorld, viewDirection, mainUv, isFront);
    normal_inWorld = normalize(TBN * normal);
  #endif

  #ifdef RN_MTOON_IS_OUTLINE
    normal_inWorld *= -1.0;
  #endif


  // Lighting, Direct Light

  let shadowAttenuation = 1.0;
  // TODO: shadowmap computation

  let receiveShadowRate: f32 = get_receiveShadowRate(materialSID, 0);
  var lightAttenuation: f32 = shadowAttenuation * mix(1.0, shadowAttenuation, receiveShadowRate * textureSample(receiveShadowTexture, receiveShadowSampler, mainUv).r);

  let shadingGradeRate: f32 = get_shadingGradeRate(materialSID, 0);
  let shadingGrade: f32 = 1.0 - shadingGradeRate * (1.0 - textureSample(shadingGradeTexture, shadingGradeSampler, mainUv).r);
  let lightColorAttenuation: f32 = get_lightColorAttenuation(materialSID, 0);

  let shadeColorFactor: vec3f = get_shadeColor(materialSID, 0);
  var shadeColor: vec3f = shadeColorFactor * srgbToLinear(textureSample(shadeColorTexture, shadeColorSampler, mainUv).xyz);

  var litColor: vec3f = litColorFactor.xyz * srgbToLinear(litTextureColor.xyz);

  let shadeShift: f32 = get_shadeShift(materialSID, 0);
  let shadeToony: f32 = get_shadeToony(materialSID, 0);

  var lightings: array<vec3<f32>, /* shaderity: @{Config.maxLightNumber} */>;
  #ifdef RN_MTOON_DEBUG_LITSHADERATE
    var lightIntensities[/* shaderity: @{Config.maxLightNumber} */]: array<f32>;
  #endif
  let lightNumber = u32(get_lightNumber(0u, 0u));
  for (var i = 0u; i < /* shaderity: @{Config.maxLightNumber} */; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Light
    let light: Light = getLight(i, input.position_inWorld.xyz);

    // lightAttenuation *= distanceAttenuation * spotEffect;
    let dotNL: f32 = dot(light.direction, normal_inWorld);
    var lightIntensity: f32 = dotNL * 0.5 + 0.5; // from [-1, +1] to [0, 1]
    lightIntensity = lightIntensity * lightAttenuation; // TODO: receive shadow
    lightIntensity = lightIntensity * shadingGrade; // darker
    lightIntensity = lightIntensity * 2.0 - 1.0; // from [0, 1] to [-1, +1]

    // tooned. mapping from [minIntensityThreshold, maxIntensityThreshold] to [0, 1]
    let maxIntensityThreshold: f32 = mix(1.0, shadeShift, shadeToony);
    let minIntensityThreshold: f32 = shadeShift;
    lightIntensity = clamp((lightIntensity - minIntensityThreshold) / max(EPS_COL, (maxIntensityThreshold - minIntensityThreshold)), 0.0, 1.0);
    #ifdef RN_MTOON_DEBUG_LITSHADERATE
      lightIntensities[i] = lightIntensity;
    #endif

    // Albedo color
    var col: vec3f = mix(shadeColor, litColor, lightIntensity);

    // Direct Light
    var lighting: vec3f = light.attenuatedIntensity;
    lighting = mix(lighting, vec3(max(EPS_COL, max(lighting.x, max(lighting.y, lighting.z)))), lightColorAttenuation); // color atten


    if(i > 0){
      lighting *= 0.5; // darken if additional light.
      lighting *= min(0.0, dotNL) + 1.0; // darken dotNL < 0 area by using half lambert
      // lighting *= shadowAttenuation; // darken if receiving shadow
      #ifdef RN_ALPHABLEND_ON
        lighting *= step(0.0, dotNL); // darken if transparent. Because Unity's transparent material can't receive shadowAttenuation.
      #endif
    }

    col *= lighting * RECIPROCAL_PI;
    lightings[i] = lighting;

    rt0 += vec4f(col, 0.0);

    lightAttenuation = 1.0;
  }


  // Indirect Light
  let indirectLightIntensity = get_indirectLightIntensity(materialSID, 0);
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
  var indirectLighting = mix(uniformedGi, passthroughGi, indirectLightIntensity);
  indirectLighting = mix(indirectLighting, vec3f(max(EPS_COL, max(indirectLighting.x, max(indirectLighting.y, indirectLighting.z)))), lightColorAttenuation); // color atten
  rt0 += vec4f(indirectLighting * litColor * RECIPROCAL_PI, 0.0);
  // rt0 = vec4f(min(rt0.xyz, litColor), rt0.w); // comment out if you want to PBR absolutely.


  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_COLOR_MIXED
      var outlineColor: vec3f = get_outlineColor(materialSID, 0);
      // outlineColor = srgbToLinear(outlineColor);
      let outlineLightingMix: f32 = get_outlineLightingMix(materialSID, 0);
      rt0 = vec4f(outlineColor * mix(vec3f(1.0), rt0.xyz, outlineLightingMix), rt0.w);
    #endif
  #else
    let rimFresnelPower: f32 = get_rimFresnelPower(materialSID, 0);
    let rimLift: f32 = get_rimLift(materialSID, 0);
    let rimColorFactor: vec3f = get_rimColor(materialSID, 0);
    let rimTextureColor: vec3f = textureSample(rimTexture, rimSampler, mainUv).xyz;
    let rimColor: vec3f = rimColorFactor * srgbToLinear(rimTextureColor);
    let rim: vec3f = pow(clamp(1.0 - dot(normal_inWorld, viewDirection) + rimLift, 0.0, 1.0), rimFresnelPower) * rimColor;

    var staticRimLighting = 1.0;
    let rimLightingMix: f32 = get_rimLightingMix(materialSID, 0);
    for (var i = 0u; i < /* shaderity: @{Config.maxLightNumber} */u; i++) {
      if (i >= lightNumber) { break; }

      if (i > 0) { staticRimLighting = 0.0; }

      let rimLighting: vec3f = mix(vec3f(staticRimLighting), lightings[i], vec3f(rimLightingMix));
      rt0 += vec4f(rim * rimLighting, 0.0);
    }

    // additive matcap
    let cameraUp: vec3f = get_cameraUp(0u, 0u); //solo datum
    let worldViewUp: vec3f = normalize(cameraUp - viewDirection * dot(viewDirection, cameraUp));
    let worldViewRight: vec3f = normalize(cross(viewDirection, worldViewUp));
    let matcapUv: vec2f = vec2f(dot(worldViewRight, normal_inWorld), dot(worldViewUp, normal_inWorld)) * 0.5 + 0.5;
    let matCapColor: vec3f = srgbToLinear(textureSample(matCapTexture, matCapSampler, matcapUv).xyz);
    rt0 += vec4f(matCapColor, 0.0);


    // Emission
    let emissionColor: vec3f = get_emissionColor(materialSID, 0);
    let emission: vec3f = srgbToLinear(textureSample(emissionTexture, emissionSampler, mainUv).xyz) * emissionColor;
    rt0 += vec4f(emission, 0.0);
  #endif


  // debug
  #ifdef RN_MTOON_DEBUG_NORMAL
    rt0 = vec4f(normal_inWorld * 0.5 + 0.5, alpha);

    rt0 = vec4f(srgbToLinear(rt0.xyz), rt0.w);
    return rt0;
  #elif defined(RN_MTOON_DEBUG_LITSHADERATE)
    rt0 = vec4f(0.0);
    for (var i = 0u; i < /* shaderity: @{Config.maxLightNumber} */u; i++) {
      if (i >= lightNumber) { break; }
      rt0 += vec4f(lightIntensities[i] * lightings[i], alpha);
    }

    rt0 = vec4f(srgbToLinear(rt0.xyz), rt0.w);
    return rt0;
  #endif


  // Wireframe

/* shaderity: @{wireframe} */

  let makeOutputSrgb = get_makeOutputSrgb(materialSID, 0);
  rt0 = vec4f(select(rt0.rgb, linearToSrgb(rt0.rgb), makeOutputSrgb), rt0.w);

  return rt0;
}
