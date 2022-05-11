import {Vector3} from './Vector3';
import {Quaternion} from './Quaternion';
import {Vector4} from './Vector4';
import {IMatrix, IMatrix33, IMatrix44} from './IMatrix';
import {CompositionType} from '../definitions/CompositionType';
import {MutableVector3} from './MutableVector3';
import {MutableMatrix44} from './MutableMatrix44';
import {MutableVector4} from './MutableVector4';
import {IVector3} from './IVector';
import {MathUtil} from './MathUtil';
import {IdentityMatrix44} from './IdentityMatrix44';
import {AbstractMatrix} from './AbstractMatrix';
import {Array16, ArrayType} from '../../types/CommonTypes';
import {mulThatAndThisToOutAsMat44_offsetAsComposition} from './raw/raw_extension';
import {IQuaternion} from './IQuaternion';

/* eslint-disable prettier/prettier */
const FloatArray = Float32Array;
type FloatArray = Float32Array;

export class Matrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {

  constructor(m: FloatArray) {
    super();
    this._v = m;
  }

  public get m00() {
    return this._v[0];
  }

  public get m10() {
    return this._v[1];
  }

  public get m20() {
    return this._v[2];
  }

  public get m30() {
    return this._v[3];
  }

  public get m01() {
    return this._v[4];
  }

  public get m11() {
    return this._v[5];
  }

  public get m21() {
    return this._v[6];
  }

  public get m31() {
    return this._v[7];
  }

  public get m02() {
    return this._v[8];
  }

  public get m12() {
    return this._v[9];
  }

  public get m22() {
    return this._v[10];
  }

  public get m32() {
    return this._v[11];
  }

  public get m03() {
    return this._v[12];
  }

  public get m13() {
    return this._v[13];
  }

  public get m23() {
    return this._v[14];
  }

  public get m33() {
    return this._v[15];
  }

  public get translateX() {
    return this._v[12];
  }

  public get translateY() {
    return this._v[13];
  }

  public get translateZ() {
    return this._v[14];
  }

  static get compositionType() {
    return CompositionType.Mat4;
  }

