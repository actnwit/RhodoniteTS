import Vector3 from "./Vector3";
import AbstractTexture from "../textures/AbstractTexture";
import Matrix33 from "./Matrix33";
import MutableMatrix33 from "./MutableMatrix33";
import { MathUtil } from "./MathUtil";
import MutableVector3 from "./MutableVector3";
import ColorRgb from "./ColorRgb";
import Vector2 from "./Vector2";

// These codes are from https://eheitzresearch.wordpress.com/738-2/
// "Procedural Stochastic Textures by Tiling and Blending"
// Thanks to the authors for permission to use.
//
// Compute the eigen vectors of the histogram of the input image
function computeEigenVectors(input: AbstractTexture, eigenVectors: Vector3[])
{
  // First and second order moments
  let R=0, G=0, B=0, RR=0, GG=0, BB=0, RG=0, RB=0, GB=0;
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++)
    {
      const col = input.getPixelAs(x, y, ColorRgb);
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
  covarMat.m00 = RR - R*R;
  covarMat.m01 = RG - R*G;
  covarMat.m02 = RB - R*B;
  covarMat.m10 = RG - R*G;
  covarMat.m11 = GG - G*G;
  covarMat.m12 = GB - G*B;
  covarMat.m20 = RB - R*B;
  covarMat.m21 = GB - G*B;
  covarMat.m22 = BB - B*B;

  // Find eigen values and vectors using Jacobi algorithm
  const eigenVectorsTemp = Matrix33.zero();
  const eigenValuesTemp = Vector3.zero();
  //MathUtil.computeEigenValuesAndVectors(covarMat, eigenVectorsTemp, eigenValuesTemp);

  // Set return values
  eigenVectors[0] = new Vector3(eigenVectorsTemp.m00, eigenVectorsTemp.m10, eigenVectorsTemp.m20);
  eigenVectors[1] = new Vector3(eigenVectorsTemp.m01, eigenVectorsTemp.m11, eigenVectorsTemp.m21);
  eigenVectors[2] = new Vector3(eigenVectorsTemp.m02, eigenVectorsTemp.m12, eigenVectorsTemp.m22);
}

function decorrelateColorSpace(
  input: AbstractTexture,        // input: example image
  input_decorrelated: AbstractTexture,// output: decorrelated input
  colorSpaceVector1: MutableVector3,        // output: color space vector1
  colorSpaceVector2: MutableVector3,        // output: color space vector2
  colorSpaceVector3: MutableVector3,        // output: color space vector3
  colorSpaceOrigin: MutableVector3)        // output: color space origin
{
  // Compute the eigenvectors of the histogram
  const eigenvectors = [MutableVector3.zero(),MutableVector3.zero(),MutableVector3.zero()];
  computeEigenVectors(input, eigenvectors);

  // Rotate to eigenvector space and
  for (let y = 0; y < input.height; y++)
  for (let x = 0; x < input.width; x++)
  for(let channel = 0 ; channel < 3 ; ++channel)
  {
    // Get current color
    const color: ColorRgb = input.getPixelAs(x, y, ColorRgb);
    // Project on eigenvector
    const new_channel_value:number = Vector3.dot(color, eigenvectors[channel]);
    // Store
    input_decorrelated.setPixelAtChannel(x, y, channel, new_channel_value);
  }

   // Compute ranges of the new color space
  const colorSpaceRanges: Vector2[] = [
    new Vector2(Number.MAX_VALUE, -Number.MAX_VALUE),
    new Vector2(Number.MAX_VALUE, -Number.MAX_VALUE),
    new Vector2(Number.MAX_VALUE, -Number.MAX_VALUE)
  ];
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      for(let channel = 0 ; channel < 3 ; ++channel)
      {
        colorSpaceRanges[channel].x = Math.min(colorSpaceRanges[channel].x, input_decorrelated.getPixelAsArray(x,y)[channel]);
        colorSpaceRanges[channel].y = Math.max(colorSpaceRanges[channel].y, input_decorrelated.getPixelAsArray(x,y)[channel]);
      }
    }
  }

  // Remap range to [0, 1]
  for (let y = 0; y < input.height; y++) {
    for (let x = 0; x < input.width; x++) {
      for(let channel = 0 ; channel < 3 ; ++channel)
      {
        // Get current value
        const value:number = input_decorrelated.getPixelAsArray(x,y)[channel];
        // Remap in [0, 1]
        const remapped_value = (value - colorSpaceRanges[channel].x) / (colorSpaceRanges[channel].y - colorSpaceRanges[channel].x);
        // Store
        input_decorrelated.setPixelAtChannel(x, y, channel, remapped_value);
      }
    }
  }

  // Compute color space origin and vectors scaled for the normalized range
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

