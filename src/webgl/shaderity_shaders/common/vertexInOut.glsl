in vec4 a_position;
#ifdef RN_USE_COLOR_0
  in vec4 a_color;
#else
  const vec4 a_color = vec4(1.0, 1.0, 1.0, 1.0);
#endif
in vec3 a_normal;
in vec4 a_instanceInfo;
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in vec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
out vec4 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;
out vec2 v_texcoord_0;
out vec2 v_texcoord_1;
out vec2 v_texcoord_2;
out vec3 v_baryCentricCoord;
out float v_instanceInfo;
out float v_displayIdx;
in vec4 a_tangent;
out vec3 v_tangent_inWorld;
out vec3 v_binormal_inWorld;
