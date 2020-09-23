import { Size } from "../../commontypes/CommonTypes";
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
declare function convertToStringAsGLSLFloat(value: number): string;
declare function nearZeroToZero(value: number): number;
export declare const MathUtil: Readonly<{
    radianToDegree: typeof radianToDegree;
    degreeToRadian: typeof degreeToRadian;
    toHalfFloat: (val: number) => number;
    isPowerOfTwo: typeof isPowerOfTwo;
    isPowerOfTwoTexture: typeof isPowerOfTwoTexture;
    packNormalizedVec4ToVec2: typeof packNormalizedVec4ToVec2;
    convertToStringAsGLSLFloat: typeof convertToStringAsGLSLFloat;
    nearZeroToZero: typeof nearZeroToZero;
}>;
export {};
