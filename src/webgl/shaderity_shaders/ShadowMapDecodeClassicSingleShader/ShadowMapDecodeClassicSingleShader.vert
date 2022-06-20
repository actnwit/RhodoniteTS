#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec2 a_instanceInfo;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec4 a_joint;
in vec4 a_weight;
out vec3 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;
out vec2 v_texcoord_0;
out vec4 v_texcoord_1;
out vec4 v_projPosition_from_light;


#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/toNormalMatrix.glsl)

#pragma shaderity: require(../common/getSkinMatrix.glsl)

#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.glsl)

void main(){

  #pragma shaderity: require(../common/mainPrerequisites.glsl)

  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];
  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);

  // Skeletal
  processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    worldMatrix,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  #pragma shaderity: require(../common/pointSprite.glsl)

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
  v_texcoord_1 = tMatrix * v_projPosition_from_light;

  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord_0 = a_texcoord_0;

}
