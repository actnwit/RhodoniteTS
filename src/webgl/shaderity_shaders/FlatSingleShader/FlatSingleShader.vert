
/* shaderity: @{enableVertexExtensions} */
/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexInOut} */

uniform float u_pointSize; // initialValue=30
uniform vec3 u_pointDistanceAttenuation; // initialValue=(0,0.1,0.01)

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main()
{

/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(uint(a_instanceInfo.x));
  mat4 viewMatrix = get_viewMatrix(uint(cameraSID));
  mat4 projectionMatrix = get_projectionMatrix(uint(cameraSID));
  mat3 normalMatrix = get_normalMatrix(uint(a_instanceInfo.x));
  bool isBillboard = get_isBillboard(uint(a_instanceInfo.x));

  // Skeletal
  processGeometry(
    worldMatrix,
    normalMatrix,
    viewMatrix,
    a_position,
    a_normal,
    uvec4(a_joint),
    a_weight,
    isBillboard,
    normalMatrix,
    v_position_inWorld,
    v_normal_inWorld
  );

  gl_Position = projectionMatrix * viewMatrix * v_position_inWorld;


  v_color = a_color;
  v_normal_inWorld = normalMatrix * a_normal;
  v_texcoord_0 = a_texcoord_0;
  v_baryCentricCoord = a_baryCentricCoord.xyz;

  bool visibility = get_isVisible(uint(a_instanceInfo.x));
  if (!visibility)
  {
    gl_Position = vec4(0.0);
  }



}
