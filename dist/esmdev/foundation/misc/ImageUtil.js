// src/foundation/misc/ImageUtil.ts
import { ColorRgb } from "../math/ColorRgb.js";
import { MathUtil } from "../math/MathUtil.js";
import { MutableMatrix33 } from "../math/MutableMatrix33.js";
import { MutableVector2 } from "../math/MutableVector2.js";
import { MutableVector3 } from "../math/MutableVector3.js";
import { Vector3 } from "../math/Vector3.js";
import { TextureDataFloat } from "../textures/TextureDataFloat.js";
import { Is } from "./Is.js";
function computeEigenVectors(input, eigenVectors) {
  let R = 0;
  let G = 0;
  let B = 0;
  let RR = 0;
  let GG = 0;
  let BB = 0;
  let RG = 0;
  let RB = 0;
  let GB = 0;
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      const col = input.getPixelAs(x, y, 3, ColorRgb);
      R += col.x;
      G += col.y;
      B += col.z;
      RR += col.x * col.x;
      GG += col.y * col.y;
      BB += col.z * col.z;
      RG += col.x * col.y;
      RB += col.x * col.z;
      GB += col.y * col.z;
    }
  }
  const inputImagePixelsNumber = input.width * input.height;
  R /= inputImagePixelsNumber;
  G /= inputImagePixelsNumber;
  B /= inputImagePixelsNumber;
  RR /= inputImagePixelsNumber;
  GG /= inputImagePixelsNumber;
  BB /= inputImagePixelsNumber;
  RG /= inputImagePixelsNumber;
  RB /= inputImagePixelsNumber;
  GB /= inputImagePixelsNumber;
  const covarMat = MutableMatrix33.zero();
  covarMat.m00 = RR - R * R;
  covarMat.m01 = RG - R * G;
  covarMat.m02 = RB - R * B;
  covarMat.m10 = RG - R * G;
  covarMat.m11 = GG - G * G;
  covarMat.m12 = GB - G * B;
  covarMat.m20 = RB - R * B;
  covarMat.m21 = GB - G * B;
  covarMat.m22 = BB - B * B;
  const eigenVectorsTemp = MutableMatrix33.zero();
  const eigenValuesTemp = MutableVector3.zero();
  MathUtil.computeEigenValuesAndVectors(covarMat, eigenVectorsTemp, eigenValuesTemp);
  eigenVectors[0] = Vector3.fromCopyArray([eigenVectorsTemp.m00, eigenVectorsTemp.m10, eigenVectorsTemp.m20]);
  eigenVectors[1] = Vector3.fromCopyArray([eigenVectorsTemp.m01, eigenVectorsTemp.m11, eigenVectorsTemp.m21]);
  eigenVectors[2] = Vector3.fromCopyArray([eigenVectorsTemp.m02, eigenVectorsTemp.m12, eigenVectorsTemp.m22]);
}
function decorrelateColorSpace(input, input_decorrelated, colorSpaceVector1, colorSpaceVector2, colorSpaceVector3, colorSpaceOrigin) {
  const eigenvectors = [MutableVector3.zero(), MutableVector3.zero(), MutableVector3.zero()];
  computeEigenVectors(input, eigenvectors);
  for (let y = 0; y < input.height; y++)
    for (let x = 0; x < input.width; x++)
      for (let channel = 0; channel < 3; ++channel) {
        const color = input.getPixelAs(x, y, 3, ColorRgb);
        const new_channel_value = Vector3.dot(color, eigenvectors[channel]);
        input_decorrelated.setPixelAtChannel(x, y, channel, new_channel_value);
      }
  const colorSpaceRanges = [
    MutableVector2.fromCopyArray2([Number.MAX_VALUE, -Number.MAX_VALUE]),
    MutableVector2.fromCopyArray2([Number.MAX_VALUE, -Number.MAX_VALUE]),
    MutableVector2.fromCopyArray2([Number.MAX_VALUE, -Number.MAX_VALUE])
  ];
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      for (let channel = 0; channel < 3; ++channel) {
        colorSpaceRanges[channel].x = Math.min(
          colorSpaceRanges[channel].x,
          input_decorrelated.getPixelAsArray(x, y)[channel]
        );
        colorSpaceRanges[channel].y = Math.max(
          colorSpaceRanges[channel].y,
          input_decorrelated.getPixelAsArray(x, y)[channel]
        );
      }
    }
  }
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      for (let channel = 0; channel < 3; ++channel) {
        const value = input_decorrelated.getPixelAsArray(x, y)[channel];
        const remapped_value = (value - colorSpaceRanges[channel].x) / (colorSpaceRanges[channel].y - colorSpaceRanges[channel].x);
        input_decorrelated.setPixelAtChannel(x, y, channel, remapped_value);
      }
    }
  }
  colorSpaceOrigin.x = colorSpaceRanges[0].x * eigenvectors[0].x + colorSpaceRanges[1].x * eigenvectors[1].x + colorSpaceRanges[2].x * eigenvectors[2].x;
  colorSpaceOrigin.y = colorSpaceRanges[0].x * eigenvectors[0].y + colorSpaceRanges[1].x * eigenvectors[1].y + colorSpaceRanges[2].x * eigenvectors[2].y;
  colorSpaceOrigin.z = colorSpaceRanges[0].x * eigenvectors[0].z + colorSpaceRanges[1].x * eigenvectors[1].z + colorSpaceRanges[2].x * eigenvectors[2].z;
  colorSpaceVector1.x = eigenvectors[0].x * (colorSpaceRanges[0].y - colorSpaceRanges[0].x);
  colorSpaceVector1.y = eigenvectors[0].y * (colorSpaceRanges[0].y - colorSpaceRanges[0].x);
  colorSpaceVector1.z = eigenvectors[0].z * (colorSpaceRanges[0].y - colorSpaceRanges[0].x);
  colorSpaceVector2.x = eigenvectors[1].x * (colorSpaceRanges[1].y - colorSpaceRanges[1].x);
  colorSpaceVector2.y = eigenvectors[1].y * (colorSpaceRanges[1].y - colorSpaceRanges[1].x);
  colorSpaceVector2.z = eigenvectors[1].z * (colorSpaceRanges[1].y - colorSpaceRanges[1].x);
  colorSpaceVector3.x = eigenvectors[2].x * (colorSpaceRanges[2].y - colorSpaceRanges[2].x);
  colorSpaceVector3.y = eigenvectors[2].y * (colorSpaceRanges[2].y - colorSpaceRanges[2].x);
  colorSpaceVector3.z = eigenvectors[2].z * (colorSpaceRanges[2].y - colorSpaceRanges[2].x);
}
function computeLODAverageSubpixelVariance(image, LOD, channel) {
  const windowWidth = 1 << LOD;
  let average_window_variance = 0;
  for (let window_y = 0; window_y < image.height; window_y += windowWidth) {
    for (let window_x = 0; window_x < image.width; window_x += windowWidth) {
      let v = 0;
      let v2 = 0;
      for (let y = 0; y < windowWidth; y++) {
        for (let x = 0; x < windowWidth; x++) {
          const value = image.getPixel(window_x + x, window_y + y, channel);
          v += value;
          v2 += value * value;
        }
      }
      v /= windowWidth * windowWidth;
      v2 /= windowWidth * windowWidth;
      const window_variance = Math.max(0, v2 - v * v);
      average_window_variance += window_variance / (image.width * image.height / windowWidth / windowWidth);
    }
  }
  return average_window_variance;
}
function filterLUTValueAtx(LUT, x, std, channel, LUT_WIDTH = 128) {
  const numberOfSamples = 2 * LUT_WIDTH;
  let filtered_value = 0;
  for (let sample = 0; sample < numberOfSamples; sample++) {
    const U = (sample + 0.5) / numberOfSamples;
    const sample_x = MathUtil.invGaussianCdf(U, x, std);
    const sample_texel = Math.max(0, Math.min(LUT_WIDTH - 1, Math.floor(sample_x * LUT_WIDTH)));
    const sample_value = LUT.getPixelAsArray(sample_texel, 0)[channel];
    filtered_value += sample_value;
  }
  filtered_value /= numberOfSamples;
  return filtered_value;
}
function prefilterLUT(image_T_Input, LUT_Tinv, channel) {
  for (let LOD = 1; LOD < LUT_Tinv.height; LOD++) {
    const window_variance = computeLODAverageSubpixelVariance(image_T_Input, LOD, channel);
    const window_std = Math.sqrt(window_variance);
    for (let i = 0; i < LUT_Tinv.width; i++) {
      const x_texel = (i + 0.5) / LUT_Tinv.width;
      const filteredValue = filterLUTValueAtx(LUT_Tinv, x_texel, window_std, channel);
      LUT_Tinv.setPixelAtChannel(i, LOD, channel, filteredValue);
    }
  }
}
function generatePixelSortTypeArray(arrayLength) {
  const array = [];
  for (let i = 0; i < arrayLength; i++) {
    array.push({});
  }
  return array;
}
function computeTinput(input, T_input, channel, GAUSSIAN_AVERAGE = 0.5, GAUSSIAN_STD = 0.16666) {
  const sortedInputValues = generatePixelSortTypeArray(input.height * input.width);
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      sortedInputValues[y * input.width + x].x = x;
      sortedInputValues[y * input.width + x].y = y;
      sortedInputValues[y * input.width + x].value = input.getPixel(x, y, channel);
    }
  }
  sortedInputValues.sort((a, b) => {
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
  });
  for (let i = 0; i < sortedInputValues.length; i++) {
    const x = sortedInputValues[i].x;
    const y = sortedInputValues[i].y;
    const U = (i + 0.5) / sortedInputValues.length;
    const G = MathUtil.invGaussianCdf(U, GAUSSIAN_AVERAGE, GAUSSIAN_STD);
    T_input.setPixelAtChannel(x, y, channel, G);
  }
}
function computeInvT(input, Tinv, channel, GAUSSIAN_AVERAGE = 0.5, GAUSSIAN_STD = 0.16666) {
  const sortedInputValues = [];
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      sortedInputValues[y * input.width + x] = input.getPixel(x, y, channel);
    }
  }
  sortedInputValues.sort((a, b) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });
  for (let i = 0; i < Tinv.width; i++) {
    const G = (i + 0.5) / Tinv.width;
    const U = MathUtil.gaussianCdf(G, GAUSSIAN_AVERAGE, GAUSSIAN_STD);
    const index = Math.floor(U * sortedInputValues.length);
    const I = sortedInputValues[index];
    Tinv.setPixelAtChannel(i, 0, channel, I);
  }
}
function precomputations(input, LUT_WIDTH = 128) {
  const retVal = {};
  retVal.lutWidth = LUT_WIDTH;
  retVal.colorSpaceVector1 = MutableVector3.zero();
  retVal.colorSpaceVector2 = MutableVector3.zero();
  retVal.colorSpaceVector3 = MutableVector3.zero();
  retVal.colorSpaceOrigin = MutableVector3.zero();
  const input_decorrelated = new TextureDataFloat(input.width, input.height, 3);
  decorrelateColorSpace(
    input,
    input_decorrelated,
    retVal.colorSpaceVector1,
    retVal.colorSpaceVector2,
    retVal.colorSpaceVector3,
    retVal.colorSpaceOrigin
  );
  const Tinput = new TextureDataFloat(input.width, input.height, 3);
  retVal.Tinput = Tinput;
  for (let channel = 0; channel < 3; channel++) {
    computeTinput(input_decorrelated, Tinput, channel);
  }
  const Tinv = new TextureDataFloat(LUT_WIDTH, 1, 3);
  retVal.Tinv = Tinv;
  for (let channel = 0; channel < 3; channel++) {
    computeInvT(input_decorrelated, Tinv, channel);
  }
  Tinv.resize(Tinv.width, Math.floor(Math.log(Tinput.width) / Math.log(2)), 3);
  for (let channel = 0; channel < 3; channel++) {
    prefilterLUT(Tinput, Tinv, channel);
  }
  return retVal;
}
function convertHTMLImageElementToCanvas(image, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, width, height);
  return canvas;
}
function combineImages(data) {
  const width = data.width;
  const height = data.height;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputCtx = outputCanvas.getContext("2d");
  const outputImageData = outputCtx.getImageData(0, 0, width, height);
  if (Is.exist(data.r_image)) {
    const inputR_ctx = data.r_image.getContext("2d");
    const r_imageData = inputR_ctx.getImageData(0, 0, data.r_image.width, data.r_image.height);
    for (let i = 0; i < width * height; i++) {
      outputImageData.data[i * 4 + 0] = r_imageData.data[i * 4 + 0];
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      outputImageData.data[i * 4 + 0] = 0;
    }
  }
  if (Is.exist(data.g_image)) {
    const inputG_ctx = data.g_image.getContext("2d");
    const g_imageData = inputG_ctx.getImageData(0, 0, data.g_image.width, data.g_image.height);
    for (let i = 0; i < width * height; i++) {
      outputImageData.data[i * 4 + 1] = g_imageData.data[i * 4 + 1];
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      outputImageData.data[i * 4 + 1] = 0;
    }
  }
  if (Is.exist(data.b_image)) {
    const inputB_ctx = data.b_image.getContext("2d");
    const b_imageData = inputB_ctx.getImageData(0, 0, data.b_image.width, data.b_image.height);
    for (let i = 0; i < width * height; i++) {
      outputImageData.data[i * 4 + 2] = b_imageData.data[i * 4 + 2];
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      outputImageData.data[i * 4 + 2] = 0;
    }
  }
  if (Is.exist(data.a_image)) {
    const inputA_ctx = data.a_image.getContext("2d");
    const a_imageData = inputA_ctx.getImageData(0, 0, data.a_image.width, data.a_image.height);
    for (let i = 0; i < width * height; i++) {
      outputImageData.data[i * 4 + 3] = a_imageData.data[i * 4 + 3];
    }
  } else {
    for (let i = 0; i < width * height; i++) {
      outputImageData.data[i * 4 + 3] = 0;
    }
  }
  outputCtx.putImageData(outputImageData, 0, 0);
  return outputCanvas;
}
var ImageUtil = Object.freeze({ precomputations });
export {
  ImageUtil,
  combineImages,
  convertHTMLImageElementToCanvas
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWlzYy9JbWFnZVV0aWwudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB0eXBlIHsgSW5kZXgsIFNpemUgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb2xvclJnYiB9IGZyb20gJy4uL21hdGgvQ29sb3JSZ2InO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuLi9tYXRoL01hdGhVdGlsJztcbmltcG9ydCB7IE11dGFibGVNYXRyaXgzMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZU1hdHJpeDMzJztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IyIH0gZnJvbSAnLi4vbWF0aC9NdXRhYmxlVmVjdG9yMic7XG5pbXBvcnQgeyBNdXRhYmxlVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvTXV0YWJsZVZlY3RvcjMnO1xuaW1wb3J0IHsgVmVjdG9yMyB9IGZyb20gJy4uL21hdGgvVmVjdG9yMyc7XG5pbXBvcnQgeyBUZXh0dXJlRGF0YUZsb2F0IH0gZnJvbSAnLi4vdGV4dHVyZXMvVGV4dHVyZURhdGFGbG9hdCc7XG5pbXBvcnQgeyBJcyB9IGZyb20gJy4vSXMnO1xuXG4vKipcbiAqIFR5cGUgZGVmaW5pdGlvbiBmb3IgcGl4ZWwgc29ydGluZyBvcGVyYXRpb25zXG4gKi9cbnR5cGUgUGl4ZWxTb3J0VHlwZSA9IHtcbiAgeDogSW5kZXg7XG4gIHk6IEluZGV4O1xuICB2YWx1ZTogbnVtYmVyO1xufTtcblxuLyoqXG4gKiBDb21wdXRlcyB0aGUgZWlnZW4gdmVjdG9ycyBvZiB0aGUgaGlzdG9ncmFtIG9mIHRoZSBpbnB1dCBpbWFnZS5cbiAqIFRoaXMgaW1wbGVtZW50YXRpb24gaXMgYmFzZWQgb24gXCJQcm9jZWR1cmFsIFN0b2NoYXN0aWMgVGV4dHVyZXMgYnkgVGlsaW5nIGFuZCBCbGVuZGluZ1wiXG4gKiBmcm9tIGh0dHBzOi8vZWhlaXR6cmVzZWFyY2gud29yZHByZXNzLmNvbS83MzgtMi9cbiAqXG4gKiBAcGFyYW0gaW5wdXQgLSBUaGUgaW5wdXQgdGV4dHVyZSBkYXRhIHRvIGFuYWx5emVcbiAqIEBwYXJhbSBlaWdlblZlY3RvcnMgLSBBcnJheSB0byBzdG9yZSB0aGUgY29tcHV0ZWQgZWlnZW4gdmVjdG9ycyAob3V0cHV0IHBhcmFtZXRlcilcbiAqL1xuZnVuY3Rpb24gY29tcHV0ZUVpZ2VuVmVjdG9ycyhpbnB1dDogVGV4dHVyZURhdGFGbG9hdCwgZWlnZW5WZWN0b3JzOiBWZWN0b3IzW10pIHtcbiAgLy8gRmlyc3QgYW5kIHNlY29uZCBvcmRlciBtb21lbnRzXG4gIGxldCBSID0gMDtcbiAgbGV0IEcgPSAwO1xuICBsZXQgQiA9IDA7XG4gIGxldCBSUiA9IDA7XG4gIGxldCBHRyA9IDA7XG4gIGxldCBCQiA9IDA7XG4gIGxldCBSRyA9IDA7XG4gIGxldCBSQiA9IDA7XG4gIGxldCBHQiA9IDA7XG4gIGZvciAobGV0IHkgPSAwOyB5IDwgaW5wdXQuaGVpZ2h0OyB5KyspIHtcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGlucHV0LndpZHRoOyB4KyspIHtcbiAgICAgIGNvbnN0IGNvbCA9IGlucHV0LmdldFBpeGVsQXMoeCwgeSwgMywgQ29sb3JSZ2IpO1xuICAgICAgUiArPSBjb2wueDtcbiAgICAgIEcgKz0gY29sLnk7XG4gICAgICBCICs9IGNvbC56O1xuICAgICAgUlIgKz0gY29sLnggKiBjb2wueDtcbiAgICAgIEdHICs9IGNvbC55ICogY29sLnk7XG4gICAgICBCQiArPSBjb2wueiAqIGNvbC56O1xuICAgICAgUkcgKz0gY29sLnggKiBjb2wueTtcbiAgICAgIFJCICs9IGNvbC54ICogY29sLno7XG4gICAgICBHQiArPSBjb2wueSAqIGNvbC56O1xuICAgIH1cbiAgfVxuICBjb25zdCBpbnB1dEltYWdlUGl4ZWxzTnVtYmVyID0gaW5wdXQud2lkdGggKiBpbnB1dC5oZWlnaHQ7XG4gIFIgLz0gaW5wdXRJbWFnZVBpeGVsc051bWJlcjtcbiAgRyAvPSBpbnB1dEltYWdlUGl4ZWxzTnVtYmVyO1xuICBCIC89IGlucHV0SW1hZ2VQaXhlbHNOdW1iZXI7XG4gIFJSIC89IGlucHV0SW1hZ2VQaXhlbHNOdW1iZXI7XG4gIEdHIC89IGlucHV0SW1hZ2VQaXhlbHNOdW1iZXI7XG4gIEJCIC89IGlucHV0SW1hZ2VQaXhlbHNOdW1iZXI7XG4gIFJHIC89IGlucHV0SW1hZ2VQaXhlbHNOdW1iZXI7XG4gIFJCIC89IGlucHV0SW1hZ2VQaXhlbHNOdW1iZXI7XG4gIEdCIC89IGlucHV0SW1hZ2VQaXhlbHNOdW1iZXI7XG5cbiAgLy8gQ292YXJpYW5jZSBtYXRyaXhcbiAgY29uc3QgY292YXJNYXQgPSBNdXRhYmxlTWF0cml4MzMuemVybygpO1xuICBjb3Zhck1hdC5tMDAgPSBSUiAtIFIgKiBSO1xuICBjb3Zhck1hdC5tMDEgPSBSRyAtIFIgKiBHO1xuICBjb3Zhck1hdC5tMDIgPSBSQiAtIFIgKiBCO1xuICBjb3Zhck1hdC5tMTAgPSBSRyAtIFIgKiBHO1xuICBjb3Zhck1hdC5tMTEgPSBHRyAtIEcgKiBHO1xuICBjb3Zhck1hdC5tMTIgPSBHQiAtIEcgKiBCO1xuICBjb3Zhck1hdC5tMjAgPSBSQiAtIFIgKiBCO1xuICBjb3Zhck1hdC5tMjEgPSBHQiAtIEcgKiBCO1xuICBjb3Zhck1hdC5tMjIgPSBCQiAtIEIgKiBCO1xuXG4gIC8vIEZpbmQgZWlnZW4gdmFsdWVzIGFuZCB2ZWN0b3JzIHVzaW5nIEphY29iaSBhbGdvcml0aG1cbiAgY29uc3QgZWlnZW5WZWN0b3JzVGVtcCA9IE11dGFibGVNYXRyaXgzMy56ZXJvKCk7XG4gIGNvbnN0IGVpZ2VuVmFsdWVzVGVtcCA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgTWF0aFV0aWwuY29tcHV0ZUVpZ2VuVmFsdWVzQW5kVmVjdG9ycyhjb3Zhck1hdCwgZWlnZW5WZWN0b3JzVGVtcCwgZWlnZW5WYWx1ZXNUZW1wKTtcblxuICAvLyBTZXQgcmV0dXJuIHZhbHVlc1xuICBlaWdlblZlY3RvcnNbMF0gPSBWZWN0b3IzLmZyb21Db3B5QXJyYXkoW2VpZ2VuVmVjdG9yc1RlbXAubTAwLCBlaWdlblZlY3RvcnNUZW1wLm0xMCwgZWlnZW5WZWN0b3JzVGVtcC5tMjBdKTtcbiAgZWlnZW5WZWN0b3JzWzFdID0gVmVjdG9yMy5mcm9tQ29weUFycmF5KFtlaWdlblZlY3RvcnNUZW1wLm0wMSwgZWlnZW5WZWN0b3JzVGVtcC5tMTEsIGVpZ2VuVmVjdG9yc1RlbXAubTIxXSk7XG4gIGVpZ2VuVmVjdG9yc1syXSA9IFZlY3RvcjMuZnJvbUNvcHlBcnJheShbZWlnZW5WZWN0b3JzVGVtcC5tMDIsIGVpZ2VuVmVjdG9yc1RlbXAubTEyLCBlaWdlblZlY3RvcnNUZW1wLm0yMl0pO1xufVxuXG4vKipcbiAqIERlY29ycmVsYXRlcyB0aGUgY29sb3Igc3BhY2Ugb2YgdGhlIGlucHV0IGltYWdlIGJ5IHRyYW5zZm9ybWluZyBpdCB0byBlaWdlbnZlY3RvciBzcGFjZS5cbiAqIFRoaXMgcmVkdWNlcyBjb3JyZWxhdGlvbiBiZXR3ZWVuIGNvbG9yIGNoYW5uZWxzIGZvciBiZXR0ZXIgdGV4dHVyZSBzeW50aGVzaXMgcmVzdWx0cy5cbiAqXG4gKiBAcGFyYW0gaW5wdXQgLSBUaGUgaW5wdXQgdGV4dHVyZSBkYXRhIHRvIGRlY29ycmVsYXRlXG4gKiBAcGFyYW0gaW5wdXRfZGVjb3JyZWxhdGVkIC0gT3V0cHV0IHRleHR1cmUgZGF0YSB3aXRoIGRlY29ycmVsYXRlZCBjb2xvcnNcbiAqIEBwYXJhbSBjb2xvclNwYWNlVmVjdG9yMSAtIE91dHB1dCBjb2xvciBzcGFjZSB2ZWN0b3IgMVxuICogQHBhcmFtIGNvbG9yU3BhY2VWZWN0b3IyIC0gT3V0cHV0IGNvbG9yIHNwYWNlIHZlY3RvciAyXG4gKiBAcGFyYW0gY29sb3JTcGFjZVZlY3RvcjMgLSBPdXRwdXQgY29sb3Igc3BhY2UgdmVjdG9yIDNcbiAqIEBwYXJhbSBjb2xvclNwYWNlT3JpZ2luIC0gT3V0cHV0IGNvbG9yIHNwYWNlIG9yaWdpblxuICovXG5mdW5jdGlvbiBkZWNvcnJlbGF0ZUNvbG9yU3BhY2UoXG4gIGlucHV0OiBUZXh0dXJlRGF0YUZsb2F0LCAvLyBpbnB1dDogZXhhbXBsZSBpbWFnZVxuICBpbnB1dF9kZWNvcnJlbGF0ZWQ6IFRleHR1cmVEYXRhRmxvYXQsIC8vIG91dHB1dDogZGVjb3JyZWxhdGVkIGlucHV0XG4gIGNvbG9yU3BhY2VWZWN0b3IxOiBNdXRhYmxlVmVjdG9yMywgLy8gb3V0cHV0OiBjb2xvciBzcGFjZSB2ZWN0b3IxXG4gIGNvbG9yU3BhY2VWZWN0b3IyOiBNdXRhYmxlVmVjdG9yMywgLy8gb3V0cHV0OiBjb2xvciBzcGFjZSB2ZWN0b3IyXG4gIGNvbG9yU3BhY2VWZWN0b3IzOiBNdXRhYmxlVmVjdG9yMywgLy8gb3V0cHV0OiBjb2xvciBzcGFjZSB2ZWN0b3IzXG4gIGNvbG9yU3BhY2VPcmlnaW46IE11dGFibGVWZWN0b3IzXG4pIHtcbiAgLy8gb3V0cHV0OiBjb2xvciBzcGFjZSBvcmlnaW5cbiAgLy8gQ29tcHV0ZSB0aGUgZWlnZW52ZWN0b3JzIG9mIHRoZSBoaXN0b2dyYW1cbiAgY29uc3QgZWlnZW52ZWN0b3JzID0gW011dGFibGVWZWN0b3IzLnplcm8oKSwgTXV0YWJsZVZlY3RvcjMuemVybygpLCBNdXRhYmxlVmVjdG9yMy56ZXJvKCldO1xuICBjb21wdXRlRWlnZW5WZWN0b3JzKGlucHV0LCBlaWdlbnZlY3RvcnMpO1xuXG4gIC8vIFJvdGF0ZSB0byBlaWdlbnZlY3RvciBzcGFjZSBhbmRcbiAgZm9yIChsZXQgeSA9IDA7IHkgPCBpbnB1dC5oZWlnaHQ7IHkrKylcbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGlucHV0LndpZHRoOyB4KyspXG4gICAgICBmb3IgKGxldCBjaGFubmVsID0gMDsgY2hhbm5lbCA8IDM7ICsrY2hhbm5lbCkge1xuICAgICAgICAvLyBHZXQgY3VycmVudCBjb2xvclxuICAgICAgICBjb25zdCBjb2xvcjogQ29sb3JSZ2IgPSBpbnB1dC5nZXRQaXhlbEFzKHgsIHksIDMsIENvbG9yUmdiKTtcbiAgICAgICAgLy8gUHJvamVjdCBvbiBlaWdlbnZlY3RvclxuICAgICAgICBjb25zdCBuZXdfY2hhbm5lbF92YWx1ZTogbnVtYmVyID0gVmVjdG9yMy5kb3QoY29sb3IsIGVpZ2VudmVjdG9yc1tjaGFubmVsXSk7XG4gICAgICAgIC8vIFN0b3JlXG4gICAgICAgIGlucHV0X2RlY29ycmVsYXRlZC5zZXRQaXhlbEF0Q2hhbm5lbCh4LCB5LCBjaGFubmVsLCBuZXdfY2hhbm5lbF92YWx1ZSk7XG4gICAgICB9XG5cbiAgLy8gQ29tcHV0ZSByYW5nZXMgb2YgdGhlIG5ldyBjb2xvciBzcGFjZVxuICBjb25zdCBjb2xvclNwYWNlUmFuZ2VzOiBNdXRhYmxlVmVjdG9yMltdID0gW1xuICAgIE11dGFibGVWZWN0b3IyLmZyb21Db3B5QXJyYXkyKFtOdW1iZXIuTUFYX1ZBTFVFLCAtTnVtYmVyLk1BWF9WQUxVRV0pLFxuICAgIE11dGFibGVWZWN0b3IyLmZyb21Db3B5QXJyYXkyKFtOdW1iZXIuTUFYX1ZBTFVFLCAtTnVtYmVyLk1BWF9WQUxVRV0pLFxuICAgIE11dGFibGVWZWN0b3IyLmZyb21Db3B5QXJyYXkyKFtOdW1iZXIuTUFYX1ZBTFVFLCAtTnVtYmVyLk1BWF9WQUxVRV0pLFxuICBdO1xuICBmb3IgKGxldCB5ID0gMDsgeSA8IGlucHV0LmhlaWdodDsgeSsrKSB7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbnB1dC53aWR0aDsgeCsrKSB7XG4gICAgICBmb3IgKGxldCBjaGFubmVsID0gMDsgY2hhbm5lbCA8IDM7ICsrY2hhbm5lbCkge1xuICAgICAgICBjb2xvclNwYWNlUmFuZ2VzW2NoYW5uZWxdLnggPSBNYXRoLm1pbihcbiAgICAgICAgICBjb2xvclNwYWNlUmFuZ2VzW2NoYW5uZWxdLngsXG4gICAgICAgICAgaW5wdXRfZGVjb3JyZWxhdGVkLmdldFBpeGVsQXNBcnJheSh4LCB5KVtjaGFubmVsXVxuICAgICAgICApO1xuICAgICAgICBjb2xvclNwYWNlUmFuZ2VzW2NoYW5uZWxdLnkgPSBNYXRoLm1heChcbiAgICAgICAgICBjb2xvclNwYWNlUmFuZ2VzW2NoYW5uZWxdLnksXG4gICAgICAgICAgaW5wdXRfZGVjb3JyZWxhdGVkLmdldFBpeGVsQXNBcnJheSh4LCB5KVtjaGFubmVsXVxuICAgICAgICApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFJlbWFwIHJhbmdlIHRvIFswLCAxXVxuICBmb3IgKGxldCB5ID0gMDsgeSA8IGlucHV0LmhlaWdodDsgeSsrKSB7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbnB1dC53aWR0aDsgeCsrKSB7XG4gICAgICBmb3IgKGxldCBjaGFubmVsID0gMDsgY2hhbm5lbCA8IDM7ICsrY2hhbm5lbCkge1xuICAgICAgICAvLyBHZXQgY3VycmVudCB2YWx1ZVxuICAgICAgICBjb25zdCB2YWx1ZTogbnVtYmVyID0gaW5wdXRfZGVjb3JyZWxhdGVkLmdldFBpeGVsQXNBcnJheSh4LCB5KVtjaGFubmVsXTtcbiAgICAgICAgLy8gUmVtYXAgaW4gWzAsIDFdXG4gICAgICAgIGNvbnN0IHJlbWFwcGVkX3ZhbHVlID1cbiAgICAgICAgICAodmFsdWUgLSBjb2xvclNwYWNlUmFuZ2VzW2NoYW5uZWxdLngpIC8gKGNvbG9yU3BhY2VSYW5nZXNbY2hhbm5lbF0ueSAtIGNvbG9yU3BhY2VSYW5nZXNbY2hhbm5lbF0ueCk7XG4gICAgICAgIC8vIFN0b3JlXG4gICAgICAgIGlucHV0X2RlY29ycmVsYXRlZC5zZXRQaXhlbEF0Q2hhbm5lbCh4LCB5LCBjaGFubmVsLCByZW1hcHBlZF92YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQ29tcHV0ZSBjb2xvciBzcGFjZSBvcmlnaW4gYW5kIHZlY3RvcnMgc2NhbGVkIGZvciB0aGUgbm9ybWFsaXplZCByYW5nZVxuICBjb2xvclNwYWNlT3JpZ2luLnggPVxuICAgIGNvbG9yU3BhY2VSYW5nZXNbMF0ueCAqIGVpZ2VudmVjdG9yc1swXS54ICtcbiAgICBjb2xvclNwYWNlUmFuZ2VzWzFdLnggKiBlaWdlbnZlY3RvcnNbMV0ueCArXG4gICAgY29sb3JTcGFjZVJhbmdlc1syXS54ICogZWlnZW52ZWN0b3JzWzJdLng7XG4gIGNvbG9yU3BhY2VPcmlnaW4ueSA9XG4gICAgY29sb3JTcGFjZVJhbmdlc1swXS54ICogZWlnZW52ZWN0b3JzWzBdLnkgK1xuICAgIGNvbG9yU3BhY2VSYW5nZXNbMV0ueCAqIGVpZ2VudmVjdG9yc1sxXS55ICtcbiAgICBjb2xvclNwYWNlUmFuZ2VzWzJdLnggKiBlaWdlbnZlY3RvcnNbMl0ueTtcbiAgY29sb3JTcGFjZU9yaWdpbi56ID1cbiAgICBjb2xvclNwYWNlUmFuZ2VzWzBdLnggKiBlaWdlbnZlY3RvcnNbMF0ueiArXG4gICAgY29sb3JTcGFjZVJhbmdlc1sxXS54ICogZWlnZW52ZWN0b3JzWzFdLnogK1xuICAgIGNvbG9yU3BhY2VSYW5nZXNbMl0ueCAqIGVpZ2VudmVjdG9yc1syXS56O1xuICBjb2xvclNwYWNlVmVjdG9yMS54ID0gZWlnZW52ZWN0b3JzWzBdLnggKiAoY29sb3JTcGFjZVJhbmdlc1swXS55IC0gY29sb3JTcGFjZVJhbmdlc1swXS54KTtcbiAgY29sb3JTcGFjZVZlY3RvcjEueSA9IGVpZ2VudmVjdG9yc1swXS55ICogKGNvbG9yU3BhY2VSYW5nZXNbMF0ueSAtIGNvbG9yU3BhY2VSYW5nZXNbMF0ueCk7XG4gIGNvbG9yU3BhY2VWZWN0b3IxLnogPSBlaWdlbnZlY3RvcnNbMF0ueiAqIChjb2xvclNwYWNlUmFuZ2VzWzBdLnkgLSBjb2xvclNwYWNlUmFuZ2VzWzBdLngpO1xuICBjb2xvclNwYWNlVmVjdG9yMi54ID0gZWlnZW52ZWN0b3JzWzFdLnggKiAoY29sb3JTcGFjZVJhbmdlc1sxXS55IC0gY29sb3JTcGFjZVJhbmdlc1sxXS54KTtcbiAgY29sb3JTcGFjZVZlY3RvcjIueSA9IGVpZ2VudmVjdG9yc1sxXS55ICogKGNvbG9yU3BhY2VSYW5nZXNbMV0ueSAtIGNvbG9yU3BhY2VSYW5nZXNbMV0ueCk7XG4gIGNvbG9yU3BhY2VWZWN0b3IyLnogPSBlaWdlbnZlY3RvcnNbMV0ueiAqIChjb2xvclNwYWNlUmFuZ2VzWzFdLnkgLSBjb2xvclNwYWNlUmFuZ2VzWzFdLngpO1xuICBjb2xvclNwYWNlVmVjdG9yMy54ID0gZWlnZW52ZWN0b3JzWzJdLnggKiAoY29sb3JTcGFjZVJhbmdlc1syXS55IC0gY29sb3JTcGFjZVJhbmdlc1syXS54KTtcbiAgY29sb3JTcGFjZVZlY3RvcjMueSA9IGVpZ2VudmVjdG9yc1syXS55ICogKGNvbG9yU3BhY2VSYW5nZXNbMl0ueSAtIGNvbG9yU3BhY2VSYW5nZXNbMl0ueCk7XG4gIGNvbG9yU3BhY2VWZWN0b3IzLnogPSBlaWdlbnZlY3RvcnNbMl0ueiAqIChjb2xvclNwYWNlUmFuZ2VzWzJdLnkgLSBjb2xvclNwYWNlUmFuZ2VzWzJdLngpO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBhdmVyYWdlIHN1YnBpeGVsIHZhcmlhbmNlIGF0IGEgZ2l2ZW4gTGV2ZWwgb2YgRGV0YWlsIChMT0QpLlxuICogVGhpcyBpcyB1c2VkIGZvciBwcmVmaWx0ZXJpbmcgb3BlcmF0aW9ucyBpbiB0ZXh0dXJlIHN5bnRoZXNpcy5cbiAqXG4gKiBAcGFyYW0gaW1hZ2UgLSBUaGUgaW5wdXQgdGV4dHVyZSBkYXRhXG4gKiBAcGFyYW0gTE9EIC0gVGhlIExldmVsIG9mIERldGFpbCB0byBjb21wdXRlIHZhcmlhbmNlIGZvclxuICogQHBhcmFtIGNoYW5uZWwgLSBUaGUgY29sb3IgY2hhbm5lbCBpbmRleCAoMD1SLCAxPUcsIDI9QilcbiAqIEByZXR1cm5zIFRoZSBjb21wdXRlZCBhdmVyYWdlIHN1YnBpeGVsIHZhcmlhbmNlXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVMT0RBdmVyYWdlU3VicGl4ZWxWYXJpYW5jZShpbWFnZTogVGV4dHVyZURhdGFGbG9hdCwgTE9EOiBJbmRleCwgY2hhbm5lbDogSW5kZXgpOiBudW1iZXIge1xuICAvLyBXaW5kb3cgd2lkdGggYXNzb2NpYXRlZCB3aXRoXG4gIGNvbnN0IHdpbmRvd1dpZHRoID0gMSA8PCBMT0Q7XG5cbiAgLy8gQ29tcHV0ZSBhdmVyYWdlIHZhcmlhbmNlIGluIGFsbCB0aGUgd2luZG93c1xuICBsZXQgYXZlcmFnZV93aW5kb3dfdmFyaWFuY2UgPSAwLjA7XG5cbiAgLy8gTG9vcCBvdmVyIGFsIHRoZSB3aW5kb3dzXG4gIGZvciAobGV0IHdpbmRvd195ID0gMDsgd2luZG93X3kgPCBpbWFnZS5oZWlnaHQ7IHdpbmRvd195ICs9IHdpbmRvd1dpZHRoKSB7XG4gICAgZm9yIChsZXQgd2luZG93X3ggPSAwOyB3aW5kb3dfeCA8IGltYWdlLndpZHRoOyB3aW5kb3dfeCArPSB3aW5kb3dXaWR0aCkge1xuICAgICAgLy8gRXN0aW1hdGUgdmFyaWFuY2Ugb2YgY3VycmVudCB3aW5kb3dcbiAgICAgIGxldCB2ID0gMC4wO1xuICAgICAgbGV0IHYyID0gMC4wO1xuICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCB3aW5kb3dXaWR0aDsgeSsrKSB7XG4gICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2luZG93V2lkdGg7IHgrKykge1xuICAgICAgICAgIGNvbnN0IHZhbHVlID0gaW1hZ2UuZ2V0UGl4ZWwod2luZG93X3ggKyB4LCB3aW5kb3dfeSArIHksIGNoYW5uZWwpO1xuICAgICAgICAgIHYgKz0gdmFsdWU7XG4gICAgICAgICAgdjIgKz0gdmFsdWUgKiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdiAvPSB3aW5kb3dXaWR0aCAqIHdpbmRvd1dpZHRoO1xuICAgICAgdjIgLz0gd2luZG93V2lkdGggKiB3aW5kb3dXaWR0aDtcbiAgICAgIGNvbnN0IHdpbmRvd192YXJpYW5jZSA9IE1hdGgubWF4KDAuMCwgdjIgLSB2ICogdik7XG5cbiAgICAgIC8vIFVwZGF0ZSBhdmVyYWdlXG4gICAgICBhdmVyYWdlX3dpbmRvd192YXJpYW5jZSArPSB3aW5kb3dfdmFyaWFuY2UgLyAoKGltYWdlLndpZHRoICogaW1hZ2UuaGVpZ2h0KSAvIHdpbmRvd1dpZHRoIC8gd2luZG93V2lkdGgpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdmVyYWdlX3dpbmRvd192YXJpYW5jZTtcbn1cblxuLyoqXG4gKiBGaWx0ZXJzIGEgTG9vay1VcCBUYWJsZSAoTFVUKSB2YWx1ZSBieSBzYW1wbGluZyBhIEdhdXNzaWFuIGRpc3RyaWJ1dGlvbiBOKG11LCBzdGRcdTAwQjIpLlxuICogVGhpcyBpcyB1c2VkIGZvciBwcmVmaWx0ZXJpbmcgTFVUcyB0byByZWR1Y2UgYWxpYXNpbmcgYXJ0aWZhY3RzLlxuICpcbiAqIEBwYXJhbSBMVVQgLSBUaGUgTG9vay1VcCBUYWJsZSB0byBmaWx0ZXJcbiAqIEBwYXJhbSB4IC0gVGhlIHBvc2l0aW9uIHRvIGZpbHRlciBhdFxuICogQHBhcmFtIHN0ZCAtIFRoZSBzdGFuZGFyZCBkZXZpYXRpb24gb2YgdGhlIEdhdXNzaWFuIGZpbHRlclxuICogQHBhcmFtIGNoYW5uZWwgLSBUaGUgY29sb3IgY2hhbm5lbCBpbmRleFxuICogQHBhcmFtIExVVF9XSURUSCAtIFRoZSB3aWR0aCBvZiB0aGUgTFVUIChkZWZhdWx0OiAxMjgpXG4gKiBAcmV0dXJucyBUaGUgZmlsdGVyZWQgdmFsdWVcbiAqL1xuZnVuY3Rpb24gZmlsdGVyTFVUVmFsdWVBdHgoXG4gIExVVDogVGV4dHVyZURhdGFGbG9hdCxcbiAgeDogbnVtYmVyLFxuICBzdGQ6IG51bWJlcixcbiAgY2hhbm5lbDogSW5kZXgsXG4gIExVVF9XSURUSDogU2l6ZSA9IDEyOFxuKTogbnVtYmVyIHtcbiAgLy8gTnVtYmVyIG9mIHNhbXBsZXMgZm9yIGZpbHRlcmluZyAoaGV1cmlzdGljOiB0d2ljZSB0aGUgTFVUIHJlc29sdXRpb24pXG4gIGNvbnN0IG51bWJlck9mU2FtcGxlcyA9IDIgKiBMVVRfV0lEVEg7XG5cbiAgLy8gRmlsdGVyXG4gIGxldCBmaWx0ZXJlZF92YWx1ZSA9IDAuMDtcbiAgZm9yIChsZXQgc2FtcGxlID0gMDsgc2FtcGxlIDwgbnVtYmVyT2ZTYW1wbGVzOyBzYW1wbGUrKykge1xuICAgIC8vIFF1YW50aWxlIHVzZWQgdG8gc2FtcGxlIHRoZSBHYXVzc2lhblxuICAgIGNvbnN0IFUgPSAoc2FtcGxlICsgMC41KSAvIG51bWJlck9mU2FtcGxlcztcbiAgICAvLyBTYW1wbGUgdGhlIEdhdXNzaWFuXG4gICAgY29uc3Qgc2FtcGxlX3ggPSBNYXRoVXRpbC5pbnZHYXVzc2lhbkNkZihVLCB4LCBzdGQpO1xuICAgIC8vIEZpbmQgc2FtcGxlIHRleGVsIGluIExVVCAodGhlIExVVCBjb3ZlcnMgdGhlIGRvbWFpbiBbMCwgMV0pXG4gICAgY29uc3Qgc2FtcGxlX3RleGVsID0gTWF0aC5tYXgoMCwgTWF0aC5taW4oTFVUX1dJRFRIIC0gMSwgTWF0aC5mbG9vcihzYW1wbGVfeCAqIExVVF9XSURUSCkpKTtcbiAgICAvLyBGZXRjaCBMVVQgYXQgbGV2ZWwgMFxuICAgIGNvbnN0IHNhbXBsZV92YWx1ZSA9IExVVC5nZXRQaXhlbEFzQXJyYXkoc2FtcGxlX3RleGVsLCAwKVtjaGFubmVsXTtcbiAgICAvLyBBY2N1bXVsYXRlXG4gICAgZmlsdGVyZWRfdmFsdWUgKz0gc2FtcGxlX3ZhbHVlO1xuICB9XG4gIC8vIE5vcm1hbGl6ZSBhbmQgcmV0dXJuXG4gIGZpbHRlcmVkX3ZhbHVlIC89IG51bWJlck9mU2FtcGxlcztcbiAgcmV0dXJuIGZpbHRlcmVkX3ZhbHVlO1xufVxuXG4vKipcbiAqIFByZWZpbHRlcnMgYSBMb29rLVVwIFRhYmxlIChMVVQpIGZvciBtdWx0aXBsZSBMZXZlbHMgb2YgRGV0YWlsIChMT0QpLlxuICogVGhpcyByZWR1Y2VzIGFsaWFzaW5nIGFydGlmYWN0cyB3aGVuIHRoZSB0ZXh0dXJlIGlzIHZpZXdlZCBhdCBkaWZmZXJlbnQgc2NhbGVzLlxuICpcbiAqIEBwYXJhbSBpbWFnZV9UX0lucHV0IC0gVGhlIHRyYW5zZm9ybWVkIGlucHV0IGltYWdlXG4gKiBAcGFyYW0gTFVUX1RpbnYgLSBUaGUgaW52ZXJzZSB0cmFuc2Zvcm1hdGlvbiBMVVQgdG8gcHJlZmlsdGVyXG4gKiBAcGFyYW0gY2hhbm5lbCAtIFRoZSBjb2xvciBjaGFubmVsIGluZGV4IHRvIHByb2Nlc3NcbiAqL1xuZnVuY3Rpb24gcHJlZmlsdGVyTFVUKGltYWdlX1RfSW5wdXQ6IFRleHR1cmVEYXRhRmxvYXQsIExVVF9UaW52OiBUZXh0dXJlRGF0YUZsb2F0LCBjaGFubmVsOiBJbmRleCk6IHZvaWQge1xuICAvLyBQcmVmaWx0ZXJcbiAgZm9yIChsZXQgTE9EID0gMTsgTE9EIDwgTFVUX1RpbnYuaGVpZ2h0OyBMT0QrKykge1xuICAgIC8vIENvbXB1dGUgc3VicGl4ZWwgdmFyaWFuY2UgYXQgTE9EXG4gICAgY29uc3Qgd2luZG93X3ZhcmlhbmNlID0gY29tcHV0ZUxPREF2ZXJhZ2VTdWJwaXhlbFZhcmlhbmNlKGltYWdlX1RfSW5wdXQsIExPRCwgY2hhbm5lbCk7XG4gICAgY29uc3Qgd2luZG93X3N0ZCA9IE1hdGguc3FydCh3aW5kb3dfdmFyaWFuY2UpO1xuXG4gICAgLy8gUHJlZmlsdGVyIExVVCB3aXRoIEdhdXNzaWFuIGtlcm5lbCBvZiB0aGlzIHZhcmlhbmNlXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBMVVRfVGludi53aWR0aDsgaSsrKSB7XG4gICAgICAvLyBUZXhlbCBwb3NpdGlvbiBpbiBbMCwgMV1cbiAgICAgIGNvbnN0IHhfdGV4ZWw6IG51bWJlciA9IChpICsgMC41KSAvIExVVF9UaW52LndpZHRoO1xuICAgICAgLy8gRmlsdGVyIGxvb2stdXAgdGFibGUgYXJvdW5kIHRoaXMgcG9zaXRpb24gd2l0aCBHYXVzc2lhbiBrZXJuZWxcbiAgICAgIGNvbnN0IGZpbHRlcmVkVmFsdWUgPSBmaWx0ZXJMVVRWYWx1ZUF0eChMVVRfVGludiwgeF90ZXhlbCwgd2luZG93X3N0ZCwgY2hhbm5lbCk7XG4gICAgICAvLyBTdG9yZSBmaWx0ZXJlZCB2YWx1ZVxuICAgICAgTFVUX1RpbnYuc2V0UGl4ZWxBdENoYW5uZWwoaSwgTE9ELCBjaGFubmVsLCBmaWx0ZXJlZFZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgYW4gYXJyYXkgb2YgUGl4ZWxTb3J0VHlwZSBvYmplY3RzIGZvciBwaXhlbCBzb3J0aW5nIG9wZXJhdGlvbnMuXG4gKlxuICogQHBhcmFtIGFycmF5TGVuZ3RoIC0gVGhlIGxlbmd0aCBvZiB0aGUgYXJyYXkgdG8gZ2VuZXJhdGVcbiAqIEByZXR1cm5zIEFuIGFycmF5IG9mIFBpeGVsU29ydFR5cGUgb2JqZWN0c1xuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVBpeGVsU29ydFR5cGVBcnJheShhcnJheUxlbmd0aDogU2l6ZSkge1xuICBjb25zdCBhcnJheSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5TGVuZ3RoOyBpKyspIHtcbiAgICBhcnJheS5wdXNoKHt9KTtcbiAgfVxuICByZXR1cm4gYXJyYXkgYXMgUGl4ZWxTb3J0VHlwZVtdO1xufVxuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBUKGlucHV0KSB0cmFuc2Zvcm1hdGlvbiBieSBhcHBseWluZyBoaXN0b2dyYW0gbWF0Y2hpbmcgdG8gR2F1c3NpYW4gZGlzdHJpYnV0aW9uLlxuICogVGhpcyB0cmFuc2Zvcm1zIHRoZSBpbnB1dCBpbWFnZSdzIGhpc3RvZ3JhbSB0byBtYXRjaCBhIEdhdXNzaWFuIGRpc3RyaWJ1dGlvbi5cbiAqXG4gKiBAcGFyYW0gaW5wdXQgLSBUaGUgaW5wdXQgdGV4dHVyZSBkYXRhXG4gKiBAcGFyYW0gVF9pbnB1dCAtIFRoZSBvdXRwdXQgdHJhbnNmb3JtZWQgdGV4dHVyZSBkYXRhXG4gKiBAcGFyYW0gY2hhbm5lbCAtIFRoZSBjb2xvciBjaGFubmVsIGluZGV4IHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBHQVVTU0lBTl9BVkVSQUdFIC0gVGhlIG1lYW4gb2YgdGhlIHRhcmdldCBHYXVzc2lhbiBkaXN0cmlidXRpb24gKGRlZmF1bHQ6IDAuNSlcbiAqIEBwYXJhbSBHQVVTU0lBTl9TVEQgLSBUaGUgc3RhbmRhcmQgZGV2aWF0aW9uIG9mIHRoZSB0YXJnZXQgR2F1c3NpYW4gZGlzdHJpYnV0aW9uIChkZWZhdWx0OiAwLjE2NjY2KVxuICovXG5mdW5jdGlvbiBjb21wdXRlVGlucHV0KFxuICBpbnB1dDogVGV4dHVyZURhdGFGbG9hdCxcbiAgVF9pbnB1dDogVGV4dHVyZURhdGFGbG9hdCxcbiAgY2hhbm5lbDogSW5kZXgsXG4gIEdBVVNTSUFOX0FWRVJBR0UgPSAwLjUsXG4gIEdBVVNTSUFOX1NURCA9IDAuMTY2NjZcbikge1xuICAvLyBTb3J0IHBpeGVscyBvZiBleGFtcGxlIGltYWdlXG4gIGNvbnN0IHNvcnRlZElucHV0VmFsdWVzID0gZ2VuZXJhdGVQaXhlbFNvcnRUeXBlQXJyYXkoaW5wdXQuaGVpZ2h0ICogaW5wdXQud2lkdGgpO1xuICBmb3IgKGxldCB5ID0gMDsgeSA8IGlucHV0LmhlaWdodDsgeSsrKSB7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbnB1dC53aWR0aDsgeCsrKSB7XG4gICAgICBzb3J0ZWRJbnB1dFZhbHVlc1t5ICogaW5wdXQud2lkdGggKyB4XS54ID0geDtcbiAgICAgIHNvcnRlZElucHV0VmFsdWVzW3kgKiBpbnB1dC53aWR0aCArIHhdLnkgPSB5O1xuICAgICAgc29ydGVkSW5wdXRWYWx1ZXNbeSAqIGlucHV0LndpZHRoICsgeF0udmFsdWUgPSBpbnB1dC5nZXRQaXhlbCh4LCB5LCBjaGFubmVsKTtcbiAgICB9XG4gIH1cblxuICBzb3J0ZWRJbnB1dFZhbHVlcy5zb3J0KChhOiBQaXhlbFNvcnRUeXBlLCBiOiBQaXhlbFNvcnRUeXBlKSA9PiB7XG4gICAgaWYgKGEudmFsdWUgPCBiLnZhbHVlKSByZXR1cm4gLTE7XG4gICAgaWYgKGEudmFsdWUgPiBiLnZhbHVlKSByZXR1cm4gMTtcbiAgICByZXR1cm4gMDtcbiAgfSk7XG5cbiAgLy8gQXNzaWduIEdhdXNzaWFuIHZhbHVlIHRvIGVhY2ggcGl4ZWxcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzb3J0ZWRJbnB1dFZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIC8vIFBpeGVsIGNvb3JkaW5hdGVzXG4gICAgY29uc3QgeCA9IHNvcnRlZElucHV0VmFsdWVzW2ldLng7XG4gICAgY29uc3QgeSA9IHNvcnRlZElucHV0VmFsdWVzW2ldLnk7XG4gICAgLy8gSW5wdXQgcXVhbnRpbGUgKGdpdmVuIGJ5IGl0cyBvcmRlciBpbiB0aGUgc29ydGluZylcbiAgICBjb25zdCBVID0gKGkgKyAwLjUpIC8gc29ydGVkSW5wdXRWYWx1ZXMubGVuZ3RoO1xuICAgIC8vIEdhdXNzaWFuIHF1YW50aWxlXG4gICAgY29uc3QgRyA9IE1hdGhVdGlsLmludkdhdXNzaWFuQ2RmKFUsIEdBVVNTSUFOX0FWRVJBR0UsIEdBVVNTSUFOX1NURCk7XG4gICAgLy8gU3RvcmVcbiAgICBUX2lucHV0LnNldFBpeGVsQXRDaGFubmVsKHgsIHksIGNoYW5uZWwsIEcpO1xuICB9XG59XG5cbi8qKlxuICogQ29tcHV0ZXMgdGhlIGludmVyc2UgdHJhbnNmb3JtYXRpb24gVF4oLTEpIGFzIGEgTG9vay1VcCBUYWJsZS5cbiAqIFRoaXMgTFVUIGNhbiBiZSB1c2VkIHRvIHRyYW5zZm9ybSBHYXVzc2lhbi1kaXN0cmlidXRlZCB2YWx1ZXMgYmFjayB0byB0aGUgb3JpZ2luYWwgZGlzdHJpYnV0aW9uLlxuICpcbiAqIEBwYXJhbSBpbnB1dCAtIFRoZSBpbnB1dCB0ZXh0dXJlIGRhdGFcbiAqIEBwYXJhbSBUaW52IC0gVGhlIG91dHB1dCBpbnZlcnNlIHRyYW5zZm9ybWF0aW9uIExVVFxuICogQHBhcmFtIGNoYW5uZWwgLSBUaGUgY29sb3IgY2hhbm5lbCBpbmRleCB0byBwcm9jZXNzXG4gKiBAcGFyYW0gR0FVU1NJQU5fQVZFUkFHRSAtIFRoZSBtZWFuIG9mIHRoZSBHYXVzc2lhbiBkaXN0cmlidXRpb24gKGRlZmF1bHQ6IDAuNSlcbiAqIEBwYXJhbSBHQVVTU0lBTl9TVEQgLSBUaGUgc3RhbmRhcmQgZGV2aWF0aW9uIG9mIHRoZSBHYXVzc2lhbiBkaXN0cmlidXRpb24gKGRlZmF1bHQ6IDAuMTY2NjYpXG4gKi9cbmZ1bmN0aW9uIGNvbXB1dGVJbnZUKFxuICBpbnB1dDogVGV4dHVyZURhdGFGbG9hdCxcbiAgVGludjogVGV4dHVyZURhdGFGbG9hdCxcbiAgY2hhbm5lbDogbnVtYmVyLFxuICBHQVVTU0lBTl9BVkVSQUdFID0gMC41LFxuICBHQVVTU0lBTl9TVEQgPSAwLjE2NjY2XG4pIHtcbiAgLy8gU29ydCBwaXhlbHMgb2YgZXhhbXBsZSBpbWFnZVxuICBjb25zdCBzb3J0ZWRJbnB1dFZhbHVlczogQXJyYXk8bnVtYmVyPiA9IFtdO1xuICBmb3IgKGxldCB5ID0gMDsgeSA8IGlucHV0LmhlaWdodDsgeSsrKSB7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPCBpbnB1dC53aWR0aDsgeCsrKSB7XG4gICAgICBzb3J0ZWRJbnB1dFZhbHVlc1t5ICogaW5wdXQud2lkdGggKyB4XSA9IGlucHV0LmdldFBpeGVsKHgsIHksIGNoYW5uZWwpO1xuICAgIH1cbiAgfVxuXG4gIHNvcnRlZElucHV0VmFsdWVzLnNvcnQoKGE6IG51bWJlciwgYjogbnVtYmVyKSA9PiB7XG4gICAgaWYgKGEgPCBiKSByZXR1cm4gLTE7XG4gICAgaWYgKGEgPiBiKSByZXR1cm4gMTtcbiAgICByZXR1cm4gMDtcbiAgfSk7XG5cbiAgLy8gR2VuZXJhdGUgVGludiBsb29rLXVwIHRhYmxlXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgVGludi53aWR0aDsgaSsrKSB7XG4gICAgLy8gR2F1c3NpYW4gdmFsdWUgaW4gWzAsIDFdXG4gICAgY29uc3QgRyA9IChpICsgMC41KSAvIFRpbnYud2lkdGg7XG4gICAgLy8gUXVhbnRpbGUgdmFsdWVcbiAgICBjb25zdCBVID0gTWF0aFV0aWwuZ2F1c3NpYW5DZGYoRywgR0FVU1NJQU5fQVZFUkFHRSwgR0FVU1NJQU5fU1REKTtcbiAgICAvLyBGaW5kIHF1YW50aWxlIGluIHNvcnRlZCBwaXhlbCB2YWx1ZXNcbiAgICBjb25zdCBpbmRleCA9IE1hdGguZmxvb3IoVSAqIHNvcnRlZElucHV0VmFsdWVzLmxlbmd0aCk7XG4gICAgLy8gR2V0IGlucHV0IHZhbHVlXG4gICAgY29uc3QgSSA9IHNvcnRlZElucHV0VmFsdWVzW2luZGV4XTtcbiAgICAvLyBTdG9yZSBpbiBMVVRcbiAgICBUaW52LnNldFBpeGVsQXRDaGFubmVsKGksIDAsIGNoYW5uZWwsIEkpO1xuICB9XG59XG5cbi8qKlxuICogRGF0YSBzdHJ1Y3R1cmUgY29udGFpbmluZyBhbGwgcHJlY29tcHV0ZWQgZGF0YSBuZWVkZWQgZm9yIHNlYW1sZXNzIHRleHR1cmUgc3ludGhlc2lzLlxuICovXG50eXBlIFNlYW1sZXNzVGV4dHVyZURhdGEgPSB7XG4gIGlucHV0OiBUZXh0dXJlRGF0YUZsb2F0OyAvLyBpbnB1dDogZXhhbXBsZSBpbWFnZVxuICBUaW5wdXQ6IFRleHR1cmVEYXRhRmxvYXQ7IC8vIG91dHB1dDogVChpbnB1dCkgaW1hZ2VcbiAgVGludjogVGV4dHVyZURhdGFGbG9hdDsgLy8gb3V0cHV0OiBUXnstMX0gbG9vay11cCB0YWJsZVxuICBjb2xvclNwYWNlVmVjdG9yMTogTXV0YWJsZVZlY3RvcjM7IC8vIG91dHB1dDogY29sb3Igc3BhY2UgdmVjdG9yMVxuICBjb2xvclNwYWNlVmVjdG9yMjogTXV0YWJsZVZlY3RvcjM7IC8vIG91dHB1dDogY29sb3Igc3BhY2UgdmVjdG9yMlxuICBjb2xvclNwYWNlVmVjdG9yMzogTXV0YWJsZVZlY3RvcjM7IC8vIG91dHB1dDogY29sb3Igc3BhY2UgdmVjdG9yM1xuICBjb2xvclNwYWNlT3JpZ2luOiBNdXRhYmxlVmVjdG9yMzsgLy8gb3V0cHV0OiBjb2xvciBzcGFjZSBvcmlnaW5cbiAgbHV0V2lkdGg6IFNpemU7XG59O1xuXG4vKipcbiAqIFBlcmZvcm1zIGFsbCBuZWNlc3NhcnkgcHJlY29tcHV0YXRpb25zIGZvciBzZWFtbGVzcyB0ZXh0dXJlIHN5bnRoZXNpcy5cbiAqIFRoaXMgaW5jbHVkZXMgY29sb3Igc3BhY2UgZGVjb3JyZWxhdGlvbiwgaGlzdG9ncmFtIHRyYW5zZm9ybWF0aW9uLCBhbmQgTFVUIHByZWZpbHRlcmluZy5cbiAqXG4gKiBAcGFyYW0gaW5wdXQgLSBUaGUgaW5wdXQgZXhhbXBsZSB0ZXh0dXJlXG4gKiBAcGFyYW0gTFVUX1dJRFRIIC0gVGhlIHdpZHRoIG9mIHRoZSBMb29rLVVwIFRhYmxlIChkZWZhdWx0OiAxMjgpXG4gKiBAcmV0dXJucyBTZWFtbGVzc1RleHR1cmVEYXRhIGNvbnRhaW5pbmcgYWxsIHByZWNvbXB1dGVkIGRhdGFcbiAqL1xuZnVuY3Rpb24gcHJlY29tcHV0YXRpb25zKFxuICBpbnB1dDogVGV4dHVyZURhdGFGbG9hdCwgLy8gaW5wdXQ6IGV4YW1wbGUgaW1hZ2VcbiAgTFVUX1dJRFRIOiBTaXplID0gMTI4XG4pIHtcbiAgY29uc3QgcmV0VmFsOiBhbnkgPSB7fTtcbiAgcmV0VmFsLmx1dFdpZHRoID0gTFVUX1dJRFRIO1xuICByZXRWYWwuY29sb3JTcGFjZVZlY3RvcjEgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHJldFZhbC5jb2xvclNwYWNlVmVjdG9yMiA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcbiAgcmV0VmFsLmNvbG9yU3BhY2VWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuemVybygpO1xuICByZXRWYWwuY29sb3JTcGFjZU9yaWdpbiA9IE11dGFibGVWZWN0b3IzLnplcm8oKTtcblxuICAvLyBTZWN0aW9uIDEuNCBJbXByb3ZlbWVudDogdXNpbmcgYSBkZWNvcnJlbGF0ZWQgY29sb3Igc3BhY2VcbiAgLy9cdGNvbnN0IGlucHV0X2RlY29ycmVsYXRlZDpBYnN0cmFjdFRleHR1cmUgPSBUZXh0dXJlRGF0YUZsb2F0KGlucHV0LndpZHRoLCBpbnB1dC5oZWlnaHQsIDMpO1xuICBjb25zdCBpbnB1dF9kZWNvcnJlbGF0ZWQgPSBuZXcgVGV4dHVyZURhdGFGbG9hdChpbnB1dC53aWR0aCwgaW5wdXQuaGVpZ2h0LCAzKTtcblxuICBkZWNvcnJlbGF0ZUNvbG9yU3BhY2UoXG4gICAgaW5wdXQsXG4gICAgaW5wdXRfZGVjb3JyZWxhdGVkLFxuICAgIHJldFZhbC5jb2xvclNwYWNlVmVjdG9yMSxcbiAgICByZXRWYWwuY29sb3JTcGFjZVZlY3RvcjIsXG4gICAgcmV0VmFsLmNvbG9yU3BhY2VWZWN0b3IzLFxuICAgIHJldFZhbC5jb2xvclNwYWNlT3JpZ2luXG4gICk7XG5cbiAgLy8gU2VjdGlvbiAxLjMuMiBBcHBseWluZyB0aGUgaGlzdG9ncmFtIHRyYW5zZm9ybWF0aW9uIFQgb24gdGhlIGlucHV0XG4gIC8vVGlucHV0ID0gVGV4dHVyZURhdGFGbG9hdChpbnB1dC53aWR0aCwgaW5wdXQuaGVpZ2h0LCAzKTtcbiAgY29uc3QgVGlucHV0ID0gbmV3IFRleHR1cmVEYXRhRmxvYXQoaW5wdXQud2lkdGgsIGlucHV0LmhlaWdodCwgMyk7XG4gIHJldFZhbC5UaW5wdXQgPSBUaW5wdXQ7XG5cbiAgZm9yIChsZXQgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCAzOyBjaGFubmVsKyspIHtcbiAgICBjb21wdXRlVGlucHV0KGlucHV0X2RlY29ycmVsYXRlZCwgVGlucHV0LCBjaGFubmVsKTtcbiAgfVxuXG4gIC8vIFNlY3Rpb24gMS4zLjMgUHJlY29tcHV0aW5nIHRoZSBpbnZlcnNlIGhpc3RvZ3JhbSB0cmFuc2Zvcm1hdGlvbiBUXnstMX1cbiAgY29uc3QgVGludiA9IG5ldyBUZXh0dXJlRGF0YUZsb2F0KExVVF9XSURUSCwgMSwgMyk7XG4gIHJldFZhbC5UaW52ID0gVGludjtcbiAgZm9yIChsZXQgY2hhbm5lbCA9IDA7IGNoYW5uZWwgPCAzOyBjaGFubmVsKyspIHtcbiAgICBjb21wdXRlSW52VChpbnB1dF9kZWNvcnJlbGF0ZWQsIFRpbnYsIGNoYW5uZWwpO1xuICB9XG5cbiAgLy8gU2VjdGlvbiAxLjUgSW1wcm92ZW1lbnQ6IHByZWZpbHRlcmluZyB0aGUgbG9vay11cCB0YWJsZVxuICAvLyBDb21wdXRlIG51bWJlciBvZiBwcmVmaWx0ZXJlZCBsZXZlbHMgYW5kIHJlc2l6ZSBMVVRcbiAgVGludi5yZXNpemUoVGludi53aWR0aCwgTWF0aC5mbG9vcihNYXRoLmxvZyhUaW5wdXQud2lkdGgpIC8gTWF0aC5sb2coMi4wKSksIDMpO1xuICBmb3IgKGxldCBjaGFubmVsID0gMDsgY2hhbm5lbCA8IDM7IGNoYW5uZWwrKykge1xuICAgIHByZWZpbHRlckxVVChUaW5wdXQsIFRpbnYsIGNoYW5uZWwpO1xuICB9XG5cbiAgcmV0dXJuIHJldFZhbCBhcyBTZWFtbGVzc1RleHR1cmVEYXRhO1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGFuIEhUTUxJbWFnZUVsZW1lbnQgdG8gYSBDYW52YXMgd2l0aCBzcGVjaWZpZWQgZGltZW5zaW9ucy5cbiAqIFRoZSBpbWFnZSBpcyBzY2FsZWQgdG8gZml0IHRoZSB0YXJnZXQgd2lkdGggYW5kIGhlaWdodC5cbiAqXG4gKiBAcGFyYW0gaW1hZ2UgLSBUaGUgc291cmNlIEhUTUwgaW1hZ2UgZWxlbWVudFxuICogQHBhcmFtIHdpZHRoIC0gVGhlIHRhcmdldCBjYW52YXMgd2lkdGhcbiAqIEBwYXJhbSBoZWlnaHQgLSBUaGUgdGFyZ2V0IGNhbnZhcyBoZWlnaHRcbiAqIEByZXR1cm5zIEEgbmV3IENhbnZhcyBlbGVtZW50IGNvbnRhaW5pbmcgdGhlIHNjYWxlZCBpbWFnZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udmVydEhUTUxJbWFnZUVsZW1lbnRUb0NhbnZhcyhpbWFnZTogSFRNTEltYWdlRWxlbWVudCwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIpIHtcbiAgY29uc3QgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICBjb25zdCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKSE7XG4gIGN0eC5kcmF3SW1hZ2UoaW1hZ2UsIDAsIDAsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXG4gIHJldHVybiBjYW52YXM7XG59XG5cbi8qKlxuICogQ29tYmluZXMgbXVsdGlwbGUgc2luZ2xlLWNoYW5uZWwgaW1hZ2VzIGludG8gYSBzaW5nbGUgUkdCQSBpbWFnZS5cbiAqIEVhY2ggaW5wdXQgaW1hZ2UgY29udHJpYnV0ZXMgdG8gb25lIGNvbG9yIGNoYW5uZWwgb2YgdGhlIG91dHB1dC5cbiAqXG4gKiBAcGFyYW0gZGF0YSAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGNvbnRhaW5pbmc6XG4gKiAgIC0gcl9pbWFnZTogT3B0aW9uYWwgY2FudmFzIGZvciByZWQgY2hhbm5lbFxuICogICAtIGdfaW1hZ2U6IE9wdGlvbmFsIGNhbnZhcyBmb3IgZ3JlZW4gY2hhbm5lbFxuICogICAtIGJfaW1hZ2U6IE9wdGlvbmFsIGNhbnZhcyBmb3IgYmx1ZSBjaGFubmVsXG4gKiAgIC0gYV9pbWFnZTogT3B0aW9uYWwgY2FudmFzIGZvciBhbHBoYSBjaGFubmVsXG4gKiAgIC0gd2lkdGg6IE91dHB1dCBpbWFnZSB3aWR0aFxuICogICAtIGhlaWdodDogT3V0cHV0IGltYWdlIGhlaWdodFxuICogQHJldHVybnMgQSBuZXcgQ2FudmFzIGNvbnRhaW5pbmcgdGhlIGNvbWJpbmVkIFJHQkEgaW1hZ2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmVJbWFnZXMoZGF0YToge1xuICByX2ltYWdlPzogSFRNTENhbnZhc0VsZW1lbnQ7XG4gIGdfaW1hZ2U/OiBIVE1MQ2FudmFzRWxlbWVudDtcbiAgYl9pbWFnZT86IEhUTUxDYW52YXNFbGVtZW50O1xuICBhX2ltYWdlPzogSFRNTENhbnZhc0VsZW1lbnQ7XG4gIHdpZHRoOiBudW1iZXI7XG4gIGhlaWdodDogbnVtYmVyO1xufSkge1xuICBjb25zdCB3aWR0aCA9IGRhdGEud2lkdGg7XG4gIGNvbnN0IGhlaWdodCA9IGRhdGEuaGVpZ2h0O1xuXG4gIGNvbnN0IG91dHB1dENhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xuICBvdXRwdXRDYW52YXMud2lkdGggPSB3aWR0aDtcbiAgb3V0cHV0Q2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgY29uc3Qgb3V0cHV0Q3R4ID0gb3V0cHV0Q2FudmFzLmdldENvbnRleHQoJzJkJykhO1xuICBjb25zdCBvdXRwdXRJbWFnZURhdGEgPSBvdXRwdXRDdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xuXG4gIGlmIChJcy5leGlzdChkYXRhLnJfaW1hZ2UpKSB7XG4gICAgY29uc3QgaW5wdXRSX2N0eCA9IGRhdGEucl9pbWFnZS5nZXRDb250ZXh0KCcyZCcpITtcbiAgICBjb25zdCByX2ltYWdlRGF0YSA9IGlucHV0Ul9jdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGRhdGEucl9pbWFnZS53aWR0aCwgZGF0YS5yX2ltYWdlLmhlaWdodCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aCAqIGhlaWdodDsgaSsrKSB7XG4gICAgICBvdXRwdXRJbWFnZURhdGEuZGF0YVtpICogNCArIDBdID0gcl9pbWFnZURhdGEuZGF0YVtpICogNCArIDBdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpZHRoICogaGVpZ2h0OyBpKyspIHtcbiAgICAgIG91dHB1dEltYWdlRGF0YS5kYXRhW2kgKiA0ICsgMF0gPSAwO1xuICAgIH1cbiAgfVxuXG4gIGlmIChJcy5leGlzdChkYXRhLmdfaW1hZ2UpKSB7XG4gICAgY29uc3QgaW5wdXRHX2N0eCA9IGRhdGEuZ19pbWFnZS5nZXRDb250ZXh0KCcyZCcpITtcbiAgICBjb25zdCBnX2ltYWdlRGF0YSA9IGlucHV0R19jdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGRhdGEuZ19pbWFnZS53aWR0aCwgZGF0YS5nX2ltYWdlLmhlaWdodCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aCAqIGhlaWdodDsgaSsrKSB7XG4gICAgICBvdXRwdXRJbWFnZURhdGEuZGF0YVtpICogNCArIDFdID0gZ19pbWFnZURhdGEuZGF0YVtpICogNCArIDFdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpZHRoICogaGVpZ2h0OyBpKyspIHtcbiAgICAgIG91dHB1dEltYWdlRGF0YS5kYXRhW2kgKiA0ICsgMV0gPSAwO1xuICAgIH1cbiAgfVxuXG4gIGlmIChJcy5leGlzdChkYXRhLmJfaW1hZ2UpKSB7XG4gICAgY29uc3QgaW5wdXRCX2N0eCA9IGRhdGEuYl9pbWFnZS5nZXRDb250ZXh0KCcyZCcpITtcbiAgICBjb25zdCBiX2ltYWdlRGF0YSA9IGlucHV0Ql9jdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGRhdGEuYl9pbWFnZS53aWR0aCwgZGF0YS5iX2ltYWdlLmhlaWdodCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aCAqIGhlaWdodDsgaSsrKSB7XG4gICAgICBvdXRwdXRJbWFnZURhdGEuZGF0YVtpICogNCArIDJdID0gYl9pbWFnZURhdGEuZGF0YVtpICogNCArIDJdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpZHRoICogaGVpZ2h0OyBpKyspIHtcbiAgICAgIG91dHB1dEltYWdlRGF0YS5kYXRhW2kgKiA0ICsgMl0gPSAwO1xuICAgIH1cbiAgfVxuXG4gIGlmIChJcy5leGlzdChkYXRhLmFfaW1hZ2UpKSB7XG4gICAgY29uc3QgaW5wdXRBX2N0eCA9IGRhdGEuYV9pbWFnZS5nZXRDb250ZXh0KCcyZCcpITtcbiAgICBjb25zdCBhX2ltYWdlRGF0YSA9IGlucHV0QV9jdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGRhdGEuYV9pbWFnZS53aWR0aCwgZGF0YS5hX2ltYWdlLmhlaWdodCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3aWR0aCAqIGhlaWdodDsgaSsrKSB7XG4gICAgICBvdXRwdXRJbWFnZURhdGEuZGF0YVtpICogNCArIDNdID0gYV9pbWFnZURhdGEuZGF0YVtpICogNCArIDNdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHdpZHRoICogaGVpZ2h0OyBpKyspIHtcbiAgICAgIG91dHB1dEltYWdlRGF0YS5kYXRhW2kgKiA0ICsgM10gPSAwO1xuICAgIH1cbiAgfVxuXG4gIG91dHB1dEN0eC5wdXRJbWFnZURhdGEob3V0cHV0SW1hZ2VEYXRhLCAwLCAwKTtcblxuICByZXR1cm4gb3V0cHV0Q2FudmFzO1xufVxuXG4vKipcbiAqIFV0aWxpdHkgY2xhc3MgZm9yIGltYWdlIHByb2Nlc3Npbmcgb3BlcmF0aW9ucy5cbiAqIFByb3ZpZGVzIG1ldGhvZHMgZm9yIHNlYW1sZXNzIHRleHR1cmUgc3ludGhlc2lzIGFuZCBpbWFnZSBtYW5pcHVsYXRpb24uXG4gKi9cbmV4cG9ydCBjb25zdCBJbWFnZVV0aWwgPSBPYmplY3QuZnJlZXplKHsgcHJlY29tcHV0YXRpb25zIH0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsZ0JBQWdCO0FBQ3pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQUN4QixTQUFTLHdCQUF3QjtBQUNqQyxTQUFTLFVBQVU7QUFtQm5CLFNBQVMsb0JBQW9CLE9BQXlCLGNBQXlCO0FBRTdFLE1BQUksSUFBSTtBQUNSLE1BQUksSUFBSTtBQUNSLE1BQUksSUFBSTtBQUNSLE1BQUksS0FBSztBQUNULE1BQUksS0FBSztBQUNULE1BQUksS0FBSztBQUNULE1BQUksS0FBSztBQUNULE1BQUksS0FBSztBQUNULE1BQUksS0FBSztBQUNULFdBQVMsSUFBSSxHQUFHLElBQUksTUFBTSxRQUFRLEtBQUs7QUFDckMsYUFBUyxJQUFJLEdBQUcsSUFBSSxNQUFNLE9BQU8sS0FBSztBQUNwQyxZQUFNLE1BQU0sTUFBTSxXQUFXLEdBQUcsR0FBRyxHQUFHLFFBQVE7QUFDOUMsV0FBSyxJQUFJO0FBQ1QsV0FBSyxJQUFJO0FBQ1QsV0FBSyxJQUFJO0FBQ1QsWUFBTSxJQUFJLElBQUksSUFBSTtBQUNsQixZQUFNLElBQUksSUFBSSxJQUFJO0FBQ2xCLFlBQU0sSUFBSSxJQUFJLElBQUk7QUFDbEIsWUFBTSxJQUFJLElBQUksSUFBSTtBQUNsQixZQUFNLElB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
