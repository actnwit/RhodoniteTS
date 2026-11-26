

/* shaderity: @{glslPrecision} */

/* shaderity: @{renderTargetBegin} */

/* shaderity: @{definitions} */

/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

/* shaderity: @{vertexIn} */

// Temporal anti-aliasing resolve: blends the current (jittered) frame with the reprojected history.
// u_baseColorTexture: the current frame, u_historyTexture: the previous result,
// u_velocityTexture: xy = the motion from the previous frame in texture coordinates, z = the depth.

vec3 rgbToYCoCg(vec3 c) {
  return vec3(0.25 * c.r + 0.5 * c.g + 0.25 * c.b, 0.5 * c.r - 0.5 * c.b, -0.25 * c.r + 0.5 * c.g - 0.25 * c.b);
}

vec3 yCoCgToRgb(vec3 c) {
  float t = c.x - c.z;
  return vec3(t + c.y, c.x + c.z, t - c.y);
}

// Bicubic Catmull-Rom filtering of the history with 5 bilinear taps (the 4 corner taps are dropped),
// which keeps the history sharp when it is resampled every frame.
vec3 sampleHistoryCatmullRom(vec2 uv, vec2 textureSize) {
  vec2 samplePosition = uv * textureSize;
  vec2 texPosition1 = floor(samplePosition - 0.5) + 0.5;
  vec2 f = samplePosition - texPosition1;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 offset12 = w2 / w12;
  vec2 texPosition0 = (texPosition1 - 1.0) / textureSize;
  vec2 texPosition3 = (texPosition1 + 2.0) / textureSize;
  vec2 texPosition12 = (texPosition1 + offset12) / textureSize;

  vec3 result = texture(u_historyTexture, vec2(texPosition12.x, texPosition0.y)).rgb * (w12.x * w0.y);
  result += texture(u_historyTexture, vec2(texPosition0.x, texPosition12.y)).rgb * (w0.x * w12.y);
  result += texture(u_historyTexture, texPosition12).rgb * (w12.x * w12.y);
  result += texture(u_historyTexture, vec2(texPosition3.x, texPosition12.y)).rgb * (w3.x * w12.y);
  result += texture(u_historyTexture, vec2(texPosition12.x, texPosition3.y)).rgb * (w12.x * w3.y);
  float weightSum = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
  return max(result / weightSum, vec3(0.0));
}

void main ()
{
/* shaderity: @{mainPrerequisites} */

  vec2 uv = v_texcoord_0;
  vec2 framebufferSize = get_framebufferSize(materialSID, 0u);
  vec2 texelSize = 1.0 / framebufferSize;

  vec4 current = texture(u_baseColorTexture, uv);

  // Statistics of the 3x3 neighborhood (for the variance clipping) and the closest surface in it
  // (whose motion vector is used, so that the edges of moving objects reproject with them).
  vec3 moment1 = vec3(0.0);
  vec3 moment2 = vec3(0.0);
  float closestDepth = 2.0;
  vec2 closestOffset = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y)) * texelSize;
      vec3 neighbor = rgbToYCoCg(texture(u_baseColorTexture, uv + offset).rgb);
      moment1 += neighbor;
      moment2 += neighbor * neighbor;
      float depth = texture(u_velocityTexture, uv + offset).z;
      if (depth < closestDepth) {
        closestDepth = depth;
        closestOffset = offset;
      }
    }
  }

  vec2 velocity = texture(u_velocityTexture, uv + closestOffset).xy;
  vec2 historyUv = uv - velocity;
  bool isHistoryValid = get_isHistoryValid(materialSID, 0u);
  if (!isHistoryValid || historyUv.x < 0.0 || historyUv.x > 1.0 || historyUv.y < 0.0 || historyUv.y > 1.0) {
    rt0 = current;
    return;
  }

  vec3 history = rgbToYCoCg(sampleHistoryCatmullRom(historyUv, framebufferSize));

  // Variance clipping (Salvi 2016): clip the history towards the mean of the neighborhood.
  vec3 mean = moment1 / 9.0;
  vec3 sigma = sqrt(max(moment2 / 9.0 - mean * mean, vec3(0.0)));
  float varianceClipGamma = get_varianceClipGamma(materialSID, 0u);
  vec3 extents = sigma * varianceClipGamma + vec3(1.0e-5);
  vec3 fromMean = history - mean;
  vec3 ratio = abs(fromMean / extents);
  float maxRatio = max(ratio.x, max(ratio.y, ratio.z));
  if (maxRatio > 1.0) {
    history = mean + fromMean / maxRatio;
  }

  // Exponential blend weighted by the inverse luminance (Karis 2014) to suppress flickering highlights.
  vec3 currentYCoCg = rgbToYCoCg(current.rgb);
  float blendFactor = get_currentFrameWeight(materialSID, 0u);
  float currentWeight = blendFactor / (1.0 + currentYCoCg.x);
  float historyWeight = (1.0 - blendFactor) / (1.0 + history.x);
  vec3 result = (currentYCoCg * currentWeight + history * historyWeight) / (currentWeight + historyWeight);

  rt0 = vec4(max(yCoCgToRgb(result), vec3(0.0)), current.a);
}
