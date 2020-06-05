import Matrix44 from "./Matrix44";
import { IMutableMatrix22, IMutableMatrix } from "./IMatrix";
import Matrix22 from "./Matrix22";
import { Index } from "../../commontypes/CommonTypes";
import Matrix33 from "./Matrix33";
import Vector2 from "./Vector2";

export default class MutableMatrix22 extends Matrix22 implements IMutableMatrix, IMutableMatrix22 {

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

  /**
   * Create zero matrix
   */
  static zero() {
    return super.zero() as MutableMatrix22;
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return super.identity() as MutableMatrix22;
  }

  static dummy() {
    return super.dummy() as MutableMatrix22;
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix22) {
    return super.transpose(mat) as MutableMatrix22;
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix22) {
    return super.invert(mat) as MutableMatrix22;
  }

  /**
   * Create Rotation Matrix
   */
  static rotate(radian: number) {
    return super.rotate(radian) as MutableMatrix22;
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector2) {
    return super.scale(vec) as MutableMatrix22;
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix22, r_mat: Matrix22) {
    return super.multiply(l_mat, r_mat) as MutableMatrix22;
  }

  clone() {
    const result = super.clone() as MutableMatrix22;
    return result;
  }

  raw() {
    return this.v;
  }

  setAt(row_i: number, column_i: number, val: number) {
    this.v[row_i + column_i * 2] = val;
    return this;
  }

  setComponents(
    m00: number, m01: number,
    m10: number, m11: number
  ): MutableMatrix22 {
    this.m00 = m00; this.m01 = m01;
    this.m10 = m10; this.m11 = m11;

    return this;
  }

  copyComponents(mat: Matrix22 | Matrix33 | Matrix44) {
    this.m00 = mat.m00; this.m01 = mat.m01;
    this.m10 = mat.m10; this.m11 = mat.m11;

    return this;
  }

  /**
   * zero matrix
   */
  zero() {
    return this.setComponents(0, 0, 0, 0);
  }

  identity() {
    return this.setComponents(
      1, 0,
      0, 1
    );
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
    const det = this.determinant();
    if (det === 0) {
      console.error("the determinant is 0!");
    }

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

  multiplyByLeft(mat: Matrix22) {
    const m00 = mat.m00 * this.m00 + mat.m01 * this.m10;
    const m01 = mat.m00 * this.m01 + mat.m01 * this.m11;

    const m10 = mat.m10 * this.m00 + mat.m11 * this.m10;
    const m11 = mat.m10 * this.m01 + mat.m11 * this.m11;

    return this.setComponents(
      m00, m01,
      m10, m11
    );
  }
}