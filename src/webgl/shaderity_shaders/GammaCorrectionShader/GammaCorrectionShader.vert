#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

in vec2 a_instanceInfo;
in vec2 a_texcoord_0;
in vec3 a_position;
out vec2 v_texcoord_0;

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main()
{

#pragma shaderity: require(../common/mainPrerequisites.glsl)

#pragma shaderity: require(../common/simpleMVPPosition.glsl)

v_texcoord_0 = a_texcoord_0;

}
