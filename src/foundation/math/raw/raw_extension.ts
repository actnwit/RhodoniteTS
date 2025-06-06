/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Array1, Array2, Array3, Array4, ArrayType } from '../../../types/CommonTypes';

/**
 * Symbol for getting a 1-component vector from an array
 */
export const get1 = Symbol('get1');

/**
 * Symbol for getting a 1-component vector from an array at a specific offset
 */
export const get1_offset = Symbol('get1_offset');

/**
 * Symbol for getting a 1-component vector from an array at a specific composition offset
 */
export const get1_offsetAsComposition = Symbol('get1_offsetAsComposition');

/**
 * Symbol for getting a 2-component vector from an array
 */
export const get2 = Symbol('get2');

/**
 * Symbol for getting a 2-component vector from an array at a specific offset
 */
export const get2_offset = Symbol('get2_offset');

/**
 * Symbol for getting a 2-component vector from an array at a specific composition offset
 */
export const get2_offsetAsComposition = Symbol('get2_offsetAsComposition');

/**
 * Symbol for getting a 3-component vector from an array
 */
export const get3 = Symbol('get3');

/**
 * Symbol for getting a 3-component vector from an array at a specific offset
 */
export const get3_offset = Symbol('get3_offset');

/**
 * Symbol for getting a 3-component vector from an array at a specific composition offset
 */
export const get3_offsetAsComposition = Symbol('get3_offsetAsComposition');

/**
 * Symbol for getting a 4-component vector from an array
 */
export const get4 = Symbol('get4');

/**
 * Symbol for getting a 4-component vector from an array at a specific offset
 */
export const get4_offset = Symbol('get4_offset');

/**
 * Symbol for getting a 4-component vector from an array at a specific composition offset
 */
export const get4_offsetAsComposition = Symbol('get4_offsetAsComposition');

/**
 * Symbol for getting an N-component vector from an array at a specific offset
 */
export const getN_offset = Symbol('getN_offset');

/**
 * Symbol for getting an N-component vector from an array at a specific composition offset
 */
export const getN_offsetAsComposition = Symbol('getN_offsetAsComposition');

/**
 * Symbol for adding two 2-component vectors
 */
export const add2 = Symbol('add2');

/**
 * Symbol for adding two 2-component vectors at specific offsets
 */
export const add2_offset = Symbol('add2_offset');

/**
 * Symbol for adding two 3-component vectors
 */
export const add3 = Symbol('add3');

/**
 * Symbol for adding two 3-component vectors at specific offsets
 */
export const add3_offset = Symbol('add3_offset');

/**
 * Symbol for adding two 4-component vectors
 */
export const add4 = Symbol('add4');

/**
 * Symbol for multiplying a 3-component vector by a scalar at a specific offset
 */
export const mulArray3WithScalar_offset = Symbol('mulArray3WithScalar_offset');

/**
 * Symbol for multiplying a 4-component vector by a scalar at a specific offset
 */
export const mulArray4WithScalar_offset = Symbol('mulArray4WithScalar_offset');

/**
 * Symbol for multiplying an N-component vector by a scalar at a specific offset
 */
export const mulArrayNWithScalar_offset = Symbol('mulArrayNWithScalar_offset');

/**
 * Symbol for multiplying two 4x4 matrices and storing the result in an output array
 */
export const mulThatAndThisToOutAsMat44_offsetAsComposition = Symbol('mulThatAndThisToOutAsMat44_offsetAsComposition');

/**
 * Symbol for adding two 4-component vectors at specific offsets
 */
export const add4_offset = Symbol('add4_offset');

/**
 * Symbol for quaternion spherical linear interpolation at specific composition offsets
 */
export const qlerp_offsetAsComposition = Symbol('qlerp_offsetAsComposition');

/**
 * Symbol for scalar linear interpolation at specific composition offsets
 */
export const scalar_lerp_offsetAsComposition = Symbol('scalar_lerp_offsetAsComposition');

/**
 * Symbol for 2-component vector linear interpolation at specific composition offsets
 */
export const array2_lerp_offsetAsComposition = Symbol('array2_lerp_offsetAsComposition');

/**
 * Symbol for 3-component vector linear interpolation at specific composition offsets
 */
export const array3_lerp_offsetAsComposition = Symbol('array3_lerp_offsetAsComposition');

