var t=`#ifdef RN_USE_SHADOW_MAPPING

float chebyshevUpperBound(vec2 moments, float t, float minVariance) {
  float p = (t <= moments.x) ? 1.0 : 0.0;

  float variance = moments.y - sq(moments.x);
  variance = max(variance, minVariance);

  float d = t - moments.x;
  float p_max = variance / (variance + sq(d));

  return max(p, p_max);
}

// The shadow maps are sampled with an explicit level (they have no mipmaps), because these functions run in the
// light loop, whose trip count is not uniform with Clustered Forward rendering (implicit derivatives are undefined).
float varianceShadowContribution(vec2 lightTexCoord, float distanceToLight, int depthTextureIndex) {
  vec2 moments = textureLod(u_depthTexture, vec3(lightTexCoord, depthTextureIndex), 0.0).xy;

  return chebyshevUpperBound(moments, distanceToLight, 0.001);
}

float varianceShadowContributionParaboloid(vec3 worldPos, vec3 lightPos, float farPlane, float uvScale, int depthTextureIndex) {
  vec3 L = worldPos - lightPos;
  float currentDist = length(L);
  vec3 Lnorm = normalize(L);

  // Determine whether it is front or back simply by the sign of the z component
  bool isFront = (Lnorm.z >= 0.0);

  // Denominators for paraboloid projection
  float denom = 1.0 + (isFront ? Lnorm.z : -Lnorm.z);

  // Convert to UV coordinates (normalized)
  // Lnorm.xy / denom is in [-1,1], so map it to [0,1]
  vec2 uv = (Lnorm.xy / denom) * uvScale * 0.5 + 0.5;

  vec2 storedMoments = isFront
      ? textureLod(u_paraboloidDepthTexture, vec3(uv, depthTextureIndex), 0.0).rg
      : textureLod(u_paraboloidDepthTexture, vec3(uv, depthTextureIndex), 0.0).ba;

  float currentDepth = currentDist / farPlane;


  return chebyshevUpperBound(storedMoments, currentDepth, 0.00001);
}


#endif
`,o="fragment",r=!0,a={code:t,shaderStage:o,isFragmentShader:r};export{t as code,a as default,r as isFragmentShader,o as shaderStage};
