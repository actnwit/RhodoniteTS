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
}

export interface IScalar {
  readonly x: number;
}

export interface IVector2 {
  readonly v: TypedArray;

  readonly x: number;
  readonly y: number;
}

export interface IMutableVector2 {
  v: TypedArray;

  x: number;
  y: number;
}

export interface IVector3 {
  readonly v: TypedArray;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface IMutableVector3 {
  v: TypedArray;

  x: number;
  y: number;
  z: number;
}

export interface IVector4 {
  readonly v: TypedArray;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
  length(): number;
}

export interface IMutableVector4 {
  v: TypedArray;

  x: number;
  y: number;
  z: number;
  w: number;
}