/**
 * Symbol for 4-component vector linear interpolation at specific composition offsets
 */
export const array4_lerp_offsetAsComposition = Symbol('array4_lerp_offsetAsComposition');

/**
 * Symbol for N-component vector linear interpolation at specific composition offsets
 */
export const arrayN_lerp_offsetAsComposition = Symbol('arrayN_lerp_offsetAsComposition');

/**
 * Symbol for normalizing a 4-component vector
 */
export const normalizeArray4 = Symbol('normalizeArray4');

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
    [mulThatAndThisToOutAsMat44_offsetAsComposition](
      this: ArrayType,
      thisOffsetAsComposition: number,
      that: ArrayType,
      thatOffsetAsComposition: number,
      out: ArrayType
    ): ArrayType;

    /**
     * Performs quaternion spherical linear interpolation (SLERP) at specific composition offsets
     * @param array - The target quaternion array
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @param selfOffsetAsComposition - The composition offset for this quaternion
     * @param argOffsetAsComposition - The composition offset for the target quaternion
     * @returns A new Array4 containing the interpolated quaternion
     */
    [qlerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffsetAsComposition: number,
      argOffsetAsComposition: number
    ): Array4<number>;

    /**
     * Performs scalar linear interpolation at specific offsets
     * @param array - The target scalar array
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @param selfOffset - The offset in this array
     * @param argOffset - The offset in the target array
     * @returns The interpolated scalar value
     */
    [scalar_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffset: number,
      argOffset: number
    ): number;

    /**
     * Performs 2-component vector linear interpolation at specific composition offsets
     * @param array - The target vector array
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @param selfOffsetAsComposition - The composition offset for this vector
     * @param argOffsetAsComposition - The composition offset for the target vector
     * @returns A new Array2 containing the interpolated vector
     */
    [array2_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffsetAsComposition: number,
      argOffsetAsComposition: number
    ): Array2<number>;

    /**
     * Performs 3-component vector linear interpolation at specific composition offsets
     * @param array - The target vector array
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @param selfOffsetAsComposition - The composition offset for this vector
     * @param argOffsetAsComposition - The composition offset for the target vector
     * @returns A new Array3 containing the interpolated vector
     */
    [array3_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffsetAsComposition: number,
      argOffsetAsComposition: number
    ): Array3<number>;

    /**
     * Performs 4-component vector linear interpolation at specific composition offsets
     * @param array - The target vector array
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @param selfOffsetAsComposition - The composition offset for this vector
     * @param argOffsetAsComposition - The composition offset for the target vector
     * @returns A new Array4 containing the interpolated vector
     */
    [array4_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffsetAsComposition: number,
      argOffsetAsComposition: number
    ): Array4<number>;

    /**
     * Performs N-component vector linear interpolation at specific composition offsets
     * @param array - The target vector array
     * @param componentN - The number of components in the vectors
     * @param ratio - The interpolation ratio (0.0 to 1.0)
     * @param selfOffsetAsComposition - The composition offset for this vector
     * @param argOffsetAsComposition - The composition offset for the target vector
     * @returns A new Array containing the interpolated vector
     */
    [arrayN_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      componentN: number,
      ratio: number,
      selfOffsetAsComposition: number,
      argOffsetAsComposition: number
    ): Array<number>;

    /**
     * Normalizes a 4-component vector in-place
     * @returns The normalized vector (this)
     */
    [normalizeArray4](this: Array4<number>): Array4<number>;
  }

  interface Array<T> extends Extension {}
  // interface Array2<T> extends Extension {}
  // interface Array3<T> extends Extension {}
  // interface Array4<T> extends Extension {}
  interface ReadonlyArray<T> extends Extension {}
  interface Float32Array extends Extension {}
}

/**
 * Gets a 1-component vector from the beginning of the array
 * @returns A new Array1 containing the first element
 */
const get1_fn = function (this: ArrayType): Array1<number> {
  return [this[0]];
};

/**
 * Gets a 1-component vector from the array at a specific offset
 * @param offset - The index offset to start reading from
 * @returns A new Array1 containing one element at the specified offset
 */
const get1_offset_fn = function (this: ArrayType, offset: number): Array1<number> {
  return [this[offset]];
};

