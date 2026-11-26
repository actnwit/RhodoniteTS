/* shaderity: @{definitions} */
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

@fragment
fn main(
  input: VertexOutput,
) -> @location(0) vec4<f32> {
/* shaderity: @{mainPrerequisites} */

  let uv = input.texcoord_0;
  let framebufferSize: vec2<f32> = get_framebufferSize(materialSID, 0);
  let texelSize = 1.0 / framebufferSize;

  let current = textureSampleLevel(baseColorTexture, baseColorSampler, uv, 0.0);

  // Statistics of the 3x3 neighborhood (for the variance clipping) and the closest surface in it
  // (whose motion vector is used, so that the edges of moving objects reproject with them).
  var moment1 = vec3<f32>(0.0);
  var moment2 = vec3<f32>(0.0);
  var closestDepth = 2.0;
  var closestOffset = vec2<f32>(0.0);
  for (var y = -1; y <= 1; y++) {
    for (var x = -1; x <= 1; x++) {
      let offset = vec2<f32>(f32(x), f32(y)) * texelSize;
      let neighbor = rgbToYCoCg(textureSampleLevel(baseColorTexture, baseColorSampler, uv + offset, 0.0).rgb);
      moment1 += neighbor;
      moment2 += neighbor * neighbor;
      let depth = textureSampleLevel(velocityTexture, velocitySampler, uv + offset, 0.0).z;
      if (depth < closestDepth) {
        closestDepth = depth;
        closestOffset = offset;
      }
    }
  }

  let velocity = textureSampleLevel(velocityTexture, velocitySampler, uv + closestOffset, 0.0).xy;
  let historyUv = uv - velocity;
  let isHistoryValid = get_isHistoryValid(materialSID, 0);
  if (!isHistoryValid || historyUv.x < 0.0 || historyUv.x > 1.0 || historyUv.y < 0.0 || historyUv.y > 1.0) {
    return current;
  }

  var history = rgbToYCoCg(sampleHistoryCatmullRom(historyUv, framebufferSize));

  // Variance clipping (Salvi 2016): clip the history towards the mean of the neighborhood.
  let mean = moment1 / 9.0;
  let sigma = sqrt(max(moment2 / 9.0 - mean * mean, vec3<f32>(0.0)));
  let varianceClipGamma = get_varianceClipGamma(materialSID, 0);
  let extents = sigma * varianceClipGamma + vec3<f32>(1.0e-5);
  let fromMean = history - mean;
  let ratio = abs(fromMean / extents);
  let maxRatio = max(ratio.x, max(ratio.y, ratio.z));
  if (maxRatio > 1.0) {
    history = mean + fromMean / maxRatio;
  }

  // Exponential blend weighted by the inverse luminance (Karis 2014) to suppress flickering highlights.
  let currentYCoCg = rgbToYCoCg(current.rgb);
  let blendFactor = get_currentFrameWeight(materialSID, 0);
  let currentWeight = blendFactor / (1.0 + currentYCoCg.x);
  let historyWeight = (1.0 - blendFactor) / (1.0 + history.x);
  let result = (currentYCoCg * currentWeight + history * historyWeight) / (currentWeight + historyWeight);

  return vec4<f32>(max(yCoCgToRgb(result), vec3<f32>(0.0)), current.a);
}
