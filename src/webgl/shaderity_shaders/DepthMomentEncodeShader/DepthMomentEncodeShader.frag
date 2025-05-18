#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */


void main (){

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  float depth = gl_FragCoord.z;
  float dx = dFdx(depth);
  float dy = dFdy(depth);

  rt0.x = depth; // M1
  rt0.y = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2
  rt0.z = 0.0;
  rt0.w = 1.0;

#pragma shaderity: require(../common/glFragColor.glsl)
}

