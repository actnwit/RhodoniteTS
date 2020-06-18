import { TypedArray } from "../../commontypes/CommonTypes";

export interface IQuaternion {
  readonly v: TypedArray;
  readonly className: string;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}

export interface IMutableQuaternion {
  readonly v: TypedArray;
  readonly className: string;

  x: number;
  y: number;
  z: number;
  w: number;

  setComponents(x: number, y: number, z: number, w: number): IMutableQuaternion;
}

export interface ILogQuaternion {
  readonly v: TypedArray;
  readonly className: string;

  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
}
