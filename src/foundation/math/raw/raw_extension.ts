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
export const get3 = Symbol('get3');
export const get3_offset = Symbol('get3_offset');
export const get3_offsetAsComposition = Symbol('get3_offsetAsComposition');
export const get4 = Symbol('get4');
export const get4_offset = Symbol('get4_offset');
export const get4_offsetAsComposition = Symbol('get4_offsetAsComposition');
export const getN_offset = Symbol('getN_offset');
export const getN_offsetAsComposition = Symbol('getN_offsetAsComposition');
export const add2 = Symbol('add2');
export const add2_offset = Symbol('add2_offset');
export const add3 = Symbol('add3');
export const add3_offset = Symbol('add3_offset');
export const add4 = Symbol('add4');
export const mulArray3WithScalar_offset = Symbol('mulArray3WithScalar_offset');
export const mulArray4WithScalar_offset = Symbol('mulArray4WithScalar_offset');
export const mulArrayNWithScalar_offset = Symbol('mulArrayNWithScalar_offset');
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
export const normalizeArray4 = Symbol('normalizeArray4');

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
    [get3](this: ArrayType): Array3<number>;
    [get3_offset](this: ArrayType, offset: number): Array3<number>;
    [get3_offsetAsComposition](
      this: ArrayType,
      offsetAsComposition: number
    ): Array3<number>;
    [get4](this: ArrayType): Array4<number>;
    [get4_offset](this: ArrayType, offset: number): Array4<number>;
    [get4_offsetAsComposition](
      this: ArrayType,
      offsetAsComposition: number
    ): Array4<number>;
    [getN_offset](
      this: ArrayType,
      offsetAsComposition: number,
      componentN: number
    ): Array<number>;
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
    [mulArray3WithScalar_offset](
      this: ArrayType,
      offset: number,
      value: number
    ): Array4<number>;
    [mulArray4WithScalar_offset](
      this: ArrayType,
      offset: number,
      value: number
    ): Array4<number>;
    [mulArrayNWithScalar_offset](
      this: ArrayType,
      offset: number,
      componentN: number,
      value: number
    ): Array4<number>;
    [qlerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      ratio: number,
      selfOffsetAsComposition: number,
      argOffsetAsComposition: number
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
      selfOffsetAsComposition: number,
      argOffsetAsComposition: number
    ): Array3<number>;
    [arrayN_lerp_offsetAsComposition](
      this: ArrayType,
      array: ArrayType,
      componentN: number,
      ratio: number,
      selfOffsetAsComposition: number,
      argOffsetAsComposition: number
    ): Array<number>;
    [normalizeArray4](this: Array4<number>): Array4<number>;
  }

  interface Array<T> extends Extension {}
  // interface Array2<T> extends Extension {}
  // interface Array3<T> extends Extension {}
  // interface Array4<T> extends Extension {}
  interface ReadonlyArray<T> extends Extension {}
  interface Float32Array extends Extension {}
}

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

const get3_fn = function (this: ArrayType): Array3<number> {
  return [this[0], this[1], this[2]];
};

const get3_offset_fn = function (
  this: ArrayType,
  offset: number
): Array3<number> {
  return [this[offset], this[offset + 1], this[offset + 2]];
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

const get4_fn = function (this: ArrayType): Array4<number> {
  return [this[0], this[1], this[2], this[3]];
};

const get4_offset_fn = function (
  this: ArrayType,
  offset: number
): Array4<number> {
  return [this[offset], this[offset + 1], this[offset + 2], this[offset + 3]];
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

const getN_offset_fn = function (
  this: ArrayType,
  offset: number,
  componentN: number
): Array<number> {
  const array = new Array(componentN) as unknown as Array<number>;
  for (let i = 0; i < componentN; i++) {
    array[i] = this[offset + i];
  }
  return array;
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

const mulArray3WithScalar_offset_fn = function (
  this: ArrayType,
  offset: number,
  value: number
) {
  this[offset] *= value;
  this[offset + 1] *= value;
  this[offset + 2] *= value;

  return this;
};

const mulArray4WithScalar_offset_fn = function (
  this: ArrayType,
  offset: number,
  value: number
) {
  this[offset] *= value;
  this[offset + 1] *= value;
  this[offset + 2] *= value;
  this[offset + 3] *= value;

  return this;
};

const mulArrayNWithScalar_offset_fn = function (
  this: ArrayType,
  offset: number,
  componentN: number,
  value: number
) {
  for (let i = 0; i < componentN; i++) {
    this[offset + i] *= value;
  }

  return this;
};

const qlerp_offsetAsComposition_fn = function (
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
      array[0 + argOffsetAsComposition * 4] * s2;
    out[1] =
      this[1 + selfOffsetAsComposition * 4] * s1 +
      array[1 + argOffsetAsComposition * 4] * s2;
    out[2] =
      this[2 + selfOffsetAsComposition * 4] * s1 +
      array[2 + argOffsetAsComposition * 4] * s2;
    out[3] =
      this[3 + selfOffsetAsComposition * 4] * s1 +
      array[3 + argOffsetAsComposition * 4] * s2;
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
  selfOffsetAsComposition: number,
  argOffsetAsComposition: number
) {
  const ret = new Array(3);
  for (let i = 0; i < 3; i++) {
    ret[i] =
      this[selfOffsetAsComposition * 3 + i] * (1 - ratio) +
      array[argOffsetAsComposition * 3 + i] * ratio;
  }
  return ret;
};

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
  qlerp_offsetAsComposition,
  scalar_lerp_offsetAsComposition,
  array3_lerp_offsetAsComposition,
  arrayN_lerp_offsetAsComposition,
  normalizeArray4,
];
const functions = [
  get1_offsetAsComposition_fn,
  get2_offsetAsComposition_fn,
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
  qlerp_offsetAsComposition_fn,
  scalar_lerp_offsetAsComposition_fn,
  array3_lerp_offsetAsComposition_fn,
  arrayN_lerp_offsetAsComposition_fn,
  normalizeArray4_fn,
];

for (let i = 0; i < arrayTypes.length; i++) {
  for (let j = 0; j < operators.length; j++) {
    arrayTypes[i].prototype[operators[j] as unknown as number] = functions[j];
  }
}
