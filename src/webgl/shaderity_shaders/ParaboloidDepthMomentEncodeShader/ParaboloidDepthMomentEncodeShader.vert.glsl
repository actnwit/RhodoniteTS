
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */
uniform bool u_frontHemisphere; // initialValue=true
uniform int u_lightIndex; // initialValue=0
uniform float u_farPlane; // initialValue=1000.0

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main()
{

/* shaderity: @{mainPrerequisites} */

  bool visibility = get_isVisible(a_instanceInfo.x);
  if (!visibility)
  {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
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
    uvec4(a_joint),
    a_weight,
    isBillboard,
    normalMatrix,
    v_position_inWorld,
    v_normal_inWorld
  );

  int lightIndex = get_lightIndex(materialSID, 0);
  vec3 lightPosition = get_lightPosition(0.0, lightIndex);
  vec3 L = v_position_inWorld.xyz - lightPosition;
  float dist = length(L);
  L = normalize(L);

  bool frontHemisphere = get_frontHemisphere(materialSID, 0);
  float signHemisphere = frontHemisphere ? 1.0 : -1.0;
  float denom = 1.0 + signHemisphere * L.z;

  vec2 uv = L.xy / denom;

  if (abs(denom) < 1e-6) {
    gl_Position = vec4(0.0, 0.0, -1000000.0, 1.0);
    return;
  }
  // if ((u_frontHemisphere && L.z < 0.0) ||
  //      (!u_frontHemisphere && L.z > 0.0))
  // {
  //   gl_Position = vec4(0.0, 0.0, -1000000.0, 1.0);
  //   return;
  // }

  float farPlane = get_farPlane(materialSID, 0);
  gl_Position = vec4(uv, dist / farPlane, 1.0);
  v_position_inWorld = vec4(uv, dist / farPlane, signHemisphere * L.z);
}
