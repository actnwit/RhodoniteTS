
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */
out vec4 v_position_inLocal;

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main(){

/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(uint(a_instanceInfo.x));
  mat4 viewMatrix = get_viewMatrix(uint(cameraSID));
  mat4 projectionMatrix = get_projectionMatrix(uint(cameraSID));
  mat3 normalMatrix = get_normalMatrix(uint(a_instanceInfo.x));

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

  v_position_inLocal = gl_Position;



}
