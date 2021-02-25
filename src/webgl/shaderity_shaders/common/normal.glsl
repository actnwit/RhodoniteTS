#ifdef RN_USE_TANGENT_ATTRIBUTE
  vec3 perturb_normal(vec3 normal_inWorld, vec3 viewVector, vec2 texcoord) {
    vec3 tangent_inWorld = normalize(v_tangent_inWorld);
    vec3 binormal_inWorld = normalize(v_binormal_inWorld);
    mat3 tbnMat_tangent_to_world = mat3(tangent_inWorld, binormal_inWorld, normal_inWorld);

    vec3 normal = texture(u_normalTexture, texcoord).xyz * 2.0 - 1.0;
    return normalize(tbnMat_tangent_to_world * normal);
  }
#else
  #ifdef RN_IS_SUPPORTING_STANDARD_DERIVATIVES
    // This is based on http://www.thetenthplanet.de/archives/1180
    mat3 cotangent_frame(vec3 normal, vec3 position, vec2 uv) {
      uv = gl_FrontFacing ? uv : -uv;

      // get edge vectors of the pixel triangle
      vec3 dp1 = dFdx(position);
      vec3 dp2 = dFdy(position);
      vec2 duv1 = dFdx(uv);
      vec2 duv2 = dFdy(uv);

      // solve the linear system
      vec3 dp2perp = cross(dp2, normal);
      vec3 dp1perp = cross(normal, dp1);
      vec3 tangent = dp2perp * duv1.x + dp1perp * duv2.x;
      vec3 bitangent = dp2perp * duv1.y + dp1perp * duv2.y;

      // construct a scale-invariant frame
      float invMat = inversesqrt(max(dot(tangent, tangent), dot(bitangent, bitangent)));
      return mat3(tangent * invMat, bitangent * invMat, normal);
    }

    vec3 perturb_normal(vec3 normal, vec3 viewVector, vec2 texcoord) {
      vec3 normalTex = texture(u_normalTexture, texcoord).xyz * 2.0 - 1.0;

      mat3 tbnMat_tangent_to_world = cotangent_frame(normal, -viewVector, texcoord);
      return normalize(tbnMat_tangent_to_world * normalTex);
    }
  #else
    vec3 perturb_normal(vec3 normal, vec3 viewVector, vec2 texcoord) {
      return normal;
    }
  #endif
#endif
