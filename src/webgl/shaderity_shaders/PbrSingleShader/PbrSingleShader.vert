#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#ifdef WEBGL2_MULTI_VIEW
  layout(num_views=2) in;
#endif

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in vec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
out vec3 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;
out vec2 v_texcoord_0;
out vec2 v_texcoord_1;
out vec2 v_texcoord_2;
out vec3 v_baryCentricCoord;
out float v_instanceInfo;
out float v_displayIdx;
#ifdef RN_USE_TANGENT
  in vec4 a_tangent;
  out vec3 v_tangent_inWorld;
  out vec3 v_binormal_inWorld;
#endif

uniform float u_pointSize; // initialValue=30, soloDatum=true
uniform vec3 u_pointDistanceAttenuation; // initialValue=(0.0, 0.1, 0.01), soloDatum=true

#ifdef RN_USE_SHADOW_MAPPING
  uniform int u_lightIndex; // initialValue=0
#endif
#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/toNormalMatrix.glsl)

#pragma shaderity: require(../common/getSkinMatrix.glsl)

#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.glsl)

void main()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  bool isBillboard = get_isBillboard(a_instanceInfo.x);

  v_color = a_color;

  bool isSkinning = false;

  isSkinning = processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    worldMatrix,
    viewMatrix,
    isBillboard,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  v_texcoord_0 = a_texcoord_0;
  v_texcoord_1 = a_texcoord_1;
  v_texcoord_2 = a_texcoord_2;

  #ifdef RN_USE_TANGENT
    v_tangent_inWorld = normalMatrix * a_tangent.xyz;
    v_binormal_inWorld = cross(v_tangent_inWorld, v_normal_inWorld) * a_tangent.w;
  #endif
  v_baryCentricCoord = a_baryCentricCoord.xyz;

  v_instanceInfo = a_instanceInfo.x;

#ifdef WEBGL2_MULTI_VIEW
  v_displayIdx = float(gl_ViewID_OVR);
#endif

  bool visibility = get_isVisible(a_instanceInfo.x);
  if (!visibility)
  {
    gl_Position = vec4(0.0);
  }

#pragma shaderity: require(../common/pointSprite.glsl)

}
