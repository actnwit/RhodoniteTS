

/* shaderity: @{glslPrecision} */

/* shaderity: @{definitions} */

/* shaderity: @{vertexIn} */

/* shaderity: @{prerequisites} */

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{getters} */

#pragma shaderity: require(../common/packing.glsl)

void main ()
{
/* shaderity: @{mainPrerequisites} */

  rt0 = encodeFloatRGBA(v_instanceIds.x);


}
