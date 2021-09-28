/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {ArrayType} from '../../../types/CommonTypes';
export const add2 = Symbol();
export const add2_offset = Symbol();
export const add3 = Symbol();
export const add3_offset = Symbol();
export const add4 = Symbol();
export const add4_offset = Symbol();

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
    [add4](this: ArrayType, array: ArrayType): ArrayType;
    [add4_offset](
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

const add2_fn = function (this: ArrayType, array: ArrayType) {
  this[0] += array[0];
  this[1] += array[1];

  return this;
};

const add2_offset_fn = function (
  this: ArrayType,
  array: ArrayType,
  selfOffset: number,
  argOffset: number
) {
  this[selfOffset] += array[argOffset];
  this[selfOffset + 1] += array[argOffset + 1];

  return this;
};

const add3_fn = function (this: ArrayType, array: ArrayType) {
  this[0] += array[0];
  this[1] += array[1];
  this[2] += array[2];

  return this;
};

const add3_offset_fn = function (
  this: ArrayType,
  array: ArrayType,
  selfOffset: number,
  argOffset: number
) {
  this[selfOffset] += array[argOffset];
  this[selfOffset + 1] += array[argOffset + 1];
  this[selfOffset + 2] += array[argOffset + 2];

  return this;
};

const add4_fn = function (this: ArrayType, array: ArrayType) {
  this[0] += array[0];
  this[1] += array[1];
  this[2] += array[2];
  this[3] += array[3];

  return this;
};

const add4_offset_fn = function (
  this: ArrayType,
  array: ArrayType,
  selfOffset: number,
  argOffset: number
) {
  this[selfOffset] += array[argOffset];
  this[selfOffset + 1] += array[argOffset + 1];
  this[selfOffset + 2] += array[argOffset + 2];
  this[selfOffset + 3] += array[argOffset + 3];

  return this;
};

const arrayTypes = [Array, Float32Array, Float64Array];
const operators = [add2, add2_offset, add3, add3_offset, add4, add4_offset];
const functions = [
  add2_fn,
  add2_offset_fn,
  add3_fn,
  add3_offset_fn,
  add4_fn,
  add4_offset_fn,
];

for (let i = 0; i < arrayTypes.length; i++) {
  for (let j = 0; j < operators.length; j++) {
    arrayTypes[i].prototype[operators[j] as unknown as number] = functions[j];
  }
}
