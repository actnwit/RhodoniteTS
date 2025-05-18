#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#ifdef WEBGL2_MULTI_VIEW
  layout(num_views=2) in;
#endif

in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
out vec3 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;
out vec2 v_texcoord_0;
out vec3 v_baryCentricCoord;
out vec4 v_shadowCoord;

uniform float u_pointSize; // initialValue=30
uniform vec3 u_pointDistanceAttenuation; // initialValue=(0,0.1,0.01)

// BiasMatrix * LightProjectionMatrix * LightViewMatrix, See: http://www.opengl-tutorial.org/intermediate-tutorials/tutorial-16-shadow-mapping/#basic-shader
uniform mat4 u_depthBiasPV; // initialValue=(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main()
{

/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  bool isBillboard = get_isBillboard(a_instanceInfo.x);

  // Skeletal
  processGeometry(
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


  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord_0 = a_texcoord_0;
  v_baryCentricCoord = a_baryCentricCoord.xyz;

  bool visibility = get_isVisible(a_instanceInfo.x);
  if (!visibility)
  {
    gl_Position = vec4(0.0);
  }

  v_shadowCoord = get_depthBiasPV(materialSID, 0) * v_position_inWorld;

#pragma shaderity: require(../common/pointSprite.glsl)

}
