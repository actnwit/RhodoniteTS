#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord_0;
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
uniform vec4 u_baseColorFactor; // initialValue=(1,1,1,1)
uniform sampler2D u_normalTexture; // initialValue=(2,black)

vec3 linearToSrgb(vec3 linearColor) {
  return pow(linearColor, vec3(1.0/2.2));
}

vec3 srgbToLinear(vec3 srgbColor) {
  return pow(srgbColor, vec3(2.2));
}

#pragma shaderity: require(../common/perturbedNormal.glsl)

void main() {
  #pragma shaderity: require(../common/mainPrerequisites.glsl)

  // main color
  vec4 baseColorTextureColor = texture(u_baseColorTexture, v_texcoord_0);
  vec4 baseColorFactor = get_baseColorFactor(materialSID, 0);

  // alpha
  float alpha = baseColorTextureColor.a * baseColorFactor.a;
  #ifdef RN_ALPHATEST_ON
    float cutoff = get_cutoff(materialSID, 0);
    if(alpha < cutoff) discard;
  #endif

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


#ifdef RN_MTOON_IS_OUTLINE
  rt0 = vec4(0.0, 0.0, 0.0, 1.0);
#else
  rt0 = vec4(1.0, 0.0, 0.0, 1.0);
#endif



  #pragma shaderity: require(../common/glFragColor.glsl)
}
