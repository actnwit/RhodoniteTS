#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

void main (){
  rt0 = vec4(1.0, 0.0, 0.0, 1.0);
  #pragma shaderity: require(../common/glFragColor.glsl)
}
