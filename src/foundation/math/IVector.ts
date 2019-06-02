export interface IScalar {
  readonly x: number;
}

export interface IVector2 {
  readonly x: number;
  readonly y: number;
}

export interface IMutableVector2 {
  x: number;
  y: number;
}

export interface IVector3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface IMutableVector3 {
  x: number;
  y: number;
  z: number;
}

export interface IVector4 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly w: number;
  length(): number;
}

export interface IMutableVector4 {
  x: number;
  y: number;
  z: number;
  w: number;
}
