import Matrix44 from './Matrix44';
import {IMutableMatrix44, IMutableMatrix, IMatrix44} from './IMatrix';
import Matrix33 from './Matrix33';
import Quaternion from './Quaternion';
import Vector3 from './Vector3';
import {Index} from '../../types/CommonTypes';
import {IQuaternion} from './IQuaternion';
import MutableVector3 from './MutableVector3';

/* eslint-disable prettier/prettier */
const FloatArray = Float32Array;
type FloatArray = Float32Array;

export default class MutableMatrix44 extends Matrix44 implements IMutableMatrix, IMutableMatrix44 {
  constructor(m: FloatArray, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Array<number>, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Matrix33, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Matrix44, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: Quaternion, isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(m: null);
  constructor(
    m0: number, m1: number, m2: number, m3: number,
    m4: number, m5: number, m6: number, m7: number,
    m8: number, m9: number, m10: number, m11: number,
    m12: number, m13: number, m14: number, m15: number,
    isColumnMajor?: boolean, notCopyFloatArray?: boolean);
  constructor(
    m0: any, m1?: any, m2?: any, m3?: any,
    m4?: number, m5?: number, m6?: number, m7?: number,
    m8?: number, m9?: number, m10?: number, m11?: number,
    m12?: number, m13?: number, m14?: number, m15?: number,
    isColumnMajor = false, notCopyFloatArray = false) {
    const _isColumnMajor = (arguments.length >= 16) ? isColumnMajor : m1;
    const _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m2;

    if (arguments.length >= 16) {
      super(m0, m1, m2, m3, m4!, m5!, m6!, m7!, m8!, m9!, m10!, m11!, m12!, m13!, m14!, m15!, _isColumnMajor, _notCopyFloatArray);
    } else {
      super(m0, _isColumnMajor, _notCopyFloatArray);
    }
  }

  public set m00(val) {
    this._v[0] = val;
  }

  public get m00() {
    return this._v[0];
  }

  public set m10(val) {
    this._v[1] = val;
  }

  public get m10() {
    return this._v[1];
  }

  public set m20(val) {
    this._v[2] = val;
  }

  public get m20() {
    return this._v[2];
  }

  public set m30(val) {
    this._v[3] = val;
  }

  public get m30() {
    return this._v[3];
  }

  public set m01(val) {
    this._v[4] = val;
  }

  public get m01() {
    return this._v[4];
  }

  public set m11(val) {
    this._v[5] = val;
  }

  public get m11() {
    return this._v[5];
  }

  public set m21(val) {
    this._v[6] = val;
  }

  public get m21() {
    return this._v[6];
  }

  public set m31(val) {
    this._v[7] = val;
  }

  public get m31() {
    return this._v[7];
  }

  public set m02(val) {
    this._v[8] = val;
  }

  public get m02() {
    return this._v[8];
  }

  public set m12(val) {
    this._v[9] = val;
  }

  public get m12() {
    return this._v[9];
  }

  public set m22(val) {
    this._v[10] = val;
  }

  public get m22() {
    return this._v[10];
  }

  public set m32(val) {
    this._v[11] = val;
  }

  public get m32() {
    return this._v[11];
  }

  public set m03(val) {
    this._v[12] = val;
  }

  public get m03() {
    return this._v[12];
  }

  public set m13(val) {
    this._v[13] = val;
  }

  public get m13() {
    return this._v[13];
  }

  public set m23(val) {
    this._v[14] = val;
  }

  public get m23() {
    return this._v[14];
  }

  public set m33(val) {
    this._v[15] = val;
  }

  public get m33() {
    return this._v[15];
  }

  public get translateX() {
    return this._v[12];
  }

  public set translateX(val: number) {
    this._v[12] = val;
  }

  public get translateY() {
    return this._v[13];
  }

  public set translateY(val: number) {
    this._v[13] = val;
  }

  public get translateZ() {
    return this._v[14];
  }

  public set translateZ(val: number) {
    this._v[14] = val;
  }

  get className() {
    return 'MutableMatrix44';
  }

  /**
   * zero matrix(static version)
   */
  static zero() {
    return super.zero() as MutableMatrix44;
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return new MutableMatrix44(1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1);
  }

  static dummy() {
    return super.dummy() as MutableMatrix44;
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix44) {
    return super.transpose(mat) as MutableMatrix44;
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix44) {
    return super.invert(mat) as MutableMatrix44;
  }

  /**
   * Create translation Matrix
   */
  static translate(vec: Vector3) {
    return super.translate(vec) as MutableMatrix44;
  }

  /**
   * Create X oriented Rotation Matrix
   */
  static rotateX(radian: number) {
    return super.rotateX(radian) as MutableMatrix44;
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  static rotateY(radian: number) {
    return super.rotateY(radian) as MutableMatrix44;
  }

  /**
   * Create Z oriented Rotation Matrix
   */
  static rotateZ(radian: number) {
    return super.rotateZ(radian) as MutableMatrix44;
  }

  static rotateXYZ(x: number, y: number, z: number) {
    return super.rotateXYZ(x, y, z) as MutableMatrix44;
  }

  static rotate(vec: Vector3) {
    return super.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]) as MutableMatrix44;
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector3) {
    return super.scale(vec) as MutableMatrix44;
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix44, r_mat: Matrix44) {
    return super.multiply(l_mat, r_mat) as MutableMatrix44;
  }

