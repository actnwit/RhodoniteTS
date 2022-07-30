import { MutableMatrix33 } from './MutableMatrix33';
import { MutableVector3 } from './MutableVector3';
import { Count, Size } from '../../types/CommonTypes';
declare function radianToDegree(rad: number): number;
declare function degreeToRadian(deg: number): number;
/**
 * check whether or not this texture size is power of two.
 *
 * @param x texture size.
 * @returns check whether or not the size x is power of two.
 */
declare function isPowerOfTwo(x: number): boolean;
declare function isPowerOfTwoTexture(width: Size, height: Size): boolean;
declare function packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number): number[];
declare function gaussianCdf(x: number, mu: number, sigma: number): number;
declare function invGaussianCdf(U: number, mu: number, sigma: number): number;
declare function computeEigenValuesAndVectors(A: MutableMatrix33, Q: MutableMatrix33, w: MutableVector3): -1 | 0;
declare function convertToStringAsGLSLFloat(value: number): string;
declare function nearZeroToZero(value: number): number;
declare function financial(val: number | string): string;
declare function roundAsFloat(value: number): number;
/**
 * This function calculates the ratio of a discrete Gaussian distribution.
 * The sampling points are one away from each other. The sum of the ratios is 1.
 * @kernelSize number of sampling points
 * @variance variance of the Gaussian distribution
 * @mean mean of the Gaussian distribution
 * e.g. kernelSize = 2 (mean=0) => the sampling points are -0.5 and 0.5
 * e.g. kernelSize = 3 (mean=1) => the sampling points are 0.0, 1.0 and 2.0
 * @effectiveDigit effectiveDigit of values in return array
 * @returns array of the Gaussian distribution where the sum of the elements is 1
 */
declare function computeGaussianDistributionRatioWhoseSumIsOne({ kernelSize, variance, mean, effectiveDigit, }: {
    kernelSize: Count;
    variance: number;
    mean?: number;
    effectiveDigit?: Count;
}): any[];
export declare const MathUtil: Readonly<{
    radianToDegree: typeof radianToDegree;
    degreeToRadian: typeof degreeToRadian;
    toHalfFloat: () => (val: number) => number;
    isPowerOfTwo: typeof isPowerOfTwo;
    isPowerOfTwoTexture: typeof isPowerOfTwoTexture;
    packNormalizedVec4ToVec2: typeof packNormalizedVec4ToVec2;
    convertToStringAsGLSLFloat: typeof convertToStringAsGLSLFloat;
    nearZeroToZero: typeof nearZeroToZero;
    gaussianCdf: typeof gaussianCdf;
    invGaussianCdf: typeof invGaussianCdf;
    computeEigenValuesAndVectors: typeof computeEigenValuesAndVectors;
    computeGaussianDistributionRatioWhoseSumIsOne: typeof computeGaussianDistributionRatioWhoseSumIsOne;
    roundAsFloat: typeof roundAsFloat;
    financial: typeof financial;
}>;
export {};