  /**
   * zero matrix(static version)
   */
  static zero() {
    return Matrix44.fromCopy16RowMajor(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return new IdentityMatrix44();
  }

  static dummy() {
    return new this(new Float32Array(0));
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix44) {
    if (mat.isIdentityMatrixClass) {
      return mat;
    }

    return Matrix44.fromCopyFloat32ArrayRowMajor(mat._v);
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix44) {
    if (mat.isIdentityMatrixClass) {
      return mat;
    }
    const n00 = mat._v[0] * mat._v[5] - mat._v[4] * mat._v[1];
    const n01 = mat._v[0] * mat._v[9] - mat._v[8] * mat._v[1];
    const n02 = mat._v[0] * mat._v[13] - mat._v[12] * mat._v[1];
    const n03 = mat._v[4] * mat._v[9] - mat._v[8] * mat._v[5];
    const n04 = mat._v[4] * mat._v[13] - mat._v[12] * mat._v[5];
    const n05 = mat._v[8] * mat._v[13] - mat._v[12] * mat._v[9];
    const n06 = mat._v[2] * mat._v[7] - mat._v[6] * mat._v[3];
    const n07 = mat._v[2] * mat._v[11] - mat._v[10] * mat._v[3];
    const n08 = mat._v[2] * mat._v[15] - mat._v[14] * mat._v[3];
    const n09 = mat._v[6] * mat._v[11] - mat._v[10] * mat._v[7];
    const n10 = mat._v[6] * mat._v[15] - mat._v[14] * mat._v[7];
    const n11 = mat._v[10] * mat._v[15] - mat._v[14] * mat._v[11];

    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = (mat._v[5] * n11 - mat._v[9] * n10 + mat._v[13] * n09) / det;
    const m01 = (mat._v[8] * n10 - mat._v[4] * n11 - mat._v[12] * n09) / det;
    const m02 = (mat._v[7] * n05 - mat._v[11] * n04 + mat._v[15] * n03) / det;
    const m03 = (mat._v[10] * n04 - mat._v[6] * n05 - mat._v[14] * n03) / det;
    const m10 = (mat._v[9] * n08 - mat._v[1] * n11 - mat._v[13] * n07) / det;
    const m11 = (mat._v[0] * n11 - mat._v[8] * n08 + mat._v[12] * n07) / det;
    const m12 = (mat._v[11] * n02 - mat._v[3] * n05 - mat._v[15] * n01) / det;
    const m13 = (mat._v[2] * n05 - mat._v[10] * n02 + mat._v[14] * n01) / det;
    const m20 = (mat._v[1] * n10 - mat._v[5] * n08 + mat._v[13] * n06) / det;
    const m21 = (mat._v[4] * n08 - mat._v[0] * n10 - mat._v[12] * n06) / det;
    const m22 = (mat._v[3] * n04 - mat._v[7] * n02 + mat._v[15] * n00) / det;
    const m23 = (mat._v[6] * n02 - mat._v[2] * n04 - mat._v[14] * n00) / det;
    const m30 = (mat._v[5] * n07 - mat._v[1] * n09 - mat._v[9] * n06) / det;
    const m31 = (mat._v[0] * n09 - mat._v[4] * n07 + mat._v[8] * n06) / det;
    const m32 = (mat._v[7] * n01 - mat._v[3] * n03 - mat._v[11] * n00) / det;
    const m33 = (mat._v[2] * n03 - mat._v[6] * n01 + mat._v[10] * n00) / det;

    return Matrix44.fromCopy16RowMajor(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  static invertTo(mat: Matrix44, outMat: MutableMatrix44) {
    if (mat.isIdentityMatrixClass) {
      return outMat.copyComponents(mat);
    }
    const n00 = mat._v[0] * mat._v[5] - mat._v[4] * mat._v[1];
    const n01 = mat._v[0] * mat._v[9] - mat._v[8] * mat._v[1];
    const n02 = mat._v[0] * mat._v[13] - mat._v[12] * mat._v[1];
    const n03 = mat._v[4] * mat._v[9] - mat._v[8] * mat._v[5];
    const n04 = mat._v[4] * mat._v[13] - mat._v[12] * mat._v[5];
    const n05 = mat._v[8] * mat._v[13] - mat._v[12] * mat._v[9];
    const n06 = mat._v[2] * mat._v[7] - mat._v[6] * mat._v[3];
    const n07 = mat._v[2] * mat._v[11] - mat._v[10] * mat._v[3];
    const n08 = mat._v[2] * mat._v[15] - mat._v[14] * mat._v[3];
    const n09 = mat._v[6] * mat._v[11] - mat._v[10] * mat._v[7];
    const n10 = mat._v[6] * mat._v[15] - mat._v[14] * mat._v[7];
    const n11 = mat._v[10] * mat._v[15] - mat._v[14] * mat._v[11];

    const det = n00 * n11 - n01 * n10 + n02 * n09 + n03 * n08 - n04 * n07 + n05 * n06;
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = (mat._v[5] * n11 - mat._v[9] * n10 + mat._v[13] * n09) / det;
    const m01 = (mat._v[8] * n10 - mat._v[4] * n11 - mat._v[12] * n09) / det;
    const m02 = (mat._v[7] * n05 - mat._v[11] * n04 + mat._v[15] * n03) / det;
    const m03 = (mat._v[10] * n04 - mat._v[6] * n05 - mat._v[14] * n03) / det;
    const m10 = (mat._v[9] * n08 - mat._v[1] * n11 - mat._v[13] * n07) / det;
    const m11 = (mat._v[0] * n11 - mat._v[8] * n08 + mat._v[12] * n07) / det;
    const m12 = (mat._v[11] * n02 - mat._v[3] * n05 - mat._v[15] * n01) / det;
    const m13 = (mat._v[2] * n05 - mat._v[10] * n02 + mat._v[14] * n01) / det;
    const m20 = (mat._v[1] * n10 - mat._v[5] * n08 + mat._v[13] * n06) / det;
    const m21 = (mat._v[4] * n08 - mat._v[0] * n10 - mat._v[12] * n06) / det;
    const m22 = (mat._v[3] * n04 - mat._v[7] * n02 + mat._v[15] * n00) / det;
    const m23 = (mat._v[6] * n02 - mat._v[2] * n04 - mat._v[14] * n00) / det;
    const m30 = (mat._v[5] * n07 - mat._v[1] * n09 - mat._v[9] * n06) / det;
    const m31 = (mat._v[0] * n09 - mat._v[4] * n07 + mat._v[8] * n06) / det;
    const m32 = (mat._v[7] * n01 - mat._v[3] * n03 - mat._v[11] * n00) / det;
    const m33 = (mat._v[2] * n03 - mat._v[6] * n01 + mat._v[10] * n00) / det;

    return outMat.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  /**
   * Create translation Matrix
   */
  static translate(vec: Vector3) {
    return Matrix44.fromCopy16RowMajor(
      1, 0, 0, vec._v[0],
      0, 1, 0, vec._v[1],
      0, 0, 1, vec._v[2],
      0, 0, 0, 1
    );
  }

  /**
   * Create X oriented Rotation Matrix
   */
  static rotateX(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix44.fromCopy16RowMajor(
      1, 0, 0, 0,
      0, cos, -sin, 0,
      0, sin, cos, 0,
      0, 0, 0, 1
    );
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  static rotateY(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix44.fromCopy16RowMajor(
      cos, 0, sin, 0,
      0, 1, 0, 0,
      -sin, 0, cos, 0,
      0, 0, 0, 1
    );
  }


  /**
   * Create Z oriented Rotation Matrix
   */
  static rotateZ(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return Matrix44.fromCopy16RowMajor(
      cos, -sin, 0, 0,
      sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  static rotateXYZ(x: number, y: number, z: number) {
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

    return Matrix44.fromCopy16RowMajor(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  static rotate(vec: Vector3) {
    return this.rotateXYZ(vec._v[0], vec._v[1], vec._v[2]);
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector3) {
    return Matrix44.fromCopy16RowMajor(
      vec._v[0], 0, 0, 0,
      0, vec._v[1], 0, 0,
      0, 0, vec._v[2], 0,
      0, 0, 0, 1
    );
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix44, r_mat: Matrix44) {
    if (l_mat.isIdentityMatrixClass) {
      return r_mat;
    } else if (r_mat.isIdentityMatrixClass) {
      return l_mat;
    }

    const lv = (l_mat as Matrix44)._v;
    const rv = (r_mat as Matrix44)._v;
    const m00 = lv[0] * rv[0] + lv[4] * rv[1] + lv[8] * rv[2] + lv[12] * rv[3];
    const m10 = lv[1] * rv[0] + lv[5] * rv[1] + lv[9] * rv[2] + lv[13] * rv[3];
    const m20 = lv[2] * rv[0] + lv[6] * rv[1] + lv[10] * rv[2] + lv[14] * rv[3];
    const m30 = lv[3] * rv[0] + lv[7] * rv[1] + lv[11] * rv[2] + lv[15] * rv[3];

    const m01 = lv[0] * rv[4] + lv[4] * rv[5] + lv[8] * rv[6] + lv[12] * rv[7];
    const m11 = lv[1] * rv[4] + lv[5] * rv[5] + lv[9] * rv[6] + lv[13] * rv[7];
    const m21 = lv[2] * rv[4] + lv[6] * rv[5] + lv[10] * rv[6] + lv[14] * rv[7];
    const m31 = lv[3] * rv[4] + lv[7] * rv[5] + lv[11] * rv[6] + lv[15] * rv[7];

    const m02 = lv[0] * rv[8] + lv[4] * rv[9] + lv[8] * rv[10] + lv[12] * rv[11];
    const m12 = lv[1] * rv[8] + lv[5] * rv[9] + lv[9] * rv[10] + lv[13] * rv[11];
    const m22 = lv[2] * rv[8] + lv[6] * rv[9] + lv[10] * rv[10] + lv[14] * rv[11];
    const m32 = lv[3] * rv[8] + lv[7] * rv[9] + lv[11] * rv[10] + lv[15] * rv[11];

    const m03 = lv[0] * rv[12] + lv[4] * rv[13] + lv[8] * rv[14] + lv[12] * rv[15];
    const m13 = lv[1] * rv[12] + lv[5] * rv[13] + lv[9] * rv[14] + lv[13] * rv[15];
    const m23 = lv[2] * rv[12] + lv[6] * rv[13] + lv[10] * rv[14] + lv[14] * rv[15];
    const m33 = lv[3] * rv[12] + lv[7] * rv[13] + lv[11] * rv[14] + lv[15] * rv[15];

    return Matrix44.fromCopy16RowMajor(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  /**
   * multiply matrixes
   */
  static multiplyTo(l_mat: IMatrix44, r_mat: IMatrix44, outMat: MutableMatrix44) {
    if (l_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(r_mat);
    } else if (r_mat.isIdentityMatrixClass) {
      return outMat.copyComponents(l_mat);
    }

    const lv = (l_mat as Matrix44)._v;
    const rv = (r_mat as Matrix44)._v;
    const m00 = lv[0] * rv[0] + lv[4] * rv[1] + lv[8] * rv[2] + lv[12] * rv[3];
    const m10 = lv[1] * rv[0] + lv[5] * rv[1] + lv[9] * rv[2] + lv[13] * rv[3];
    const m20 = lv[2] * rv[0] + lv[6] * rv[1] + lv[10] * rv[2] + lv[14] * rv[3];
    const m30 = lv[3] * rv[0] + lv[7] * rv[1] + lv[11] * rv[2] + lv[15] * rv[3];

    const m01 = lv[0] * rv[4] + lv[4] * rv[5] + lv[8] * rv[6] + lv[12] * rv[7];
    const m11 = lv[1] * rv[4] + lv[5] * rv[5] + lv[9] * rv[6] + lv[13] * rv[7];
    const m21 = lv[2] * rv[4] + lv[6] * rv[5] + lv[10] * rv[6] + lv[14] * rv[7];
    const m31 = lv[3] * rv[4] + lv[7] * rv[5] + lv[11] * rv[6] + lv[15] * rv[7];

    const m02 = lv[0] * rv[8] + lv[4] * rv[9] + lv[8] * rv[10] + lv[12] * rv[11];
    const m12 = lv[1] * rv[8] + lv[5] * rv[9] + lv[9] * rv[10] + lv[13] * rv[11];
    const m22 = lv[2] * rv[8] + lv[6] * rv[9] + lv[10] * rv[10] + lv[14] * rv[11];
    const m32 = lv[3] * rv[8] + lv[7] * rv[9] + lv[11] * rv[10] + lv[15] * rv[11];

    const m03 = lv[0] * rv[12] + lv[4] * rv[13] + lv[8] * rv[14] + lv[12] * rv[15];
    const m13 = lv[1] * rv[12] + lv[5] * rv[13] + lv[9] * rv[14] + lv[13] * rv[15];
    const m23 = lv[2] * rv[12] + lv[6] * rv[13] + lv[10] * rv[14] + lv[14] * rv[15];
    const m33 = lv[3] * rv[12] + lv[7] * rv[13] + lv[11] * rv[14] + lv[15] * rv[15];

    return outMat.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  static multiplyTypedArrayTo(l_mat: IMatrix44, r_array: ArrayType, outMat: MutableMatrix44, offsetAsComposition: number) {
    (r_array as any)[mulThatAndThisToOutAsMat44_offsetAsComposition](offsetAsComposition, l_mat._v, 0, outMat._v);

    return outMat;
  }

  static fromQuaternionTo(quat: Quaternion, outMat: MutableMatrix44) {
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

    return outMat.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  toString() {
    return this._v[0] + ' ' + this._v[4] + ' ' + this._v[8] + ' ' + this._v[12] + ' \n' +
      this._v[1] + ' ' + this._v[5] + ' ' + this._v[9] + ' ' + this._v[13] + ' \n' +
      this._v[2] + ' ' + this._v[6] + ' ' + this._v[10] + ' ' + this._v[14] + ' \n' +
      this._v[3] + ' ' + this._v[7] + ' ' + this._v[11] + ' ' + this._v[15] + ' \n';
  }

  toStringApproximately() {
    return MathUtil.financial(this._v[0]) + ' ' + MathUtil.financial(this._v[4]) + ' ' + MathUtil.financial(this._v[8]) + ' ' + MathUtil.financial(this._v[12]) + ' \n' +
      MathUtil.financial(this._v[1]) + ' ' + MathUtil.financial(this._v[5]) + ' ' + MathUtil.financial(this._v[9]) + ' ' + MathUtil.financial(this._v[13]) + ' \n' +
      MathUtil.financial(this._v[2]) + ' ' + MathUtil.financial(this._v[6]) + ' ' + MathUtil.financial(this._v[10]) + ' ' + MathUtil.financial(this._v[14]) + ' \n' +
      MathUtil.financial(this._v[3]) + ' ' + MathUtil.financial(this._v[7]) + ' ' + MathUtil.financial(this._v[11]) + ' ' + MathUtil.financial(this._v[15]) + ' \n';
  }

  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3],
    this._v[4], this._v[5], this._v[6], this._v[7],
    this._v[8], this._v[9], this._v[10], this._v[11],
    this._v[12], this._v[13], this._v[14], this._v[15]];
  }

  isDummy() {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(mat: IMatrix44, delta: number = Number.EPSILON) {
    const v = (mat as Matrix44)._v;
    if (Math.abs(v[0] - this._v[0]) < delta &&
      Math.abs(v[1] - this._v[1]) < delta &&
      Math.abs(v[2] - this._v[2]) < delta &&
      Math.abs(v[3] - this._v[3]) < delta &&
      Math.abs(v[4] - this._v[4]) < delta &&
      Math.abs(v[5] - this._v[5]) < delta &&
      Math.abs(v[6] - this._v[6]) < delta &&
      Math.abs(v[7] - this._v[7]) < delta &&
      Math.abs(v[8] - this._v[8]) < delta &&
      Math.abs(v[9] - this._v[9]) < delta &&
      Math.abs(v[10] - this._v[10]) < delta &&
      Math.abs(v[11] - this._v[11]) < delta &&
      Math.abs(v[12] - this._v[12]) < delta &&
      Math.abs(v[13] - this._v[13]) < delta &&
      Math.abs(v[14] - this._v[14]) < delta &&
      Math.abs(v[15] - this._v[15]) < delta) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(mat: Matrix44) {
    if (
      mat._v[0] === this._v[0] && mat._v[1] === this._v[1] && mat._v[2] === this._v[2] && mat._v[3] === this._v[3] &&
      mat._v[4] === this._v[4] && mat._v[5] === this._v[5] && mat._v[6] === this._v[6] && mat._v[7] === this._v[7] &&
      mat._v[8] === this._v[8] && mat._v[9] === this._v[9] && mat._v[10] === this._v[10] && mat._v[11] === this._v[11] &&
      mat._v[12] === this._v[12] && mat._v[13] === this._v[13] && mat._v[14] === this._v[14] && mat._v[15] === this._v[15]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(row_i: number, column_i: number) {
    return this._v[row_i + column_i * 4];
  }

  determinant() {
    return this._v[0] * this._v[5] * this._v[10] * this._v[15] + this._v[0] * this._v[9] * this._v[14] * this._v[7] + this._v[0] * this._v[13] * this._v[6] * this._v[11] +
      this._v[4] * this._v[1] * this._v[14] * this._v[11] + this._v[4] * this._v[9] * this._v[2] * this._v[15] + this._v[4] * this._v[13] * this._v[10] * this._v[3] +
      this._v[8] * this._v[1] * this._v[6] * this._v[15] + this._v[8] * this._v[5] * this._v[14] * this._v[3] + this._v[8] * this._v[13] * this._v[2] * this._v[7] +
      this._v[12] * this._v[1] * this._v[10] * this._v[7] + this._v[12] * this._v[5] * this._v[2] * this._v[11] + this._v[12] * this._v[9] * this._v[6] * this._v[3] -

      this._v[0] * this._v[5] * this._v[14] * this._v[11] - this._v[0] * this._v[9] * this._v[6] * this._v[15] - this._v[0] * this._v[13] * this._v[10] * this._v[7] -
      this._v[4] * this._v[1] * this._v[10] * this._v[15] - this._v[4] * this._v[9] * this._v[14] * this._v[3] - this._v[4] * this._v[13] * this._v[2] * this._v[11] -
      this._v[8] * this._v[1] * this._v[14] * this._v[7] - this._v[8] * this._v[5] * this._v[2] * this._v[15] - this._v[8] * this._v[13] * this._v[6] * this._v[3] -
      this._v[12] * this._v[1] * this._v[6] * this._v[11] - this._v[12] * this._v[5] * this._v[10] * this._v[3] - this._v[12] * this._v[9] * this._v[2] * this._v[7];
  }

  multiplyVector(vec: Vector4) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12] * vec._v[3];
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13] * vec._v[3];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14] * vec._v[3];
    const w = this._v[3] * vec._v[0] + this._v[7] * vec._v[1] + this._v[11] * vec._v[2] + this._v[15] * vec._v[3];

    return Vector4.fromCopyArray([x, y, z, w]);
  }

  multiplyVectorTo(vec: Vector4, outVec: MutableVector4) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12] * vec._v[3];
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13] * vec._v[3];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14] * vec._v[3];
    const w = this._v[3] * vec._v[0] + this._v[7] * vec._v[1] + this._v[11] * vec._v[2] + this._v[15] * vec._v[3];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;
    outVec._v[3] = w;

    return outVec;
  }

  multiplyVectorToVec3(vec: Vector4, outVec: MutableVector3) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12] * vec._v[3];
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13] * vec._v[3];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14] * vec._v[3];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;

    return outVec;
  }

  multiplyVector3(vec: Vector3) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12]; // regards vec.w(vec._v[3]) as 1
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14];

