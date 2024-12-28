/* shaderity: @{definitions} */
#pragma shaderity: require(../common/vertexOutput.wgsl)
#pragma shaderity: require(../common/prerequisites.wgsl)

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

const EPS_COL: f32 = 0.00001;

#pragma shaderity: require(../common/opticalDefinition.wgsl)

fn edge_ratio(bary3: vec3f, wireframeWidthInner: f32, wireframeWidthRelativeScale: f32) -> f32 {
  let d: vec3f = fwidth(bary3);
  let x: vec3f = bary3 + vec3f(1.0 - wireframeWidthInner) * d;
  let a3: vec3f = smoothstep(vec3f(0.0), d, x);
  let factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

fn linearToSrgb(linearColor: vec3f) -> vec3f {
  return pow(linearColor, vec3f(1.0/2.2));
}

fn srgbToLinear(srgbColor: vec3f) -> vec3f {
  return pow(srgbColor, vec3f(2.2));
}

#pragma shaderity: require(../common/perturbedNormal.wgsl)

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

  #pragma shaderity: require(../common/mainPrerequisites.wgsl)


  // TODO
  // uv transform

  // TODO
  // uv animation

  // main color
  let litTextureColor: vec4f = textureSample(litColorTexture, litColorSampler, input.texcoord_0);
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
  let viewPosition: vec3f = get_viewPosition(cameraSID, 0);
  let viewVector: vec3f = viewPosition - input.position_inWorld.xyz;

  // Normal
  var normal_inWorld: vec3f = normalize(input.normal_inWorld);
  #ifdef RN_MTOON_HAS_BUMPMAP
    let normal: vec3f = textureSample(normalTexture, normalSampler, input.texcoord_0).xyz * 2.0 - 1.0;
    let TBN: mat3x3<f32> = getTBN(normal_inWorld, input, viewVector, input.texcoord_0, isFront);
    normal_inWorld = normalize(TBN * normal);
  #endif

  #ifdef RN_MTOON_IS_OUTLINE
    normal_inWorld *= -1.0;
  #endif


  // Lighting, Direct Light

  let shadowAttenuation = 1.0;
  // TODO: shadowmap computation

  let receiveShadowRate: f32 = get_receiveShadowRate(materialSID, 0);
  var lightAttenuation: f32 = shadowAttenuation * mix(1.0, shadowAttenuation, receiveShadowRate * textureSample(receiveShadowTexture, receiveShadowSampler, input.texcoord_0).r);

  let shadingGradeRate: f32 = get_shadingGradeRate(materialSID, 0);
  let shadingGrade: f32 = 1.0 - shadingGradeRate * (1.0 - textureSample(shadingGradeTexture, shadingGradeSampler, input.texcoord_0).r);
  let lightColorAttenuation: f32 = get_lightColorAttenuation(materialSID, 0);

  let shadeColorFactor: vec3f = get_shadeColor(materialSID, 0);
  var shadeColor: vec3f = shadeColorFactor * textureSample(shadeColorTexture, shadeColorSampler, input.texcoord_0).xyz;
  shadeColor = srgbToLinear(shadeColor.xyz);

  var litColor: vec3f = litColorFactor.xyz * litTextureColor.xyz;
  litColor = srgbToLinear(litColor.xyz);


  let shadeShift: f32 = get_shadeShift(materialSID, 0);
  let shadeToony: f32 = get_shadeToony(materialSID, 0);

  var lightings: array<vec3<f32>, /* shaderity: @{Config.maxLightNumberInShader} */>;
  #ifdef RN_MTOON_DEBUG_LITSHADERATE
    var lightIntensities[/* shaderity: @{Config.maxLightNumberInShader} */]: array<f32>;
  #endif
  let lightNumber = u32(get_lightNumber(0u, 0u));
  for (var i = 0u; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
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
  // var indirectLighting: vec3f = get_ambientColor(materialSID, 0);
  // indirectLighting = srgbToLinear(indirectLighting);
  // indirectLighting = mix(indirectLighting, vec3f(max(EPS_COL, max(indirectLighting.x, max(indirectLighting.y, indirectLighting.z)))), lightColorAttenuation); // color atten
  // // TODO: use ShadeIrad in www.ppsloan.org/publications/StupidSH36.pdf

  // rt0 += vec4f(indirectLighting * litColor, 0.0);
  // rt0 = vec4f(min(rt0.xyz, litColor), rt0.w); // comment out if you want to PBR absolutely.


  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_COLOR_MIXED
      var outlineColor: vec3f = get_outlineColor(materialSID, 0);
      outlineColor = srgbToLinear(outlineColor);
      let outlineLightingMix: f32 = get_outlineLightingMix(materialSID, 0);
      rt0 = vec4f(outlineColor * mix(vec3f(1.0), rt0.xyz, outlineLightingMix), rt0.w);
    #endif
  #else
    let viewDirection: vec3f = normalize(viewVector);

    let rimFresnelPower: f32 = get_rimFresnelPower(materialSID, 0);
    let rimLift: f32 = get_rimLift(materialSID, 0);
    let rimColorFactor: vec3f = get_rimColor(materialSID, 0);
    let rimTextureColor: vec3f = textureSample(rimTexture, rimSampler, input.texcoord_0).xyz;
    let rimColor: vec3f = srgbToLinear(rimColorFactor * rimTextureColor);
    let rim: vec3f = pow(clamp(1.0 - dot(normal_inWorld, viewDirection) + rimLift, 0.0, 1.0), rimFresnelPower) * rimColor;

    var staticRimLighting = 1.0;
    let rimLightingMix: f32 = get_rimLightingMix(materialSID, 0);
    for (var i = 0u; i < /* shaderity: @{Config.maxLightNumberInShader} */u; i++) {
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
    let emission: vec3f = srgbToLinear(textureSample(emissionTexture, emissionSampler, input.texcoord_0).xyz) * emissionColor;
    rt0 += vec4f(emission, 0.0);
  #endif


  // debug
  #ifdef RN_MTOON_DEBUG_NORMAL
    rt0 = vec4f(normal_inWorld * 0.5 + 0.5, alpha);

    rt0 = vec4f(srgbToLinear(rt0.xyz), rt0.w);
    return rt0;
  #elif defined(RN_MTOON_DEBUG_LITSHADERATE)
    rt0 = vec4f(0.0);
    for (var i = 0u; i < /* shaderity: @{Config.maxLightNumberInShader} */u; i++) {
      if (i >= lightNumber) { break; }
      rt0 += vec4f(lightIntensities[i] * lightings[i], alpha);
    }

    rt0 = vec4f(srgbToLinear(rt0.xyz), rt0.w);
    return rt0;
  #endif


  // Wireframe
  let threshold = 0.001;
  let wireframe: vec3f = get_wireframe(materialSID, 0);
  let wireframeWidthInner = wireframe.z;
  let wireframeWidthRelativeScale = 1.0;
  if (wireframe.x > 0.5 && wireframe.y < 0.5) {
    rt0.a = 0.0;
  }
  var wireframeResult = rt0;
  let wireframeColor = vec4f(0.2, 0.75, 0.0, 1.0);
  let edgeRatio: f32 = edge_ratio(input.baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  let edgeRatioModified: f32 = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  wireframeResult = vec4f(wireframeColor.rgb * edgeRatioModified + rt0.rgb * (1.0 - edgeRatioModified), wireframeResult.a);
  wireframeResult.a = max(rt0.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

  if (wireframe.x > 0.5) {
    rt0 = wireframeResult;
    if (wireframe.y < 0.5 && rt0.a == 0.0) {
      discard;
    }
  }

  let makeOutputSrgb = get_makeOutputSrgb(materialSID, 0);
  rt0 = vec4f(select(rt0.rgb, linearToSrgb(rt0.rgb), makeOutputSrgb), rt0.w);

  return rt0;
}
