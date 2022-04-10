/* eslint-disable prettier/prettier */
import { CompositionType } from '../definitions/CompositionType';
import AbstractMatrix from './AbstractMatrix';
import {IMatrix, IMatrix44} from './IMatrix';
import { IVector, IMutableVector4, IMutableVector, IVector3 } from './IVector';
import Matrix44 from './Matrix44';
import MutableVector4 from './MutableVector4';
import { Vector3 } from './Vector3';
import Vector4 from './Vector4';

export default class IdentityMatrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {
  static readonly __v = new Float32Array([1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1]);
  constructor() {
    super();
    this._v = IdentityMatrix44.__v;
  }
  toString(): string {
    return `1 0 0 0
0 1 0 0
0 0 1 0
0 0 0 1
`;
  }
  toStringApproximately(): string {
    return this.toString()
  }
  flattenAsArray(): number[] {
    return [1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1];
  }
  isDummy(): boolean {
    return false;
  }

  isEqual(mat: IMatrix44, delta: number = Number.EPSILON): boolean {
    if (Math.abs(mat.m00 - 1) < delta &&
      Math.abs(mat.m10) < delta &&
      Math.abs(mat.m20) < delta &&
      Math.abs(mat.m30) < delta &&
      Math.abs(mat.m01) < delta &&
      Math.abs(mat.m11 - 1) < delta &&
      Math.abs(mat.m21) < delta &&
      Math.abs(mat.m31) < delta &&
      Math.abs(mat.m02) < delta &&
      Math.abs(mat.m12) < delta &&
      Math.abs(mat.m22 - 1) < delta &&
      Math.abs(mat.m32) < delta &&
      Math.abs(mat.m03) < delta &&
      Math.abs(mat.m13) < delta &&
      Math.abs(mat.m23) < delta &&
      Math.abs(mat.m33 - 1) < delta) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(mat: IMatrix): boolean {
    const v = (mat as Matrix44)._v;
    if (
      v[0] === 1 && v[1] === 0 && v[2] === 0 && v[3] === 0 &&
      v[4] === 0 && v[5] === 1 && v[6] === 0 && v[7] === 0 &&
      v[8] === 0 && v[9] === 0 && v[10] === 1 && v[11] === 0 &&
      v[12] === 0 && v[13] === 0 && v[14] === 0 && v[15] === 1
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(row_i: number, column_i: number): number {
    return (row_i === column_i) ? 1 : 0;
  }

  v(i: number): number {
    return (i%5 === 0) ? 1 : 0;
  }

  determinant(): number {
    return 1;
  }

  multiplyVector(vec: IVector): IVector {
    return vec;
  }

  multiplyVectorTo(vec: IVector, outVec: IMutableVector): IMutableVector {
    const v = (vec as Vector4)._v;
    outVec._v[0] = v[0];
    outVec._v[1] = v[1];
    outVec._v[2] = v[2];
    outVec._v[3] = v[3];

    return outVec;
  }

  getScale(): IVector3 {
    return Vector3.one();
  }

  getScaleTo(outVec: IMutableVector): IMutableVector {
    const v = (outVec as MutableVector4)._v;

    v[0] = 1;
    v[1] = 1;
    v[2] = 1;

    return outVec;
  }

  clone(): IMatrix44 {
    return new IdentityMatrix44();
  }

  getRotate(): IMatrix44 {
    return new IdentityMatrix44();
  }

  getTranslate(): IVector3 {
    return Vector3.zero();
  }

  public get m00() {
    return 1;
  }

  public get m10() {
    return 0;
  }

  public get m20() {
    return 0;
  }

  public get m30() {
    return 0;
  }

  public get m01() {
    return 0;
  }

  public get m11() {
    return 1;
  }

  public get m21() {
    return 0;
  }

  public get m31() {
    return 0;
  }

  public get m02() {
    return 0;
  }

  public get m12() {
    return 0;
  }

  public get m22() {
    return 1;
  }

  public get m32() {
    return 0;
  }

  public get m03() {
    return 0;
  }

  public get m13() {
    return 0;
  }

  public get m23() {
    return 0;
  }

  public get m33() {
    return 1;
  }

  public get translateX() {
    return 0;
  }
  public get translateY() {
    return 0;
  }
  public get translateZ() {
    return 0;
  }

  get className() {
    return 'IdentityMatrix44';
  }

  static get compositionType() {
    return CompositionType.Mat4;
  }

  get isIdentityMatrixClass(): boolean {
    return true;
  }
}
