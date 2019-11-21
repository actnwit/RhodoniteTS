#pragma shaderity: require(./version.glsl)
#pragma shaderity: require(./glslPrecision.glsl)

/* shaderity: ${definitions} */

attribute vec3 a_position;
attribute vec3 a_color;
attribute vec3 a_normal;
attribute float a_instanceID;
attribute vec2 a_texcoord;
attribute vec4 a_joint;
attribute vec4 a_weight;
attribute vec4 a_baryCentricCoord;
varying vec3 v_color;
varying vec3 v_normal_inWorld;
varying vec4 v_position_inWorld;
varying vec2 v_texcoord;
varying vec3 v_baryCentricCoord;

#pragma shaderity: require(./prerequisites.glsl)

/* shaderity: ${matricesGetters} */

/* shaderity: ${getters} */

#pragma shaderity: require(./toNormalMatrix.glsl)

#pragma shaderity: require(./getSkinMatrix.glsl)

#pragma shaderity: require(./processGeometryWithSkinningOptionally.glsl)

void main()
{

#pragma shaderity: require(./mainPrerequisites.glsl)

  float cameraSID = u_currentComponentSIDs[/* shaderity: ${WellKnownComponentTIDs.CameraComponentTID} */];
  mat4 worldMatrix = get_worldMatrix(a_instanceID);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceID);

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


  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord = a_texcoord;
  v_baryCentricCoord = a_baryCentricCoord.xyz;

#pragma shaderity: require(./pointSprite.glsl)

}
