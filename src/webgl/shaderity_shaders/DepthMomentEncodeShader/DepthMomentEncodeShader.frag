#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

void main (){

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  float depth = gl_FragCoord.z;
  float dx = dFdx(depth);
  float dy = dFdy(depth);

  dt0.x = depth; // M1
  dt0.y = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2

#pragma shaderity: require(../common/glFragColor.glsl)
}

