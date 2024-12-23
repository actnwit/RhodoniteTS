#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec3 a_position;
in vec3 a_normal;
in vec4 a_baryCentricCoord;
in vec4 a_joint;
in vec4 a_weight;

out vec2 v_texcoord_0;
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
uniform float u_outlineWidth; // initialValue=1.0

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

#ifdef RN_MTOON_IS_OUTLINE
  float outlineTex = 1.0;

  if (u_mtoonOutlineWidthType == 1) {
    float outlineWidth = get_outlineWidth(materialSID, 0);
    vec3 outlineOffset = 0.01 * outlineWidth * outlineTex * a_normal;
    vec4 worldOutlineOffset = worldMatrix * vec4(outlineOffset, 0.0);
    gl_Position = projectionMatrix * viewMatrix * (v_position_inWorld + worldOutlineOffset);
  } else if (u_mtoonOutlineWidthType == 2) {
    vec4 vertex = projectionMatrix * viewMatrix * v_position_inWorld;

    vec3 clipNormal = (projectionMatrix * vec4(v_normal_inView, 1.0)).xyz;
    vec2 projectedNormal = normalize(clipNormal.xy);
    float outlineScaledMaxDistance = get_outlineScaledMaxDistance(materialSID, 0);
    projectedNormal *= min(vertex.w, outlineScaledMaxDistance);
    float aspect = abs(get_aspect(0.0, 0)); //solo datum
    projectedNormal.x *= aspect;

    float outlineWidth = get_outlineWidth(materialSID, 0);
    vertex.xy += 0.01 * outlineWidth * outlineTex * projectedNormal * clamp(1.0 - abs(v_normal_inView.z), 0.0, 1.0); // ignore offset when normal toward camera

    gl_Position = vertex;
  } else { // 0
    gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
  }
#else
  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;
#endif

  v_texcoord_0 = a_texcoord_0;
  v_baryCentricCoord = a_baryCentricCoord.xyz;
}
