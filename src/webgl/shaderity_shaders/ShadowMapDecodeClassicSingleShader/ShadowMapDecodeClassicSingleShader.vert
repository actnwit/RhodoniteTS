
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */
out vec4 v_projPosition_from_light;
out vec4 v_texcoord_light;

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main(){

  /* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);

  // Skeletal
  processGeometry(
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

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;



  // Shadow mapping
  mat4 lightViewProjectionMatrix = get_lightViewProjectionMatrix(materialSID, 0);
  v_projPosition_from_light = lightViewProjectionMatrix * v_position_inWorld;

  // Following tMatrix is based on https://wgld.org/d/webgl/w051.html
  mat4 tMatrix = mat4(
    0.5, 0.0, 0.0, 0.0,
    0.0, 0.5, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.5, 0.5, 0.0, 1.0
  );
  v_texcoord_light = tMatrix * v_projPosition_from_light;

  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord_0 = a_texcoord_0;

}
