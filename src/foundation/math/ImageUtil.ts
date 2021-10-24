import Vector3 from './Vector3';
import MutableMatrix33 from './MutableMatrix33';
import {MathUtil} from './MathUtil';
import MutableVector3 from './MutableVector3';
import ColorRgb from './ColorRgb';
import {Index, Size} from '../../types/CommonTypes';
import MutableVector2 from './MutableVector2';
import TextureDataFloat from '../textures/TextureDataFloat';

type PixelSortType = {
  x: Index;
  y: Index;
  value: number;
};

// These codes are from https://eheitzresearch.wordpress.com/738-2/
// "Procedural Stochastic Textures by Tiling and Blending"
// Thanks to the authors for permission to use.
//
// Compute the eigen vectors of the histogram of the input image
function computeEigenVectors(input: TextureDataFloat, eigenVectors: Vector3[]) {
  // First and second order moments
  let R = 0,
    G = 0,
    B = 0,
    RR = 0,
    GG = 0,
    BB = 0,
    RG = 0,
    RB = 0,
    GB = 0;
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

  // Covariance matrix
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

  // Find eigen values and vectors using Jacobi algorithm
  const eigenVectorsTemp = MutableMatrix33.zero();
  const eigenValuesTemp = MutableVector3.zero();
  MathUtil.computeEigenValuesAndVectors(
    covarMat,
    eigenVectorsTemp,
    eigenValuesTemp
  );

  // Set return values
  eigenVectors[0] = Vector3.fromCopyArray([
    eigenVectorsTemp.m00,
    eigenVectorsTemp.m10,
    eigenVectorsTemp.m20,
  ]);
  eigenVectors[1] = Vector3.fromCopyArray([
    eigenVectorsTemp.m01,
    eigenVectorsTemp.m11,
    eigenVectorsTemp.m21,
  ]);
  eigenVectors[2] = Vector3.fromCopyArray([
    eigenVectorsTemp.m02,
    eigenVectorsTemp.m12,
    eigenVectorsTemp.m22,
  ]);
}

function decorrelateColorSpace(
  input: TextureDataFloat, // input: example image
  input_decorrelated: TextureDataFloat, // output: decorrelated input
  colorSpaceVector1: MutableVector3, // output: color space vector1
  colorSpaceVector2: MutableVector3, // output: color space vector2
  colorSpaceVector3: MutableVector3, // output: color space vector3
  colorSpaceOrigin: MutableVector3
) {
  // output: color space origin
  // Compute the eigenvectors of the histogram
  const eigenvectors = [
    MutableVector3.zero(),
    MutableVector3.zero(),
    MutableVector3.zero(),
  ];
  computeEigenVectors(input, eigenvectors);

  // Rotate to eigenvector space and
  for (let y = 0; y < input.height; y++)
    for (let x = 0; x < input.width; x++)
      for (let channel = 0; channel < 3; ++channel) {
        // Get current color
        const color: ColorRgb = input.getPixelAs(x, y, 3, ColorRgb);
        // Project on eigenvector
        const new_channel_value: number = Vector3.dot(
          color,
          eigenvectors[channel]
        );
        // Store
        input_decorrelated.setPixelAtChannel(x, y, channel, new_channel_value);
      }

  // Compute ranges of the new color space
  const colorSpaceRanges: MutableVector2[] = [
    MutableVector2.fromCopyArray2([Number.MAX_VALUE, -Number.MAX_VALUE]),
    MutableVector2.fromCopyArray2([Number.MAX_VALUE, -Number.MAX_VALUE]),
    MutableVector2.fromCopyArray2([Number.MAX_VALUE, -Number.MAX_VALUE]),
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

  // Remap range to [0, 1]
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      for (let channel = 0; channel < 3; ++channel) {
        // Get current value
        const value: number = input_decorrelated.getPixelAsArray(x, y)[channel];
        // Remap in [0, 1]
        const remapped_value =
          (value - colorSpaceRanges[channel].x) /
          (colorSpaceRanges[channel].y - colorSpaceRanges[channel].x);
        // Store
        input_decorrelated.setPixelAtChannel(x, y, channel, remapped_value);
      }
    }
  }

  // Compute color space origin and vectors scaled for the normalized range
  colorSpaceOrigin.x =
    colorSpaceRanges[0].x * eigenvectors[0].x +
    colorSpaceRanges[1].x * eigenvectors[1].x +
    colorSpaceRanges[2].x * eigenvectors[2].x;
  colorSpaceOrigin.y =
    colorSpaceRanges[0].x * eigenvectors[0].y +
    colorSpaceRanges[1].x * eigenvectors[1].y +
    colorSpaceRanges[2].x * eigenvectors[2].y;
  colorSpaceOrigin.z =
    colorSpaceRanges[0].x * eigenvectors[0].z +
    colorSpaceRanges[1].x * eigenvectors[1].z +
    colorSpaceRanges[2].x * eigenvectors[2].z;
  colorSpaceVector1.x =
    eigenvectors[0].x * (colorSpaceRanges[0].y - colorSpaceRanges[0].x);
  colorSpaceVector1.y =
    eigenvectors[0].y * (colorSpaceRanges[0].y - colorSpaceRanges[0].x);
  colorSpaceVector1.z =
    eigenvectors[0].z * (colorSpaceRanges[0].y - colorSpaceRanges[0].x);
  colorSpaceVector2.x =
    eigenvectors[1].x * (colorSpaceRanges[1].y - colorSpaceRanges[1].x);
  colorSpaceVector2.y =
    eigenvectors[1].y * (colorSpaceRanges[1].y - colorSpaceRanges[1].x);
  colorSpaceVector2.z =
    eigenvectors[1].z * (colorSpaceRanges[1].y - colorSpaceRanges[1].x);
  colorSpaceVector3.x =
    eigenvectors[2].x * (colorSpaceRanges[2].y - colorSpaceRanges[2].x);
  colorSpaceVector3.y =
    eigenvectors[2].y * (colorSpaceRanges[2].y - colorSpaceRanges[2].x);
  colorSpaceVector3.z =
    eigenvectors[2].z * (colorSpaceRanges[2].y - colorSpaceRanges[2].x);
}