/**
 * Gets a 1-component vector from the array at a specific composition offset
 * @param offsetAsComposition - The composition index (element index = offsetAsComposition * 1)
 * @returns A new Array1 containing one element at the specified composition offset
 */
const get1_offsetAsComposition_fn = function (this: ArrayType, offsetAsComposition: number): Array1<number> {
  return [this[offsetAsComposition]];
};

/**
 * Gets a 2-component vector from the beginning of the array
 * @returns A new Array2 containing the first two elements
 */
const get2_fn = function (this: ArrayType): Array2<number> {
  return [this[0], this[1]];
};

/**
 * Gets a 2-component vector from the array at a specific offset
 * @param offset - The index offset to start reading from
 * @returns A new Array2 containing two elements starting at the specified offset
 */
const get2_offset_fn = function (this: ArrayType, offset: number): Array2<number> {
  return [this[offset], this[offset + 1]];
};

/**
 * Gets a 2-component vector from the array at a specific composition offset
 * @param offsetAsComposition - The composition index (element index = offsetAsComposition * 2)
 * @returns A new Array2 containing two elements at the specified composition offset
 */
const get2_offsetAsComposition_fn = function (this: ArrayType, offsetAsComposition: number): Array2<number> {
  return [this[offsetAsComposition * 2], this[offsetAsComposition * 2 + 1]];
};

/**
 * Gets a 3-component vector from the beginning of the array
 * @returns A new Array3 containing the first three elements
 */
const get3_fn = function (this: ArrayType): Array3<number> {
  return [this[0], this[1], this[2]];
};

/**
 * Gets a 3-component vector from the array at a specific offset
 * @param offset - The index offset to start reading from
 * @returns A new Array3 containing three elements starting at the specified offset
 */
const get3_offset_fn = function (this: ArrayType, offset: number): Array3<number> {
  return [this[offset], this[offset + 1], this[offset + 2]];
};

/**
 * Gets a 3-component vector from the array at a specific composition offset
 * @param offsetAsComposition - The composition index (element index = offsetAsComposition * 3)
 * @returns A new Array3 containing three elements at the specified composition offset
 */
const get3_offsetAsComposition_fn = function (this: ArrayType, offsetAsComposition: number): Array3<number> {
  return [this[offsetAsComposition * 3], this[offsetAsComposition * 3 + 1], this[offsetAsComposition * 3 + 2]];
};

/**
 * Gets a 4-component vector from the beginning of the array
 * @returns A new Array4 containing the first four elements
 */
const get4_fn = function (this: ArrayType): Array4<number> {
  return [this[0], this[1], this[2], this[3]];
};

/**
 * Gets a 4-component vector from the array at a specific offset
 * @param offset - The index offset to start reading from
 * @returns A new Array4 containing four elements starting at the specified offset
 */
const get4_offset_fn = function (this: ArrayType, offset: number): Array4<number> {
  return [this[offset], this[offset + 1], this[offset + 2], this[offset + 3]];
};

/**
 * Gets a 4-component vector from the array at a specific composition offset
 * @param offsetAsComposition - The composition index (element index = offsetAsComposition * 4)
 * @returns A new Array4 containing four elements at the specified composition offset
 */
const get4_offsetAsComposition_fn = function (this: ArrayType, offsetAsComposition: number): Array4<number> {
  return [
    this[offsetAsComposition * 4],
    this[offsetAsComposition * 4 + 1],
    this[offsetAsComposition * 4 + 2],
    this[offsetAsComposition * 4 + 3],
  ];
};

/**
 * Gets an N-component vector from the array at a specific offset
 * @param offset - The index offset to start reading from
 * @param componentN - The number of components to read
 * @returns A new Array containing N elements starting at the specified offset
 */
const getN_offset_fn = function (this: ArrayType, offset: number, componentN: number): Array<number> {
  const array = new Array(componentN) as unknown as Array<number>;
  for (let i = 0; i < componentN; i++) {
    array[i] = this[offset + i];
  }
  return array;
};

/**
 * Gets an N-component vector from the array at a specific composition offset
 * @param offsetAsComposition - The composition index (element index = offsetAsComposition * componentN)
 * @param componentN - The number of components to read
 * @returns A new Array containing N elements at the specified composition offset
 */
