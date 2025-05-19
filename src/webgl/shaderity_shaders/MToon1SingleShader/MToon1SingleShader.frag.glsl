

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

in vec2 v_texcoord_0;
in vec2 v_texcoord_1;
in vec2 v_texcoord_2;
in vec3 v_baryCentricCoord;
in vec3 v_normal_inView;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in float v_instanceInfo;
#ifdef RN_USE_TANGENT
  in vec3 v_tangent_inWorld;
  in vec3 v_binormal_inWorld; // bitangent_inWorld
#endif

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

/* shaderity: @{opticalDefinition} */
/* shaderity: @{pbrDefinition} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{iblDefinition} */

uniform vec4 u_baseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_baseColorTexture; // initialValue=(1,white)
uniform int u_baseColorTexcoordIndex; // initialValue=0
uniform vec2 u_baseColorTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_baseColorTextureTransformOffset; // initialValue=(0,0)
uniform float u_baseColorTextureTransformRotation; // initialValue=0

uniform sampler2D u_normalTexture; // initialValue=(2,black)
uniform vec2 u_normalTextureTransformScale; // initialValue=(1,1)
uniform vec2 u_normalTextureTransformOffset; // initialValue=(0,0)
uniform float u_normalTextureTransformRotation; // initialValue=0
uniform int u_normalTexcoordIndex; // initialValue=0
uniform float u_normalScale; // initialValue=(1)

uniform float u_shadingShiftFactor; // initialValue=0.0
uniform sampler2D u_shadingShiftTexture; // initialValue=(3,black)
uniform int u_shadingShiftTexcoordIndex; // initialValue=0
uniform float u_shadingShiftTextureScale; // initialValue=1.0

uniform float u_shadingToonyFactor; // initialValue=0.9
uniform vec3 u_shadeColorFactor; // initialValue=(0,0,0)
uniform sampler2D u_shadeMultiplyTexture; // initialValue=(4,white)
uniform int u_shadeMultiplyTexcoordIndex; // initialValue=0

uniform samplerCube u_diffuseEnvTexture; // initialValue=(5,black), isInternalSetting=true
uniform samplerCube u_specularEnvTexture; // initialValue=(6,black), isInternalSetting=true

uniform float u_giEqualizationFactor; // initialValue=0.9

uniform sampler2D u_matcapTexture; // initialValue=(8,black)
uniform vec3 u_matcapFactor; // initialValue=(1,1,1)
uniform vec3 u_parametricRimColorFactor; // initialValue=(0,0,0)
uniform float u_parametricRimFresnelPowerFactor; // initialValue=5.0
uniform float u_parametricRimLiftFactor; // initialValue=0.0
uniform sampler2D u_rimMultiplyTexture; // initialValue=(9,white)
uniform int u_rimMultiplyTexcoordIndex; // initialValue=0
uniform float u_rimLightingMixFactor; // initialValue=1.0

uniform vec3 u_emissiveFactor; // initialValue=(0,0,0)
uniform sampler2D u_emissiveTexture; // initialValue=(10,white)
uniform int u_emissiveTexcoordIndex; // initialValue=0

uniform vec3 u_outlineColorFactor; // initialValue=(0,0,0)
uniform float u_outlineLightingMixFactor; // initialValue=1.0

uniform sampler2D u_uvAnimationMaskTexture; // initialValue=(11,white)
uniform int u_uvAnimationMaskTexcoordIndex; // initialValue=0
uniform float u_uvAnimationScrollXSpeedFactor; // initialValue=0.0
uniform float u_uvAnimationScrollYSpeedFactor; // initialValue=0.0
uniform float u_uvAnimationRotationSpeedFactor; // initialValue=0.0

uniform bool u_inverseEnvironment; // initialValue=false
uniform vec4 u_iblParameter; // initialValue=(1,1,1,1), isInternalSetting=true
uniform ivec2 u_hdriFormat; // initialValue=(0,0), isInternalSetting=true
uniform float u_alphaCutoff; // initialValue=0.5
uniform bool u_makeOutputSrgb; // initialValue=false

