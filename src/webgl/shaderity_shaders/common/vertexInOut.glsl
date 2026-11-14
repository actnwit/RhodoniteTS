in vec4 a_position;
#ifdef RN_USE_COLOR_0
  in vec4 a_color;
#else
  const vec4 a_color = vec4(1.0, 1.0, 1.0, 1.0);
#endif
in vec3 a_normal;
#if defined(RN_IS_DATATEXTURE_MODE) && defined(RN_USE_INSTANCE_SID_TEXTURE)
  in uint a_instanceBase;
  uniform highp usampler2D u_instanceSidTexture;
  uniform highp usampler2D u_instanceRemapTexture;
  uniform highp int u_instanceTextureWidth;
  // 1 when no instance was culled in this render pass, so the remap lookup can be skipped.
  uniform highp int u_instanceRemapIdentity;

  uvec4 rn_fetchInstanceTexel(highp usampler2D tex, uint index) {
    uint w = uint(u_instanceTextureWidth);
    return texelFetch(tex, ivec2(int(index % w), int(index / w)), 0);
  }

  // The instance SID lookup is a pair of dependent integer texture fetches. Shaders
  // reference a_instanceIds several times per vertex (world matrix, normal matrix,
  // billboard, visibility, skinning, ...), so resolve it once per invocation and
  // reuse the cached value for every reference.
  uvec4 rn_instanceIdsCache;
  bool rn_instanceIdsCacheValid = false;

  uvec4 get_instanceIds() {
    if (!rn_instanceIdsCacheValid) {
      uint localIndex = uint(gl_InstanceID);
      if (u_instanceRemapIdentity == 0) {
        uint packedIndex = a_instanceBase + localIndex;
        localIndex = rn_fetchInstanceTexel(u_instanceRemapTexture, packedIndex).r;
      }
      rn_instanceIdsCache = rn_fetchInstanceTexel(u_instanceSidTexture, a_instanceBase + localIndex);
      rn_instanceIdsCacheValid = true;
    }
    return rn_instanceIdsCache;
  }

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
