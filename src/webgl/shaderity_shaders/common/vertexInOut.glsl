in vec4 a_position;
#ifdef RN_USE_COLOR_0
  in vec4 a_color;
#else
  const vec4 a_color = vec4(1.0, 1.0, 1.0, 1.0);
#endif
in vec3 a_normal;
#if defined(RN_IS_DATATEXTURE_MODE) && defined(RN_USE_INSTANCE_SID_TEXTURE)
  // a_instanceBase and the instance SID lookup are declared in prerequisites.glsl so that
  // every vertex shader including it (including node-based shader templates) can use them.
  #define a_instanceIds get_instanceIds()
#else
  in uvec4 a_instanceIds;
#endif
#if defined(RN_IS_DATATEXTURE_MODE) && defined(RN_USE_MATERIAL_SID_ATTRIBUTE)
  in uint a_materialSid;
  flat out uint v_materialSid;
#endif
in vec2 a_texcoord_0;
in vec2 a_texcoord_1;
in vec2 a_texcoord_2;
in uvec4 a_joint;
in vec4 a_weight;
in vec4 a_baryCentricCoord;
in vec4 a_tangent;
out vec4 v_color;
out vec3 v_normal_inWorld;
out vec4 v_position_inWorld;
out vec2 v_texcoord_0;
out vec2 v_texcoord_1;
out vec2 v_texcoord_2;
out vec3 v_baryCentricCoord;
flat out uvec4 v_instanceIds;
out float v_displayIdx;
out vec3 v_tangent_inWorld;
out vec3 v_bitangent_inWorld;
