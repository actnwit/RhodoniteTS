import { TypedArray } from "../../commontypes/CommonTypes";

export interface IVector {
  readonly v: TypedArray;
  readonly className: string;
  // toString(): string;
  // toStringApproximately(): string;
  // flattenAsArray(): Array<number>;
  // isDummy(): boolean;
  // isEqual(vec: IVector, delta: number): boolean;
  // isStrictEqual(vec: IVector): boolean;
  // at(i: number): number;
  // length(): number;
  // lengthSquared(): number;
  // lengthTo(vec: IVector): number;
  // dot(vec: IVector): number;
  // clone(): IVector;
}

export interface IMutableVector {
  v: TypedArray;
  readonly className: string;

  // clone(): IMutableVector;
  // raw(): TypedArray;
  // setAt(row_i: number, column_i: number, val: number): IMutableVector;
  // setComponents(...num: number[]): IMutableVector;
  // copyComponents(vec: any): IMutableVector;
  // zero(): IMutableVector;
  // one(): IMutableVector;
  // normalize(): IMutableVector;
  // add(vec: any): IMutableVector;
  // subtract(vec: any): IMutableVector;
  // multiply(val: number): IMutableVector;
  // multiplyVector(vec: any): IMutableVector;
  // divide(val: number): IMutableVector;
  // divideVector(vec: any): IMutableVector;
}

export interface IScalar {
  readonly x: number;
}

export interface IVector2 {
  readonly v: TypedArray;
  readonly className: string;

  readonly x: number;
  readonly y: number;

  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector2, delta: number): boolean;
  isStrictEqual(vec: IVector2): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector2): number;
  dot(vec: IVector2): number;
  clone(): IVector2;
}

export interface IMutableVector2 {
  v: TypedArray;
  readonly className: string;

  x: number;
  y: number;

  // common with immutable vector2
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector2, delta: number): boolean;
  isStrictEqual(vec: IVector2): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector2): number;
  dot(vec: IVector2): number;
  clone(): IVector2;

  // only for mutable vector2
  raw(): TypedArray;
  setAt(row_i: number, column_i: number, val: number): IMutableVector2;
  setComponents(x: number, y: number): IMutableVector2;
  copyComponents(vec: IVector2): IMutableVector2;
  zero(): IMutableVector2;
  one(): IMutableVector2;
  normalize(): IMutableVector2;
  add(vec: IVector2): IMutableVector2;
  subtract(vec: IVector2): IMutableVector2;
  multiply(val: number): IMutableVector2;
  multiplyVector(vec: IVector2): IMutableVector2;
  divide(val: number): IMutableVector2;
  divideVector(vec: IVector2): IMutableVector2;
}

export interface IVector3 {
  readonly v: TypedArray;
  readonly className: string;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface IMutableVector3 {
  v: TypedArray;
  readonly className: string;

  x: number;
  y: number;
  z: number;
}

export interface IVector4 {
  readonly v: TypedArray;
  readonly className: string;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
  length(): number;
}

export interface IMutableVector4 {
  v: TypedArray;
  readonly className: string;

  x: number;
  y: number;
  z: number;
  w: number;
}