    return Vector3.fromCopyArray([x, y, z]);
  }

  multiplyVector3To(vec: IVector3, outVec: MutableVector3) {
    const x = this._v[0] * vec._v[0] + this._v[4] * vec._v[1] + this._v[8] * vec._v[2] + this._v[12]; // regards vec.w(vec._v[3]) as 1
    const y = this._v[1] * vec._v[0] + this._v[5] * vec._v[1] + this._v[9] * vec._v[2] + this._v[13];
    const z = this._v[2] * vec._v[0] + this._v[6] * vec._v[1] + this._v[10] * vec._v[2] + this._v[14];
    outVec._v[0] = x;
    outVec._v[1] = y;
    outVec._v[2] = z;

    return outVec;
  }

  getTranslate() {
    return Vector3.fromCopyArray([this._v[12], this._v[13], this._v[14]]);
  }

  /**
   * get translate vector from this matrix
   */
  getTranslateTo(outVec: MutableVector3) {
    outVec._v[0] = this._v[12];
    outVec._v[1] = this._v[13];
    outVec._v[2] = this._v[14];
    return outVec;
  }

  getScale() {
    return Vector3.fromCopyArray([
      Math.hypot(this._v[0], this._v[4], this._v[8]),
      Math.hypot(this._v[1], this._v[5], this._v[9]),
      Math.hypot(this._v[2], this._v[6], this._v[10])]
    );
  }

  /**
   * get scale vector from this matrix
   */
  getScaleTo(outVec: MutableVector3) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[4], this._v[8]);
    outVec._v[1] = Math.hypot(this._v[1], this._v[5], this._v[9]);
    outVec._v[2] = Math.hypot(this._v[2], this._v[6], this._v[10]);
    return outVec;
  }

  /**
   * @return Euler Angles Rotation (x, y, z)
   */
  toEulerAngles() {
    let rotate = null;
    if (Math.abs(this._v[2]) !== 1.0) {
      const y = -Math.asin(this._v[2]);
      const x = Math.atan2(this._v[6] / Math.cos(y), this._v[10] / Math.cos(y));
      const z = Math.atan2(this._v[1] / Math.cos(y), this._v[0] / Math.cos(y));
      rotate = Vector3.fromCopyArray([x, y, z]);
    } else if (this._v[2] === -1.0) {
      rotate = Vector3.fromCopyArray([Math.atan2(this._v[4], this._v[8]), Math.PI / 2.0, 0.0]);
    } else {
      rotate = Vector3.fromCopyArray([Math.atan2(-this._v[4], -this._v[8]), -Math.PI / 2.0, 0.0]);
    }

    return rotate;
  }

  toEulerAnglesTo(outVec3: MutableVector3) {
    if (Math.abs(this._v[2]) !== 1.0) {
      const y = -Math.asin(this._v[2]);
      const x = Math.atan2(this._v[6] / Math.cos(y), this._v[10] / Math.cos(y));
      const z = Math.atan2(this._v[1] / Math.cos(y), this._v[0] / Math.cos(y));
      outVec3._v[0] = x;
      outVec3._v[1] = y;
      outVec3._v[2] = z;
    } else if (this._v[2] === -1.0) {
      outVec3._v[0] = Math.atan2(this._v[4], this._v[8])
      outVec3._v[1] = Math.PI / 2.0;
      outVec3._v[2] = 0.0;
    } else {
      outVec3._v[0] = Math.atan2(-this._v[4], -this._v[8])
      outVec3._v[1] = -Math.PI / 2.0;
      outVec3._v[2] = 0.0;
    }

    return outVec3;
  }

  clone() {
    return (this.constructor as any).fromCopy16RowMajor(
      this._v[0], this._v[4], this._v[8], this._v[12],
      this._v[1], this._v[5], this._v[9], this._v[13],
      this._v[2], this._v[6], this._v[10], this._v[14],
      this._v[3], this._v[7], this._v[11], this._v[15]
    ) as Matrix44;
  }

  getRotate() {
    // const quat = Quaternion.fromMatrix(this);
    // const rotateMat = (this.constructor as any).fromCopyQuaternion(quat) as Matrix44;
    const scaleX = Math.hypot(this._v[0], this._v[4], this._v[8]);
    const scaleY = Math.hypot(this._v[1], this._v[5], this._v[9]);
    const scaleZ = Math.hypot(this._v[2], this._v[6], this._v[10]);

    const mat = Matrix44.fromCopy16RowMajor(
      this._v[0] / scaleX, this._v[4], this._v[8], 0,
      this._v[1], this._v[5] / scaleY, this._v[9], 0,
      this._v[2], this._v[6], this._v[10] / scaleZ, 0,
      0, 0, 0, 1,
    );
    return mat;
  }

  /**
   * Set values as Row Major
   * Note that WebGL matrix keeps the values in column major.
   * If you write 16 values in 4x4 style (4 values in each row),
   *   It will becomes an intuitive handling.
   * @returns
   */
  static fromCopy16RowMajor(
    m00: number, m01: number, m02: number, m03: number,
    m10: number, m11: number, m12: number, m13: number,
    m20: number, m21: number, m22: number, m23: number,
    m30: number, m31: number, m32: number, m33: number) {
    const v = new Float32Array(16);
    v[0] = m00; v[4] = m01; v[8] = m02; v[12] = m03;
    v[1] = m10; v[5] = m11; v[9] = m12; v[13] = m13;
    v[2] = m20; v[6] = m21; v[10] = m22; v[14] = m23;
    v[3] = m30; v[7] = m31; v[11] = m32; v[15] = m33;
    return new Matrix44(v);
  }

  /**
   * Set values as Column Major
   * Note that WebGL matrix keeps the values in column major.
   * @returns
   */
  static fromCopy16ColumnMajor(
    m00: number, m10: number, m20: number, m30: number,
    m01: number, m11: number, m21: number, m31: number,
    m02: number, m12: number, m22: number, m32: number,
    m03: number, m13: number, m23: number, m33: number) {
    const v = new Float32Array(16);
    v[0] = m00; v[4] = m01; v[8] = m02; v[12] = m03;
    v[1] = m10; v[5] = m11; v[9] = m12; v[13] = m13;
    v[2] = m20; v[6] = m21; v[10] = m22; v[14] = m23;
    v[3] = m30; v[7] = m31; v[11] = m32; v[15] = m33;
    return new Matrix44(v);
  }


  static fromCopyMatrix44(mat: Matrix44) {
    const v = new Float32Array(16);
    v.set(mat._v);
    return new Matrix44(v);
  }

  static fromFloat32ArrayColumnMajor(float32Array: Float32Array) {
    return new Matrix44(float32Array);
  }

  static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array) {
    const v = new Float32Array(16);
    v.set(float32Array);
    return new Matrix44(v);
  }

  static fromCopyFloat32ArrayRowMajor(array: Float32Array) {
    const v = new Float32Array(16);
    v[0] = array[0]; v[4] = array[1]; v[8] = array[2]; v[12] = array[3];
    v[1] = array[4]; v[5] = array[5]; v[9] = array[6]; v[13] = array[7];
    v[2] = array[8]; v[6] = array[9]; v[10] = array[10]; v[14] = array[11];
    v[3] = array[12]; v[7] = array[13]; v[11] = array[14]; v[15] = array[15];
    return new Matrix44(v);
  }

  static fromCopyMatrix33(mat: IMatrix33) {
    const v = new Float32Array(16);
    v[0] = mat._v[0]; v[4] = mat._v[3]; v[8] = mat._v[6]; v[12] = 0;
    v[1] = mat._v[1]; v[5] = mat._v[4]; v[9] = mat._v[7]; v[13] = 0;
    v[2] = mat._v[2]; v[6] = mat._v[5]; v[10] = mat._v[8]; v[14] = 0;
    v[3] = 0; v[7] = 0; v[11] = 0; v[15] = 1;
    return new Matrix44(v);
  }

  static fromCopyArray16ColumnMajor(array: Array16<number>) {
    const v = new Float32Array(16);
    v.set(array);
    return new Matrix44(v);
  }

  static fromCopyArrayColumnMajor(array: Array<number>) {
    const v = new Float32Array(16);
    v.set(array);
    return new Matrix44(v);
  }

  static fromCopyArray16RowMajor(array: Array16<number>) {
    const v = new Float32Array(16);
    v[0] = array[0]; v[4] = array[1]; v[8] = array[2]; v[12] = array[3];
    v[1] = array[4]; v[5] = array[5]; v[9] = array[6]; v[13] = array[7];
    v[2] = array[8]; v[6] = array[9]; v[10] = array[10]; v[14] = array[11];
    v[3] = array[12]; v[7] = array[13]; v[11] = array[14]; v[15] = array[15];
    return new Matrix44(v);
  }

  static fromCopyArrayRowMajor(array: Array<number>) {
    const v = new Float32Array(16);
    v[0] = array[0]; v[4] = array[1]; v[8] = array[2]; v[12] = array[3];
    v[1] = array[4]; v[5] = array[5]; v[9] = array[6]; v[13] = array[7];
    v[2] = array[8]; v[6] = array[9]; v[10] = array[10]; v[14] = array[11];
    v[3] = array[12]; v[7] = array[13]; v[11] = array[14]; v[15] = array[15];
    return new Matrix44(v);
  }

  static fromCopyQuaternion(q: IQuaternion) {
      const sx = q._v[0] * q._v[0];
      const sy = q._v[1] * q._v[1];
      const sz = q._v[2] * q._v[2];
      const cx = q._v[1] * q._v[2];
      const cy = q._v[0] * q._v[2];
      const cz = q._v[0] * q._v[1];
      const wx = q._v[3] * q._v[0];
      const wy = q._v[3] * q._v[1];
      const wz = q._v[3] * q._v[2];
      const v = new Float32Array(16)
      v[0] = 1.0 - 2.0 * (sy + sz); v[4] = 2.0 * (cz - wz); v[8] = 2.0 * (cy + wy); v[12] = 0;
      v[1] = 2.0 * (cz + wz); v[5] = 1.0 - 2.0 * (sx + sz); v[9] = 2.0 * (cx - wx); v[13] = 0;
      v[2] = 2.0 * (cy - wy); v[6] = 2.0 * (cx + wx); v[10] = 1.0 - 2.0 * (sx + sy); v[14] = 0;
      v[3] = 0; v[7] = 0; v[11] = 0; v[15] = 1;

    return new Matrix44(v);
  }
}