const getN_offsetAsComposition_fn = function (
  this: ArrayType,
  offsetAsComposition: number,
  componentN: number
): Array<number> {
  const array = new Array(componentN) as unknown as Array<number>;
  for (let i = 0; i < componentN; i++) {
    array[i] = this[offsetAsComposition * componentN + i];
  }
  return array;
};

/**
 * Adds a 2-component vector to this array in-place
 * @param array - The array to add
 * @returns The modified array (this)
 */
const add2_fn = function (this: ArrayType, array: ArrayType) {
  this[0] += array[0];
  this[1] += array[1];

  return this;
};

/**
 * Adds a 2-component vector to this array in-place at specific offsets
 * @param array - The array to add
 * @param selfOffset - The offset in this array
 * @param argOffset - The offset in the argument array
 * @returns The modified array (this)
 */
const add2_offset_fn = function (this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number) {
  this[selfOffset] += array[argOffset];
  this[selfOffset + 1] += array[argOffset + 1];

  return this;
};

/**
 * Adds a 3-component vector to this array in-place
 * @param array - The array to add
 * @returns The modified array (this)
 */
const add3_fn = function (this: ArrayType, array: ArrayType) {
  this[0] += array[0];
  this[1] += array[1];
  this[2] += array[2];

  return this;
};

/**
 * Adds a 3-component vector to this array in-place at specific offsets
 * @param array - The array to add
 * @param selfOffset - The offset in this array
 * @param argOffset - The offset in the argument array
 * @returns The modified array (this)
 */
const add3_offset_fn = function (this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number) {
  this[selfOffset] += array[argOffset];
  this[selfOffset + 1] += array[argOffset + 1];
  this[selfOffset + 2] += array[argOffset + 2];

  return this;
};

/**
 * Adds a 4-component vector to this array in-place
 * @param array - The array to add
 * @returns The modified array (this)
 */
const add4_fn = function (this: ArrayType, array: ArrayType) {
  this[0] += array[0];
  this[1] += array[1];
  this[2] += array[2];
  this[3] += array[3];

  return this;
};

/**
 * Adds a 4-component vector to this array in-place at specific offsets
 * @param array - The array to add
 * @param selfOffset - The offset in this array
 * @param argOffset - The offset in the argument array
 * @returns The modified array (this)
 */
const add4_offset_fn = function (this: ArrayType, array: ArrayType, selfOffset: number, argOffset: number) {
  this[selfOffset] += array[argOffset];
  this[selfOffset + 1] += array[argOffset + 1];
  this[selfOffset + 2] += array[argOffset + 2];
  this[selfOffset + 3] += array[argOffset + 3];

  return this;
};

/**
 * Multiplies a 3-component vector by a scalar in-place at a specific offset
 * @param offset - The offset in the array
 * @param value - The scalar value to multiply by
 * @returns The modified array (this)
 */
const mulArray3WithScalar_offset_fn = function (this: ArrayType, offset: number, value: number) {
  this[offset] *= value;
  this[offset + 1] *= value;
  this[offset + 2] *= value;

  return this;
};

/**
 * Multiplies a 4-component vector by a scalar in-place at a specific offset
 * @param offset - The offset in the array
 * @param value - The scalar value to multiply by
 * @returns The modified array (this)
 */
const mulArray4WithScalar_offset_fn = function (this: ArrayType, offset: number, value: number) {
  this[offset] *= value;
  this[offset + 1] *= value;
  this[offset + 2] *= value;
  this[offset + 3] *= value;

  return this;
};

/**
 * Multiplies an N-component vector by a scalar in-place at a specific offset
 * @param offset - The offset in the array
 * @param componentN - The number of components to multiply
 * @param value - The scalar value to multiply by
 * @returns The modified array (this)
 */
const mulArrayNWithScalar_offset_fn = function (this: ArrayType, offset: number, componentN: number, value: number) {
  for (let i = 0; i < componentN; i++) {
    this[offset + i] *= value;
  }

  return this;
};

/**
 * Multiplies two 4x4 matrices and stores the result in an output array.
 * Performs the operation: out = that * this
 * @param thisOffsetAsComposition - The composition offset for this matrix (matrix index)
 * @param that - The left-hand side matrix array
 * @param thatOffsetAsComposition - The composition offset for the left-hand side matrix
 * @param out - The output array to store the result matrix
 * @returns The output array
 */
