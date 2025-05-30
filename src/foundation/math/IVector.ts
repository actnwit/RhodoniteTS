import { TypedArray } from '../../types/CommonTypes';
import { IQuaternion } from './IQuaternion';

export interface IVector {
  readonly x: number;
  readonly _v: TypedArray;
  readonly className: string;
  readonly bytesPerComponent: number;
  readonly glslStrAsFloat: string;
  readonly glslStrAsInt: string;
  readonly wgslStrAsFloat: string;
  readonly wgslStrAsInt: string;
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector, delta?: number): boolean;
  isStrictEqual(vec: IVector): boolean;
  at(i: number): number;
  v(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector): number;
  dot(vec: IVector): number;
  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}

export interface IMutableVector extends IVector {
  _v: TypedArray;
  readonly className: string;

  raw(): TypedArray;
  setAt(i: number, value: number): IMutableVector;
  setComponents(...num: number[]): IMutableVector;
  copyComponents(vec: any): IMutableVector;
  zero(): IMutableVector;
  one(): IMutableVector;
  normalize(): IMutableVector;
  add(vec: any): IMutableVector;
  subtract(vec: any): IMutableVector;
  multiply(value: number): IMutableVector;
  multiplyVector(vec: any): IMutableVector;
  divide(value: number): IMutableVector;
  divideVector(vec: any): IMutableVector;
}

export interface IScalar extends IVector {
  _v: TypedArray;
  readonly x: number;
}
export interface IMutableScalar extends IMutableVector {
  readonly x: number;
}

export interface IVector2 extends IVector {
  readonly className: string;

  readonly x: number;
  readonly y: number;

  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector2, delta?: number): boolean;
  isStrictEqual(vec: IVector2): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector2): number;
  dot(vec: IVector2): number;
  clone(): IVector2;
}

export interface IMutableVector2 extends IMutableVector {
  readonly className: string;

  x: number;
  y: number;

  // common with immutable vector2
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector2, delta?: number): boolean;
  isStrictEqual(vec: IVector2): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector2): number;
  dot(vec: IVector2): number;
  clone(): IMutableVector2;

  // only for mutable vector2
  raw(): TypedArray;
  setAt(i: number, value: number): IMutableVector2;
  setComponents(x: number, y: number): IMutableVector2;
  copyComponents(vec: IVector2): IMutableVector2;
  zero(): IMutableVector2;
  one(): IMutableVector2;
  normalize(): IMutableVector2;
  add(vec: IVector2): IMutableVector2;
  subtract(vec: IVector2): IMutableVector2;
  multiply(value: number): IMutableVector2;
  multiplyVector(vec: IVector2): IMutableVector2;
  divide(value: number): IMutableVector2;
  divideVector(vec: IVector2): IMutableVector2;
}

export interface IVector3 extends IVector {
  readonly className: string;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;

  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector3, delta?: number): boolean;
  isStrictEqual(vec: IVector3): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector3): number;
  dot(vec: IVector3): number;
  clone(): IVector3;
}

export interface IMutableVector3 extends IMutableVector {
  readonly className: string;

  x: number;
  y: number;
  z: number;
  readonly w: number;

  // common with immutable vector3
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector3, delta?: number): boolean;
  isStrictEqual(vec: IVector3): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector3): number;
  dot(vec: IVector3): number;
  clone(): IMutableVector3;

  // only for mutable vector3
  raw(): TypedArray;
  setAt(i: number, value: number): IMutableVector3;
  setComponents(x: number, y: number, z: number): IMutableVector3;
  copyComponents(vec: IVector3): IMutableVector3;
  zero(): IMutableVector3;
  one(): IMutableVector3;
  normalize(): IMutableVector3;
  add(vec: IVector3): IMutableVector3;
  subtract(vec: IVector3): IMutableVector3;
  multiply(value: number): IMutableVector3;
  multiplyVector(vec: IVector3): IMutableVector3;
  divide(value: number): IMutableVector3;
  divideVector(vec: IVector3): IMutableVector3;
  cross(vec: IVector3): IMutableVector3;
  multiplyQuaternion(quat: IQuaternion): IMutableVector3;
}

export interface IVector4 extends IVector {
  readonly className: string;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;

  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector4, delta?: number): boolean;
  isStrictEqual(vec: IVector4): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector4): number;
  dot(vec: IVector4): number;
  clone(): IVector4;
}

export interface IMutableVector4 extends IMutableVector {
  readonly className: string;

  x: number;
  y: number;
  z: number;
  w: number;

  // common with immutable vector3
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IVector4, delta?: number): boolean;
  isStrictEqual(vec: IVector4): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  lengthTo(vec: IVector4): number;
  dot(vec: IVector4): number;
  clone(): IMutableVector4;

  // only for mutable vector3
  raw(): TypedArray;
  setAt(i: number, value: number): IMutableVector4;
  setComponents(x: number, y: number, z: number, w: number): IMutableVector4;
  copyComponents(vec: IVector4): IMutableVector4;
  zero(): IMutableVector4;
  one(): IMutableVector4;
  normalize(): IMutableVector4;
  normalize3(): IMutableVector4;
  add(vec: IVector4): IMutableVector4;
  subtract(vec: IVector4): IMutableVector4;
  multiply(value: number): IMutableVector4;
  multiplyVector(vec: IVector4): IMutableVector4;
  divide(value: number): IMutableVector4;
  divideVector(vec: IVector4): IMutableVector4;
}
