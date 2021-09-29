/* eslint-disable @typescript-eslint/no-empty-interface */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  Array1,
  Array2,
  Array3,
  Array4,
  ArrayType,
} from '../../../types/CommonTypes';
export const get1_offsetAsComposition = Symbol('get1_offsetAsComposition');
export const get2_offsetAsComposition = Symbol('get2_offsetAsComposition');
export const get3_offsetAsComposition = Symbol('get3_offsetAsComposition');
export const get4_offsetAsComposition = Symbol('get4_offsetAsComposition');
export const getN_offsetAsComposition = Symbol('getN_offsetAsComposition');
export const add2 = Symbol('add2');
export const add2_offset = Symbol('add2_offset');
export const add3 = Symbol('add3');
export const add3_offset = Symbol('add3_offset');
export const add4 = Symbol('add4');
export const add4_offset = Symbol('add4_offset');
export const qlerp_offsetAsComposition = Symbol('qlerp_offsetAsComposition');
export const scalar_lerp_offsetAsComposition = Symbol(
  'scalar_lerp_offsetAsComposition'
);
export const array3_lerp_offsetAsComposition = Symbol(
  'array3_lerp_offsetAsComposition'
);
export const arrayN_lerp_offsetAsComposition = Symbol(
  'arrayN_lerp_offsetAsComposition'
);

declare global {
  interface Extension {
    [get1_offsetAsComposition](
      this: ArrayType,
      offsetAsComposition: number
    ): Array1<number>;
    [get2_offsetAsComposition](
      this: ArrayType,
      offsetAsComposition: number
    ): Array2<number>;
    [get3_offsetAsComposition](
      this: ArrayType,
      offsetAsComposition: number
    ): Array3<number>;
    [get4_offsetAsComposition](
      this: ArrayType,
      offsetAsComposition: number
    ): Array4<number>;
    [getN_offsetAsComposition](
      this: ArrayType,
      offsetAsComposition: number,
      componentN: number
    ): Array<number>;
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
    [qlerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffset: number,
      argOffset: number
    ): Array4<number>;
    [scalar_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffset: number,
      argOffset: number
    ): number;
    [array3_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffset: number,
      argOffset: number
    ): Array3<number>;
    [arrayN_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      componentN: number,
      ratio: number,
      selfOffset: number,
      argOffset: number
    ): Array<number>;
  }

  interface Array<T> extends Extension {}
  interface ReadonlyArray<T> extends Extension {}
  interface Float32Array extends Extension {}
}
// interface Array<T> extends Extension {}
// interface ReadonlyArray<T> extends Extension {}
// interface Float32Array extends Extension {}

const get1_offsetAsComposition_fn = function (
  this: ArrayType,
  offsetAsComposition: number
): Array1<number> {
  return [this[offsetAsComposition]];
};

const get2_offsetAsComposition_fn = function (
  this: ArrayType,
  offsetAsComposition: number
): Array2<number> {
  return [this[offsetAsComposition * 2], this[offsetAsComposition * 2 + 1]];
};

const get3_offsetAsComposition_fn = function (
  this: ArrayType,
  offsetAsComposition: number
): Array3<number> {
  return [
    this[offsetAsComposition * 3],
    this[offsetAsComposition * 3 + 1],
    this[offsetAsComposition * 3 + 2],
  ];
};

const get4_offsetAsComposition_fn = function (
  this: ArrayType,
  offsetAsComposition: number
): Array4<number> {
  return [
    this[offsetAsComposition * 4],
    this[offsetAsComposition * 4 + 1],
    this[offsetAsComposition * 4 + 2],
    this[offsetAsComposition * 4 + 3],
  ];
};

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

const qlerp_offsetAsComposition_to_fn = function (
  this: ArrayType,
  array: ArrayType,
  ratio: number,
  selfOffsetAsComposition: number,
  argOffsetAsComposition: number
) {
  const out = new Array(4);
  let dotProduct =
    this[0 + selfOffsetAsComposition * 4] *
      array[0 + argOffsetAsComposition * 4] +
    this[1 + selfOffsetAsComposition * 4] *
      array[1 + argOffsetAsComposition * 4] +
    this[2 + selfOffsetAsComposition * 4] *
      array[2 + argOffsetAsComposition * 4] +
    this[3 + selfOffsetAsComposition * 4] *
      array[3 + argOffsetAsComposition * 4];
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

    out[0] =
      this[0 + selfOffsetAsComposition * 4] * s1 +
      array[0 + selfOffsetAsComposition * 4] * s2;
    out[1] =
      this[1 + selfOffsetAsComposition * 4] * s1 +
      array[1 + selfOffsetAsComposition * 4] * s2;
    out[2] =
      this[2 + selfOffsetAsComposition * 4] * s1 +
      array[2 + selfOffsetAsComposition * 4] * s2;
    out[3] =
      this[3 + selfOffsetAsComposition * 4] * s1 +
      array[3 + selfOffsetAsComposition * 4] * s2;
  }

  return out;
};

const scalar_lerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  ratio: number,
  selfOffset: number,
  argOffset: number
) {
  return this[selfOffset] * (1 - ratio) + array[argOffset] * ratio;
};

const array3_lerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  ratio: number,
  selfOffset: number,
  argOffset: number
) {
  const ret = new Array(3);
  for (let i = 0; i < 3; i++) {
    ret[i] = this[selfOffset] * (1 - ratio) + array[argOffset] * ratio;
  }
  return ret;
};

const arrayN_lerp_offsetAsComposition_fn = function (
  this: ArrayType,
  array: ArrayType,
  componentN: number,
  ratio: number,
  selfOffset: number,
  argOffset: number
) {
  const ret = new Array(componentN);
  for (let i = 0; i < componentN; i++) {
    ret[i] = this[selfOffset] * (1 - ratio) + array[argOffset] * ratio;
  }
  return ret;
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
  get3_offsetAsComposition,
  get4_offsetAsComposition,
  getN_offsetAsComposition,
  add2,
  add2_offset,
  add3,
  add3_offset,
  add4,
  add4_offset,
  qlerp_offsetAsComposition,
  scalar_lerp_offsetAsComposition,
  array3_lerp_offsetAsComposition,
  arrayN_lerp_offsetAsComposition,
];
const functions = [
  get1_offsetAsComposition_fn,
  get2_offsetAsComposition_fn,
  get3_offsetAsComposition_fn,
  get4_offsetAsComposition_fn,
  getN_offsetAsComposition_fn,
  add2_fn,
  add2_offset_fn,
  add3_fn,
  add3_offset_fn,
  add4_fn,
  add4_offset_fn,
  qlerp_offsetAsComposition_to_fn,
  scalar_lerp_offsetAsComposition_fn,
  array3_lerp_offsetAsComposition_fn,
  arrayN_lerp_offsetAsComposition_fn,
];

for (let i = 0; i < arrayTypes.length; i++) {
  for (let j = 0; j < operators.length; j++) {
    arrayTypes[i].prototype[operators[j] as unknown as number] = functions[j];
  }
}
