var r=`/* shaderity: @{definitions} */
/* shaderity: @{vertexOutput} */
/* shaderity: @{prerequisites} */

/* shaderity: @{getters} */

// Temporal anti-aliasing resolve: blends the current (jittered) frame with the reprojected history.
// baseColorTexture: the current frame, historyTexture: the previous result,
// velocityTexture: xy = the motion from the previous frame in texture coordinates, z = the depth.
// textureSampleLevel is used everywhere because some lookups are in non-uniform control flow.

fn rgbToYCoCg(c: vec3<f32>) -> vec3<f32> {
  return vec3<f32>(0.25 * c.r + 0.5 * c.g + 0.25 * c.b, 0.5 * c.r - 0.5 * c.b, -0.25 * c.r + 0.5 * c.g - 0.25 * c.b);
}

fn yCoCgToRgb(c: vec3<f32>) -> vec3<f32> {
  let t = c.x - c.z;
  return vec3<f32>(t + c.y, c.x + c.z, t - c.y);
}

// Bicubic Catmull-Rom filtering of the history with 5 bilinear taps (the 4 corner taps are dropped),
// which keeps the history sharp when it is resampled every frame.
fn sampleHistoryCatmullRom(uv: vec2<f32>, textureSize: vec2<f32>) -> vec3<f32> {
  let samplePosition = uv * textureSize;
  let texPosition1 = floor(samplePosition - 0.5) + 0.5;
  let f = samplePosition - texPosition1;
  let w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  let w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  let w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  let w3 = f * f * (-0.5 + 0.5 * f);
  let w12 = w1 + w2;
  let offset12 = w2 / w12;
  let texPosition0 = (texPosition1 - 1.0) / textureSize;
  let texPosition3 = (texPosition1 + 2.0) / textureSize;
  let texPosition12 = (texPosition1 + offset12) / textureSize;

  var result = textureSampleLevel(historyTexture, historySampler, vec2<f32>(texPosition12.x, texPosition0.y), 0.0).rgb * (w12.x * w0.y);
  result += textureSampleLevel(historyTexture, historySampler, vec2<f32>(texPosition0.x, texPosition12.y), 0.0).rgb * (w0.x * w12.y);
  result += textureSampleLevel(historyTexture, historySampler, texPosition12, 0.0).rgb * (w12.x * w12.y);
  result += textureSampleLevel(historyTexture, historySampler, vec2<f32>(texPosition3.x, texPosition12.y), 0.0).rgb * (w3.x * w12.y);
  result += textureSampleLevel(historyTexture, historySampler, vec2<f32>(texPosition12.x, texPosition3.y), 0.0).rgb * (w12.x * w3.y);
  let weightSum = w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y;
  return max(result / weightSum, vec3<f32>(0.0));
}

// The color of the pixel at texelOffset for the clipping box, or fallback when that pixel moves: the box only
// grows to cover the sub-pixel coverage changes of still surfaces, not the colors of moving objects, whose
// stale history would otherwise survive behind them.
fn stillNeighborForBox(uv: vec2<f32>, texelOffset: vec2<f32>, texelSize: vec2<f32>, framebufferSize: vec2<f32>, fallback: vec3<f32>) -> vec3<f32> {
  let sampleUv = uv + texelOffset * texelSize;
  let velocity = textureSampleLevel(velocityTexture, velocitySampler, sampleUv, 0.0).xy;
  let color = rgbToYCoCg(textureSampleLevel(baseColorTexture, baseColorSampler, sampleUv, 0.0).rgb);
  return select(color, fallback, length(velocity * framebufferSize) >= 0.5);
}

@fragment
fn main(
  input: VertexOutput,
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  let uv = input.texcoord_0;
  let framebufferSize: vec2<f32> = get_framebufferSize(materialSID, 0);
  let texelSize = 1.0 / framebufferSize;

  let centerSample = textureSampleLevel(baseColorTexture, baseColorSampler, uv, 0.0);
  let currentAlpha = centerSample.a;

  // The position where this frame sampled the scene, relative to the center of each pixel, in texels. The jitter
  // moves the geometry by currentJitter (NDC, y up), i.e. the sample position by -currentJitter, and the v axis of
  // the texture coordinates points down.
  let currentJitter = get_currentJitter(materialSID, 0);
  let sampleOffset = vec2<f32>(-currentJitter.x, currentJitter.y) * framebufferSize * 0.5;

  // Statistics of the 3x3 neighborhood (for the variance clipping), the closest surface in it (whose motion vector
  // is used, so that the edges of moving objects reproject with them) and the reconstruction of the current frame.
  var moment1 = vec3<f32>(0.0);
  var moment2 = vec3<f32>(0.0);
  var filtered = vec3<f32>(0.0);
  var filterWeightSum = 0.0;
  var closestDepth = 2.0;
  var closestOffset = vec2<f32>(0.0);
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let texelOffset = vec2<f32>(f32(x), f32(y));
      let offset = texelOffset * texelSize;
      let neighbor = rgbToYCoCg(textureSampleLevel(baseColorTexture, baseColorSampler, uv + offset, 0.0).rgb);
      moment1 += neighbor;
      moment2 += neighbor * neighbor;
      // Reconstruction filter: weights each sample by its distance from the center of this pixel, with the
      // Gaussian fit of a Blackman-Harris window (Karis 2014). Without it, the sample of every frame counts the
      // same wherever the jitter put it, and edge pixels flicker with the period of the jitter sequence.
      let sampleDistance = texelOffset + sampleOffset;
      let filterWeight = exp(-2.29 * dot(sampleDistance, sampleDistance));
      filtered += neighbor * filterWeight;
      filterWeightSum += filterWeight;
      let depth = textureSampleLevel(velocityTexture, velocitySampler, uv + offset, 0.0).z;
      if (depth < closestDepth) {
        closestDepth = depth;
        closestOffset = offset;
      }
    }
  }
  let currentYCoCg = filtered / filterWeightSum;

  let velocity = textureSampleLevel(velocityTexture, velocitySampler, uv + closestOffset, 0.0).xy;
  let historyUv = uv - velocity;
  let isHistoryValid = get_isHistoryValid(materialSID, 0);
  if (!isHistoryValid || historyUv.x < 0.0 || historyUv.x > 1.0 || historyUv.y < 0.0 || historyUv.y > 1.0) {
    return vec4<f32>(max(yCoCgToRgb(currentYCoCg), vec3<f32>(0.0)), currentAlpha);
  }

  var history = rgbToYCoCg(sampleHistoryCatmullRom(historyUv, framebufferSize));

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
  let mean = moment1 / 9.0;
  let sigma = sqrt(max(moment2 / 9.0 - mean * mean, vec3<f32>(0.0)));
  let varianceClipGamma = get_varianceClipGamma(materialSID, 0);
  let farLeft = stillNeighborForBox(uv, vec2<f32>(-2.0, 0.0), texelSize, framebufferSize, currentYCoCg);
  let farRight = stillNeighborForBox(uv, vec2<f32>(2.0, 0.0), texelSize, framebufferSize, currentYCoCg);
  let farUp = stillNeighborForBox(uv, vec2<f32>(0.0, -2.0), texelSize, framebufferSize, currentYCoCg);
  let farDown = stillNeighborForBox(uv, vec2<f32>(0.0, 2.0), texelSize, framebufferSize, currentYCoCg);
  let centerYCoCg = rgbToYCoCg(centerSample.rgb);
  let localMin = min(min(centerYCoCg, currentYCoCg), min(min(farLeft, farRight), min(farUp, farDown)));
  let localMax = max(max(centerYCoCg, currentYCoCg), max(max(farLeft, farRight), max(farUp, farDown)));
  let boxMin = min(mean - sigma * varianceClipGamma, localMin);
  let boxMax = max(mean + sigma * varianceClipGamma, localMax);
  let toHistory = history - currentYCoCg;
  let roomToBox = select(currentYCoCg - boxMin, boxMax - currentYCoCg, toHistory > vec3<f32>(0.0));
  let tolerance = 1.0e-4 + 0.01 * (abs(currentYCoCg.x) + abs(history.x));
  let ratio = abs(toHistory) / max(roomToBox, vec3<f32>(tolerance));
  let maxRatio = max(ratio.x, max(ratio.y, ratio.z));
  if (maxRatio > 1.0) {
    history = currentYCoCg + toHistory / maxRatio;
  }

  // The weight of the current frame. Pixels that do not move use the smaller static weight: the exponential blend
  // weights the recent frames of the jitter sequence more, and a smaller weight averages the sequence more evenly.
  // Pixels that move by a pixel per frame or more keep the larger weight, so that the history, resampled every
  // frame, does not blur. Right after a reset, the weight starts at 1 / (n + 1), the even average of the frames.
  let movingFrameWeight = get_currentFrameWeight(materialSID, 0);
  let staticFrameWeight = min(get_staticFrameWeight(materialSID, 0), movingFrameWeight);
  let speedInPixels = length(velocity * framebufferSize);
  let historyFrameCount = get_historyFrameCount(materialSID, 0);
  let blendFactor = max(
    mix(staticFrameWeight, movingFrameWeight, saturate(speedInPixels)),
    1.0 / (historyFrameCount + 1.0)
  );

  // Exponential blend weighted by the inverse luminance (Karis 2014) to suppress flickering highlights.
  let currentWeight = blendFactor / (1.0 + currentYCoCg.x);
  let historyWeight = (1.0 - blendFactor) / (1.0 + history.x);
  let result = (currentYCoCg * currentWeight + history * historyWeight) / (currentWeight + historyWeight);

  return vec4<f32>(max(yCoCgToRgb(result), vec3<f32>(0.0)), currentAlpha);
}
`,n="fragment",o=!0,i={code:r,shaderStage:n,isFragmentShader:o};export{r as code,i as default,o as isFragmentShader,n as shaderStage};
