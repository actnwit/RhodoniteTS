#pragma shaderity: require(../common/version.glsl)
#pragma shaderity: require(../common/enableFragmentExtensions.glsl)
#pragma shaderity: require(../common/glslPrecision.glsl)

/* shaderity: @{definitions} */

#pragma shaderity: require(../common/prerequisites.glsl)

in vec2 v_texcoord_0;
in vec3 v_baryCentricCoord;
in vec3 v_normal_inView;
in vec3 v_normal_inWorld;
in vec4 v_position_inWorld;
#ifdef RN_USE_TANGENT
  in vec3 v_tangent_inWorld;
  in vec3 v_binormal_inWorld; // bitangent_inWorld
#endif

#pragma shaderity: require(../common/rt0.glsl)

void main (){
  rt0 = vec4(1.0, 0.0, 0.0, 1.0);
  #pragma shaderity: require(../common/glFragColor.glsl)
}
