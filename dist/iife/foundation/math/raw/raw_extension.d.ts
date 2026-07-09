import type { Array1, Array2, Array3, Array4, ArrayType } from '../../../types/CommonTypes';
/**
 * Symbol for getting a 1-component vector from an array
 */
export declare const get1: unique symbol;
/**
 * Symbol for getting a 1-component vector from an array at a specific offset
 */
export declare const get1_offset: unique symbol;
/**
 * Symbol for getting a 1-component vector from an array at a specific composition offset
 */
export declare const get1_offsetAsComposition: unique symbol;
/**
 * Symbol for getting a 2-component vector from an array
 */
export declare const get2: unique symbol;
/**
 * Symbol for getting a 2-component vector from an array at a specific offset
 */
export declare const get2_offset: unique symbol;
/**
 * Symbol for getting a 2-component vector from an array at a specific composition offset
 */
export declare const get2_offsetAsComposition: unique symbol;
/**
 * Symbol for getting a 3-component vector from an array
 */
export declare const get3: unique symbol;
/**
 * Symbol for getting a 3-component vector from an array at a specific offset
 */
export declare const get3_offset: unique symbol;
/**
 * Symbol for getting a 3-component vector from an array at a specific composition offset
 */
export declare const get3_offsetAsComposition: unique symbol;
/**
 * Symbol for getting a 4-component vector from an array
 */
export declare const get4: unique symbol;
/**
 * Symbol for getting a 4-component vector from an array at a specific offset
 */
export declare const get4_offset: unique symbol;
/**
 * Symbol for getting a 4-component vector from an array at a specific composition offset
 */
export declare const get4_offsetAsComposition: unique symbol;
/**
 * Symbol for getting an N-component vector from an array at a specific offset
 */
export declare const getN_offset: unique symbol;
/**
 * Symbol for getting an N-component vector from an array at a specific composition offset
 */
export declare const getN_offsetAsComposition: unique symbol;
/**
 * Symbol for adding two 2-component vectors
 */
export declare const add2: unique symbol;
/**
 * Symbol for adding two 2-component vectors at specific offsets
 */
export declare const add2_offset: unique symbol;
/**
 * Symbol for adding two 3-component vectors
 */
export declare const add3: unique symbol;
/**
 * Symbol for adding two 3-component vectors at specific offsets
 */
export declare const add3_offset: unique symbol;
/**
 * Symbol for adding two 4-component vectors
 */
export declare const add4: unique symbol;
/**
 * Symbol for multiplying a 3-component vector by a scalar at a specific offset
 */
export declare const mulArray3WithScalar_offset: unique symbol;
/**
 * Symbol for multiplying a 4-component vector by a scalar at a specific offset
 */
export declare const mulArray4WithScalar_offset: unique symbol;
/**
 * Symbol for multiplying an N-component vector by a scalar at a specific offset
 */
export declare const mulArrayNWithScalar_offset: unique symbol;
/**
 * Symbol for multiplying two 4x4 matrices and storing the result in an output array
 */
export declare const mulThatAndThisToOutAsMat44_offsetAsComposition: unique symbol;
/**
 * Symbol for adding two 4-component vectors at specific offsets
 */
export declare const add4_offset: unique symbol;
/**
 * Symbol for quaternion spherical linear interpolation at specific composition offsets
 */
export declare const qlerp_offsetAsComposition: unique symbol;
/**
 * Symbol for scalar linear interpolation at specific composition offsets
 */
export declare const scalar_lerp_offsetAsComposition: unique symbol;
/**
 * Symbol for 2-component vector linear interpolation at specific composition offsets
 */
export declare const array2_lerp_offsetAsComposition: unique symbol;
/**
 * Symbol for 3-component vector linear interpolation at specific composition offsets
 */
export declare const array3_lerp_offsetAsComposition: unique symbol;
/**
 * Symbol for 4-component vector linear interpolation at specific composition offsets
 */
export declare const array4_lerp_offsetAsComposition: unique symbol;
/**
 * Symbol for N-component vector linear interpolation at specific composition offsets
 */
export declare const arrayN_lerp_offsetAsComposition: unique symbol;
/**
 * Symbol for normalizing a 4-component vector
 */
export declare const normalizeArray4: unique symbol;
/**
 * Mathematical extension methods for array types.
 * These methods provide efficient operations for vectors, matrices, and quaternions.
 */