  clone() {
    const result = super.clone() as MutableMatrix44;
    return result;
  }

  getRotate() {
    const rotateMat = super.getRotate() as MutableMatrix44;
    return rotateMat;
  }

  getTranslate() {
    const rotateMat = super.getTranslate() as MutableVector3;
    return rotateMat;
  }

  getScale() {
    const rotateMat = super.getScale() as MutableVector3;
    return rotateMat;
  }

  raw() {
    return this._v;
  }

  setAt(row_i: number, column_i: number, value: number) {
    this._v[row_i + column_i * 4] = value;
    return this;
  }

  setComponents(
    m00: number, m01: number, m02: number, m03: number,
    m10: number, m11: number, m12: number, m13: number,
    m20: number, m21: number, m22: number, m23: number,
    m30: number, m31: number, m32: number, m33: number
  ) {
    this._v[0] = m00; this._v[4] = m01; this._v[8] = m02; this._v[12] = m03;
    this._v[1] = m10; this._v[5] = m11; this._v[9] = m12; this._v[13] = m13;
    this._v[2] = m20; this._v[6] = m21; this._v[10] = m22; this._v[14] = m23;
    this._v[3] = m30; this._v[7] = m31; this._v[11] = m32; this._v[15] = m33;

    return this;
  }

  copyComponents(mat: IMatrix44) {
    this._v[0] = mat._v[0]; this._v[4] = mat._v[4]; this._v[8] = mat._v[8]; this._v[12] = mat._v[12];
    this._v[1] = mat._v[1]; this._v[5] = mat._v[5]; this._v[9] = mat._v[9]; this._v[13] = mat._v[13];
    this._v[2] = mat._v[2]; this._v[6] = mat._v[6]; this._v[10] = mat._v[10]; this._v[14] = mat._v[14];
    this._v[3] = mat._v[3]; this._v[7] = mat._v[7]; this._v[11] = mat._v[11]; this._v[15] = mat._v[15];

    return this;
  }

