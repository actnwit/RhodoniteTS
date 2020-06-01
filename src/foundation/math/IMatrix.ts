import { IVector, IVector2, IMutableVector2, IMutableVector } from "./IVector";
import { TypedArray, Index } from "../../commontypes/CommonTypes";

export interface IMatrix {
  readonly className: string;
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(mat: IMatrix, delta: number): boolean;

  // ---Add following methods later---
  // isStrictEqual(mat: IMatrix): boolean;
  // at(row_i: number, column_i: number): number;
  // clone(): IMatrix;
  // determinant(): number;
  // multiplyVector(vec: IVector): IVector;
  // multiplyVectorTo(vec: IVector, outVec: IMutableVector): IMutableVector;
  // getScale(): IVector;
  // getScaleTo(outVec: IMutableVector): IMutableVector;
}

export interface IMutableMatrix {

  // ---Add following methods later---
  // raw(): TypedArray;
  // setAt(row_i: number, column_i: number, val: number): void;
  // setComponents(...num: number[]): IMutableMatrix;
  // copyComponents(mat: IMatrix): IMutableMatrix;
  // zero(): IMutableMatrix;
  // identity(): IMutableMatrix;
  _swap(l: Index, r: Index): void;
  // transpose(): IMutableMatrix;
  // invert(): IMutableMatrix;
  // rotate(radian: number): IMutableMatrix;
  // scale(vec: IVector): IMutableMatrix;
  // putScale(vec: IVector): IMutableMatrix;
  // multiply(mat: IMatrix): IMutableMatrix;
  // multiplyByLeft(mat: IMatrix): IMutableMatrix;
}

export interface IMatrix22 {
  readonly m00: number;
  readonly m01: number;
  readonly m10: number;
  readonly m11: number;
  readonly className: string;
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(mat: IMatrix22, delta: number): boolean;
  isStrictEqual(mat: IMatrix22): boolean;
  clone(): IMatrix22;
  determinant(): number;
  multiplyVector(vec: IVector2): IVector2;
  multiplyVectorTo(vec: IVector2, outVec: IMutableVector2): IMutableVector2;
  getScale(): IVector2;
  getScaleTo(outVec: IMutableVector2): IMutableVector2
}

export interface IMutableMatrix22 {
  m00: number;
  m01: number;
  m10: number;
  m11: number;
  raw(): TypedArray;
  setComponents(...num: number[]): IMutableMatrix22;
  copyComponents(mat: IMatrix22 | IMatrix33 | IMatrix44): IMutableMatrix22;
  zero(): IMutableMatrix22;
  identity(): IMutableMatrix22;
  _swap(l: Index, r: Index): void;
  transpose(): IMutableMatrix22;
  invert(): IMutableMatrix22;
  rotate(radian: number): IMutableMatrix22;
  scale(vec: IVector2): IMutableMatrix22;
  putScale(vec: IVector2): IMutableMatrix22;
  multiply(mat: IMatrix22): IMutableMatrix22;
  multiplyByLeft(mat: IMatrix22): IMutableMatrix22;
}

export interface IMatrix33 {
  readonly m00: number;
  readonly m01: number;
  readonly m02: number;
  readonly m10: number;
  readonly m11: number;
  readonly m12: number;
  readonly m20: number;
  readonly m21: number;
  readonly m22: number;
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
}

export interface IMatrix44 {
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
}

export interface IMutableMatrix44 {
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
}

