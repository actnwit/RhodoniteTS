import {TypedArray} from '../../types/CommonTypes';
import {IVector3, IMutableVector3} from './IVector';
import {IMatrix44} from './IMatrix';

export interface IQuaternion {
  readonly className: string;
  _v: Float32Array;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;

  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IQuaternion, delta?: number): boolean;
  isStrictEqual(vec: IQuaternion): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  dot(vec: IQuaternion): number;
  toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
  clone(): IQuaternion;
}

export interface IMutableQuaternion extends IQuaternion {
  readonly className: string;

  x: number;
  y: number;
  z: number;
  w: number;

  // common with immutable quaternion
  toString(): string;
  toStringApproximately(): string;
  flattenAsArray(): Array<number>;
  isDummy(): boolean;
  isEqual(vec: IQuaternion, delta?: number): boolean;
  isStrictEqual(vec: IQuaternion): boolean;
  at(i: number): number;
  length(): number;
  lengthSquared(): number;
  dot(vec: IQuaternion): number;
  toEulerAnglesTo(out: IMutableVector3): IMutableVector3;
  clone(): IMutableQuaternion;

  // only for mutable quaternion
  raw(): TypedArray;
  setAt(i: number, value: number): IMutableQuaternion;
  setComponents(x: number, y: number, z: number, w: number): IMutableQuaternion;
  copyComponents(quat: IQuaternion): IMutableQuaternion;
  identity(): IMutableQuaternion;
  normalize(): IMutableQuaternion;
  axisAngle(vec: IVector3, radian: number): IMutableQuaternion;
  fromMatrix(mat: IMatrix44): IMutableQuaternion;
  add(quat: IQuaternion): IMutableQuaternion;
  subtract(quat: IQuaternion): IMutableQuaternion;
  multiply(quat: IQuaternion): IMutableQuaternion;
  multiplyNumber(value: number): IMutableQuaternion;
  divideNumber(value: number): IMutableQuaternion;
  clone(): IMutableQuaternion;
}

export interface ILogQuaternion {
  readonly className: string;
  readonly _v: Float32Array;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}
