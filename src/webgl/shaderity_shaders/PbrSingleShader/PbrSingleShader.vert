
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

#ifdef WEBGL2_MULTI_VIEW
  layout(num_views=2) in;
#endif

/* shaderity: @{vertexInOut} */

uniform float u_pointSize; // initialValue=30, soloDatum=true
uniform vec3 u_pointDistanceAttenuation; // initialValue=(0.0, 0.1, 0.01), soloDatum=true

#ifdef RN_USE_SHADOW_MAPPING
  uniform int u_lightIndex; // initialValue=0
#endif

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main()
{

/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  bool isBillboard = get_isBillboard(a_instanceInfo.x);

  v_color = a_color;

  bool isSkinning = false;

  isSkinning = processGeometry(
    worldMatrix,
    normalMatrix,
    viewMatrix,
    a_position,
    a_normal,
    a_joint,
    a_weight,
    a_instanceInfo,
    isBillboard,
    normalMatrix,
    v_position_inWorld,
    v_normal_inWorld
  );

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  v_texcoord_0 = a_texcoord_0;
  v_texcoord_1 = a_texcoord_1;
  v_texcoord_2 = a_texcoord_2;

  #ifdef RN_USE_TANGENT
    v_tangent_inWorld = vec3(worldMatrix * vec4(a_tangent.xyz, 0.0));
    v_binormal_inWorld = cross(v_normal_inWorld, v_tangent_inWorld) * a_tangent.w;
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



}
