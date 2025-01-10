#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec3 v_color;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;

#pragma shaderity: require(../common/rt0.glsl)

/* shaderity: @{getters} */

uniform bool u_frontHemisphere; // initialValue=true

void main (){

#pragma shaderity: require(../common/mainPrerequisites.glsl)

  float depth = gl_FragCoord.z;
  float dx = dFdx(depth);
  float dy = dFdy(depth);

  if (u_frontHemisphere) {
    rt0.r = depth; // M1
    rt0.g = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2
    rt0.b = 1.0;
    rt0.a = 1.0;
  } else {
    rt0.r = 1.0;
    rt0.g = 1.0;
    rt0.b = depth; // M1
    rt0.a = sq(depth) + 0.25 * (sq(dx) + sq(dy)); // M2
  }

#pragma shaderity: require(../common/glFragColor.glsl)
}