float linearstep(float a, float b, float t) {
  return clamp((t - a) / (b - a), 0.0, 1.0);
}

vec2 getTexcoord(int texcoordIndex) {
  vec2 texcoord;
  if(texcoordIndex == 2){
    texcoord = v_texcoord_2;
  } else if(texcoordIndex == 1){
    texcoord = v_texcoord_1;
  }else{
    texcoord = v_texcoord_0;
  }
  return texcoord;
}

vec2 uvAnimation(vec2 origUv, float time, float uvAnimMask, float uvAnimationScrollXSpeedFactor, float uvAnimationScrollYSpeedFactor, float uvAnimationRotationSpeedFactor) {
  float scrollX = uvAnimationScrollXSpeedFactor * time;
  float scrollY = uvAnimationScrollYSpeedFactor * time;
  float rotation = uvAnimationRotationSpeedFactor * time;
  float rotationCos = cos(rotation * uvAnimMask);
  float rotationSin = sin(rotation * uvAnimMask);
  vec2 uv = mat2(rotationCos, -rotationSin, rotationSin, rotationCos) * (origUv - vec2(0.5)) + vec2(0.5);
  uv += vec2(scrollX, scrollY) * uvAnimMask;
  return uv;
}

#pragma shaderity: require(../common/perturbedNormal.glsl)

