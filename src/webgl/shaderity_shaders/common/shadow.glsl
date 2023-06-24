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

#endif
