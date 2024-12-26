#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord_0;
in vec2 v_texcoord_1;
in vec2 v_texcoord_2;
in vec3 v_baryCentricCoord;
in vec3 v_normal_inView;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
#ifdef RN_USE_TANGENT
  in vec3 v_tangent_inWorld;
  in vec3 v_binormal_inWorld; // bitangent_inWorld
#endif

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/opticalDefinition.glsl)

uniform sampler2D u_baseColorTexture; // initialValue=(1,white)
uniform int u_baseColorTexcoordIndex; // initialValue=0
uniform vec4 u_baseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_normalTexture; // initialValue=(2,black)
uniform float u_shadingShiftFactor; // initialValue=0.0
uniform sampler2D u_shadingShiftTexture; // initialValue=(3,black)
uniform float u_shadingShiftTextureScale; // initialValue=1.0
uniform float u_shadingToonyFactor; // initialValue=0.9
uniform vec3 u_shadeColorFactor; // initialValue=(0,0,0)
uniform sampler2D u_shadeMultiplyTexture; // initialValue=(4,black)

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

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

#pragma shaderity: require(../common/perturbedNormal.glsl)

void main() {
  #pragma shaderity: require(../common/mainPrerequisites.glsl)

  rt0 = vec4(0.0, 0.0, 0.0, 1.0);

  // main color
  int baseColorTexcoordIndex = get_baseColorTexcoordIndex(materialSID, 0);
  vec2 baseColorTexcoord = getTexcoord(baseColorTexcoordIndex);
  vec4 baseColorTexture = texture(u_baseColorTexture, baseColorTexcoord);
  baseColorTexture.rgb = srgbToLinear(baseColorTexture.rgb);
  vec4 baseColorFactor = get_baseColorFactor(materialSID, 0);
  vec3 baseColorTerm = baseColorTexture.rgb * baseColorFactor.rgb;
  vec3 shadeColorFactor = get_shadeColorFactor(materialSID, 0);
  vec4 shadeMultiplyTexture = texture(u_shadeMultiplyTexture, v_texcoord_0);
  shadeMultiplyTexture.rgb = srgbToLinear(shadeMultiplyTexture.rgb);
  vec3 shadeColorTerm = shadeColorFactor * shadeMultiplyTexture.rgb;

  // alpha
  float alpha = baseColorTexture.a * baseColorFactor.a;
  #ifdef RN_ALPHATEST_ON
    float cutoff = get_cutoff(materialSID, 0);
    if(alpha < cutoff) discard;
  #endif

  if (alpha < 0.01) {
    discard;
  }

  rt0.w = alpha;

  // view vector
  vec3 viewPosition = get_viewPosition(cameraSID, 0);
  vec3 viewVector = viewPosition - v_position_inWorld.xyz;

    // Normal
  vec3 normal_inWorld = normalize(v_normal_inWorld);
#ifdef RN_MTOON_HAS_BUMPMAP
  vec3 normal = texture(u_normalTexture, v_texcoord_0).xyz * 2.0 - 1.0;
  mat3 TBN = getTBN(normal_inWorld, viewVector, v_texcoord_0);
  normal_inWorld = normalize(TBN * normal);
#endif

#ifdef RN_MTOON_IS_OUTLINE
  normal_inWorld *= -1.0;
#endif

  for (int i = 0; i < lightNumber; i++) {
    Light light = getLight(i, v_position_inWorld.xyz);
    float shading = dot(light.direction, normal_inWorld);
    float shadingShiftFactor = get_shadingShiftFactor(materialSID, 0);
    shading = shading + shadingShiftFactor;
    float shadingShiftTexture = texture(u_shadingShiftTexture, v_texcoord_0).r;
    float shadingShiftTextureScale = get_shadingShiftTextureScale(materialSID, 0);
    shading = shading + shadingShiftTexture * shadingShiftTextureScale;
    float shadingToonyFactor = get_shadingToonyFactor(materialSID, 0);
    shading = linearstep(-1.0 + shadingToonyFactor, 1.0 - shadingToonyFactor, shading);

    vec3 color = mix(shadeColorTerm, baseColorTerm, shading);
    color = color * light.attenuatedIntensity * RECIPROCAL_PI;
    // vec3 color = vec3(shading);
    rt0.xyz += color;
  }

#ifdef RN_MTOON_IS_OUTLINE
  rt0 = vec4(0.0, 0.0, 0.0, 1.0);
#endif



  #pragma shaderity: require(../common/glFragColor.glsl)
}