// prettier-ignore
const mulThatAndThisToOutAsMat44_offsetAsComposition_fn = function (
  this: ArrayType,
  thisOffsetAsComposition: number,
  that: ArrayType,
  thatOffsetAsComposition: number,
  out: ArrayType
) {
  const lv = that;
  const l = thatOffsetAsComposition * 16;
  const r = thisOffsetAsComposition * 16;

  out[0] = lv[l] * this[r] + lv[l + 4] * this[r + 1] + lv[l + 8] * this[r + 2] + lv[l + 12] * this[r + 3]; // m00
  out[1] = lv[l + 1] * this[r] + lv[l + 5] * this[r + 1] + lv[l + 9] * this[r + 2] + lv[l + 13] * this[r + 3]; // m10
  out[2] = lv[l + 2] * this[r] + lv[l + 6] * this[r + 1] + lv[l + 10] * this[r + 2] + lv[l + 14] * this[r + 3]; // m20
  out[3] = lv[l + 3] * this[r] + lv[l + 7] * this[r + 1] + lv[l + 11] * this[r + 2] + lv[l + 15] * this[r + 3]; // m30

  out[4] = lv[l] * this[r + 4] + lv[l + 4] * this[r + 5] + lv[l + 8] * this[r + 6] + lv[l + 12] * this[r + 7]; // m01
  out[5] = lv[l + 1] * this[r + 4] + lv[l + 5] * this[r + 5] + lv[l + 9] * this[r + 6] + lv[l + 13] * this[r + 7]; // m11
  out[6] = lv[l + 2] * this[r + 4] + lv[l + 6] * this[r + 5] + lv[l + 10] * this[r + 6] + lv[l + 14] * this[r + 7]; // m21
  out[7] = lv[l + 3] * this[r + 4] + lv[l + 7] * this[r + 5] + lv[l + 11] * this[r + 6] + lv[l + 15] * this[r + 7]; // m31

  out[8] = lv[l] * this[r + 8] + lv[l + 4] * this[r + 9] + lv[l + 8] * this[r + 10] + lv[l + 12] * this[r + 11]; // m02
  out[9] = lv[l + 1] * this[r + 8] + lv[l + 5] * this[r + 9] + lv[l + 9] * this[r + 10] + lv[l + 13] * this[r + 11]; // m12
  out[10] = lv[l + 2] * this[r + 8] + lv[l + 6] * this[r + 9] + lv[l + 10] * this[r + 10] + lv[l + 14] * this[r + 11]; // m22
  out[11] = lv[l + 3] * this[r + 8] + lv[l + 7] * this[r + 9] + lv[l + 11] * this[r + 10] + lv[l + 15] * this[r + 11]; // m32

  out[12] = lv[l] * this[r + 12] + lv[l + 4] * this[r + 13] + lv[l + 8] * this[r + 14] + lv[l + 12] * this[r + 15]; // m03
  out[13] = lv[l + 1] * this[r + 12] + lv[l + 5] * this[r + 13] + lv[l + 9] * this[r + 14] + lv[l + 13] * this[r + 15]; // m13
  out[14] = lv[l + 2] * this[r + 12] + lv[l + 6] * this[r + 13] + lv[l + 10] * this[r + 14] + lv[l + 14] * this[r + 15]; // m23
  out[15] = lv[l + 3] * this[r + 12] + lv[l + 7] * this[r + 13] + lv[l + 11] * this[r + 14] + lv[l + 15] * this[r + 15]; // m33
};

/**
 * Performs quaternion spherical linear interpolation (SLERP) at specific composition offsets.
 * SLERP provides smooth interpolation between two quaternions along the shortest path on the unit sphere.
 * @param array - The target quaternion array
 * @param ratio - The interpolation ratio (0.0 = this quaternion, 1.0 = target quaternion)
 * @param selfOffsetAsComposition - The composition offset for this quaternion
 * @param argOffsetAsComposition - The composition offset for the target quaternion
 * @returns A new Array4 containing the interpolated quaternion
 */
const qlerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  ratio: number,
  selfOffsetAsComposition: number,
  argOffsetAsComposition: number
) {
  const out = new Array(4);
  let dotProduct =
    this[0 + selfOffsetAsComposition * 4] * array[0 + argOffsetAsComposition * 4] +
    this[1 + selfOffsetAsComposition * 4] * array[1 + argOffsetAsComposition * 4] +
    this[2 + selfOffsetAsComposition * 4] * array[2 + argOffsetAsComposition * 4] +
    this[3 + selfOffsetAsComposition * 4] * array[3 + argOffsetAsComposition * 4];
  const ss = 1.0 - dotProduct * dotProduct;

  if (ss === 0.0) {
    out[0] = this[0 + selfOffsetAsComposition * 4];
    out[1] = this[1 + selfOffsetAsComposition * 4];
    out[2] = this[2 + selfOffsetAsComposition * 4];
    out[3] = this[3 + selfOffsetAsComposition * 4];
  } else {
    if (dotProduct > 1) {
      dotProduct = 0.999;
    } else if (dotProduct < -1) {
      dotProduct = -0.999;
    }

    let theta = Math.acos(dotProduct);
    const sinTheta = Math.sin(theta);

    let s2;
    if (dotProduct < 0.0) {
      dotProduct *= -1;
      theta = Math.acos(dotProduct);
      s2 = (-1 * Math.sin(theta * ratio)) / sinTheta;
    } else {
      s2 = Math.sin(theta * ratio) / sinTheta;
    }
    const s1 = Math.sin(theta * (1.0 - ratio)) / sinTheta;

    out[0] = this[0 + selfOffsetAsComposition * 4] * s1 + array[0 + argOffsetAsComposition * 4] * s2;
    out[1] = this[1 + selfOffsetAsComposition * 4] * s1 + array[1 + argOffsetAsComposition * 4] * s2;
    out[2] = this[2 + selfOffsetAsComposition * 4] * s1 + array[2 + argOffsetAsComposition * 4] * s2;
    out[3] = this[3 + selfOffsetAsComposition * 4] * s1 + array[3 + argOffsetAsComposition * 4] * s2;
  }

  return out;
};

/**
 * Performs scalar linear interpolation at specific offsets
 * @param array - The target scalar array
 * @param ratio - The interpolation ratio (0.0 = this value, 1.0 = target value)
 * @param selfOffset - The offset in this array
 * @param argOffset - The offset in the target array
 * @returns The interpolated scalar value
 */
const scalar_lerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  ratio: number,
  selfOffset: number,
  argOffset: number
) {
  return [this[selfOffset] * (1 - ratio) + array[argOffset] * ratio];
};

/**
 * Performs 2-component vector linear interpolation at specific composition offsets
 * @param array - The target vector array
 * @param ratio - The interpolation ratio (0.0 = this vector, 1.0 = target vector)
 * @param selfOffsetAsComposition - The composition offset for this vector
 * @param argOffsetAsComposition - The composition offset for the target vector
 * @returns A new Array2 containing the interpolated vector
 */
const array2_lerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  ratio: number,
  selfOffsetAsComposition: number,
  argOffsetAsComposition: number
) {
  const ret = new Array(2);
  for (let i = 0; i < 2; i++) {
    ret[i] = this[selfOffsetAsComposition * 2 + i] * (1 - ratio) + array[argOffsetAsComposition * 2 + i] * ratio;
  }
  return ret;
};

/**
 * Performs 3-component vector linear interpolation at specific composition offsets
 * @param array - The target vector array
 * @param ratio - The interpolation ratio (0.0 = this vector, 1.0 = target vector)
 * @param selfOffsetAsComposition - The composition offset for this vector
 * @param argOffsetAsComposition - The composition offset for the target vector
 * @returns A new Array3 containing the interpolated vector
 */
const array3_lerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  ratio: number,
  selfOffsetAsComposition: number,
  argOffsetAsComposition: number
) {
  const ret = new Array(3);
  for (let i = 0; i < 3; i++) {
    ret[i] = this[selfOffsetAsComposition * 3 + i] * (1 - ratio) + array[argOffsetAsComposition * 3 + i] * ratio;
  }
  return ret;
};

/**
 * Performs 4-component vector linear interpolation at specific composition offsets
 * @param array - The target vector array
 * @param ratio - The interpolation ratio (0.0 = this vector, 1.0 = target vector)
 * @param selfOffsetAsComposition - The composition offset for this vector
 * @param argOffsetAsComposition - The composition offset for the target vector
 * @returns A new Array4 containing the interpolated vector
 */
