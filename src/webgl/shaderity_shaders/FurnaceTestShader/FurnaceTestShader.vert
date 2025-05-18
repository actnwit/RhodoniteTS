#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableVertexExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec4 a_instanceInfo;
in vec2 a_texcoord;
in vec3 a_position;
in vec3 a_color;
in vec3 a_normal;
in vec4 a_joint;
in vec4 a_weight;

out vec2 v_texcoord;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

/* shaderity: @{processGeometry} */

void main(){
#pragma shaderity: require(../common/mainPrerequisites.glsl)

#pragma shaderity: require(../common/simpleMVPPosition.glsl)

  mat3 normalMatrix = get_normalMatrix(a_instanceInfo.x);
  v_normal_inWorld = normalMatrix * a_normal;
  v_position_inWorld = worldMatrix * vec4(a_position, 1.0);
  v_texcoord = a_texcoord;

}
