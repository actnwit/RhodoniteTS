#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in float a_instanceID;
in vec2 a_texcoord_0;
in vec3 a_position;
out vec2 v_texcoord_0;

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
#pragma shaderity: require(../common/mainPrerequisites.glsl)
#pragma shaderity: require(../common/simpleMVPPosition.glsl)

  v_texcoord_0 = a_texcoord_0;
}
