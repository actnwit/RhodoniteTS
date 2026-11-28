var r=`

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

// The color of the pixel at texelOffset for the clipping box, or fallback when that pixel moves: the box only
// grows to cover the sub-pixel coverage changes of still surfaces, not the colors of moving objects, whose
// stale history would otherwise survive behind them.
vec3 stillNeighborForBox(vec2 uv, vec2 texelOffset, vec2 texelSize, vec2 framebufferSize, vec3 fallback) {
  vec2 sampleUv = uv + texelOffset * texelSize;
  vec2 velocity = texture(u_velocityTexture, sampleUv).xy;
  vec3 color = rgbToYCoCg(texture(u_baseColorTexture, sampleUv).rgb);
  return length(velocity * framebufferSize) >= 0.5 ? fallback : color;
}

void main ()
{
/* shaderity: @{mainPrerequisites} */

  vec2 uv = v_texcoord_0;
  vec2 framebufferSize = get_framebufferSize(materialSID, 0u);
  vec2 texelSize = 1.0 / framebufferSize;

  vec4 centerSample = texture(u_baseColorTexture, uv);
  float currentAlpha = centerSample.a;

  // The position where this frame sampled the scene, relative to the center of each pixel, in texels. The jitter
  // moves the geometry by currentJitter (NDC), i.e. the sample position by -currentJitter. In WebGL, the texture
  // coordinates of a render target have the same orientation as NDC (both y up).
  vec2 currentJitter = get_currentJitter(materialSID, 0u);
  vec2 sampleOffset = -currentJitter * framebufferSize * 0.5;

  // Statistics of the 3x3 neighborhood (for the variance clipping), the closest surface in it (whose motion vector
  // is used, so that the edges of moving objects reproject with them) and the reconstruction of the current frame.
  vec3 moment1 = vec3(0.0);
  vec3 moment2 = vec3(0.0);
  vec3 filtered = vec3(0.0);
  float filterWeightSum = 0.0;
  float closestDepth = 2.0;
  vec2 closestOffset = vec2(0.0);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 texelOffset = vec2(float(x), float(y));
      vec2 offset = texelOffset * texelSize;
      vec3 neighbor = rgbToYCoCg(texture(u_baseColorTexture, uv + offset).rgb);
      moment1 += neighbor;
      moment2 += neighbor * neighbor;
      // Reconstruction filter: weights each sample by its distance from the center of this pixel, with the
      // Gaussian fit of a Blackman-Harris window (Karis 2014). Without it, the sample of every frame counts the
      // same wherever the jitter put it, and edge pixels flicker with the period of the jitter sequence.
      vec2 sampleDistance = texelOffset + sampleOffset;
      float filterWeight = exp(-2.29 * dot(sampleDistance, sampleDistance));
      filtered += neighbor * filterWeight;
      filterWeightSum += filterWeight;
      float depth = texture(u_velocityTexture, uv + offset).z;
      if (depth < closestDepth) {
        closestDepth = depth;
        closestOffset = offset;
      }
    }
  }
  vec3 currentYCoCg = filtered / filterWeightSum;

  vec2 velocity = texture(u_velocityTexture, uv + closestOffset).xy;
  vec2 historyUv = uv - velocity;
  bool isHistoryValid = get_isHistoryValid(materialSID, 0u);
  if (!isHistoryValid || historyUv.x < 0.0 || historyUv.x > 1.0 || historyUv.y < 0.0 || historyUv.y > 1.0) {
    rt0 = vec4(max(yCoCgToRgb(currentYCoCg), vec3(0.0)), currentAlpha);
    return;
  }

  vec3 history = rgbToYCoCg(sampleHistoryCatmullRom(historyUv, framebufferSize));

  // Variance clipping (Salvi 2016): clip the history into a box around the neighborhood.
  // - The box also contains the colors 2 pixels away in the 4 axis directions, where those pixels do not move. The
  //   reconstruction filter spreads a surface into the pixels next to it, so a pixel beside a high contrast edge
  //   accumulates some of the surface; in the frames where the jitter puts the samples of its 3x3 neighborhood all
  //   on the other side, the variance box collapses (sigma = 0) and would clip that history away every few
  //   frames, which flickers.
  // - The box always contains the sample of this pixel and the reconstructed current color, and the history is
  //   clipped along the line towards the reconstructed current color. The result then always lies between the
  //   history and the current color. Clipping towards the center of the box instead moved the luminance towards
  //   the center: a gray pixel, whose chroma extents are almost 0, was clipped by a chroma difference of 1e-4 and
  //   its luminance pulled up to the middle of an asymmetric box, once per jitter sequence.
  // - The chroma of grays is almost 0, so the distance to the box is measured with a tolerance proportional to the
  //   luminance, so that rounding differences in the chroma do not clip the history.
  vec3 mean = moment1 / 9.0;
  vec3 sigma = sqrt(max(moment2 / 9.0 - mean * mean, vec3(0.0)));
  float varianceClipGamma = get_varianceClipGamma(materialSID, 0u);
  vec3 farLeft = stillNeighborForBox(uv, vec2(-2.0, 0.0), texelSize, framebufferSize, currentYCoCg);
  vec3 farRight = stillNeighborForBox(uv, vec2(2.0, 0.0), texelSize, framebufferSize, currentYCoCg);
  vec3 farDown = stillNeighborForBox(uv, vec2(0.0, -2.0), texelSize, framebufferSize, currentYCoCg);
  vec3 farUp = stillNeighborForBox(uv, vec2(0.0, 2.0), texelSize, framebufferSize, currentYCoCg);
  vec3 centerYCoCg = rgbToYCoCg(centerSample.rgb);
  vec3 localMin = min(min(centerYCoCg, currentYCoCg), min(min(farLeft, farRight), min(farUp, farDown)));
  vec3 localMax = max(max(centerYCoCg, currentYCoCg), max(max(farLeft, farRight), max(farUp, farDown)));
  vec3 boxMin = min(mean - sigma * varianceClipGamma, localMin);
  vec3 boxMax = max(mean + sigma * varianceClipGamma, localMax);
  vec3 toHistory = history - currentYCoCg;
  vec3 roomToBox = mix(currentYCoCg - boxMin, boxMax - currentYCoCg, vec3(greaterThan(toHistory, vec3(0.0))));
  float tolerance = 1.0e-4 + 0.01 * (abs(currentYCoCg.x) + abs(history.x));
  vec3 ratio = abs(toHistory) / max(roomToBox, vec3(tolerance));
  float maxRatio = max(ratio.x, max(ratio.y, ratio.z));
  if (maxRatio > 1.0) {
    history = currentYCoCg + toHistory / maxRatio;
  }

  // The weight of the current frame. Pixels that do not move use the smaller static weight: the exponential blend
  // weights the recent frames of the jitter sequence more, and a smaller weight averages the sequence more evenly.
  // Pixels that move by a pixel per frame or more keep the larger weight, so that the history, resampled every
  // frame, does not blur. Right after a reset, the weight starts at 1 / (n + 1), the even average of the frames.
  float movingFrameWeight = get_currentFrameWeight(materialSID, 0u);
  float staticFrameWeight = min(get_staticFrameWeight(materialSID, 0u), movingFrameWeight);
  float speedInPixels = length(velocity * framebufferSize);
  float historyFrameCount = get_historyFrameCount(materialSID, 0u);
  float blendFactor = max(
    mix(staticFrameWeight, movingFrameWeight, clamp(speedInPixels, 0.0, 1.0)),
    1.0 / (historyFrameCount + 1.0)
  );

  // Exponential blend weighted by the inverse luminance (Karis 2014) to suppress flickering highlights.
  float currentWeight = blendFactor / (1.0 + currentYCoCg.x);
  float historyWeight = (1.0 - blendFactor) / (1.0 + history.x);
  vec3 result = (currentYCoCg * currentWeight + history * historyWeight) / (currentWeight + historyWeight);

  rt0 = vec4(max(yCoCgToRgb(result), vec3(0.0)), currentAlpha);
}
`,n="fragment",o=!0,i={code:r,shaderStage:n,isFragmentShader:o};export{r as code,i as default,o as isFragmentShader,n as shaderStage};
