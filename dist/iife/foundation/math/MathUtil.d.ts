import type { Count, Size } from '../../types/CommonTypes';
import type { MutableMatrix33 } from './MutableMatrix33';
import type { MutableVector3 } from './MutableVector3';
/**
 * Converts radians to degrees.
 * @param rad - The angle in radians
 * @returns The angle in degrees
 */
declare function radianToDegree(rad: number): number;
/**
 * Converts degrees to radians.
 * @param deg - The angle in degrees
 * @returns The angle in radians
 */
declare function degreeToRadian(deg: number): number;
/**
 * Checks whether a number is a power of two.
 * @param x - The number to check
 * @returns True if the number is a power of two, false otherwise
 */
declare function isPowerOfTwo(x: number): boolean;
/**
 * Checks whether the given texture dimensions are both powers of two.
 * @param width - The width of the texture
 * @param height - The height of the texture
 * @returns True if both dimensions are powers of two, false otherwise
 */
declare function isPowerOfTwoTexture(width: Size, height: Size): boolean;
/**
 * Packs a normalized 4D vector into a 2D vector using a specific encoding scheme.
 * All input values must be in the range [-1, 1].
 * @param x - The x component of the vector (range: [-1, 1])
 * @param y - The y component of the vector (range: [-1, 1])
 * @param z - The z component of the vector (range: [-1, 1])
 * @param w - The w component of the vector (range: [-1, 1])
 * @param criteria - The encoding criteria/resolution
 * @returns A 2-element array containing the packed values
 */
declare function packNormalizedVec4ToVec2(x: number, y: number, z: number, w: number, criteria: number): number[];
/**
 * Calculates the cumulative distribution function (CDF) for a Gaussian distribution.
 * @param x - The value at which to evaluate the CDF
 * @param mu - The mean of the Gaussian distribution
 * @param sigma - The standard deviation of the Gaussian distribution
 * @returns The cumulative probability up to x
 */
declare function gaussianCdf(x: number, mu: number, sigma: number): number;
/**
 * Calculates the inverse cumulative distribution function (inverse CDF) for a Gaussian distribution.
 * @param U - The cumulative probability (should be in range [0, 1])
 * @param mu - The mean of the Gaussian distribution
 * @param sigma - The standard deviation of the Gaussian distribution
 * @returns The value x such that CDF(x) = U
 */
declare function invGaussianCdf(U: number, mu: number, sigma: number): number;
/**
 * Computes eigenvalues and eigenvectors of a 3x3 symmetric matrix using the Jacobi method.
 * @param A - The input 3x3 symmetric matrix (will be modified during computation)
 * @param Q - The output matrix that will contain the eigenvectors
 * @param w - The output vector that will contain the eigenvalues
 * @returns 0 on success, -1 if maximum iterations exceeded
 */
declare function computeEigenValuesAndVectors(A: MutableMatrix33, Q: MutableMatrix33, w: MutableVector3): -1 | 0;
/**
 * Converts a numeric value to a string formatted for GLSL float literals.
 * Ensures that integer values are suffixed with ".0" for proper GLSL syntax.
 * @param value - The numeric value to convert
 * @returns A string representation suitable for GLSL float literals
 */
declare function convertToStringAsGLSLFloat(value: number): string;
/**
 * Rounds very small values to zero and values very close to ±1 to exactly ±1.
 * This helps reduce floating-point precision errors in calculations.
 * @param value - The value to normalize
 * @returns The normalized value with small errors corrected
 */
declare function nearZeroToZero(value: number): number;
/**
 * Formats a numeric value as a fixed-width financial string with 7 decimal places.
 * Positive values are prefixed with a space for alignment.
 * @param val - The numeric value to format
 * @returns A formatted string with consistent width for financial display
 */
declare function financial(val: number | string): string;
/**
 * Rounds a floating-point number to 7 decimal places to reduce precision errors.
 * @param value - The value to round
 * @returns The rounded value
 */
declare function roundAsFloat(value: number): number;
/**
 * Performs linear interpolation between two values.
 * @param a - The starting value
 * @param b - The ending value
 * @param t - The interpolation parameter (0 returns a, 1 returns b)
 * @returns The interpolated value
 */
declare function lerp(a: number, b: number, t: number): number;
/**
 * Computes a normalized discrete Gaussian distribution where the sum of all ratios equals 1.
 * The sampling points are positioned at integer intervals around the mean.
 *
 * @param params - Configuration object for the Gaussian distribution
 * @param params.kernelSize - Number of sampling points in the distribution
 * @param params.variance - Variance of the Gaussian distribution
 * @param params.mean - Mean of the Gaussian distribution (default: 0)
 * @param params.effectiveDigit - Number of decimal places for precision (default: 4)
 * @returns An array of normalized ratios that sum to 1
 *
 * @example
 * // For kernelSize = 2 (mean=0): sampling points are at -0.5 and 0.5
 * // For kernelSize = 3 (mean=1): sampling points are at 0.0, 1.0, and 2.0
 */
declare function computeGaussianDistributionRatioWhoseSumIsOne({ kernelSize, variance, mean, effectiveDigit, }: {
    kernelSize: Count;
    variance: number;
    mean?: number;
    effectiveDigit?: Count;
}): number[];
/**
 * A utility class containing various mathematical functions and operations.
 * This class provides static methods for common mathematical computations including:
 * - Angle conversions (radians/degrees)
 * - Floating point operations and conversions
 * - Power-of-two checks
 * - Vector packing utilities
 * - Statistical functions (Gaussian distributions, error functions)
 * - Matrix eigenvalue computations
 * - Interpolation and formatting utilities
 */
export declare const MathUtil: Readonly<{
    radianToDegree: typeof radianToDegree;
    degreeToRadian: typeof degreeToRadian;
    toHalfFloat: () => ((val: number) => number);
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
    lerp: typeof lerp;
}>;
export {};
