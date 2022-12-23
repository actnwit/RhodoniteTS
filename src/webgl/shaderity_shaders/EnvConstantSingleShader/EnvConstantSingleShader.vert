#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;

out vec2 v_texcoord_0;
out vec3 v_color;
out vec3 v_normal_inWorld;
out vec3 v_position_inWorld;

uniform bool u_enableViewMatrix; // initialValue=true

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  float cameraSID = u_currentComponentSIDs[/* shaderity: @{WellKnownComponentTIDs.CameraComponentTID} */];
  mat4 worldMatrix = get_worldMatrix(a_instanceInfo.x);
  mat4 viewMatrix = get_viewMatrix(cameraSID, 0);
  mat4 projectionMatrix = get_projectionMatrix(cameraSID, 0);

  if (get_enableViewMatrix(materialSID, 0)) {
    mat4 rotateMatrix = viewMatrix;
    rotateMatrix[3][0] = 0.0;
    rotateMatrix[3][1] = 0.0;
    rotateMatrix[3][2] = 0.0;
    gl_Position = projectionMatrix * rotateMatrix * worldMatrix * vec4(a_position, 1.0);
  } else {
    gl_Position = projectionMatrix * worldMatrix * vec4(a_position, 1.0);
  }

  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  v_normal_inWorld = normalMatrix * a_normal;

  v_color = a_color;
  v_position_inWorld = (worldMatrix * vec4(a_position, 1.0)).xyz;
  v_texcoord_0 = a_texcoord_0;

}
