#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: ${definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in float v_instanceID;


#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: ${getters} */

#pragma shaderity: require(../common/packing.glsl)

void main ()
{
#pragma shaderity: require(../common/mainPrerequisites.glsl)

  rt0 = encodeFloatRGBA(v_instanceID);

#pragma shaderity: require(../common/glFragColor.glsl)
}
