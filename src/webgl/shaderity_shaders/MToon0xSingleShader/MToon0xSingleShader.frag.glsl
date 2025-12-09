

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */


const float EPS_COL = 0.00001;

/* shaderity: @{vertexIn} */
in vec3 v_normal_inView;

/* shaderity: @{prerequisites} */
/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */
/* shaderity: @{matricesGetters} */

/* shaderity: @{opticalDefinition} */
/* shaderity: @{pbrDefinition} */

/* shaderity: @{iblDefinition} */

uniform bool u_inverseEnvironment; // initialValue=false
uniform vec4 u_iblParameter; // initialValue=(1,1,1,1), isInternalSetting=true
uniform ivec2 u_hdriFormat; // initialValue=(0,0), isInternalSetting=true

uniform samplerCube u_diffuseEnvTexture; // initialValue=(5,black), isInternalSetting=true
uniform samplerCube u_specularEnvTexture; // initialValue=(6,black), isInternalSetting=true


const float PI_2 = 6.28318530718;

vec2 uvAnimation(vec2 origUv, float time, float uvAnimationMask, float uvAnimationScrollXSpeedFactor, float uvAnimationScrollYSpeedFactor, float uvAnimationRotationSpeedFactor) {
  float uvAnim = uvAnimationMask * time;
  vec2 uv = origUv;
  uv += vec2(uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor) * uvAnim;
  float rotateRad = uvAnimationRotationSpeedFactor * PI_2 * uvAnim;
  const vec2 rotatePivot = vec2(0.5);
  uv = mat2(cos(rotateRad), -sin(rotateRad), sin(rotateRad), cos(rotateRad)) * (uv - rotatePivot) + rotatePivot;
  return uv;
}

