in vec4 a_position;
#ifdef RN_USE_COLOR_0
  in vec4 a_color;
#else
  const vec4 a_color = vec4(1.0, 1.0, 1.0, 1.0);
#endif
in vec3 a_normal;
#if defined(RN_IS_DATATEXTURE_MODE) && defined(RN_USE_INSTANCE_SID_TEXTURE)
  in uint a_instanceBase;
  // 1 when no instance was culled in this render pass, so the remap lookup can be skipped.
  uniform highp int u_instanceRemapIdentity;

  // The instance SID lookup reads the engine data texture (unit 0) twice (remap and
  // SID) and its result is referenced several times per vertex (world matrix, normal
  // matrix, billboard, visibility, skinning, ...). Resolve it once per invocation and
  // reuse the cached value for every reference. The lookup itself is defined in
  // prerequisites.glsl, after the data texture fetch helpers.
  uvec4 rn_instanceIdsCache;
  bool rn_instanceIdsCacheValid = false;

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
