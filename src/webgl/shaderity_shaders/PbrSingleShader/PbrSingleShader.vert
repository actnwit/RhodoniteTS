#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in float a_instanceID;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
out vec3 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;
out vec2 v_texcoord_0;
out vec2 v_texcoord_1;
out vec3 v_baryCentricCoord;
#ifdef RN_USE_TANGENT_ATTRIBUTE
  in vec4 a_tangent;
  out vec3 v_tangent_inWorld;
  out vec3 v_binormal_inWorld;
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
  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);

  v_color = a_color;

  bool isSkinning = false;

  isSkinning = processGeometryWithMorphingAndSkinning(
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

  v_texcoord_0 = a_texcoord_0;
  v_texcoord_1 = a_texcoord_1;


  #ifdef RN_USE_TANGENT_ATTRIBUTE
    vec3 tangent_inWorld = normalMatrix * a_tangent.xyz;

    v_binormal_inWorld = cross(v_normal_inWorld, tangent_inWorld) * a_tangent.w;
    v_tangent_inWorld = cross(v_binormal_inWorld, v_normal_inWorld);
  #endif
  v_baryCentricCoord = a_baryCentricCoord.xyz;

#pragma shaderity: require(../common/pointSprite.glsl)

}