const array4_lerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  ratio: number,
  selfOffsetAsComposition: number,
  argOffsetAsComposition: number
) {
  const ret = new Array(4);
  for (let i = 0; i < 4; i++) {
    ret[i] = this[selfOffsetAsComposition * 4 + i] * (1 - ratio) + array[argOffsetAsComposition * 4 + i] * ratio;
  }
  return ret;
};

/**
 * Performs N-component vector linear interpolation at specific composition offsets
 * @param array - The target vector array
 * @param componentN - The number of components in the vectors
 * @param ratio - The interpolation ratio (0.0 = this vector, 1.0 = target vector)
 * @param selfOffsetAsComposition - The composition offset for this vector
 * @param argOffsetAsComposition - The composition offset for the target vector
 * @returns A new Array containing the interpolated vector
 */
const arrayN_lerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  componentN: number,
  ratio: number,
  selfOffsetAsComposition: number,
  argOffsetAsComposition: number
) {
  const ret = new Array(componentN);
  for (let i = 0; i < componentN; i++) {
    ret[i] =
      this[selfOffsetAsComposition * componentN + i] * (1 - ratio) +
      array[argOffsetAsComposition * componentN + i] * ratio;
  }
  return ret;
};

/**
 * Normalizes a 4-component vector in-place.
 * Divides each component by the vector's magnitude to create a unit vector.
 * @returns The normalized vector (this)
 */
const normalizeArray4_fn = function (this: Array4<number>) {
  const length = Math.hypot(this[0], this[1], this[2], this[3]);
  this[0] /= length;
  this[1] /= length;
  this[2] /= length;
  this[3] /= length;

  return this;
};

const arrayTypes = [
  Array,
  Float32Array,
  Float64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  Uint8Array,
  Uint16Array,
  Uint32Array,
];
const operators = [
  get1_offsetAsComposition,
  get2_offsetAsComposition,
  get1,
  get1_offset,
  get2,
  get2_offset,
  get3,
  get3_offset,
  get3_offsetAsComposition,
  get4,
  get4_offset,
  get4_offsetAsComposition,
  getN_offset,
  getN_offsetAsComposition,
  add2,
  add2_offset,
  add3,
  add3_offset,
  add4,
  add4_offset,
  mulArray3WithScalar_offset,
  mulArray4WithScalar_offset,
  mulArrayNWithScalar_offset,
  mulThatAndThisToOutAsMat44_offsetAsComposition,
  qlerp_offsetAsComposition,
  scalar_lerp_offsetAsComposition,
  array2_lerp_offsetAsComposition,
  array3_lerp_offsetAsComposition,
  array4_lerp_offsetAsComposition,
  arrayN_lerp_offsetAsComposition,
  normalizeArray4,
];
const functions = [
  get1_offsetAsComposition_fn,
  get2_offsetAsComposition_fn,
  get1_fn,
  get1_offset_fn,
  get2_fn,
  get2_offset_fn,
  get3_fn,
  get3_offset_fn,
  get3_offsetAsComposition_fn,
  get4_fn,
  get4_offset_fn,
  get4_offsetAsComposition_fn,
  getN_offset_fn,
  getN_offsetAsComposition_fn,
  add2_fn,
  add2_offset_fn,
  add3_fn,
  add3_offset_fn,
  add4_fn,
  add4_offset_fn,
  mulArray3WithScalar_offset_fn,
  mulArray4WithScalar_offset_fn,
  mulArrayNWithScalar_offset_fn,
  mulThatAndThisToOutAsMat44_offsetAsComposition_fn,
  qlerp_offsetAsComposition_fn,
  scalar_lerp_offsetAsComposition_fn,
  array2_lerp_offsetAsComposition_fn,
  array3_lerp_offsetAsComposition_fn,
  array4_lerp_offsetAsComposition_fn,
  arrayN_lerp_offsetAsComposition_fn,
  normalizeArray4_fn,
];

for (let i = 0; i < arrayTypes.length; i++) {
  for (let j = 0; j < operators.length; j++) {
    arrayTypes[i].prototype[operators[j] as unknown as number] = functions[j];
  }
}
