
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */
#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main()
{
/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(uint(a_instanceIds.x));
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  mat3 normalMatrix = get_normalMatrix(uint(a_instanceIds.x));

  // Skeletal
  processGeometry(
    worldMatrix,
    normalMatrix,
    viewMatrix,
    a_position,
    a_normal,
    uvec4(a_joint),
    a_weight,
    false,
    normalMatrix,
    v_position_inWorld,
    v_normal_inWorld
  );

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;



  v_instanceIds = a_instanceIds;
}
