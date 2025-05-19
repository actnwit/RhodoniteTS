
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
/* shaderity: @{glslPrecision} */

in vec4 a_instanceInfo;
in vec2 a_texcoord;
in vec3 a_position;

out vec2 v_texcoord;

#pragma shaderity: require(../common/morphVariables.glsl)

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
/* shaderity: @{mainPrerequisites} */

  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);
  gl_Position = projectionMatrix * viewMatrix * worldMatrix * vec4(a_position, 1.0);

  v_texcoord = a_texcoord;
}
