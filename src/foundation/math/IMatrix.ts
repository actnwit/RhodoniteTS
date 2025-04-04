import {
  IVector,
  IVector2,
  IMutableVector2,
  IVector3,
  IMutableVector3,
  IVector4,
  IMutableVector4,
} from './IVector';
import { TypedArray, Index } from '../../types/CommonTypes';
import { IQuaternion } from './IQuaternion';

export interface IMatrix {
  _v: Float32Array;
  readonly className: string;
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  at(row_i: number, column_i: number): number;
  v(i: number): number;
  determinant(): number;
  readonly isIdentityMatrixClass: boolean;
  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}

export interface IMutableMatrix extends IMatrix {
  clone(): IMutableMatrix;
  raw(): TypedArray;
  setAt(row_i: number, column_i: number, value: number): void;
  setComponents(...num: number[]): IMutableMatrix;
  copyComponents(mat: IMatrix): IMutableMatrix;
  zero(): IMutableMatrix;
  identity(): IMutableMatrix;
  _swap(l: Index, r: Index): void;
  transpose(): IMutableMatrix;
  invert(): IMutableMatrix;
  rotate(any: any): IMutableMatrix;
  scale(vec: IVector): IMutableMatrix;
  multiplyScale(vec: IVector): IMutableMatrix;
  multiply(mat: IMatrix): IMutableMatrix;
  multiplyByLeft(mat: IMatrix): IMutableMatrix;
}

export interface IMatrix22 extends IMatrix {
  readonly m00: number;
  readonly m01: number;
  readonly m10: number;
  readonly m11: number;
  isEqual(mat: IMatrix22, delta?: number): boolean;
  isStrictEqual(mat: IMatrix22): boolean;
  determinant(): number;
  multiplyVector(vec: IVector2): IVector2;
  multiplyVectorTo(vec: IVector2, outVec: IMutableVector2): IMutableVector2;
  getScale(): IVector2;
  getScaleTo(outVec: IMutableVector2): IMutableVector2;
  clone(): IMatrix22;
}

export interface IMutableMatrix22 {
  m00: number;
  m01: number;
  m10: number;
  m11: number;

  // common with immutable matrix22
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(mat: IMatrix22, delta?: number): boolean;
  isStrictEqual(mat: IMatrix22): boolean;
  at(row_i: number, column_i: number): number;
  determinant(): number;
  multiplyVector(vec: IVector2): IVector2;
  multiplyVectorTo(vec: IVector2, outVec: IMutableVector2): IMutableVector2;
  getScale(): IVector2;
  getScaleTo(outVec: IMutableVector2): IMutableVector2;

  // only for mutable matrix22
  clone(): IMutableMatrix22; // override
  raw(): TypedArray;
  setAt(row_i: number, column_i: number, value: number): IMutableMatrix22;
  setComponents(m00: number, m01: number, m10: number, m11: number): IMutableMatrix22;
  copyComponents(mat: IMatrix22 | IMatrix33 | IMatrix44): IMutableMatrix22;
  zero(): IMutableMatrix22;
  identity(): IMutableMatrix22;
  _swap(l: Index, r: Index): void;
  transpose(): IMutableMatrix22;
  invert(): IMutableMatrix22;
  rotate(radian: number): IMutableMatrix22;
  scale(vec: IVector2): IMutableMatrix22;
  multiplyScale(vec: IVector2): IMutableMatrix22;
  multiply(mat: IMatrix22): IMutableMatrix22;
  multiplyByLeft(mat: IMatrix22): IMutableMatrix22;
}

export interface IMatrix33 extends IMatrix {
  readonly m00: number;
  readonly m01: number;
  readonly m02: number;
  readonly m10: number;
  readonly m11: number;
  readonly m12: number;
  readonly m20: number;
  readonly m21: number;
  readonly m22: number;
  isEqual(mat: IMatrix33, delta?: number): boolean;
  isStrictEqual(mat: IMatrix33): boolean;
  clone(): IMatrix33;
}

export interface IMutableMatrix33 {
  m00: number;
  m01: number;
  m02: number;
  m10: number;
  m11: number;
  m12: number;
  m20: number;
  m21: number;
  m22: number;

  // common with immutable matrix33
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(mat: IMatrix33, delta?: number): boolean;
  isStrictEqual(mat: IMatrix33): boolean;
  at(row_i: number, column_i: number): number;
  determinant(): number;
  multiplyVector(vec: IVector3): IVector3;
  multiplyVectorTo(vec: IVector3, outVec: IMutableVector3): IMutableVector3;
  getScale(): IVector3;
  getScaleTo(outVec: IMutableVector3): IMutableVector3;

