#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in float a_instanceInfo;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in vec4 a_joint;
in vec4 a_weight;
out vec3 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;

uniform float u_pointSize; // initialValue=30, soloDatum=true
uniform vec3 u_pointDistanceAttenuation; // initialValue=(0.0, 0.1, 0.01), soloDatum=true

#ifdef RN_IS_MORPHING
uniform int u_morphTargetNumber; // initialValue=0, isCustomSetting=true, soloDatum=true, needUniformInDataTextureMode=true
#endif

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

#pragma shaderity: require(../common/toNormalMatrix.glsl)

#pragma shaderity: require(../common/getSkinMatrix.glsl)

#pragma shaderity: require(../common/processGeometryWithSkinningOptionally.glsl)

void main()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];
  mat4 worldMatrix = get_worldMatrix(a_instanceInfo);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo);
  bool isBillboard = get_isBillboard(a_instanceInfo);

  v_color = a_color;

  bool isSkinning = false;

  isSkinning = processGeometryWithMorphingAndSkinning(
    skeletalComponentSID,
    worldMatrix,
    viewMatrix,
    isBillboard,
    normalMatrix,
    normalMatrix,
    a_position,
    v_position_inWorld,
    a_normal,
    v_normal_inWorld
  );

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;

  bool visibility = get_isVisible(a_instanceInfo);
  if (!visibility)
  {
    gl_Position = vec4(0.0);
  }

#pragma shaderity: require(../common/pointSprite.glsl)

}

