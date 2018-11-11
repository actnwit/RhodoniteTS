// import GLBoost from '../../globals';
import Vector3 from './Vector3';
import Matrix44 from './Matrix44';
import MathUtil from './MathUtil';
import Quaternion from './Quaternion';

export default class Matrix33 {
  m: TypedArray;
  
  constructor(m: Float32Array, isColumnMajor?:boolean);
  constructor(m: Array<number>, isColumnMajor?:boolean);
  constructor(m: Matrix33, isColumnMajor?:boolean);
  constructor(m: Matrix44, isColumnMajor?:boolean);
  constructor(m: Quaternion, isColumnMajor?:boolean);
  constructor(
    m0: number, m1:number, m2:number,
    m3:number, m4:number, m5:number,
    m6:number, m7:number, m8:number,
    isColumnMajor?:boolean);
  constructor(
    m0: any, m1:any, m2?:number,
    m3?:number, m4?:number, m5?:number,
    m6?:number, m7?:number, m8?:number,
    isColumnMajor:boolean = false)
 {
    this.m = new Float32Array(9); // Data order is column major

    const _isColumnMajor = (arguments.length === 10) ? isColumnMajor : m1;
    const m = m0; 

    if (arguments.length === 10) {
      if (_isColumnMajor === true) {
        let m = arguments;
        this.setComponents(
          m[0], m[3], m[6],
          m[1], m[4], m[7],
          m[2], m[5], m[8]);
      } else {
        this.setComponents.apply(this, arguments);  // arguments[0-8] must be row major values if isColumnMajor is false
      }
    } else if (Array.isArray(m as Array<Number>)) {
      if (_isColumnMajor === true) {
        this.setComponents(
          m[0], m[3], m[6],
          m[1], m[4], m[7],
          m[2], m[5], m[8]);
      } else {
        this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
      }
    } else if (m instanceof Float32Array) {
      if (_isColumnMajor === true) {
        this.setComponents(
          m[0], m[3], m[6],
          m[1], m[4], m[7],
          m[2], m[5], m[8]);
      } else {
        this.setComponents.apply(this, m); // 'm' must be row major array if isColumnMajor is false
      }
    } else if (!!m && typeof m.m22 !== 'undefined') {
      if (_isColumnMajor === true) {
        const _m = m as Matrix33|Matrix44; 
        this.setComponents(
          _m.m00, _m.m01, _m.m02,
          _m.m10, _m.m11, _m.m12,
          _m.m20, _m.m21, _m.m22);
      } else {
        const _m = m as Matrix33|Matrix44; 
        this.setComponents(_m.m00, _m.m01, _m.m02, _m.m10, _m.m11, _m.m12, _m.m20, _m.m21, _m.m22); // 'm' must be row major array if isColumnMajor is false
      }
    } else if (!!m && typeof (m as Quaternion).className !== 'undefined' && (m as Quaternion).className === 'Quaternion') {
      const q = m as Quaternion;
      const sx = q.x * q.x;
      const sy = q.y * q.y;
      const sz = q.z * q.z;
      const cx = q.y * q.z;
      const cy = q.x * q.z;
      const cz = q.x * q.y;
      const wx = q.w * q.x;
      const wy = q.w * q.y;
      const wz = q.w * q.z;
  
      this.setComponents(
        1.0 - 2.0 * (sy + sz), 2.0 * (cz - wz), 2.0 * (cy + wy),
        2.0 * (cz + wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx - wx),
        2.0 * (cy - wy), 2.0 * (cx + wx), 1.0 - 2.0 * (sx + sy)
      );
    } else {
      this.identity();
    }
  }

  setComponents(
    m00: number, m01: number, m02: number,
    m10: number, m11: number, m12: number,
    m20: number, m21: number, m22: number
    ) {
    this.m00 = m00; this.m01 = m01; this.m02 = m02;
    this.m10 = m10; this.m11 = m11; this.m12 = m12;
    this.m20 = m20; this.m21 = m21; this.m22 = m22;

    return this;
  }

  get className() {
    return this.constructor.name;
  }

  identity() {
    this.setComponents(
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    );
    return this;
  }

  /**
   * Make this identity matrix（static method version）
   */
  static identity() {
    return new Matrix33(
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    );
  }

  clone() {
    return new Matrix33(
      this.m[0], this.m[3], this.m[6],
      this.m[1], this.m[4], this.m[7],
      this.m[2], this.m[5], this.m[8]
    );
  }

