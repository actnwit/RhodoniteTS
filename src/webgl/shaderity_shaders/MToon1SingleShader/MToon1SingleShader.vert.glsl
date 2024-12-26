#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in vec3 a_position;
in vec3 a_normal;
in vec4 a_baryCentricCoord;
in vec4 a_joint;
in vec4 a_weight;

out vec2 v_texcoord_0;
out vec2 v_texcoord_1;
out vec2 v_texcoord_2;
out vec3 v_baryCentricCoord;
out vec3 v_normal_inView;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;

#ifdef RN_USE_TANGENT
in vec4 a_tangent;
out vec3 v_tangent_inWorld;
out vec3 v_binormal_inWorld; // bitangent_inWorld
#endif

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/toNormalMatrix.glsl)

#pragma shaderity: require(../common/getSkinMatrix.glsl)

#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.glsl)

uniform int u_mtoonOutlineWidthType; // initialValue=2
uniform float u_outlineWidthFactor; // initialValue=0.0008
uniform sampler2D u_outlineWidthMultiplyTexture; // initialValue=(0,white)

void main(){

  #pragma shaderity: require(../common/mainPrerequisites.glsl)

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  bool isSkinning = false;
  isSkinning = processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    worldMatrix,
    viewMatrix,
    false,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);

  v_normal_inView = vec3(viewMatrix * vec4(v_normal_inWorld, 0.0));

#ifdef RN_MTOON_IS_OUTLINE
  int outlineWidthType = get_mtoonOutlineWidthType(materialSID, 0);
  if (outlineWidthType == 0) { // 0 ("none")
    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
  } else {
    float worldNormalLength = length(v_normal_inWorld);
    float outlineWidthFactor = get_outlineWidthFactor(materialSID, 0);
    vec3 outlineOffset = outlineWidthFactor * worldNormalLength * a_normal;

    float outlineWidthMultiply = texture(u_outlineWidthMultiplyTexture, a_texcoord_0).r;
    outlineOffset *= outlineWidthMultiply;

    if (outlineWidthType == 2) { // "screenCoordinates"
      vec4 vViewPosition = viewMatrix * v_position_inWorld;
      outlineOffset *= abs(vViewPosition.z) / projectionMatrix[1].y;
    }
    gl_Position = projectionMatrix * viewMatrix * vec4(v_position_inWorld.xyz + outlineOffset, v_position_inWorld.w);
    gl_Position.z += 0.000001 * gl_Position.w;
  }
#else
  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
#endif

#ifdef RN_USE_TANGENT
  v_tangent_inWorld = normalMatrix * a_tangent.xyz;
  v_binormal_inWorld = cross(v_normal_inWorld, v_tangent_inWorld) * a_tangent.w;
#endif

  v_texcoord_0 = a_texcoord_0;
  v_texcoord_1 = a_texcoord_1;
  v_texcoord_2 = a_texcoord_2;
  v_baryCentricCoord = a_baryCentricCoord.xyz;
}