  /**
   * zero matrix
   */
  zero() {
    return this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * to the identity matrix
   */
  identity() {
    return this.setComponents(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  _swap(l: Index, r: Index) {
    this._v[r] = [this._v[l], this._v[l] = this._v[r]][0];
  }

  /**
   * transpose
   */
  transpose() {
    this._swap(1, 4);
    this._swap(2, 8);
    this._swap(3, 12);
    this._swap(6, 9);
    this._swap(7, 13);
    this._swap(11, 14);

    return this;
  }

  invert() {
    const n00 = this._v[0] * this._v[5] - this._v[4] * this._v[1];
    const n01 = this._v[0] * this._v[9] - this._v[8] * this._v[1];
    const n02 = this._v[0] * this._v[13] - this._v[12] * this._v[1];
    const n03 = this._v[4] * this._v[9] - this._v[8] * this._v[5];
    const n04 = this._v[4] * this._v[13] - this._v[12] * this._v[5];
    const n05 = this._v[8] * this._v[13] - this._v[12] * this._v[9];
    const n06 = this._v[2] * this._v[7] - this._v[6] * this._v[3];
    const n07 = this._v[2] * this._v[11] - this._v[10] * this._v[3];
    const n08 = this._v[2] * this._v[15] - this._v[14] * this._v[3];
    const n09 = this._v[6] * this._v[11] - this._v[10] * this._v[7];
    const n10 = this._v[6] * this._v[15] - this._v[14] * this._v[7];
    const n11 = this._v[10] * this._v[15] - this._v[14] * this._v[11];

    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = (this._v[5] * n11 - this._v[9] * n10 + this._v[13] * n09) / det;
    const m01 = (this._v[8] * n10 - this._v[4] * n11 - this._v[12] * n09) / det;
    const m02 = (this._v[7] * n05 - this._v[11] * n04 + this._v[15] * n03) / det;
    const m03 = (this._v[10] * n04 - this._v[6] * n05 - this._v[14] * n03) / det;
    const m10 = (this._v[9] * n08 - this._v[1] * n11 - this._v[13] * n07) / det;
    const m11 = (this._v[0] * n11 - this._v[8] * n08 + this._v[12] * n07) / det;
    const m12 = (this._v[11] * n02 - this._v[3] * n05 - this._v[15] * n01) / det;
    const m13 = (this._v[2] * n05 - this._v[10] * n02 + this._v[14] * n01) / det;
    const m20 = (this._v[1] * n10 - this._v[5] * n08 + this._v[13] * n06) / det;
    const m21 = (this._v[4] * n08 - this._v[0] * n10 - this._v[12] * n06) / det;
    const m22 = (this._v[3] * n04 - this._v[7] * n02 + this._v[15] * n00) / det;
    const m23 = (this._v[6] * n02 - this._v[2] * n04 - this._v[14] * n00) / det;
    const m30 = (this._v[5] * n07 - this._v[1] * n09 - this._v[9] * n06) / det;
    const m31 = (this._v[0] * n09 - this._v[4] * n07 + this._v[8] * n06) / det;
    const m32 = (this._v[7] * n01 - this._v[3] * n03 - this._v[11] * n00) / det;
    const m33 = (this._v[2] * n03 - this._v[6] * n01 + this._v[10] * n00) / det;

    return this.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  translate(vec: Vector3) {
    return this.setComponents(
      1, 0, 0, vec._v[0],
      0, 1, 0, vec._v[1],
      0, 0, 1, vec._v[2],
      0, 0, 0, 1
    );
  }

  putTranslate(vec: Vector3) {
    this._v[12] = vec._v[0];
    this._v[13] = vec._v[1];
    this._v[14] = vec._v[2];
    return this;
  }

  addTranslate(vec: Vector3) {
    this._v[12] += vec._v[0];
    this._v[13] += vec._v[1];
    this._v[14] += vec._v[2];
    return this;
  }

  /**
   * Create X oriented Rotation Matrix
   */
  rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(
      1, 0, 0, 0,
      0, cos, -sin, 0,
      0, sin, cos, 0,
      0, 0, 0, 1
    );
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(
      cos, 0, sin, 0,
      0, 1, 0, 0,
      -sin, 0, cos, 0,
      0, 0, 0, 1
    );
  }

  /**
 * Create Z oriented Rotation Matrix
 */
  rotateZ(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return this.setComponents(
      cos, -sin, 0, 0,
      sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  rotateXYZ(x: number, y: number, z: number) {
    const cosX = Math.cos(x);
    const sinX = Math.sin(x);
    const cosY = Math.cos(y);
    const sinY = Math.sin(y);
    const cosZ = Math.cos(z);
    const sinZ = Math.sin(z);

    // const x00 = 1;
    // const x01 = 0;
    // const x02 = 0;
    // const x10 = 0;
    const x11 = cosX;
    const x12 = -sinX;
    // const x20 = 0;
    const x21 = sinX;
    const x22 = cosX;

    const y00 = cosY;
    // const y01 = 0;
    const y02 = sinY;
    // const y10 = 0;
    // const y11 = 1;
    // const y12 = 0;
    const y20 = -sinY;
    // const y21 = 0;
    const y22 = cosY;

    const z00 = cosZ;
    const z01 = -sinZ;
    // const z02 = 0;
    const z10 = sinZ;
    const z11 = cosZ;
    // const z12 = 0;
    // const z20 = 0;
    // const z21 = 0;
    // const z22 = 1;

    // Y * X
    const yx00 = y00;
    const yx01 = y02 * x21;
    const yx02 = y02 * x22;
    //const yx10 = 0;
    const yx11 = x11;
    const yx12 = x12;
    const yx20 = y20;
    const yx21 = y22 * x21;
    const yx22 = y22 * x22;

    // Z * Y * X
    const m00 = z00 * yx00;
    const m01 = z00 * yx01 + z01 * yx11;
    const m02 = z00 * yx02 + z01 * yx12;
    const m10 = z10 * yx00;
    const m11 = z10 * yx01 + z11 * yx11;
    const m12 = z10 * yx02 + z11 * yx12;
    const m20 = yx20;
    const m21 = yx21;
    const m22 = yx22;

    const m03 = 0;
    const m13 = 0;
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return this.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  rotate(vec: Vector3) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  scale(vec: Vector3) {
    return this.setComponents(
      vec._v[0], 0, 0, 0,
      0, vec._v[1], 0, 0,
      0, 0, vec._v[2], 0,
      0, 0, 0, 1
    );
  }

  multiplyScale(vec: Vector3) {
    this._v[0] *= vec._v[0];
    this._v[4] *= vec._v[0];
    this._v[8] *= vec._v[0];
    this._v[12] *= vec._v[0];

    this._v[1] *= vec._v[1];
    this._v[5] *= vec._v[1];
    this._v[9] *= vec._v[1];
    this._v[13] *= vec._v[1];

    this._v[2] *= vec._v[2];
    this._v[6] *= vec._v[2];
    this._v[10] *= vec._v[2];
    this._v[14] *= vec._v[2];

    return this;
  }

  /**
   * multiply the input matrix from right side
   */
  multiply(mat: Matrix44) {
    if (mat.isIdentityMatrixClass) {
      return this;
    }
    const m00 = this._v[0] * mat._v[0] + this._v[4] * mat._v[1] + this._v[8] * mat._v[2] + this._v[12] * mat._v[3];
    const m01 = this._v[0] * mat._v[4] + this._v[4] * mat._v[5] + this._v[8] * mat._v[6] + this._v[12] * mat._v[7];
    const m02 = this._v[0] * mat._v[8] + this._v[4] * mat._v[9] + this._v[8] * mat._v[10] + this._v[12] * mat._v[11];
    const m03 = this._v[0] * mat._v[12] + this._v[4] * mat._v[13] + this._v[8] * mat._v[14] + this._v[12] * mat._v[15];

    const m10 = this._v[1] * mat._v[0] + this._v[5] * mat._v[1] + this._v[9] * mat._v[2] + this._v[13] * mat._v[3];
    const m11 = this._v[1] * mat._v[4] + this._v[5] * mat._v[5] + this._v[9] * mat._v[6] + this._v[13] * mat._v[7];
    const m12 = this._v[1] * mat._v[8] + this._v[5] * mat._v[9] + this._v[9] * mat._v[10] + this._v[13] * mat._v[11];
    const m13 = this._v[1] * mat._v[12] + this._v[5] * mat._v[13] + this._v[9] * mat._v[14] + this._v[13] * mat._v[15];

    const m20 = this._v[2] * mat._v[0] + this._v[6] * mat._v[1] + this._v[10] * mat._v[2] + this._v[14] * mat._v[3];
    const m21 = this._v[2] * mat._v[4] + this._v[6] * mat._v[5] + this._v[10] * mat._v[6] + this._v[14] * mat._v[7];
    const m22 = this._v[2] * mat._v[8] + this._v[6] * mat._v[9] + this._v[10] * mat._v[10] + this._v[14] * mat._v[11];
    const m23 = this._v[2] * mat._v[12] + this._v[6] * mat._v[13] + this._v[10] * mat._v[14] + this._v[14] * mat._v[15];

    const m30 = this._v[3] * mat._v[0] + this._v[7] * mat._v[1] + this._v[11] * mat._v[2] + this._v[15] * mat._v[3];
    const m31 = this._v[3] * mat._v[4] + this._v[7] * mat._v[5] + this._v[11] * mat._v[6] + this._v[15] * mat._v[7];
    const m32 = this._v[3] * mat._v[8] + this._v[7] * mat._v[9] + this._v[11] * mat._v[10] + this._v[15] * mat._v[11];
    const m33 = this._v[3] * mat._v[12] + this._v[7] * mat._v[13] + this._v[11] * mat._v[14] + this._v[15] * mat._v[15];

    return this.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  multiplyByLeft(mat: Matrix44) {
    if (mat.isIdentityMatrixClass) {
      return this;
    }
    const m00 = mat._v[0] * this._v[0] + mat._v[4] * this._v[1] + mat._v[8] * this._v[2] + mat._v[12] * this._v[3];
    const m01 = mat._v[0] * this._v[4] + mat._v[4] * this._v[5] + mat._v[8] * this._v[6] + mat._v[12] * this._v[7];
    const m02 = mat._v[0] * this._v[8] + mat._v[4] * this._v[9] + mat._v[8] * this._v[10] + mat._v[12] * this._v[11];
    const m03 = mat._v[0] * this._v[12] + mat._v[4] * this._v[13] + mat._v[8] * this._v[14] + mat._v[12] * this._v[15];

    const m10 = mat._v[1] * this._v[0] + mat._v[5] * this._v[1] + mat._v[9] * this._v[2] + mat._v[13] * this._v[3];
    const m11 = mat._v[1] * this._v[4] + mat._v[5] * this._v[5] + mat._v[9] * this._v[6] + mat._v[13] * this._v[7];
    const m12 = mat._v[1] * this._v[8] + mat._v[5] * this._v[9] + mat._v[9] * this._v[10] + mat._v[13] * this._v[11];
    const m13 = mat._v[1] * this._v[12] + mat._v[5] * this._v[13] + mat._v[9] * this._v[14] + mat._v[13] * this._v[15];

    const m20 = mat._v[2] * this._v[0] + mat._v[6] * this._v[1] + mat._v[10] * this._v[2] + mat._v[14] * this._v[3];
    const m21 = mat._v[2] * this._v[4] + mat._v[6] * this._v[5] + mat._v[10] * this._v[6] + mat._v[14] * this._v[7];
    const m22 = mat._v[2] * this._v[8] + mat._v[6] * this._v[9] + mat._v[10] * this._v[10] + mat._v[14] * this._v[11];
    const m23 = mat._v[2] * this._v[12] + mat._v[6] * this._v[13] + mat._v[10] * this._v[14] + mat._v[14] * this._v[15];

    const m30 = mat._v[3] * this._v[0] + mat._v[7] * this._v[1] + mat._v[11] * this._v[2] + mat._v[15] * this._v[3];
    const m31 = mat._v[3] * this._v[4] + mat._v[7] * this._v[5] + mat._v[11] * this._v[6] + mat._v[15] * this._v[7];
    const m32 = mat._v[3] * this._v[8] + mat._v[7] * this._v[9] + mat._v[11] * this._v[10] + mat._v[15] * this._v[11];
    const m33 = mat._v[3] * this._v[12] + mat._v[7] * this._v[13] + mat._v[11] * this._v[14] + mat._v[15] * this._v[15];

    return this.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  fromQuaternion(quat: IQuaternion) {
    const sx = quat._v[0] * quat._v[0];
    const sy = quat._v[1] * quat._v[1];
    const sz = quat._v[2] * quat._v[2];
    const cx = quat._v[1] * quat._v[2];
    const cy = quat._v[0] * quat._v[2];
    const cz = quat._v[0] * quat._v[1];
    const wx = quat._v[3] * quat._v[0];
    const wy = quat._v[3] * quat._v[1];
    const wz = quat._v[3] * quat._v[2];

    const m00 = 1.0 - 2.0 * (sy + sz);
    const m01 = 2.0 * (cz - wz);
    const m02 = 2.0 * (cy + wy);
    const m03 = 0;
    const m10 = 2.0 * (cz + wz);
    const m11 = 1.0 - 2.0 * (sx + sz);
    const m12 = 2.0 * (cx - wx);
    const m13 = 0;
    const m20 = 2.0 * (cy - wy);
    const m21 = 2.0 * (cx + wx);
    const m22 = 1.0 - 2.0 * (sx + sy);
    const m23 = 0;
    const m30 = 0;
    const m31 = 0;
    const m32 = 0;
    const m33 = 1;

    return this.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }
}