  /**
   * Create X oriented Rotation Matrix
   */
  rotateX(radian:number) {

    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return this.setComponents(
      1, 0, 0,
      0, cos, -sin,
      0, sin, cos
    );
  }
  /**
   * Create X oriented Rotation Matrix
   */
  static rotateX(radian:number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new Matrix33(
      1, 0, 0,
      0, cos, -sin,
      0, sin, cos
    );
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  rotateY(radian:number) {

    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    this.setComponents(
      cos, 0, sin,
      0, 1, 0,
      -sin, 0, cos
    );
    return this;
  }
  /**
   * Create Y oriented Rotation Matrix
   */
  static rotateY(radian:number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new Matrix33(
      cos, 0, sin,
      0, 1, 0,
      -sin, 0, cos
    );
  }

  /**
   * Create Z oriented Rotation Matrix
   */
  rotateZ(radian:number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return this.setComponents(
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1
    );
  }
  /**
   * Create Z oriented Rotation Matrix
   */
  static rotateZ(radian:number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new Matrix33(
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1
    );
  }

  static rotateXYZ(x:number, y:number, z:number) {
    return (Matrix33.rotateZ(z).multiply(Matrix33.rotateY(y).multiply(Matrix33.rotateX(x))));
  }

  static rotate(vec3:Vector3) {
    return (Matrix33.rotateZ(vec3.z).multiply(Matrix33.rotateY(vec3.y).multiply(Matrix33.rotateX(vec3.x))));
  }

  scale(vec:Vector3) {
    return this.setComponents(
      vec.x, 0, 0,
      0, vec.y, 0,
      0, 0, vec.z
    );
  }

  static scale(vec:Vector3) {
    return new Matrix33(
      vec.x, 0, 0,
      0, vec.y, 0,
      0, 0, vec.z
    );
  }

  /**
   * zero matrix
   */
  zero() {
    this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0);
    return this;
  }

