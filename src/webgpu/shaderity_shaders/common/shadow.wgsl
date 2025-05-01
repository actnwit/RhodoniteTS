#ifdef RN_USE_SHADOW_MAPPING

const g_minVariance: f32 = 0.00001;

fn chebyshevUpperBound(moments: vec2<f32>, t: f32) -> f32 {
  let p = select(0.0, 1.0, t <= moments.x);

  var variance = moments.y - sqF32(moments.x);
  variance = max(variance, g_minVariance);

  let d = t - moments.x;
  let p_max = variance / (variance + sqF32(d));

  return max(p, p_max);
}

fn varianceShadowContribution(lightTexCoord: vec2<f32>, distanceToLight: f32, depthTextureIndex: u32) -> f32 {
  let moments = textureSample(depthTexture, depthSampler, lightTexCoord, depthTextureIndex).xy;

  return chebyshevUpperBound(moments, distanceToLight);
}

fn varianceShadowContributionParaboloid(worldPos: vec3<f32>, lightPos: vec3<f32>, farPlane: f32, uvScale: f32, depthTextureIndex: u32) -> f32 {
  let L = worldPos - lightPos;
  let currentDist = length(L);
  let Lnorm = normalize(L);

  // Determine whether it is front or back simply by the sign of the z component
  let isFront = (Lnorm.z >= 0.0);

  // Denominators for paraboloid projection
  let denom = 1.0 + select(-Lnorm.z, Lnorm.z, isFront);

  // Convert to UV coordinates (normalized)
  // Lnorm.xy / denom is in [-1,1], so map it to [0,1]
  let uv = (Lnorm.xy / denom) * uvScale * 0.5 + 0.5;

  let storedMoments = select(
      textureSample(paraboloidDepthTexture, paraboloidDepthSampler, uv, depthTextureIndex).ba,
      textureSample(paraboloidDepthTexture, paraboloidDepthSampler, uv, depthTextureIndex).rg,
      isFront);

  let currentDepth = currentDist / farPlane;


  return chebyshevUpperBound(storedMoments, currentDepth);

  // float shadow = (currentDepth > storedMoments.r + 0.00001) ? 0.5 : 1.0;
  // return shadow;
}


#endif

