
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * a_position;

  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  v_normal_inWorld = normalMatrix * a_normal;
  v_position_inWorld = worldMatrix * a_position;
  v_texcoord_0 = a_texcoord_0;

}
