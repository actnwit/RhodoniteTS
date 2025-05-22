
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */
out vec3 v_normal_inView;

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main(){
/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);

  bool isSkinning = false;
  isSkinning = processGeometry(
    a_instanceInfo,
    a_baryCentricCoord.w,
    worldMatrix,
    normalMatrix,
    viewMatrix,
    a_position,
    a_normal,
    a_joint,
    a_weight,
    false,
    normalMatrix,
    v_position_inWorld,
    v_normal_inWorld
  );

  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  v_normal_inView = vec3(viewMatrix * vec4(normalMatrix * a_normal, 0.0));



  v_baryCentricCoord = a_baryCentricCoord.xyz;

}
