/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {ArrayType} from '../../../types/CommonTypes';
export const add2 = Symbol();
export const add2_offset = Symbol();
export const add3 = Symbol();
export const add3_offset = Symbol();

declare global {
  interface Extension {
    [add2](this: ArrayType, array: ArrayType): ArrayType;
    [add2_offset](
      this: ArrayType,
      array: ArrayType,
      selfOffset: number,
      argOffset: number
    ): ArrayType;
    [add3](this: ArrayType, array: ArrayType): ArrayType;
    [add3_offset](
      this: ArrayType,
      array: ArrayType,
      selfOffset: number,
      argOffset: number
    ): ArrayType;
  }

  interface Array<T> extends Extension {}
  interface ReadonlyArray<T> extends Extension {}
  interface Float32Array extends Extension {}
}

const add2_fn = function (array: number[]) {
  this[0] += array[0];
  this[1] += array[1];

  return this;
};

const add2_offset_fn = function (
  array: number[],
  selfOffset: number,
  argOffset: number
) {
  this[selfOffset] += array[argOffset];
  this[selfOffset + 1] += array[argOffset + 1];

  return this;
};

const add3_fn = function (array: number[]) {
  this[0] += array[0];
  this[1] += array[1];
  this[2] += array[2];

  return this;
};

const add3_offset_fn = function (
  array: number[],
  selfOffset: number,
  argOffset: number
) {
  this[selfOffset] += array[argOffset];
  this[selfOffset + 1] += array[argOffset + 1];
  this[selfOffset + 2] += array[argOffset + 2];

  return this;
};

Array.prototype[add2] = add2_fn;
Array.prototype[add2_offset] = add2_offset_fn;
Array.prototype[add3] = add3_fn;
Array.prototype[add3_offset] = add3_offset_fn;

Float32Array.prototype[add2] = add2_fn;
Float32Array.prototype[add2_offset] = add2_offset_fn;
Float32Array.prototype[add3] = add3_fn;
Float32Array.prototype[add3_offset] = add3_offset_fn;

const s = [1, 2, 3];
const ss = s[add3]([1, 2, 3]);
const sss = s[add3_offset]([1, 2, 3], 0, 0);

console.log(s);
console.log(ss);
