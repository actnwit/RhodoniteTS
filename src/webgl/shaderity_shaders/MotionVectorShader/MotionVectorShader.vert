
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */

uniform float u_pointSize; // initialValue=30, soloDatum=true
uniform vec3 u_pointDistanceAttenuation; // initialValue=(0.0, 0.1, 0.01), soloDatum=true

// Clip space positions of this frame (without the jitter) and of the previous frame.
out vec4 v_currentPosition_inClip;
out vec4 v_previousPosition_inClip;

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main()
{

/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(uint(a_instanceIds.x));
  mat4 previousWorldMatrix = get_previousWorldMatrix(uint(a_instanceIds.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  mat3 normalMatrix = get_normalMatrix(uint(a_instanceIds.x));
  bool isBillboard = get_isBillboard(uint(a_instanceIds.x));

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

  // The same (jittered) position as the color pass, so that the motion vectors cover the same pixels.
  vec4 position_inClip = projectionMatrix * viewMatrix * v_position_inWorld;
  gl_Position = position_inClip;

  // The jitter moves the NDC position by currentJitter, i.e. the clip position by currentJitter * w.
  vec2 currentJitter = get_currentJitter(materialSID, 0u);
  v_currentPosition_inClip = position_inClip - vec4(currentJitter * position_inClip.w, 0.0, 0.0);

  // The previous world position applies the world matrix of the previous frame to the current local
  // (skinned or morphed) position. Deformation by skinning or blend shapes alone does not move it.
  vec4 previousPosition_inWorld = v_position_inWorld;
  if (previousWorldMatrix != worldMatrix) {
    previousPosition_inWorld = previousWorldMatrix * (inverse(worldMatrix) * v_position_inWorld);
  }
  v_previousPosition_inClip = get_previousViewProjectionMatrix(materialSID, 0u) * previousPosition_inWorld;

  bool visibility = get_isVisible(uint(a_instanceIds.x));
  if (!visibility)
  {
    gl_Position = vec4(0.0);
  }
}
