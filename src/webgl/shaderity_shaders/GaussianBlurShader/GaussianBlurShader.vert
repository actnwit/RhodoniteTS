#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

in vec2 a_instanceInfo;
in vec3 a_position;

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
#pragma shaderity: require(../common/mainPrerequisites.glsl)

#pragma shaderity: require(../common/simpleMVPPosition.glsl)

}
