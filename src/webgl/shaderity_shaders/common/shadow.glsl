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

// float varianceShadowContributionParaboloid(vec2 lightTexCoord, float distanceToLight) {
//   vec3 L = vWorldPos - uLightPos;
//   float currentDist = length(L);
//   vec3 Lnorm = normalize(L);

//   // 前方か後方かを単純に z成分の符号で判定
//   bool isFront = (Lnorm.z >= 0.0);

//   // パラボロイド投影用の denominator
//   float denom = 1.0 + (isFront ? Lnorm.z : -Lnorm.z);

//   // UV座標(正規化)へ変換
//   // Lnorm.xy / denom が [-1,1] なので、[0,1] へマッピング
//   vec2 uv = (Lnorm.xy / denom) * 0.5 + 0.5;

//   // 適切なマップをサンプリング
//   float storedDepth = isFront
//       ? texture(uShadowMapFront, uv).r
//       : texture(uShadowMapBack, uv).r;

//   // 現在の距離を同じ方法で正規化
//   float currentDepth = currentDist / uFarPlane;
// }


#endif
