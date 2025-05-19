
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

in vec4 a_instanceInfo;
in vec3 a_baryCentricCoord;
in vec3 a_position;
in vec3 a_normal;
in vec4 a_joint;
in vec4 a_weight;

out vec3 v_baryCentricCoord;
out vec3 v_normal_inView;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;

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
    skeletalComponentSID,
    worldMatrix,
    viewMatrix,
    false,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  v_normal_inView = vec3(viewMatrix * vec4(normalMatrix * a_normal, 0.0));

#pragma shaderity: require(../common/pointSprite.glsl)

  v_baryCentricCoord = a_baryCentricCoord;

}