void main() {
  /* shaderity: @{mainPrerequisites} */

  rt0 = vec4(0.0, 0.0, 0.0, 1.0);

  // uv animation
  float uvAnimationScrollXSpeedFactor = get_uvAnimationScrollXSpeedFactor(materialSID, 0);
  float uvAnimationScrollYSpeedFactor = get_uvAnimationScrollYSpeedFactor(materialSID, 0);
  float uvAnimationRotationSpeedFactor = get_uvAnimationRotationSpeedFactor(materialSID, 0);
  int uvAnimationMaskTexcoordIndex = get_uvAnimationMaskTexcoordIndex(materialSID, 0);
  vec2 uvAnimationMaskTexcoord = getTexcoord(uvAnimationMaskTexcoordIndex);
  float uvAnimMask = texture(u_uvAnimationMaskTexture, uvAnimationMaskTexcoord).b;
  float time = get_time(0.0, 0);

  // base color
  vec2 baseColorTextureTransformScale = get_baseColorTextureTransformScale(materialSID, 0);
  vec2 baseColorTextureTransformOffset = get_baseColorTextureTransformOffset(materialSID, 0);
  float baseColorTextureTransformRotation = get_baseColorTextureTransformRotation(materialSID, 0);
  int baseColorTexcoordIndex = get_baseColorTexcoordIndex(materialSID, 0);
  vec2 baseColorTexcoord = getTexcoord(baseColorTexcoordIndex);
  baseColorTexcoord = uvAnimation(baseColorTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  vec2 baseColorTexUv = uvTransform(baseColorTextureTransformScale, baseColorTextureTransformOffset, baseColorTextureTransformRotation, baseColorTexcoord);
  vec4 baseColorTexture = texture(u_baseColorTexture, baseColorTexUv);
  baseColorTexture.rgb = srgbToLinear(baseColorTexture.rgb);
  vec4 baseColorFactor = get_baseColorFactor(materialSID, 0);
  vec3 baseColorTerm = baseColorTexture.rgb * baseColorFactor.rgb;

  // shade color
  vec3 shadeColorFactor = get_shadeColorFactor(materialSID, 0);
  int shadeMultiplyTexcoordIndex = get_shadeMultiplyTexcoordIndex(materialSID, 0);
  vec2 shadeMultiplyTexcoord = getTexcoord(shadeMultiplyTexcoordIndex);
  shadeMultiplyTexcoord = uvAnimation(shadeMultiplyTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  vec4 shadeMultiplyTexture = texture(u_shadeMultiplyTexture, shadeMultiplyTexcoord);
  shadeMultiplyTexture.rgb = srgbToLinear(shadeMultiplyTexture.rgb);
  vec3 shadeColorTerm = shadeColorFactor * shadeMultiplyTexture.rgb;

  // shading shift
  int shadingShiftTexcoordIndex = get_shadingShiftTexcoordIndex(materialSID, 0);
  vec2 shadingShiftTexcoord = getTexcoord(shadingShiftTexcoordIndex);
  shadingShiftTexcoord = uvAnimation(shadingShiftTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  float shadingShiftTexture = texture(u_shadingShiftTexture, shadingShiftTexcoord).r;
  float shadingShiftTextureScale = get_shadingShiftTextureScale(materialSID, 0);

  // emissive
  vec3 emissiveFactor = get_emissiveFactor(materialSID, 0);
  int emissiveTexcoordIndex = get_emissiveTexcoordIndex(materialSID, 0);
  vec2 emissiveTexcoord = getTexcoord(emissiveTexcoordIndex);
  emissiveTexcoord = uvAnimation(emissiveTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  vec4 emissiveTexture = texture(u_emissiveTexture, emissiveTexcoord);
  emissiveTexture.rgb = srgbToLinear(emissiveTexture.rgb);
  vec3 emissive = emissiveFactor * emissiveTexture.rgb;

  // alpha
  float alpha = baseColorTexture.a * baseColorFactor.a;
#ifdef RN_ALPHATEST_ON
  float cutoff = get_alphaCutoff(materialSID, 0);
  if(alpha < cutoff) discard;
#endif

  // view vector
  vec3 viewPosition = get_viewPosition(cameraSID, 0);
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;
  vec3 viewDirection = normalize(viewVector);

  // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
#ifdef RN_USE_NORMAL_TEXTURE
  vec2 normalTextureTransformScale = get_normalTextureTransformScale(materialSID, 0);
  vec2 normalTextureTransformOffset = get_normalTextureTransformOffset(materialSID, 0);
  float normalTextureTransformRotation = get_normalTextureTransformRotation(materialSID, 0);
  int normalTexcoordIndex = get_normalTexcoordIndex(materialSID, 0);
  vec2 normalTexcoord = getTexcoord(normalTexcoordIndex);
  normalTexcoord = uvAnimation(normalTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  vec2 normalTexUv = uvTransform(normalTextureTransformScale, normalTextureTransformOffset, normalTextureTransformRotation, normalTexcoord);
  vec3 normal = texture(u_normalTexture, normalTexUv).xyz * 2.0 - 1.0;
  mat3 TBN = getTBN(normal_inWorld, viewDirection, normalTexUv);
  normal_inWorld = normalize(TBN * normal);
#endif

#ifdef RN_MTOON_IS_OUTLINE
  normal_inWorld *= -1.0;
#endif

  // direct lighting
  // https://github.com/vrm-c/vrm-specification/blob/282edef7b8de6044d782afdab12b14bd8ccf0630/specification/VRMC_materials_mtoon-1.0/README.ja.md#implementation
  vec3 directLighting = vec3(0.0);
  for (int i = 0; i < lightNumber; i++) {
    Light light = getLight(i, v_position_inWorld.xyz);
    float shading = dot(light.direction, normal_inWorld);
    float shadingShiftFactor = get_shadingShiftFactor(materialSID, 0);
    shading += shadingShiftFactor + shadingShiftTexture * shadingShiftTextureScale;
    float shadingToonyFactor = get_shadingToonyFactor(materialSID, 0);
    shading = linearstep(-1.0 + shadingToonyFactor, 1.0 - shadingToonyFactor, shading);

    vec3 color = mix(shadeColorTerm, baseColorTerm, shading);
    color = color * light.attenuatedIntensity * RECIPROCAL_PI;
    directLighting += light.attenuatedIntensity;
    rt0.xyz += color;
  }

  // indirect lighting
  // https://github.com/vrm-c/vrm-specification/blob/282edef7b8de6044d782afdab12b14bd8ccf0630/specification/VRMC_materials_mtoon-1.0/README.ja.md#implementation-1
  float giEqualizationFactor = get_giEqualizationFactor(materialSID, 0);
  vec3 worldUpVector = vec3(0.0, 1.0, 0.0);
  vec3 worldDownVector = vec3(0.0, -1.0, 0.0);
  vec4 iblParameter = get_iblParameter(materialSID, 0);
  float rot = iblParameter.w;
  float IBLDiffuseContribution = iblParameter.y;
  mat3 rotEnvMatrix = mat3(cos(rot), 0.0, -sin(rot), 0.0, 1.0, 0.0, sin(rot), 0.0, cos(rot));
  vec3 normal_forEnv = getNormalForEnv(rotEnvMatrix, normal_inWorld, materialSID);
  ivec2 hdriFormat = get_hdriFormat(materialSID, 0);
  vec3 rawGiUp = getIBLIrradiance(worldUpVector, iblParameter, hdriFormat) * IBLDiffuseContribution;
  vec3 rawGiDown = getIBLIrradiance(worldDownVector, iblParameter, hdriFormat) * IBLDiffuseContribution;
  vec3 rawGiNormal = getIBLIrradiance(normal_forEnv, iblParameter, hdriFormat) * IBLDiffuseContribution;
  vec3 uniformedGi = (rawGiUp + rawGiDown) / 2.0;
  vec3 passthroughGi = rawGiNormal;
  vec3 gi = mix(uniformedGi, passthroughGi, giEqualizationFactor);
  rt0.xyz += gi * baseColorTerm * RECIPROCAL_PI;

  // rim lighting
  // https://github.com/vrm-c/vrm-specification/blob/282edef7b8de6044d782afdab12b14bd8ccf0630/specification/VRMC_materials_mtoon-1.0/README.ja.md#implementation-2
  vec3 rim = vec3(0.0);
  vec3 worldViewX = normalize(vec3(viewDirection.z, 0.0, -viewDirection.x));
  vec3 worldViewY = cross(viewDirection, worldViewX);
  vec2 matcapUv = vec2( dot(worldViewX, normal_inWorld), dot(worldViewY, normal_inWorld)) * 0.495 + 0.5;
  float epsilon = 0.00001;
  vec3 matcapFactor = srgbToLinear(get_matcapFactor(materialSID, 0));
  rim = matcapFactor * texture(u_matcapTexture, matcapUv).rgb;
  float parametricRimLiftFactor = get_parametricRimLiftFactor(materialSID, 0);
  float parametricRim = clamp( 1.0 - dot(normal_inWorld, viewVector) + parametricRimLiftFactor, 0.0, 1.0);
  float parametricRimFresnelPowerFactor = get_parametricRimFresnelPowerFactor(materialSID, 0);
  parametricRim = pow(parametricRim, max(parametricRimFresnelPowerFactor, epsilon));
  vec3 parametricRimColorFactor = get_parametricRimColorFactor(materialSID, 0);
  rim += parametricRim * parametricRimColorFactor;
  int rimMultiplyTexcoordIndex = get_rimMultiplyTexcoordIndex(materialSID, 0);
  vec2 rimMultiplyTexcoord = getTexcoord(rimMultiplyTexcoordIndex);
  rimMultiplyTexcoord = uvAnimation(rimMultiplyTexcoord, time, uvAnimMask, uvAnimationScrollXSpeedFactor, uvAnimationScrollYSpeedFactor, uvAnimationRotationSpeedFactor);
  rim *= srgbToLinear(texture(u_rimMultiplyTexture, rimMultiplyTexcoord).rgb);
  float rimLightingMixFactor = get_rimLightingMixFactor(materialSID, 0);
  rim *= mix(vec3(1.0), directLighting + gi, rimLightingMixFactor);
  rt0.xyz += rim;

  // emissive
  rt0.xyz += emissive;

#ifdef RN_MTOON_IS_OUTLINE
  vec3 outlineColorFactor = get_outlineColorFactor(materialSID, 0);
  float outlineLightingMixFactor = get_outlineLightingMixFactor(materialSID, 0);
  rt0.xyz = outlineColorFactor * mix(vec3(1.0), rt0.xyz, outlineLightingMixFactor);
#endif

#pragma shaderity: require(../common/outputSrgb.glsl)

  // alpha
  rt0.w = alpha;
  rt0.xyz *= alpha; // premultiplied alpha
  // rt0.xyz = vec3(alpha, 0.0, 0.0);


}
