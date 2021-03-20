import { CompositionType } from '../definitions/CompositionType';
import {IMatrix, IMatrix44} from './IMatrix';
import { IVector, IMutableVector4, IMutableVector } from './IVector';
import Matrix44 from './Matrix44';
import MutableVector4 from './MutableVector4';
import Vector4 from './Vector4';

export default class IdentityMatrix44 implements IMatrix, IMatrix44 {
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
    throw [1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1];
  }
  isDummy(): boolean {
    return false;
  }

  isEqual(mat: IMatrix44, delta: number = Number.EPSILON): boolean {
    const v = (mat as Matrix44).v;
    if (Math.abs(v[0] - 1) < delta &&
      Math.abs(v[1]) < delta &&
      Math.abs(v[2]) < delta &&
      Math.abs(v[3]) < delta &&
      Math.abs(v[4]) < delta &&
      Math.abs(v[5] - 1) < delta &&
      Math.abs(v[6]) < delta &&
      Math.abs(v[7]) < delta &&
      Math.abs(v[8]) < delta &&
      Math.abs(v[9]) < delta &&
      Math.abs(v[10] - 1) < delta &&
      Math.abs(v[11]) < delta &&
      Math.abs(v[12]) < delta &&
      Math.abs(v[13]) < delta &&
      Math.abs(v[14]) < delta &&
      Math.abs(v[15] - 1) < delta) {
      return true;
    } else {
      return false;
    }
  }
  
  isStrictEqual(mat: IMatrix): boolean {
    const v = (mat as Matrix44).v;
    if (
      v[0] === 0 && v[1] === 0 && v[2] === 0 && v[3] === 0 &&
      v[4] === 0 && v[5] === 0 && v[6] === 0 && v[7] === 0 &&
      v[8] === 0 && v[9] === 0 && v[10] === 0 && v[11] === 0 &&
      v[12] === 0 && v[13] === 0 && v[14] === 0 && v[15] === 0
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(row_i: number, column_i: number): number {
    return (row_i === column_i) ? 1 : 0;
  }

  determinant(): number {
    return 1;
  }

  multiplyVector(vec: IVector): IVector {
    return vec;
  }

  multiplyVectorTo(vec: IVector, outVec: IMutableVector): IMutableVector {
    const v = (vec as Vector4).v;
    outVec.v[0] = v[0];
    outVec.v[1] = v[1];
    outVec.v[2] = v[2];
    outVec.v[3] = v[3];

    return outVec;
  }

  getScale(): IVector {
    return new Vector4(1, 1, 1, 1);
  }
  
  getScaleTo(outVec: IMutableVector): IMutableVector {
    const v = (outVec as MutableVector4).v;
    
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

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Mat4;
  }
}
