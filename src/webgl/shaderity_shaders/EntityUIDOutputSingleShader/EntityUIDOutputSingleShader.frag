

#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in float v_instanceInfo;


#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

#pragma shaderity: require(../common/packing.glsl)

void main ()
{
/* shaderity: @{mainPrerequisites} */

  rt0 = encodeFloatRGBA(v_instanceInfo);

#pragma shaderity: require(../common/glFragColor.glsl)
}
