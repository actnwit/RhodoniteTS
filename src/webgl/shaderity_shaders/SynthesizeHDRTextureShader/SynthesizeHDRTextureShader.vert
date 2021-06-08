#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

in float a_instanceID;
in vec3 a_baryCentricCoord;
in vec3 a_position;

out vec3 v_baryCentricCoord;

#pragma shaderity: require(../common/prerequisites.glsl)

/* shaderity: @{getters} */

/* shaderity: @{matricesGetters} */

void main(){
#pragma shaderity: require(../common/mainPrerequisites.glsl)

#pragma shaderity: require(../common/simpleMVPPosition.glsl)

  v_baryCentricCoord = a_baryCentricCoord;

}
