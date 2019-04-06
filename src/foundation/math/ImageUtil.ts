import Vector3 from "./Vector3";
import AbstractTexture from "../textures/AbstractTexture";
import Matrix33 from "./Matrix33";
import MutableMatrix33 from "./MutableMatrix33";
import { MathUtil } from "./MathUtil";
import MutableVector3 from "./MutableVector3";

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
      const col = input.getPixelAsColorArba(x, y);
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
