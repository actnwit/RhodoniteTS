#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

const float EPS_COL = 0.00001;

in vec2 v_texcoord_0;
in vec3 v_baryCentricCoord;
in vec3 v_normal_inView;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
#ifdef RN_USE_TANGENT_ATTRIBUTE
  in vec3 v_tangent_inWorld;
  in vec3 v_binormal_inWorld; // bitangent_inWorld
#endif

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

float edge_ratio(vec3 bary3, float wireframeWidthInner, float wireframeWidthRelativeScale) {
  vec3 d = fwidth(bary3);
  vec3 x = bary3+vec3(1.0 - wireframeWidthInner)*d;
  vec3 a3 = smoothstep(vec3(0.0), d, x);
  float factor = min(min(a3.x, a3.y), a3.z);

  return clamp((1.0 - factor), 0.0, 1.0);
}

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

#pragma shaderity: require(../common/normal.glsl)

void main (){
  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      discard;
    #endif
  #endif

  #pragma shaderity: require(../common/mainPrerequisites.glsl)


  // TODO
  // uv transform

  // TODO
  // uv animation

  // main color
  vec4 litTextureColor = texture(u_litColorTexture, v_texcoord_0);
  vec4 litColorFactor = get_litColor(materialSID, 0);

  // alpha
  float alpha = 1.0;

  #ifdef RN_ALPHATEST_ON
    alpha = litTextureColor.a * litColorFactor.a;
    float cutoff = get_cutoff(materialSID, 0);
    if(alpha < cutoff) discard;
  #elif defined(RN_ALPHABLEND_ON)
    alpha = litTextureColor.a * litColorFactor.a;
  #endif

  if (alpha < 0.01) {
    discard;
  }else{
    rt0.w = alpha;
  }


  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_COLOR_FIXED
      vec3 outlineColor = get_outlineColor(materialSID, 0);
      rt0.xyz = outlineColor;

      rt0.xyz = srgbToLinear(rt0.xyz);
      #pragma shaderity: require(../common/glFragColor.glsl)
      return;
    #endif
  #endif

  // view vector
  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];
  vec3 viewPosition = get_viewPosition(cameraSID, 0);
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  #ifdef RN_MTOON_HAS_BUMPMAP
    normal_inWorld = perturb_normal(normal_inWorld, viewVector, v_texcoord_0);
  #endif

  #ifdef RN_MTOON_IS_OUTLINE
    normal_inWorld *= -1.0;
  #endif


  // Lighting, Direct Light

  float shadowAttenuation = 1.0;
  // TODO: shadowmap computation

  float receiveShadowRate = get_receiveShadowRate(materialSID, 0);
  float lightAttenuation = shadowAttenuation * mix(1.0, shadowAttenuation, receiveShadowRate * texture(u_receiveShadowTexture, v_texcoord_0).r);

  float shadingGradeRate = get_shadingGradeRate(materialSID, 0);
  float shadingGrade = 1.0 - shadingGradeRate * (1.0 - texture(u_shadingGradeTexture, v_texcoord_0).r);
  float lightColorAttenuation = get_lightColorAttenuation(materialSID, 0);

  vec3 shadeColorFactor = get_shadeColor(materialSID, 0);
  vec3 shadeColor = shadeColorFactor * texture(u_shadeColorTexture, v_texcoord_0).xyz;
  shadeColor.xyz = srgbToLinear(shadeColor.xyz);

  vec3 litColor = litColorFactor.xyz * litTextureColor.xyz;
  litColor.xyz = srgbToLinear(litColor.xyz);


  float shadeShift = get_shadeShift(materialSID, 0);
  float shadeToony = get_shadeToony(materialSID, 0);

  vec3 lightings[/* shaderity: @{Config.maxLightNumberInShader} */];
  #ifdef RN_MTOON_DEBUG_LITSHADERATE
    float lightIntensities[/* shaderity: @{Config.maxLightNumberInShader} */];
  #endif
  for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Rn_Light
    vec4 gotLightDirection = get_lightDirection(0.0, i);
    vec4 gotLightIntensity = get_lightIntensity(0.0, i); //light color
    vec4 gotLightPosition = get_lightPosition(0.0, i);
    vec3 lightDirection = gotLightDirection.xyz;
    vec3 lightColor = gotLightIntensity.xyz;
    vec3 lightPosition = gotLightPosition.xyz;
    float lightType = gotLightPosition.w;
    float spotCosCutoff = gotLightDirection.w;
    float spotExponent = gotLightIntensity.w;

    float distanceAttenuation = 1.0;
    if (lightType > 0.75) { // is point light or spotlight
      lightDirection = normalize(lightPosition.xyz - v_position_inWorld.xyz);

      float distance = dot(lightPosition - v_position_inWorld.xyz, lightPosition - v_position_inWorld.xyz);
      distanceAttenuation = 1.0 / pow(distance, 2.0);
    }

    float spotEffect = 1.0;
    if (lightType > 1.75) { // is spotlight
      spotEffect *= dot(gotLightDirection.xyz, lightDirection);
      if (spotEffect > spotCosCutoff) {
        spotEffect *= pow(clamp(spotEffect, 0.0, 1.0), spotExponent);
      } else {
        spotEffect = 0.0;
      }
    }

    // lightAttenuation *= distanceAttenuation * spotEffect;
    float dotNL = dot(lightDirection, normal_inWorld);
    float lightIntensity = dotNL * 0.5 + 0.5; // from [-1, +1] to [0, 1]
    lightIntensity = lightIntensity * lightAttenuation; // TODO: receive shadow
    lightIntensity = lightIntensity * shadingGrade; // darker
    lightIntensity = lightIntensity * 2.0 - 1.0; // from [0, 1] to [-1, +1]

    // tooned. mapping from [minIntensityThreshold, maxIntensityThreshold] to [0, 1]
    float maxIntensityThreshold = mix(1.0, shadeShift, shadeToony);
    float minIntensityThreshold = shadeShift;
    lightIntensity = clamp((lightIntensity - minIntensityThreshold) / max(EPS_COL, (maxIntensityThreshold - minIntensityThreshold)), 0.0, 1.0);
    #ifdef RN_MTOON_DEBUG_LITSHADERATE
      lightIntensities[i] = lightIntensity;
    #endif

    // Albedo color
    vec3 col = mix(shadeColor, litColor, lightIntensity);

    // Direct Light
    vec3 lighting = lightColor;
    lighting = mix(lighting, vec3(max(EPS_COL, max(lighting.x, max(lighting.y, lighting.z)))), lightColorAttenuation); // color atten


    if(i > 0){
      lighting *= 0.5; // darken if additional light.
      lighting *= min(0.0, dotNL) + 1.0; // darken dotNL < 0 area by using half lambert
      // lighting *= shadowAttenuation; // darken if receiving shadow
      #ifdef RN_ALPHABLEND_ON
        lighting *= step(0.0, dotNL); // darken if transparent. Because Unity's transparent material can't receive shadowAttenuation.
      #endif
    }

    col *= lighting;
    lightings[i] = lighting;

    rt0.xyz += col;

    lightAttenuation = 1.0;
  }


  // Indirect Light
  vec3 indirectLighting = get_ambientColor(materialSID, 0);
  indirectLighting = srgbToLinear(indirectLighting);
  indirectLighting = mix(indirectLighting, vec3(max(EPS_COL, max(indirectLighting.x, max(indirectLighting.y, indirectLighting.z)))), lightColorAttenuation); // color atten
  // TODO: use ShadeIrad in www.ppsloan.org/publications/StupidSH36.pdf

  rt0.xyz += indirectLighting * litColor;
  rt0.xyz = min(rt0.xyz, litColor); // comment out if you want to PBR absolutely.


  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_COLOR_MIXED
      vec3 outlineColor = get_outlineColor(materialSID, 0);
      outlineColor = srgbToLinear(outlineColor);
      float outlineLightingMix = get_outlineLightingMix(materialSID, 0);
      rt0.xyz = outlineColor * mix(vec3(1.0), rt0.xyz, outlineLightingMix);
    #endif
  #else
    vec3 viewDirection = normalize(viewVector);

    float rimFresnelPower = get_rimFresnelPower(materialSID, 0);
    float rimLift = get_rimLift(materialSID, 0);
    vec3 rimColorFactor = get_rimColor(materialSID, 0);
    vec3 rimTextureColor = texture(u_rimTexture, v_texcoord_0).xyz;
    vec3 rimColor = srgbToLinear(rimColorFactor * rimTextureColor);
    vec3 rim = pow(clamp(1.0 - dot(normal_inWorld, viewDirection) + rimLift, 0.0, 1.0), rimFresnelPower) * rimColor;

    float staticRimLighting = 1.0;
    float rimLightingMix = get_rimLightingMix(materialSID, 0);
    for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
      if (i >= lightNumber) break;

      if(i > 0) staticRimLighting = 0.0;

      vec3 rimLighting = mix(vec3(staticRimLighting), lightings[i], vec3(rimLightingMix));
      rt0.xyz += rim * rimLighting;
    }

    // additive matcap
    vec3 cameraUp = get_cameraUp(0.0, 0); //solo datum
    vec3 worldViewUp = normalize(cameraUp - viewDirection * dot(viewDirection, cameraUp));
    vec3 worldViewRight = normalize(cross(viewDirection, worldViewUp));
    vec2 matcapUv = vec2(dot(worldViewRight, normal_inWorld), dot(worldViewUp, normal_inWorld)) * 0.5 + 0.5;
    vec3 matCapColor = srgbToLinear(texture(u_matCapTexture, matcapUv).xyz);
    rt0.xyz += matCapColor;


    // Emission
    vec3 emissionColor = get_emissionColor(materialSID, 0);
    vec3 emission = srgbToLinear(texture(u_emissionTexture, v_texcoord_0).xyz) * emissionColor;
    rt0.xyz += emission;
  #endif


  // debug
  #ifdef RN_MTOON_DEBUG_NORMAL
    rt0 = vec4(normal_inWorld * 0.5 + 0.5, alpha);

    rt0.xyz = srgbToLinear(rt0.xyz);
    #pragma shaderity: require(../common/glFragColor.glsl)
    return;
  #elif defined(RN_MTOON_DEBUG_LITSHADERATE)
    rt0 = vec4(0.0);
    for (int i = 0; i < /* shaderity: @{Config.maxLightNumberInShader} */; i++) {
      if (i >= lightNumber) break;
      rt0 += vec4(lightIntensities[i] * lightings[i], alpha);
    }

    rt0.xyz = srgbToLinear(rt0.xyz);
    #pragma shaderity: require(../common/glFragColor.glsl)
    return;
  #endif


  // Wireframe
  float threshold = 0.001;
  vec3 wireframe = get_wireframe(materialSID, 0);
  float wireframeWidthInner = wireframe.z;
  float wireframeWidthRelativeScale = 1.0;
  if (wireframe.x > 0.5 && wireframe.y < 0.5) {
    rt0.a = 0.0;
  }
  vec4 wireframeResult = rt0;
  vec4 wireframeColor = vec4(0.2, 0.75, 0.0, 1.0);
  float edgeRatio = edge_ratio(v_baryCentricCoord, wireframeWidthInner, wireframeWidthRelativeScale);
  float edgeRatioModified = mix(step(threshold, edgeRatio), clamp(edgeRatio*4.0, 0.0, 1.0), wireframeWidthInner / wireframeWidthRelativeScale/4.0);
  // if r0.a is 0.0, it is wireframe not on shaded
  wireframeResult.rgb = wireframeColor.rgb * edgeRatioModified + rt0.rgb * (1.0 - edgeRatioModified);
  wireframeResult.a = max(rt0.a, wireframeColor.a * mix(edgeRatioModified, pow(edgeRatioModified, 100.0), wireframeWidthInner / wireframeWidthRelativeScale/1.0));

  if (wireframe.x > 0.5) {
    rt0 = wireframeResult;
    if (wireframe.y < 0.5 && rt0.a == 0.0) {
      discard;
    }
  }

  #pragma shaderity: require(../common/outputSrgb.glsl)

  #pragma shaderity: require(../common/glFragColor.glsl)
}
