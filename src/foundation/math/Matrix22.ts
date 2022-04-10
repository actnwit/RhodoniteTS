import Matrix33 from './Matrix33';
import Matrix44 from './Matrix44';
import {IMatrix, IMatrix22} from './IMatrix';
import {CompositionType} from '../definitions/CompositionType';
import { Vector2 } from './Vector2';
import MutableMatrix22 from './MutableMatrix22';
import {MathUtil} from './MathUtil';
import { MutableVector2 } from './MutableVector2';
import AbstractMatrix from './AbstractMatrix';

export class Matrix22 extends AbstractMatrix implements IMatrix22 {
  constructor(m: null);
  constructor(
    m: Float32Array,
    isColumnMajor?: boolean,
    notCopyFloatArray?: boolean
  );
  constructor(m: Array<number>, isColumnMajor?: boolean);
  constructor(m: Matrix22, isColumnMajor?: boolean);
  constructor(m: Matrix33, isColumnMajor?: boolean);
  constructor(m: Matrix44, isColumnMajor?: boolean);
  constructor(
    m0: number,
    m1: number,
    m2: number,
    m3: number,
    isColumnMajor?: boolean
  );
  constructor(
    m0: any,
    m1?: any,
    m2?: any,
    m3?: number,
    isColumnMajor = false,
    notCopyFloatArray = false
  ) {
    super();
    const _isColumnMajor = arguments.length === 5 ? isColumnMajor : m1;
    const _notCopyFloatArray = arguments.length === 6 ? notCopyFloatArray : m2;
    const m = m0;

    if (m == null) {
      this._v = new Float32Array(0);
      return;
    }

    if (4 <= arguments.length && arguments.length <= 5 && m3 != null) {
      this._v = new Float32Array(4);
      if (_isColumnMajor === true) {
        const m = arguments;
        this._v[0] = m[0];
        this._v[2] = m[2];
        this._v[1] = m[1];
        this._v[3] = m[3];
      } else {
        const m = arguments;
        // arguments[0-3] must be row major values if isColumnMajor is false
        this._v[0] = m[0];
        this._v[2] = m[1];
        this._v[1] = m[2];
        this._v[3] = m[3];
      }
    } else if (Array.isArray(m as Array<Number>)) {
      this._v = new Float32Array(4);
      if (_isColumnMajor === true) {
        this._v[0] = m[0];
        this._v[2] = m[2];
        this._v[1] = m[1];
        this._v[3] = m[3];
      } else {
        // 'm' must be row major array if isColumnMajor is false
        this._v[0] = m[0];
        this._v[2] = m[1];
        this._v[1] = m[2];
        this._v[3] = m[3];
      }
    } else if (m instanceof Float32Array) {
      if (_notCopyFloatArray) {
        this._v = m;
      } else {
        this._v = new Float32Array(4);
        if (_isColumnMajor === true) {
          this._v[0] = m[0];
          this._v[2] = m[2];
          this._v[1] = m[1];
          this._v[3] = m[3];
        } else {
          // 'm' must be row major array if isColumnMajor is false
          this._v[0] = m[0];
          this._v[2] = m[1];
          this._v[1] = m[2];
          this._v[3] = m[3];
        }
      }
    } else if (!!m && m._v?.[3] != null) {
      if (_notCopyFloatArray) {
        this._v = m._v;
      } else {
        this._v = new Float32Array(4);
        if (_isColumnMajor === true) {
          const v = (m as Matrix22 | Matrix33 | Matrix44)._v;
          this._v[0] = m[0];
          this._v[2] = m[2];
          this._v[1] = m[1];
          this._v[3] = m[3];
        } else {
          const v = (m as Matrix22 | Matrix33 | Matrix44)._v;
          // 'm' must be row major array if isColumnMajor is false
          this._v[0] = m[0];
          this._v[2] = m[1];
          this._v[1] = m[2];
          this._v[3] = m[3];
        }
      }
    } else {
      this._v = new Float32Array(4);
      this._v[0] = 1;
      this._v[2] = 0;
      this._v[1] = 0;
      this._v[3] = 1;
    }
  }

  public get m00() {
    return this._v[0];
  }

  public get m10() {
    return this._v[1];
  }

  public get m01() {
    return this._v[2];
  }

  public get m11() {
    return this._v[3];
  }

  get className() {
    return 'Matrix22';
  }

  static get compositionType() {
    return CompositionType.Mat2;
  }

  /**
   * Create zero matrix
   */
  static zero() {
    return new this(0, 0, 0, 0);
  }

  /**
   * Create identity matrix
   */
  static identity() {
    return new this(1, 0, 0, 1);
  }

  static dummy() {
    return new this(null);
  }

  /**
   * Create transpose matrix
   */
  static transpose(mat: Matrix22) {
    return new this(mat._v[0], mat._v[1], mat._v[2], mat._v[3]);
  }