// Compute average subpixel variance at a given LOD
function computeLODAverageSubpixelVariance(
  image: TextureDataFloat,
  LOD: Index,
  channel: Index
): number {
  // Window width associated with
  const windowWidth = 1 << LOD;

  // Compute average variance in all the windows
  let average_window_variance = 0.0;

  // Loop over al the windows
  for (let window_y = 0; window_y < image.height; window_y += windowWidth) {
    for (let window_x = 0; window_x < image.width; window_x += windowWidth) {
      // Estimate variance of current window
      let v = 0.0;
      let v2 = 0.0;
      for (let y = 0; y < windowWidth; y++) {
        for (let x = 0; x < windowWidth; x++) {
          const value = image.getPixel(window_x + x, window_y + y, channel);
          v += value;
          v2 += value * value;
        }
      }
      v /= windowWidth * windowWidth;
      v2 /= windowWidth * windowWidth;
      const window_variance = Math.max(0.0, v2 - v * v);

      // Update average
      average_window_variance +=
        window_variance /
        ((image.width * image.height) / windowWidth / windowWidth);
    }
  }

  return average_window_variance;
}

// Filter LUT by sampling a Gaussian N(mu, std�)
function filterLUTValueAtx(
  LUT: TextureDataFloat,
  x: number,
  std: number,
  channel: Index,
  LUT_WIDTH: Size = 128
): number {
  // Number of samples for filtering (heuristic: twice the LUT resolution)
  const numberOfSamples = 2 * LUT_WIDTH;

  // Filter
  let filtered_value = 0.0;
  for (let sample = 0; sample < numberOfSamples; sample++) {
    // Quantile used to sample the Gaussian
    const U = (sample + 0.5) / numberOfSamples;
    // Sample the Gaussian
    const sample_x = MathUtil.invGaussianCdf(U, x, std);
    // Find sample texel in LUT (the LUT covers the domain [0, 1])
    const sample_texel = Math.max(
      0,
      Math.min(LUT_WIDTH - 1, Math.floor(sample_x * LUT_WIDTH))
    );
    // Fetch LUT at level 0
    const sample_value = LUT.getPixelAsArray(sample_texel, 0)[channel];
    // Accumulate
    filtered_value += sample_value;
  }
  // Normalize and return
  filtered_value /= numberOfSamples;
  return filtered_value;
}

function prefilterLUT(
  image_T_Input: TextureDataFloat,
  LUT_Tinv: TextureDataFloat,
  channel: Index
): void {
  // Prefilter
  for (let LOD = 1; LOD < LUT_Tinv.height; LOD++) {
    // Compute subpixel variance at LOD
    const window_variance = computeLODAverageSubpixelVariance(
      image_T_Input,
      LOD,
      channel
    );
    const window_std = Math.sqrt(window_variance);

    // Prefilter LUT with Gaussian kernel of this variance
    for (let i = 0; i < LUT_Tinv.width; i++) {
      // Texel position in [0, 1]
      const x_texel: number = (i + 0.5) / LUT_Tinv.width;
      // Filter look-up table around this position with Gaussian kernel
      const filteredValue = filterLUTValueAtx(
        LUT_Tinv,
        x_texel,
        window_std,
        channel
      );
      // Store filtered value
      LUT_Tinv.setPixelAtChannel(i, LOD, channel, filteredValue);
    }
  }
}

function generatePixelSortTypeArray(arrayLength: Size) {
  const array = [];
  for (let i = 0; i < arrayLength; i++) {
    array.push({});
  }
  return array as PixelSortType[];
}