  /**
   * zero matrix(static version)
   */
  static zero() {
    return new Matrix33(0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  flatten() {
    return this.m;
  }

  flattenAsArray() {
    return [this.m[0], this.m[1], this.m[2],
      this.m[3], this.m[4], this.m[5],
      this.m[6], this.m[7], this.m[8]];
  }

  _swap(l:Index, r:Index) {
    this.m[r] = [this.m[l], this.m[l] = this.m[r]][0]; // Swap
  }

  /**
   * transpose
   */
  transpose() {
    this._swap(1, 3);
    this._swap(2, 6);
    this._swap(5, 8);

    return this;
  }

  /**
   * transpose(static version)
   */
  static transpose(mat:Matrix33) {

    var mat_t = new Matrix33(
      mat.m00, mat.m10, mat.m20,
      mat.m01, mat.m11, mat.m21,
      mat.m02, mat.m12, mat.m22
    );

    return mat_t;
  }

  multiplyVector(vec:Vector3) {
    var x = this.m00*vec.x + this.m01*vec.y + this.m02*vec.z;
    var y = this.m10*vec.x + this.m11*vec.y + this.m12*vec.z;
    var z = this.m20*vec.x + this.m21*vec.y + this.m22*vec.z;

    return new Vector3(x, y, z);
  }

  /**
   * multiply zero matrix and zero matrix
   */
  multiply(mat:Matrix33) {
    var m00 = this.m00*mat.m00 + this.m01*mat.m10 + this.m02*mat.m20;
    var m01 = this.m00*mat.m01 + this.m01*mat.m11 + this.m02*mat.m21;
    var m02 = this.m00*mat.m02 + this.m01*mat.m12 + this.m02*mat.m22;

    var m10 = this.m10*mat.m00 + this.m11*mat.m10 + this.m12*mat.m20;
    var m11 = this.m10*mat.m01 + this.m11*mat.m11 + this.m12*mat.m21;
    var m12 = this.m10*mat.m02 + this.m11*mat.m12 + this.m12*mat.m22;

    var m20 = this.m20*mat.m00 + this.m21*mat.m10 + this.m22*mat.m20;
    var m21 = this.m20*mat.m01 + this.m21*mat.m11 + this.m22*mat.m21;
    var m22 = this.m20*mat.m02 + this.m21*mat.m12 + this.m22*mat.m22;


    return this.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  /**
   * multiply zero matrix and zero matrix(static version)
   */
  static multiply(l_m:Matrix33, r_m:Matrix33) {
    var m00 = l_m.m00*r_m.m00 + l_m.m01*r_m.m10 + l_m.m02*r_m.m20;
    var m10 = l_m.m10*r_m.m00 + l_m.m11*r_m.m10 + l_m.m12*r_m.m20;
    var m20 = l_m.m20*r_m.m00 + l_m.m21*r_m.m10 + l_m.m22*r_m.m20;

    var m01 = l_m.m00*r_m.m01 + l_m.m01*r_m.m11 + l_m.m02*r_m.m21;
    var m11 = l_m.m10*r_m.m01 + l_m.m11*r_m.m11 + l_m.m12*r_m.m21;
    var m21 = l_m.m20*r_m.m01 + l_m.m21*r_m.m11 + l_m.m22*r_m.m21;

    var m02 = l_m.m00*r_m.m02 + l_m.m01*r_m.m12 + l_m.m02*r_m.m22;
    var m12 = l_m.m10*r_m.m02 + l_m.m11*r_m.m12 + l_m.m12*r_m.m22;
    var m22 = l_m.m20*r_m.m02 + l_m.m21*r_m.m12 + l_m.m22*r_m.m22;

    return new Matrix33(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  determinant() {
    return this.m00*this.m11*this.m22 + this.m10*this.m21*this.m02 + this.m20*this.m01*this.m12
      - this.m00*this.m21*this.m12 - this.m20*this.m11*this.m02 - this.m10*this.m01*this.m22;
  }

  static determinant(mat:Matrix33) {
    return mat.m00*mat.m11*mat.m22 + mat.m10*mat.m21*mat.m02 + mat.m20*mat.m01*mat.m12
      - mat.m00*mat.m21*mat.m12 - mat.m20*mat.m11*mat.m02 - mat.m10*mat.m01*mat.m22;
  }

  invert() {
    var det = this.determinant();
    var m00 = (this.m11*this.m22 - this.m12*this.m21) / det;
    var m01 = (this.m02*this.m21 - this.m01*this.m22) / det;
    var m02 = (this.m01*this.m12 - this.m02*this.m11) / det;
    var m10 = (this.m12*this.m20 - this.m10*this.m22) / det;
    var m11 = (this.m00*this.m22 - this.m02*this.m20) / det;
    var m12 = (this.m02*this.m10 - this.m00*this.m12) / det;
    var m20 = (this.m10*this.m21 - this.m11*this.m20) / det;
    var m21 = (this.m01*this.m20 - this.m00*this.m21) / det;
    var m22 = (this.m00*this.m11 - this.m01*this.m10) / det;

    return this.setComponents(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  static invert(mat:Matrix33) {
    var det = mat.determinant();
    var m00 = (mat.m11*mat.m22 - mat.m12*mat.m21) / det;
    var m01 = (mat.m02*mat.m21 - mat.m01*mat.m22) / det;
    var m02 = (mat.m01*mat.m12 - mat.m02*mat.m11) / det;
    var m10 = (mat.m12*mat.m20 - mat.m10*mat.m22) / det;
    var m11 = (mat.m00*mat.m22 - mat.m02*mat.m20) / det;
    var m12 = (mat.m02*mat.m10 - mat.m00*mat.m12) / det;
    var m20 = (mat.m10*mat.m21 - mat.m11*mat.m20) / det;
    var m21 = (mat.m01*mat.m20 - mat.m00*mat.m21) / det;
    var m22 = (mat.m00*mat.m11 - mat.m01*mat.m10) / det;

    return new Matrix33(
      m00, m01, m02,
      m10, m11, m12,
      m20, m21, m22
    );
  }

  public set m00(val) {
    this.m[0] = val;
  }

  public get m00() {
    return this.m[0];
  }

  public set m10(val) {
    this.m[1] = val;
  }

  public get m10() {
    return this.m[1];
  }

  public set m20(val) {
    this.m[2] = val;
  }

  public get m20() {
    return this.m[2];
  }


  public set m01(val) {
    this.m[3] = val;
  }

  public get m01() {
    return this.m[3];
  }

  public set m11(val) {
    this.m[4] = val;
  }

  public get m11() {
    return this.m[4];
  }

  public set m21(val) {
    this.m[5] = val;
  }

  public get m21() {
    return this.m[5];
  }

  public set m02(val) {
    this.m[6] = val;
  }

  public get m02() {
    return this.m[6];
  }

  public set m12(val) {
    this.m[7] = val;
  }

  public get m12() {
    return this.m[7];
  }

  public set m22(val) {
    this.m[8] = val;
  }

  public get m22() {
    return this.m[8];
  }

  toString() {
    return this.m00 + ' ' + this.m01 + ' ' + this.m02 + '\n' +
      this.m10 + ' ' + this.m11 + ' ' + this.m12 + '\n' +
      this.m20 + ' ' + this.m21 + ' ' + this.m22 + '\n';
  }

  nearZeroToZero(value:number) {
    if (Math.abs(value) < 0.00001) {
      value = 0;
    } else if (0.99999 < value && value < 1.00001) {
      value = 1;
    } else if (-1.00001 < value && value < -0.99999) {
      value = -1;
    }
    return value;
  }

  toStringApproximately() {
    return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + '\n' +
      this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' \n' +
      this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + '\n';
  }

  getScale() {
    return new Vector3(
      Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02),
      Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12),
      Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22)
    );
  }

  addScale(vec:Vector3) {
    this.m00 *= vec.x;
    this.m11 *= vec.y;
    this.m22 *= vec.z;

    return this;
  }
}

// GLBoost['Matrix33'] = Matrix33;