  /**
   * Create invert matrix
   */
  static invert(mat: Matrix22) {
    const det = mat.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = mat._v[3] / det;
    const m01 = (mat._v[2] / det) * -1.0;
    const m10 = (mat._v[1] / det) * -1.0;
    const m11 = mat._v[0] / det;

    return new this(m00, m01, m10, m11);
  }

  static invertTo(mat: Matrix22, outMat: MutableMatrix22) {
    const det = mat.determinant();
    if (det === 0) {
      console.error('the determinant is 0!');
    }

    const m00 = mat._v[3] / det;
    const m01 = (mat._v[2] / det) * -1.0;
    const m10 = (mat._v[1] / det) * -1.0;
    const m11 = mat._v[0] / det;

    return outMat.setComponents(m00, m01, m10, m11);
  }

  /**
   * Create Rotation Matrix
   */
  static rotate(radian: number) {
    const cos = Math.cos(radian);
    const sin = Math.sin(radian);
    return new this(cos, -sin, sin, cos);
  }

  /**
   * Create Scale Matrix
   */
  static scale(vec: Vector2) {
    return new this(vec._v[0], 0, 0, vec._v[1]);
  }

  /**
   * multiply matrixes
   */
  static multiply(l_mat: Matrix22, r_mat: Matrix22) {
    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[2] * r_mat._v[1];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1];

    const m01 = l_mat._v[0] * r_mat._v[2] + l_mat._v[2] * r_mat._v[3];
    const m11 = l_mat._v[1] * r_mat._v[2] + l_mat._v[3] * r_mat._v[3];

    return new this(m00, m01, m10, m11);
  }

  /**
   * multiply matrixes
   */
  static multiplyTo(l_mat: Matrix33, r_mat: Matrix33, outMat: MutableMatrix22) {
    const m00 = l_mat._v[0] * r_mat._v[0] + l_mat._v[2] * r_mat._v[1];
    const m10 = l_mat._v[1] * r_mat._v[0] + l_mat._v[3] * r_mat._v[1];

    const m01 = l_mat._v[0] * r_mat._v[2] + l_mat._v[2] * r_mat._v[3];
    const m11 = l_mat._v[1] * r_mat._v[2] + l_mat._v[3] * r_mat._v[3];

    return outMat.setComponents(m00, m01, m10, m11);
  }

  toString() {
    return (
      this._v[0] +
      ' ' +
      this._v[2] +
      '\n' +
      this._v[1] +
      ' ' +
      this._v[3] +
      ' \n'
    );
  }

  toStringApproximately() {
    return (
      MathUtil.financial(this._v[0]) +
      ' ' +
      MathUtil.financial(this._v[2]) +
      '\n' +
      MathUtil.financial(this._v[1]) +
      ' ' +
      MathUtil.financial(this._v[3]) +
      ' \n'
    );
  }

  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3]];
  }

  isDummy() {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(mat: Matrix22, delta: number = Number.EPSILON) {
    if (
      Math.abs(mat._v[0] - this._v[0]) < delta &&
      Math.abs(mat._v[1] - this._v[1]) < delta &&
      Math.abs(mat._v[2] - this._v[2]) < delta &&
      Math.abs(mat._v[3] - this._v[3]) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(mat: Matrix22) {
    if (
      mat._v[0] === this._v[0] &&
      mat._v[1] === this._v[1] &&
      mat._v[2] === this._v[2] &&
      mat._v[3] === this._v[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(row_i: number, column_i: number) {
    return this._v[row_i + column_i * 2];
  }

  determinant() {
    return this._v[0] * this._v[3] - this._v[1] * this._v[2];
  }

  multiplyVector(vec: Vector2) {
    const x = this._v[0] * vec._v[0] + this._v[2] * vec._v[1];
    const y = this._v[1] * vec._v[0] + this._v[3] * vec._v[1];
    return Vector2.fromCopyArray2([x, y]);
  }

  multiplyVectorTo(vec: Vector2, outVec: MutableVector2) {
    const x = this._v[0] * vec._v[0] + this._v[2] * vec._v[1];
    const y = this._v[1] * vec._v[0] + this._v[3] * vec._v[1];
    outVec._v[0] = x;
    outVec._v[1] = y;
    return outVec;
  }

  getScale() {
    return Vector2.fromCopyArray2([
      Math.hypot(this.m00, this.m01),
      Math.hypot(this.m10, this.m11),
    ]);
  }

  getScaleTo(outVec: MutableVector2) {
    outVec._v[0] = Math.hypot(this._v[0], this._v[2]);
    outVec._v[1] = Math.hypot(this._v[1], this._v[3]);
    return outVec;
  }

  clone() {
    return new (this.constructor as any)(
      this._v[0],
      this._v[2],
      this._v[1],
      this._v[3]
    ) as Matrix22;
  }
}