function computeTinput(
  input: TextureDataFloat,
  T_input: TextureDataFloat,
  channel: Index,
  GAUSSIAN_AVERAGE = 0.5,
  GAUSSIAN_STD = 0.16666
) {
  // Sort pixels of example image
  const sortedInputValues = generatePixelSortTypeArray(
    input.height * input.width
  );
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      sortedInputValues[y * input.width + x].x = x;
      sortedInputValues[y * input.width + x].y = y;
      sortedInputValues[y * input.width + x].value = input.getPixel(
        x,
        y,
        channel
      );
    }
  }

  sortedInputValues.sort((a: PixelSortType, b: PixelSortType) => {
    if (a.value < b.value) return -1;
    if (a.value > b.value) return 1;
    return 0;
  });

  // Assign Gaussian value to each pixel
  for (let i = 0; i < sortedInputValues.length; i++) {
    // Pixel coordinates
    const x = sortedInputValues[i].x;
    const y = sortedInputValues[i].y;
    // Input quantile (given by its order in the sorting)
    const U = (i + 0.5) / sortedInputValues.length;
    // Gaussian quantile
    const G = MathUtil.invGaussianCdf(U, GAUSSIAN_AVERAGE, GAUSSIAN_STD);
    // Store
    T_input.setPixelAtChannel(x, y, channel, G);
  }
}

function computeInvT(
  input: TextureDataFloat,
  Tinv: TextureDataFloat,
  channel: number,
  GAUSSIAN_AVERAGE = 0.5,
  GAUSSIAN_STD = 0.16666
) {
  // Sort pixels of example image
  const sortedInputValues: Array<number> = [];
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      sortedInputValues[y * input.width + x] = input.getPixel(x, y, channel);
    }
  }

  sortedInputValues.sort((a: number, b: number) => {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  });

  // Generate Tinv look-up table
  for (let i = 0; i < Tinv.width; i++) {
    // Gaussian value in [0, 1]
    const G = (i + 0.5) / Tinv.width;
    // Quantile value
    const U = MathUtil.gaussianCdf(G, GAUSSIAN_AVERAGE, GAUSSIAN_STD);
    // Find quantile in sorted pixel values
    const index = Math.floor(U * sortedInputValues.length);
    // Get input value
    const I = sortedInputValues[index];
    // Store in LUT
    Tinv.setPixelAtChannel(i, 0, channel, I);
  }
}

type SeamlessTextureData = {
  input: TextureDataFloat; // input: example image
  Tinput: TextureDataFloat; // output: T(input) image
  Tinv: TextureDataFloat; // output: T^{-1} look-up table
  colorSpaceVector1: MutableVector3; // output: color space vector1
  colorSpaceVector2: MutableVector3; // output: color space vector2
  colorSpaceVector3: MutableVector3; // output: color space vector3
  colorSpaceOrigin: MutableVector3; // output: color space origin
  lutWidth: Size;
};

function precomputations(
  input: TextureDataFloat, // input: example image
  LUT_WIDTH: Size = 128
) {
  const retVal: any = {};
  retVal.lutWidth = LUT_WIDTH;
  retVal.colorSpaceVector1 = MutableVector3.zero();
  retVal.colorSpaceVector2 = MutableVector3.zero();
  retVal.colorSpaceVector3 = MutableVector3.zero();
  retVal.colorSpaceOrigin = MutableVector3.zero();

  // Section 1.4 Improvement: using a decorrelated color space
  //	const input_decorrelated:AbstractTexture = TextureDataFloat(input.width, input.height, 3);
  const input_decorrelated = new TextureDataFloat(input.width, input.height, 3);

  decorrelateColorSpace(
    input,
    input_decorrelated,
    retVal.colorSpaceVector1,
    retVal.colorSpaceVector2,
    retVal.colorSpaceVector3,
    retVal.colorSpaceOrigin
  );

  // Section 1.3.2 Applying the histogram transformation T on the input
  //Tinput = TextureDataFloat(input.width, input.height, 3);
  const Tinput = new TextureDataFloat(input.width, input.height, 3);
  retVal.Tinput = Tinput;

  for (let channel = 0; channel < 3; channel++) {
    computeTinput(input_decorrelated, Tinput, channel);
  }

  // Section 1.3.3 Precomputing the inverse histogram transformation T^{-1}
  const Tinv = new TextureDataFloat(LUT_WIDTH, 1, 3);
  retVal.Tinv = Tinv;
  for (let channel = 0; channel < 3; channel++) {
    computeInvT(input_decorrelated, Tinv, channel);
  }

  // Section 1.5 Improvement: prefiltering the look-up table
  // Compute number of prefiltered levels and resize LUT
  Tinv.resize(
    Tinv.width,
    Math.floor(Math.log(Tinput.width) / Math.log(2.0)),
    3
  );
  for (let channel = 0; channel < 3; channel++) {
    prefilterLUT(Tinput, Tinv, channel);
  }

  return retVal as SeamlessTextureData;
}

export default Object.freeze({precomputations});
