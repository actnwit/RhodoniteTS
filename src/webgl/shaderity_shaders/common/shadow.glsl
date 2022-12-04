float chebyshevUpperBound(vec2 momemts, float t) {
  float p = (t <= momemts.x);

  float variance = momemts.y - sq(momemts.x);
  variance = max(variance, g_minVariance);

  float d = t - moments.x;
  float p_max = variance / (variance + sq(d));

  return max(p, p_max);
}

float varianceShadowContribution(vec2 lightTexCoord, float distanceToLight) {
  float momemts = texture2D(u_depthTexture, v_shadowCoord.xy).xy;

  return chebyshevUpperBound(momemts, distanceToLight);
}