// Compute average subpixel variance at a given LOD
function ComputeLODAverageSubpixelVariance(image: AbstractTexture, LOD:Index, channel:Index) :number
{
	// Window width associated with
	const windowWidth = 1 << LOD;

	// Compute average variance in all the windows
	let average_window_variance = 0.0;

	// Loop over al the windows
	for(let window_y = 0 ; window_y < image.height ; window_y += windowWidth) {
    for(let window_x = 0 ; window_x < image.width  ; window_x += windowWidth)
    {
      // Estimate variance of current window
      let v = 0.0;
      let v2 = 0.0;
      for(let y = 0 ; y < windowWidth ; y++) {
        for(let x = 0 ; x < windowWidth ; x++)
        {
          const value = image.getPixelAsArray(window_x + x, window_y)[channel];
          v  += value;
          v2 += value*value;
        }
        v  /= (windowWidth*windowWidth);
        v2 /= (windowWidth*windowWidth);
        const window_variance = Math.max(0.0, v2 - v*v);

        // Update average
        average_window_variance += window_variance / (image.width*image.height/windowWidth/windowWidth);
      }
    }
  }

	return average_window_variance;
}

// Filter LUT by sampling a Gaussian N(mu, std�)
function FilterLUTValueAtx(LUT: AbstractTexture, x:number, std: number, channel: Index, LUT_WIDTH: Size = 128): number
{
	// Number of samples for filtering (heuristic: twice the LUT resolution)
	const numberOfSamples = 2 * LUT_WIDTH;

	// Filter
	let filtered_value = 0.0;
	for (let sample = 0; sample < numberOfSamples; sample++)
	{
		// Quantile used to sample the Gaussian
		const U = (sample + 0.5) / numberOfSamples;
		// Sample the Gaussian
		const sample_x = invCDF(U, x, std);
		// Find sample texel in LUT (the LUT covers the domain [0, 1])
		const sample_texel = Math.max(0, Math.min(LUT_WIDTH - 1, Math.floor(sample_x * LUT_WIDTH)));
		// Fetch LUT at level 0
		const sample_value = LUT.getPixelAsArray(sample_texel, 0)[channel];
		// Accumulate
		filtered_value += sample_value;
	}
	// Normalize and return
	filtered_value /= numberOfSamples;
	return filtered_value;
}

function PrefilterLUT(image_T_Input: AbstractTexture, LUT_Tinv: AbstractTexture, channel: Index): void
{
	// Compute number of prefiltered levels and resize LUT
	LUT_Tinv.height = Math.floor(Math.log(image_T_Input.width)/Math.log(2.0));
//	LUT_Tinv.data.resize(3 * LUT_Tinv.width * LUT_Tinv.height);

	// Prefilter
	for(let LOD = 1 ; LOD < LUT_Tinv.height ; LOD++)
	{
		// Compute subpixel variance at LOD
		const window_variance = ComputeLODAverageSubpixelVariance(image_T_Input, LOD, channel);
		const window_std = Math.sqrt(window_variance);

		// Prefilter LUT with Gaussian kernel of this variance
		for (let i = 0; i < LUT_Tinv.width; i++)
		{
			// Texel position in [0, 1]
			const x_texel:number = (i+0.5) / LUT_Tinv.width;
			// Filter look-up table around this position with Gaussian kernel
		  const filteredValue = FilterLUTValueAtx(LUT_Tinv, x_texel, window_std, channel);
			// Store filtered value
			LUT_Tinv.setPixelAtChannel(i, LOD, channel, filteredValue);
		}
	}
}

