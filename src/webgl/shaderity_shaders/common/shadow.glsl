#ifdef RN_USE_SHADOW_MAPPING

const float g_minVariance = 0.00001;

float chebyshevUpperBound(vec2 moments, float t) {
  float p = (t <= moments.x) ? 1.0 : 0.0;

  float variance = moments.y - sq(moments.x);
  variance = max(variance, g_minVariance);

  float d = t - moments.x;
  float p_max = variance / (variance + sq(d));

  return max(p, p_max);
}

float varianceShadowContribution(vec2 lightTexCoord, float distanceToLight) {
  vec2 moments = texture(u_depthTexture, lightTexCoord).xy;

  return chebyshevUpperBound(moments, distanceToLight);
}

float varianceShadowContributionParaboloid(vec3 worldPos, vec3 lightPos, float farPlane) {
  vec3 L = worldPos - lightPos;
  float currentDist = length(L);
  vec3 Lnorm = normalize(L);

  // Determine whether it is front or back simply by the sign of the z component
  bool isFront = (Lnorm.z >= 0.0);

  // Denominators for paraboloid projection
  float denom = 1.0 + (isFront ? Lnorm.z : -Lnorm.z);

  // Convert to UV coordinates (normalized)
  // Lnorm.xy / denom is in [-1,1], so map it to [0,1]
  vec2 uv = (Lnorm.xy / denom) * 0.5 + 0.5;

  vec2 storedMoments = isFront
      ? texture(u_paraboloidDepthTexture, uv).rg
      : texture(u_paraboloidDepthTexture, uv).ba;

  float currentDepth = currentDist / farPlane;


  return chebyshevUpperBound(storedMoments, currentDepth);

  // float shadow = (currentDepth > storedMoments.r + 0.00001) ? 0.5 : 1.0;
  // return shadow;
}


#endif
