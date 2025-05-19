

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
in float v_instanceInfo;


/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

#pragma shaderity: require(../common/packing.glsl)

void main ()
{
/* shaderity: @{mainPrerequisites} */

  rt0 = encodeFloatRGBA(v_instanceInfo);

#pragma shaderity: require(../common/glFragColor.glsl)
}
