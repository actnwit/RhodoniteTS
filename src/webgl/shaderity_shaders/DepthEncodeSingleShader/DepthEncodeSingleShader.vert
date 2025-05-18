#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec3 a_position;
in vec3 a_normal;
in vec4 a_instanceInfo;
in vec4 a_joint;
in vec4 a_weight;

out vec3 v_normal_inWorld;
out vec4 v_position_inLocal;
out vec4 v_position_inWorld;

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.glsl)

void main(){

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);

  // Skeletal
  processGeometry(
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

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  v_position_inLocal = gl_Position;

#pragma shaderity: require(../common/pointSprite.glsl)

}