  // only for mutable matrix33
  clone(): IMutableMatrix33; // override
  raw(): TypedArray;
  setAt(row_i: number, column_i: number, value: number): IMutableMatrix33;
  setComponents(
    m00: number,
    m01: number,
    m02: number,
    m10: number,
    m11: number,
    m12: number,
    m20: number,
    m21: number,
    m22: number
  ): IMutableMatrix33;
  copyComponents(mat: IMatrix33 | IMatrix44): IMutableMatrix33;
  zero(): IMutableMatrix33;
  identity(): IMutableMatrix33;
  _swap(l: Index, r: Index): void;
  transpose(): IMutableMatrix33;
  invert(): IMutableMatrix33;
  rotateX(radian: number): IMutableMatrix33;
  rotateY(radian: number): IMutableMatrix33;
  rotateZ(radian: number): IMutableMatrix33;
  rotateXYZ(x: number, y: number, z: number): IMutableMatrix33;
  rotate(vec3: IVector3): IMutableMatrix33;
  scale(vec: IVector3): IMutableMatrix33;
  multiplyScale(vec: IVector3): IMutableMatrix33;
  multiply(mat: IMatrix33): IMutableMatrix33;
  multiplyByLeft(mat: IMatrix33): IMutableMatrix33;
}

export interface IMatrix44 extends IMatrix {
  readonly m00: number;
  readonly m01: number;
  readonly m02: number;
  readonly m03: number;
  readonly m10: number;
  readonly m11: number;
  readonly m12: number;
  readonly m13: number;
  readonly m20: number;
  readonly m21: number;
  readonly m22: number;
  readonly m23: number;
  readonly m30: number;
  readonly m31: number;
  readonly m32: number;
  readonly m33: number;
  readonly translateX: number;
  readonly translateY: number;
  readonly translateZ: number;
  at(row_i: number, column_i: number): number;
  clone(): IMatrix44;
  getRotate(): IMatrix44;
  getTranslate(): IVector3;
  getScale(): IVector3;
  multiplyVector3(vec: IVector3): IVector3;
  multiplyVector(vec: IVector4): IVector4;
}

export interface IMutableMatrix44 extends IMatrix {
  m00: number;
  m01: number;
  m02: number;
  m03: number;
  m10: number;
  m11: number;
  m12: number;
  m13: number;
  m20: number;
  m21: number;
  m22: number;
  m23: number;
  m30: number;
  m31: number;
  m32: number;
  m33: number;
  translateX: number;
  translateY: number;
  translateZ: number;

  // common with immutable matrix33
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(mat: IMatrix44, delta?: number): boolean;
  isStrictEqual(mat: IMatrix44): boolean;
  at(row_i: number, column_i: number): number;
  determinant(): number;
  multiplyVector(vec: IVector4): IVector4;
  multiplyVectorTo(vec: IVector4, outVec: IMutableVector4): IMutableVector4;
  multiplyVectorToVec3(vec: IVector4, outVec: IMutableVector3): IMutableVector3;
  multiplyVector3(vec: IVector3): IVector3;
  multiplyVector3To(vec: IVector3, outVec: IMutableVector3): IMutableVector3;
  getTranslate(): IVector3;
  getTranslateTo(outVec: IMutableVector3): IMutableVector3;
  getScale(): IVector4;
  getScaleTo(outVec: IMutableVector3): IMutableVector3;
  toEulerAngles(): IVector3;
  toEulerAnglesTo(outVec3: IMutableVector3): IMutableVector3;

  // only for mutable matrix44
  clone(): IMutableMatrix44; // override
  getRotate(): IMutableMatrix44; // override
  raw(): TypedArray;
  setAt(row_i: number, column_i: number, value: number): IMutableMatrix44;
  setComponents(
    m00: number,
    m01: number,
    m02: number,
    m03: number,
    m10: number,
    m11: number,
    m12: number,
    m13: number,
    m20: number,
    m21: number,
    m22: number,
    m23: number,
    m30: number,
    m31: number,
    m32: number,
    m33: number
  ): IMutableMatrix44;
  copyComponents(mat: IMatrix44): IMutableMatrix44;
  zero(): IMutableMatrix44;
  identity(): IMutableMatrix44;
  _swap(l: Index, r: Index): void;
  transpose(): IMutableMatrix44;
  invert(): IMutableMatrix44;
  translate(vec: IVector3): IMutableMatrix44;
  putTranslate(vec: IVector3): IMutableMatrix44;
  addTranslate(vec: IVector3): IMutableMatrix44;
  rotateX(radian: number): IMutableMatrix44;
  rotateY(radian: number): IMutableMatrix44;
  rotateZ(radian: number): IMutableMatrix44;
  rotateXYZ(x: number, y: number, z: number): IMutableMatrix44;
  rotate(vec3: IVector3): IMutableMatrix44;
  scale(vec: IVector3): IMutableMatrix44;
  multiplyScale(vec: IVector3): IMutableMatrix44;
  multiply(mat: IMatrix44): IMutableMatrix44;
  multiplyByLeft(mat: IMatrix44): IMutableMatrix44;
  fromQuaternion(quat: IQuaternion): IMutableMatrix44;
}
