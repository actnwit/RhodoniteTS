
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

  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID);

  bool isSkinning = false;
  isSkinning = processGeometry(
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

  mat4 projectionMatrix = get_projectionMatrix(cameraSID);
  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;



  v_baryCentricCoord = a_baryCentricCoord.xyz;
  v_color = a_color;
  v_texcoord_0 = a_texcoord_0;

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

}
