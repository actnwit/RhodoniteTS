import Matrix44 from "./Matrix44";
import { IMutableMatrix22 } from "./IMatrix";
import Matrix22 from "./Matrix22";
import { CompositionType } from "../definitions/CompositionType";
import { Index } from "../../commontypes/CommonTypes";
import Matrix33 from "./Matrix33";
import Vector2 from "./Vector2";

export default class MutableMatrix22 extends Matrix22 implements IMutableMatrix22 {

  constructor(m: null);
  constructor(m: Float32Array, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Array<number>, isColumnMajor?: boolean);
  constructor(m: Matrix22, isColumnMajor?: boolean);
  constructor(m: Matrix33, isColumnMajor?: boolean);
  constructor(m: Matrix44, isColumnMajor?: boolean);
  constructor(
    m0: number, m1: number,
    m2: number, m3: number,
    isColumnMajor?: boolean, );
  constructor(
    m0: any, m1?: any,
    m2?: any, m3?: number,
    isColumnMajor: boolean = false, notCopyFloatArray: boolean = false) {
    super(m0, m1, m2, m3!, isColumnMajor);
  }

  public set m00(val) {
    this.v[0] = val;
  }

  public get m00() {
    return this.v[0];
  }

  public set m10(val) {
    this.v[1] = val;
  }

  public get m10() {
    return this.v[1];
  }

  public set m01(val) {
    this.v[2] = val;
  }

  public get m01() {
    return this.v[2];
  }

  public set m11(val) {
    this.v[3] = val;
  }

  public get m11() {
    return this.v[3];
  }

  raw() {
    return this.v;
  }

  setComponents(
    m00: number, m01: number,
    m10: number, m11: number
  ): MutableMatrix22 {
    this.v[0] = m00; this.v[3] = m01;
    this.v[1] = m10; this.v[4] = m11;
    return this;
  }

  copyComponents(mat: Matrix22 | Matrix33 | Matrix44) {
    const m = mat;

    this.m00 = m.m00;
    this.m01 = m.m01;
    this.m10 = m.m10;
    this.m11 = m.m11;

    return this;
  }

  /**
   * zero matrix
   */
  zero() {
    return this.setComponents(0, 0, 0, 0);
  }

  identity() {
    this.setComponents(
      1, 0,
      0, 1
    );
    return this;
  }

  _swap(l: Index, r: Index) {
    this.v[r] = [this.v[l], this.v[l] = this.v[r]][0]; // Swap
  }

  /**
   * transpose
   */
  transpose() {
    this._swap(1, 2);

    return this;
  }

  invert() {
    const det = Matrix22.determinant(this);
    const m00 = this.m11 / det;
    const m01 = this.m01 / det * (-1.0);
    const m10 = this.m10 / det * (-1.0);
    const m11 = this.m00 / det;

    return this.setComponents(
      m00, m01,
      m10, m11
    );
  }

  /**
   * Create Rotation Matrix
   */
  rotate(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(
      cos, -sin,
      sin, cos
    );
  }

  scale(vec: Vector2) {
    return this.setComponents(
      vec.x, 0,
      0, vec.y
    );
  }

  putScale(vec: Vector2) {
    this.m00 *= vec.x;
    this.m01 *= vec.x;

    this.m10 *= vec.y;
    this.m11 *= vec.y;

    return this;
  }

  /**
   * multiply the input matrix from right side
   */
  multiply(mat: Matrix22) {
    const m00 = this.m00 * mat.m00 + this.m01 * mat.m10;
    const m01 = this.m00 * mat.m01 + this.m01 * mat.m11;

    const m10 = this.m10 * mat.m00 + this.m11 * mat.m10;
    const m11 = this.m10 * mat.m01 + this.m11 * mat.m11;

    return this.setComponents(
      m00, m01,
      m10, m11
    );
  }
}