declare global {
    interface Extension {
        /**
         * Gets a 1-component vector from the beginning of the array
         * @returns A new Array1 containing the first element
         */
        [get1](this: ArrayType): Array1<number>;
        /**
         * Gets a 1-component vector from the array at a specific offset
         * @param offset - The index offset to start reading from
         * @returns A new Array1 containing one element at the specified offset
         */
        [get1_offset](this: ArrayType, offset: number): Array1<number>;
        /**
         * Gets a 1-component vector from the array at a specific composition offset
         * @param offsetAsComposition - The composition index (element index = offsetAsComposition * 1)
         * @returns A new Array1 containing one element at the specified composition offset
         */
        [get1_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array1<number>;
        /**
         * Gets a 2-component vector from the beginning of the array
         * @returns A new Array2 containing the first two elements
         */
        [get2](this: ArrayType): Array2<number>;
        /**
         * Gets a 2-component vector from the array at a specific offset
         * @param offset - The index offset to start reading from
         * @returns A new Array2 containing two elements starting at the specified offset
         */
        [get2_offset](this: ArrayType, offset: number): Array2<number>;
        /**
         * Gets a 2-component vector from the array at a specific composition offset
         * @param offsetAsComposition - The composition index (element index = offsetAsComposition * 2)
         * @returns A new Array2 containing two elements at the specified composition offset
         */
        [get2_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array2<number>;
        /**
         * Gets a 3-component vector from the beginning of the array
         * @returns A new Array3 containing the first three elements
         */
        [get3](this: ArrayType): Array3<number>;
        /**
         * Gets a 3-component vector from the array at a specific offset
         * @param offset - The index offset to start reading from
         * @returns A new Array3 containing three elements starting at the specified offset
         */
        [get3_offset](this: ArrayType, offset: number): Array3<number>;
        /**
         * Gets a 3-component vector from the array at a specific composition offset
         * @param offsetAsComposition - The composition index (element index = offsetAsComposition * 3)
         * @returns A new Array3 containing three elements at the specified composition offset
         */
        [get3_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array3<number>;
        /**
         * Gets a 4-component vector from the beginning of the array
         * @returns A new Array4 containing the first four elements
         */
        [get4](this: ArrayType): Array4<number>;
        /**
         * Gets a 4-component vector from the array at a specific offset
         * @param offset - The index offset to start reading from
         * @returns A new Array4 containing four elements starting at the specified offset
         */
        [get4_offset](this: ArrayType, offset: number): Array4<number>;
        /**
         * Gets a 4-component vector from the array at a specific composition offset
         * @param offsetAsComposition - The composition index (element index = offsetAsComposition * 4)
         * @returns A new Array4 containing four elements at the specified composition offset
         */
        [get4_offsetAsComposition](this: ArrayType, offsetAsComposition: number): Array4<number>;
        /**
         * Gets an N-component vector from the array at a specific offset
         * @param offset - The index offset to start reading from
         * @param componentN - The number of components to read
         * @returns A new Array containing N elements starting at the specified offset
         */
        [getN_offset](this: ArrayType, offset: number, componentN: number): Array<number>;
        /**
         * Gets an N-component vector from the array at a specific composition offset
         * @param offsetAsComposition - The composition index (element index = offsetAsComposition * componentN)
         * @param componentN - The number of components to read
         * @returns A new Array containing N elements at the specified composition offset
         */
        [getN_offsetAsComposition](this: ArrayType, offsetAsComposition: number, componentN: number): Array<number>;
        /**
         * Adds a 2-component vector to this array in-place
         * @param array - The array to add
         * @returns The modified array (this)
         */
        [add2](this: ArrayType, array: ArrayType): ArrayType;
        /**
         * Adds a 2-component vector to this array in-place at specific offsets
         * @param array - The array to add
         * @param selfOffset - The offset in this array
         * @param argOffset - The offset in the argument array
         * @returns The modified array (this)
         */
        [add2_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        /**
         * Adds a 3-component vector to this array in-place
         * @param array - The array to add
         * @returns The modified array (this)
         */
        [add3](this: ArrayType, array: ArrayType): ArrayType;
        /**
         * Adds a 3-component vector to this array in-place at specific offsets
         * @param array - The array to add
         * @param selfOffset - The offset in this array
         * @param argOffset - The offset in the argument array
         * @returns The modified array (this)
         */
        [add3_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        /**
         * Adds a 4-component vector to this array in-place
         * @param array - The array to add
         * @returns The modified array (this)
         */
        [add4](this: ArrayType, array: ArrayType): ArrayType;
        /**
         * Adds a 4-component vector to this array in-place at specific offsets
         * @param array - The array to add
         * @param selfOffset - The offset in this array
         * @param argOffset - The offset in the argument array
         * @returns The modified array (this)
         */
        [add4_offset](this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number): ArrayType;
        /**
         * Multiplies a 3-component vector by a scalar in-place at a specific offset
         * @param offset - The offset in the array
         * @param value - The scalar value to multiply by
         * @returns The modified array (this)
         */
        [mulArray3WithScalar_offset](this: ArrayType, offset: number, value: number): Array4<number>;
        /**
         * Multiplies a 4-component vector by a scalar in-place at a specific offset
         * @param offset - The offset in the array
         * @param value - The scalar value to multiply by
         * @returns The modified array (this)
         */
        [mulArray4WithScalar_offset](this: ArrayType, offset: number, value: number): Array4<number>;
        /**
         * Multiplies an N-component vector by a scalar in-place at a specific offset
         * @param offset - The offset in the array
         * @param componentN - The number of components to multiply
         * @param value - The scalar value to multiply by
         * @returns The modified array (this)
         */
        [mulArrayNWithScalar_offset](this: ArrayType, offset: number, componentN: number, value: number): Array4<number>;
        /**
         * Multiplies two 4x4 matrices and stores the result in an output array
         * @param thisOffsetAsComposition - The composition offset for this matrix
         * @param that - The other matrix array
         * @param thatOffsetAsComposition - The composition offset for the other matrix
         * @param out - The output array to store the result
         * @returns The output array
         */
        [mulThatAndThisToOutAsMat44_offsetAsComposition](this: ArrayType, thisOffsetAsComposition: number, that: ArrayType, thatOffsetAsComposition: number, out: ArrayType): ArrayType;
        /**
         * Performs quaternion spherical linear interpolation (SLERP) at specific composition offsets
         * @param array - The target quaternion array
         * @param ratio - The interpolation ratio (0.0 to 1.0)
         * @param selfOffsetAsComposition - The composition offset for this quaternion
         * @param argOffsetAsComposition - The composition offset for the target quaternion
         * @returns A new Array4 containing the interpolated quaternion
         */
        [qlerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array4<number>;
        /**
         * Performs scalar linear interpolation at specific offsets
         * @param array - The target scalar array
         * @param ratio - The interpolation ratio (0.0 to 1.0)
         * @param selfOffset - The offset in this array
         * @param argOffset - The offset in the target array
         * @returns The interpolated scalar value
         */
        [scalar_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffset: number, argOffset: number): number;
        /**
         * Performs 2-component vector linear interpolation at specific composition offsets
         * @param array - The target vector array
         * @param ratio - The interpolation ratio (0.0 to 1.0)
         * @param selfOffsetAsComposition - The composition offset for this vector
         * @param argOffsetAsComposition - The composition offset for the target vector
         * @returns A new Array2 containing the interpolated vector
         */
        [array2_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array2<number>;
        /**
         * Performs 3-component vector linear interpolation at specific composition offsets
         * @param array - The target vector array
         * @param ratio - The interpolation ratio (0.0 to 1.0)
         * @param selfOffsetAsComposition - The composition offset for this vector
         * @param argOffsetAsComposition - The composition offset for the target vector
         * @returns A new Array3 containing the interpolated vector
         */
        [array3_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array3<number>;
        /**
         * Performs 4-component vector linear interpolation at specific composition offsets
         * @param array - The target vector array
         * @param ratio - The interpolation ratio (0.0 to 1.0)
         * @param selfOffsetAsComposition - The composition offset for this vector
         * @param argOffsetAsComposition - The composition offset for the target vector
         * @returns A new Array4 containing the interpolated vector
         */
        [array4_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array4<number>;
        /**
         * Performs N-component vector linear interpolation at specific composition offsets
         * @param array - The target vector array
         * @param componentN - The number of components in the vectors
         * @param ratio - The interpolation ratio (0.0 to 1.0)
         * @param selfOffsetAsComposition - The composition offset for this vector
         * @param argOffsetAsComposition - The composition offset for the target vector
         * @returns A new Array containing the interpolated vector
         */
        [arrayN_lerp_offsetAsComposition](this: ArrayType, array: ArrayType, componentN: number, ratio: number, selfOffsetAsComposition: number, argOffsetAsComposition: number): Array<number>;
        /**
         * Normalizes a 4-component vector in-place
         * @returns The normalized vector (this)
         */
        [normalizeArray4](this: Array4<number>): Array4<number>;
    }
    interface Array<T> extends Extension {
    }
    interface ReadonlyArray<T> extends Extension {
    }
    interface Float32Array extends Extension {
    }
}
