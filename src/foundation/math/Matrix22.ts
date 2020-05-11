import Matrix33 from './Matrix33';
import Matrix44 from './Matrix44';
import { IMatrix22 } from './IMatrix';
import { CompositionType } from '../definitions/CompositionType';
import { TypedArray } from '../../commontypes/CommonTypes';
import Vector2 from './Vector2';
import MutableMatrix22 from './MutableMatrix22';
import MutableVector2 from './MutableVector2';

export default class Matrix22 implements IMatrix22 {
  v: TypedArray;

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

    const _isColumnMajor = (arguments.length === 5) ? isColumnMajor : m1;
    const _notCopyFloatArray = (arguments.length === 3) ? notCopyFloatArray : m2;
    const m = m0;

    if (m == null) {
      this.v = new Float32Array(0);
      return;
    }

    if (arguments.length === 4) {
      this.v = new Float32Array(4);
      if (_isColumnMajor === true) {
        let m = arguments;
        this.v[0] = m[0]; this.v[2] = m[2];
        this.v[1] = m[1]; this.v[3] = m[3];
      } else {
        let m = arguments;
        // arguments[0-3] must be row major values if isColumnMajor is false
        this.v[0] = m[0]; this.v[2] = m[1];
        this.v[1] = m[2]; this.v[3] = m[3];
      }
    } else if (Array.isArray(m as Array<Number>)) {
      this.v = new Float32Array(4);
      if (_isColumnMajor === true) {
        this.v[0] = m[0]; this.v[2] = m[2];
        this.v[1] = m[1]; this.v[3] = m[3];
      } else {
        // 'm' must be row major array if isColumnMajor is false
        this.v[0] = m[0]; this.v[2] = m[1];
        this.v[1] = m[2]; this.v[3] = m[3];
      }
    } else if (m instanceof Float32Array) {
      if (_notCopyFloatArray) {
        this.v = m;
      } else {
        this.v = new Float32Array(4);
        if (_isColumnMajor === true) {
          this.v[0] = m[0]; this.v[2] = m[2];
          this.v[1] = m[1]; this.v[3] = m[3];
        } else {
          // 'm' must be row major array if isColumnMajor is false
          this.v[0] = m[0]; this.v[2] = m[1];
          this.v[1] = m[2]; this.v[3] = m[3];
        }
      }
    } else if (!!m && typeof m.v[8] !== 'undefined') {
      if (_notCopyFloatArray) {
        this.v = m.v;
      } else {
        this.v = new Float32Array(4);
        if (_isColumnMajor === true) {
          const v = (m as Matrix22 | Matrix33 | Matrix44).v;
          this.v[0] = m[0]; this.v[2] = m[2];
          this.v[1] = m[1]; this.v[3] = m[3];
        } else {
          const v = (m as Matrix22 | Matrix33 | Matrix44).v;
          // 'm' must be row major array if isColumnMajor is false
          this.v[0] = m[0]; this.v[2] = m[1];
          this.v[1] = m[2]; this.v[3] = m[3];
        }
      }
    } else {
      this.v = new Float32Array(4);
      this.v[0] = 1; this.v[2] = 0;
      this.v[1] = 0; this.v[3] = 1;

    }
  }

  public get m00() {
    return this.v[0];
  }

  public get m10() {
    return this.v[1];
  }

  public get m01() {
    return this.v[2];
  }

  public get m11() {
    return this.v[3];
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Mat2;
  }

  toString() {
    return this.v[0] + ' ' + this.v[2] + '\n' +
      this.v[1] + ' ' + this.v[3] + ' \n';
  }

  toStringApproximately() {
    return this.nearZeroToZero(this.v[0]) + ' ' + this.nearZeroToZero(this.v[2]) + '\n' +
      this.nearZeroToZero(this.v[1]) + ' ' + this.nearZeroToZero(this.v[3]) + ' \n';
  }

  nearZeroToZero(value: number) {
    if (Math.abs(value) < 0.00001) {
      value = 0;
    } else if (0.99999 < value && value < 1.00001) {
      value = 1;
    } else if (-1.00001 < value && value < -0.99999) {
      value = -1;
    }
    return value;
  }

  flattenAsArray() {
    return [this.v[0], this.v[1],
    this.v[2], this.v[3]];
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(mat: Matrix22, delta: number = Number.EPSILON) {
    if (Math.abs(mat.v[0] - this.v[0]) < delta &&
      Math.abs(mat.v[1] - this.v[1]) < delta &&
      Math.abs(mat.v[2] - this.v[2]) < delta &&
      Math.abs(mat.v[3] - this.v[3]) < delta) {
      return true;
    } else {
      return false;
    }
  }

  static determinant(mat: Matrix22) {
    return mat.m00 * mat.m11 - mat.m10 * mat.m01;
  }

  /**
   * Create zero matrix
   */
  static zero() {
    return new Matrix22(0, 0, 0, 0);
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return new Matrix22(
      1, 0,
      0, 1,
    );
  }

  static dummy() {
    return new Matrix22(null);
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix22) {
    return new Matrix22(
      mat.m00, mat.m10,
      mat.m01, mat.m11
    );
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix22) {
    const det = Matrix22.determinant(mat);
    const m00 = mat.m11 / det;
    const m01 = mat.m01 / det * (-1.0);
    const m10 = mat.m10 / det * (-1.0);
    const m11 = mat.m00 / det;

    return new Matrix22(
      m00, m01,
      m10, m11
    );
  }

  /**
   * Create Rotation Matrix
   */
  static rotate(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return new Matrix22(
      cos, -sin,
      sin, cos
    );
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector2) {
    return new Matrix22(
      vec.x, 0,
      0, vec.y
    );
  }

  /**
   * multiply matrixes
   */
  static multiply(l_m: Matrix22, r_m: Matrix22) {
    const m00 = l_m.v[0] * r_m.v[0] + l_m.v[2] * r_m.v[1];
    const m10 = l_m.v[1] * r_m.v[0] + l_m.v[3] * r_m.v[1];

    const m01 = l_m.v[0] * r_m.v[2] + l_m.v[2] * r_m.v[3];
    const m11 = l_m.v[1] * r_m.v[2] + l_m.v[3] * r_m.v[3];

    return new Matrix22(
      m00, m01,
      m10, m11
    );
  }

  /**
   * multiply matrixes
   */
  static multiplyTo(l_m: Matrix33, r_m: Matrix33, out: MutableMatrix22) {
    out.m00 = l_m.v[0] * r_m.v[0] + l_m.v[2] * r_m.v[1];
    out.m10 = l_m.v[1] * r_m.v[0] + l_m.v[3] * r_m.v[1];

    out.m01 = l_m.v[0] * r_m.v[2] + l_m.v[2] * r_m.v[3];
    out.m11 = l_m.v[1] * r_m.v[2] + l_m.v[3] * r_m.v[3];

    return out;
  }

  clone() {
    return new Matrix22(
      this.v[0], this.v[2],
      this.v[1], this.v[3]
    );
  }



  multiplyVector(vec: Vector2) {
    const x = this.v[0] * vec.x + this.v[2] * vec.y;
    const y = this.v[1] * vec.x + this.v[3] * vec.y;

    return new (vec.constructor as any)(x, y);
  }

  multiplyVectorTo(vec: Vector2, outVec: MutableVector2) {
    const x = this.v[0] * vec.x + this.v[2] * vec.y;
    const y = this.v[1] * vec.x + this.v[3] * vec.y;
    outVec.x = x;
    outVec.y = y;
  }

}