void main (){
  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_NONE
      discard;
    #endif
  #endif

  /* shaderity: @{mainPrerequisites} */

  // uv animation
  float uvAnimationMaskTexture = texture(u_uvAnimationMaskTexture, v_texcoord_0).r;
  float uvAnimationScrollXSpeedFactor = get_uvAnimationScrollXSpeedFactor(uint(materialSID), 0u);
  float uvAnimationScrollYSpeedFactor = get_uvAnimationScrollYSpeedFactor(uint(materialSID), 0u);
  float uvAnimationRotationSpeedFactor = get_uvAnimationRotationSpeedFactor(uint(materialSID), 0u);
  float time = get_time(0u, 0u);
  vec2 mainUv = uvAnimation(v_texcoord_0, time, uvAnimationMaskTexture, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);

  // main color
  vec4 litTextureColor = texture(u_litColorTexture, mainUv);
  vec4 litColorFactor = get_litColor(uint(materialSID), 0u);

  // alpha
  float alpha = 1.0;

  #ifdef RN_ALPHATEST_ON
    alpha = litTextureColor.a * litColorFactor.a;
    float cutoff = get_cutoff(uint(materialSID), 0u);
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
      vec3 outlineColor = get_outlineColor(uint(materialSID), 0u);
      rt0.xyz = outlineColor;

      rt0.xyz = srgbToLinear(rt0.xyz);

      return;
    #endif
  #endif

  // view vector
  vec3 viewPosition = get_viewPosition(uint(cameraSID));
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;
  vec3 viewDirection = normalize(viewVector);

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
  #ifdef RN_MTOON_HAS_BUMPMAP
    vec3 normal = texture(u_normalTexture, mainUv).xyz * 2.0 - 1.0;
    mat3 TBN = getTBN(normal_inWorld, v_tangent_inWorld, v_binormal_inWorld, viewDirection, mainUv);
    normal_inWorld = normalize(TBN * normal);
  #endif

  #ifdef RN_MTOON_IS_OUTLINE
    normal_inWorld *= -1.0;
  #endif


  // Lighting, Direct Light

  float shadowAttenuation = 1.0;
  // TODO: shadowmap computation

  float receiveShadowRate = get_receiveShadowRate(uint(materialSID), 0u);
  float lightAttenuation = shadowAttenuation * mix(1.0, shadowAttenuation, receiveShadowRate * texture(u_receiveShadowTexture, mainUv).r);

  float shadingGradeRate = get_shadingGradeRate(uint(materialSID), 0u);
  float shadingGrade = 1.0 - shadingGradeRate * (1.0 - texture(u_shadingGradeTexture, mainUv).r);
  float lightColorAttenuation = get_lightColorAttenuation(uint(materialSID), 0u);

  vec3 shadeColorFactor = get_shadeColor(uint(materialSID), 0u);
  vec3 shadeColor = shadeColorFactor * srgbToLinear(texture(u_shadeColorTexture, mainUv).xyz);

  vec3 litColor = litColorFactor.xyz * srgbToLinear(litTextureColor.xyz);

  float shadeShift = get_shadeShift(uint(materialSID), 0u);
  float shadeToony = get_shadeToony(uint(materialSID), 0u);

  vec3 lightings[/* shaderity: @{Config.maxLightNumber} */];
  #ifdef RN_MTOON_DEBUG_LITSHADERATE
    float lightIntensities[/* shaderity: @{Config.maxLightNumber} */];
  #endif
  for (int i = 0; i < /* shaderity: @{Config.maxLightNumber} */; i++) {
    if (i >= lightNumber) {
      break;
    }

    // Light
    Light light = getLight(i, v_position_inWorld.xyz);

    // lightAttenuation *= distanceAttenuation * spotEffect;
    float dotNL = dot(light.direction, normal_inWorld);
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
    vec3 lighting = light.attenuatedIntensity;
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

    rt0.xyz += col;

    lightAttenuation = 1.0;
  }


  // Indirect Light
  float indirectLightIntensity = get_indirectLightIntensity(uint(materialSID), 0u);
  vec3 worldUpVector = vec3(0.0, 1.0, 0.0);
  vec3 worldDownVector = vec3(0.0, -1.0, 0.0);
  vec4 iblParameter = get_iblParameter(uint(materialSID), 0u);
  float rot = iblParameter.w;
  float IBLDiffuseContribution = iblParameter.y;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  vec3 normal_forEnv = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  ivec2 hdriFormat = get_hdriFormat(uint(materialSID), 0u);
  vec3 rawGiUp = getIBLIrradiance(worldUpVector, iblParameter, hdriFormat) * IBLDiffuseContribution;
  vec3 rawGiDown = getIBLIrradiance(worldDownVector, iblParameter, hdriFormat) * IBLDiffuseContribution;
  vec3 rawGiNormal = getIBLIrradiance(normal_forEnv, iblParameter, hdriFormat) * IBLDiffuseContribution;
  vec3 uniformedGi = (rawGiUp + rawGiDown) / 2.0;
  vec3 passthroughGi = rawGiNormal;
  vec3 indirectLighting = mix(uniformedGi, passthroughGi, indirectLightIntensity);
  indirectLighting = mix(indirectLighting, vec3(max(EPS_COL, max(indirectLighting.x, max(indirectLighting.y, indirectLighting.z)))), lightColorAttenuation); // color atten

  rt0.xyz += indirectLighting * litColor * RECIPROCAL_PI;
  // rt0.xyz = min(rt0.xyz, litColor); // comment out if you want to PBR absolutely.


  #ifdef RN_MTOON_IS_OUTLINE
    #ifdef RN_MTOON_OUTLINE_COLOR_MIXED
      vec3 outlineColor = get_outlineColor(uint(materialSID), 0u);
      // outlineColor = srgbToLinear(outlineColor);
      float outlineLightingMix = get_outlineLightingMix(uint(materialSID), 0u);
      rt0.xyz = outlineColor * mix(vec3(1.0), rt0.xyz, outlineLightingMix);
    #endif
  #else
    float rimFresnelPower = get_rimFresnelPower(uint(materialSID), 0u);
    float rimLift = get_rimLift(uint(materialSID), 0u);
    vec3 rimColorFactor = get_rimColor(uint(materialSID), 0u);
    vec3 rimTextureColor = texture(u_rimTexture, mainUv).xyz;
    vec3 rimColor = rimColorFactor * srgbToLinear(rimTextureColor);
    vec3 rim = pow(clamp(1.0 - dot(normal_inWorld, viewDirection) + rimLift, 0.0, 1.0), rimFresnelPower) * rimColor;

    float staticRimLighting = 1.0;
    float rimLightingMix = get_rimLightingMix(uint(materialSID), 0u);
    for (int i = 0; i < /* shaderity: @{Config.maxLightNumber} */; i++) {
      if (i >= lightNumber) break;

      if(i > 0) staticRimLighting = 0.0;

      vec3 rimLighting = mix(vec3(staticRimLighting), lightings[i], vec3(rimLightingMix));
      rt0.xyz += rim * rimLighting;
    }

    // additive matcap
    vec3 cameraUp = get_cameraUp(0u, 0u); //solo datum
    vec3 worldViewUp = normalize(cameraUp - viewDirection * dot(viewDirection, cameraUp));
    vec3 worldViewRight = normalize(cross(viewDirection, worldViewUp));
    vec2 matcapUv = vec2(dot(worldViewRight, normal_inWorld), dot(worldViewUp, normal_inWorld)) * 0.5 + 0.5;
    vec3 matCapColor = srgbToLinear(texture(u_matCapTexture, matcapUv).xyz);
    rt0.xyz += matCapColor;


    // Emission
    vec3 emissionColor = get_emissionColor(uint(materialSID), 0u);
    vec3 emission = srgbToLinear(texture(u_emissionTexture, mainUv).xyz) * emissionColor;
    rt0.xyz += emission;
  #endif


  // debug
  #ifdef RN_MTOON_DEBUG_NORMAL
    rt0 = vec4(normal_inWorld * 0.5 + 0.5, alpha);

    rt0.xyz = srgbToLinear(rt0.xyz);

    return;
  #elif defined(RN_MTOON_DEBUG_LITSHADERATE)
    rt0 = vec4(0.0);
    for (int i = 0; i < /* shaderity: @{Config.maxLightNumber} */; i++) {
      if (i >= lightNumber) break;
      rt0 += vec4(lightIntensities[i] * lightings[i], alpha);
    }

    rt0.xyz = srgbToLinear(rt0.xyz);

    return;
  #endif


  // Wireframe
  /* shaderity: @{wireframe} */

  /* shaderity: @{outputSrgb} */


}
