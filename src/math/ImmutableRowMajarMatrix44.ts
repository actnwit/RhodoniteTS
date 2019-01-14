//import GLBoost from '../../globals';
import Vector4 from './ImmutableVector4';
import ImmutableVector3 from './ImmutableVector3';
import ImmutableMatrix33 from './ImmutableMatrix33';
import ImmutableQuaternion from './ImmutableQuaternion';
import ImmutableMatrix44 from './ImmutableMatrix44';
import ImmutableVector4 from './ImmutableVector4';
import { CompositionType } from '../definitions/CompositionType';

const FloatArray = Float32Array;
type FloatArray = Float32Array;

export default class ImmutableRowMajarMatrix44 {
  v: TypedArray;

  constructor(m: FloatArray, notCopyFloatArray?:Boolean);
  constructor(m: Array<number>, notCopyFloatArray?:Boolean);
  constructor(m: ImmutableMatrix33, notCopyFloatArray?:Boolean);
  constructor(m: ImmutableRowMajarMatrix44, notCopyFloatArray?:Boolean);
  constructor(m: ImmutableQuaternion, notCopyFloatArray?:Boolean);
  constructor(m: null);
  constructor(
    m0: number, m1: number, m2: number, m3: number,
    m4: number, m5: number, m6: number, m7: number,
    m8: number, m9: number, m10: number, m11: number,
    m12: number, m13: number, m14: number, m15: number,
    notCopyFloatArray?:Boolean);
    constructor(
      m0: any, m1?: any, m2?: any, m3?: any,
      m4?: number, m5?: number, m6?: number, m7?: number,
      m8?: number, m9?: number, m10?: number, m11?: number,
      m12?: number, m13?: number, m14?: number, m15?: number,
      notCopyFloatArray:boolean = false) {

    const _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m1;

    const m = m0;

    if (m == null) {
      this.v = new FloatArray(0);
      return;
    }

    if (arguments.length >= 16) {
      let m = arguments;
      this.v = new FloatArray(16); // Data order is row major
      this.v[0] = m[0]; this.v[4] = m[4]; this.v[8] = m[8]; this.v[12] = m[12];
      this.v[1] = m[1]; this.v[5] = m[5]; this.v[9] = m[9]; this.v[13] = m[13];
      this.v[2] = m[2]; this.v[6] = m[6]; this.v[10] = m[10]; this.v[14] = m[14];
      this.v[3] = m[3]; this.v[7] = m[7]; this.v[11] = m[11]; this.v[15] = m[15];
    } else if (Array.isArray(m as Array<number>)) {
      this.v = new FloatArray(16);
      this.v[0] = m[0]; this.v[4] = m[4]; this.v[8] = m[8]; this.v[12] = m[12];
      this.v[1] = m[1]; this.v[5] = m[5]; this.v[9] = m[9]; this.v[13] = m[13];
      this.v[2] = m[2]; this.v[6] = m[6]; this.v[10] = m[10]; this.v[14] = m[14];
      this.v[3] = m[3]; this.v[7] = m[7]; this.v[11] = m[11]; this.v[15] = m[15];
    } else if (m instanceof FloatArray) {
      if (_notCopyFloatArray) {
        this.v = m;
      } else {
        this.v = new FloatArray(16);
        this.v[0] = m[0]; this.v[4] = m[4]; this.v[8] = m[8]; this.v[12] = m[12];
        this.v[1] = m[1]; this.v[5] = m[5]; this.v[9] = m[9]; this.v[13] = m[13];
        this.v[2] = m[2]; this.v[6] = m[6]; this.v[10] = m[10]; this.v[14] = m[14];
        this.v[3] = m[3]; this.v[7] = m[7]; this.v[11] = m[11]; this.v[15] = m[15];
      }
    } else if (!!m && typeof m.m33 !== 'undefined' && typeof m.m22 !== 'undefined') {
      if (_notCopyFloatArray) {
        this.v = m.v;
      } else {
        this.v = new FloatArray(16);
        this.v[0] = m.m00; this.v[4] = m.m10; this.v[8] = m.m20; this.v[12] = m.m30;
        this.v[1] = m.m01; this.v[5] = m.m11; this.v[9] = m.m21; this.v[13] = m.m31;
        this.v[2] = m.m02; this.v[6] = m.m12; this.v[10] = m.m22; this.v[14] = m.m32;
        this.v[3] = m.m03; this.v[7] = m.m13; this.v[11] = m.m23; this.v[15] = m.m33;
      }
    } else if (!!m && typeof m.m33 === 'undefined' && typeof m.m22 !== 'undefined') {
      if (_notCopyFloatArray) {
        this.v = m.v;
      } else {
        this.v = new FloatArray(16);
        this.v[0] = m.m00; this.v[4] = m.m10; this.v[8] = m.m20; this.v[12] = 0;
        this.v[1] = m.m01; this.v[5] = m.m11; this.v[9] = m.m21; this.v[13] = 0;
        this.v[2] = m.m02; this.v[6] = m.m12; this.v[10] = m.m22; this.v[14] = 0;
        this.v[3] = 0; this.v[7] = 0; this.v[11] = 0; this.v[15] = 1;
      }
    } else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
      this.v = new FloatArray(16);

      const sx = m.x * m.x;
      const sy = m.y * m.y;
      const sz = m.z * m.z;
      const cx = m.y * m.z;
      const cy = m.x * m.z;
      const cz = m.x * m.y;
      const wx = m.w * m.x;
      const wy = m.w * m.y;
      const wz = m.w * m.z;

      this.v[0] = 1.0 - 2.0 * (sy + sz); this.v[1] = 2.0 * (cz - wz); this.v[2] = 2.0 * (cy + wy); this.v[3] = 0;
      this.v[4] = 2.0 * (cz + wz); this.v[5] = 1.0 - 2.0 * (sx + sz); this.v[6] = 2.0 * (cx - wx); this.v[7] = 0;
      this.v[8] = 2.0 * (cy - wy); this.v[9] = 2.0 * (cx + wx); this.v[10] = 1.0 - 2.0 * (sx + sy); this.v[11] = 0;
      this.v[12] = 0; this.v[13] = 0; this.v[14] = 0; this.v[15] = 1;
    } else {
      this.v = new FloatArray(16);
      this.v[0] = 1; this.v[4] = 0; this.v[8] = 0; this.v[12] = 0;
      this.v[1] = 0; this.v[5] = 1; this.v[9] = 0; this.v[13] = 0;
      this.v[2] = 0; this.v[6] = 0; this.v[10] = 1; this.v[14] = 0;
      this.v[3] = 0; this.v[7] = 0; this.v[11] = 0; this.v[15] = 1;
    }
  }

  static dummy() {
    return new ImmutableRowMajarMatrix44(null);
  }

  static get compositionType() {
    return CompositionType.Mat4;
  }


  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }


  get className() {
    return this.constructor.name;
  }

  clone() {
    return new ImmutableRowMajarMatrix44(
      this.v[0], this.v[1], this.v[2], this.v[3],
      this.v[4], this.v[5], this.v[6], this.v[7],
      this.v[8], this.v[9], this.v[10], this.v[11],
      this.v[12], this.v[13], this.v[14], this.v[15]
    );
  }

  /**
   * to the identity matrix（static版）
   */
  static identity() {
    return new ImmutableRowMajarMatrix44(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
  }

  isEqual(mat: ImmutableRowMajarMatrix44, delta: number = Number.EPSILON) {
    if (Math.abs(mat.v[0] - this.v[0]) < delta &&
      Math.abs(mat.v[1] - this.v[1]) < delta &&
      Math.abs(mat.v[2] - this.v[2]) < delta &&
      Math.abs(mat.v[3] - this.v[3]) < delta &&
      Math.abs(mat.v[4] - this.v[4]) < delta &&
      Math.abs(mat.v[5] - this.v[5]) < delta &&
      Math.abs(mat.v[6] - this.v[6]) < delta &&
      Math.abs(mat.v[7] - this.v[7]) < delta &&
      Math.abs(mat.v[8] - this.v[8]) < delta &&
      Math.abs(mat.v[9] - this.v[9]) < delta &&
      Math.abs(mat.v[10] - this.v[10]) < delta &&
      Math.abs(mat.v[11] - this.v[11]) < delta &&
      Math.abs(mat.v[12] - this.v[12]) < delta &&
      Math.abs(mat.v[13] - this.v[13]) < delta &&
      Math.abs(mat.v[14] - this.v[14]) < delta &&
      Math.abs(mat.v[15] - this.v[15]) < delta) {
      return true;
    } else {
      return false;
    }
  }

  getTranslate() {
    return new ImmutableVector3(this.m03, this.m13, this.m23);
  }

  static translate(vec:ImmutableVector3) {
    return new ImmutableRowMajarMatrix44(
      1, 0, 0, vec.x,
      0, 1, 0, vec.y,
      0, 0, 1, vec.z,
      0, 0, 0, 1
    );
  }

  static scale(vec: ImmutableVector3) {
    return new ImmutableRowMajarMatrix44(
      vec.x, 0, 0, 0,
      0, vec.y, 0, 0,
      0, 0, vec.z, 0,
      0, 0, 0, 1
    );
  }

  /**
   * Create X oriented Rotation Matrix
  */
  static rotateX(radian:number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new ImmutableRowMajarMatrix44(
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
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new ImmutableRowMajarMatrix44(
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
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new ImmutableRowMajarMatrix44(
      cos, -sin, 0, 0,
      sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  /**
   * @return Euler Angles Rotation (x, y, z)
   */
  toEulerAngles() {
    let rotate = null;
    if (Math.abs(this.m20) != 1.0) {
      let y   = -Math.asin(this.m20);
      let x  = Math.atan2(this.m21 / Math.cos(y), this.m22 / Math.cos(y));
      let z = Math.atan2(this.m10 / Math.cos(y), this.m00 / Math.cos(y));
      rotate = new ImmutableVector3(x, y, z);
    } else if (this.m20 === -1.0) {
      rotate = new ImmutableVector3(Math.atan2(this.m01, this.m02), Math.PI/2.0, 0.0);
    } else {
      rotate = new ImmutableVector3(Math.atan2(-this.m01, -this.m02), -Math.PI/2.0, 0.0);
    }

    return rotate;
  }


  static zero() {
    return new ImmutableRowMajarMatrix44(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  raw() {
    return this.v;
  }

  flattenAsArray() {
    return [this.v[0], this.v[1], this.v[2], this.v[3],
      this.v[4], this.v[5], this.v[6], this.v[7],
      this.v[8], this.v[9], this.v[10], this.v[11],
      this.v[12], this.v[13], this.v[14], this.v[15]];
  }

  /**
   * transpose(static version)
   */
  static transpose(mat: ImmutableRowMajarMatrix44) {

    var mat_t = new ImmutableRowMajarMatrix44(
      mat.m00, mat.m10, mat.m20, mat.m30,
      mat.m01, mat.m11, mat.m21, mat.m31,
      mat.m02, mat.m12, mat.m22, mat.m32,
      mat.m03, mat.m13, mat.m23, mat.m33
    );

    return mat_t;
  }

  multiplyVector(vec: ImmutableVector4) {
    var x = this.m00*vec.x + this.m01*vec.y + this.m02*vec.z + this.m03*vec.w;
    var y = this.m10*vec.x + this.m11*vec.y + this.m12*vec.z + this.m13*vec.w;
    var z = this.m20*vec.x + this.m21*vec.y + this.m22*vec.z + this.m23*vec.w;
    var w = this.m30*vec.x + this.m31*vec.y + this.m32*vec.z + this.m33*vec.w;

    return new ImmutableVector4(x, y, z, w);
  }

  /**
   * multiply zero matrix and zero matrix(static version)
   */
  static multiply(l_m: ImmutableRowMajarMatrix44, r_m: ImmutableRowMajarMatrix44) {
    var m00 = l_m.m00*r_m.m00 + l_m.m01*r_m.m10 + l_m.m02*r_m.m20 + l_m.m03*r_m.m30;
    var m10 = l_m.m10*r_m.m00 + l_m.m11*r_m.m10 + l_m.m12*r_m.m20 + l_m.m13*r_m.m30;
    var m20 = l_m.m20*r_m.m00 + l_m.m21*r_m.m10 + l_m.m22*r_m.m20 + l_m.m23*r_m.m30;
    var m30 = l_m.m30*r_m.m00 + l_m.m31*r_m.m10 + l_m.m32*r_m.m20 + l_m.m33*r_m.m30;

    var m01 = l_m.m00*r_m.m01 + l_m.m01*r_m.m11 + l_m.m02*r_m.m21 + l_m.m03*r_m.m31;
    var m11 = l_m.m10*r_m.m01 + l_m.m11*r_m.m11 + l_m.m12*r_m.m21 + l_m.m13*r_m.m31;
    var m21 = l_m.m20*r_m.m01 + l_m.m21*r_m.m11 + l_m.m22*r_m.m21 + l_m.m23*r_m.m31;
    var m31 = l_m.m30*r_m.m01 + l_m.m31*r_m.m11 + l_m.m32*r_m.m21 + l_m.m33*r_m.m31;

    var m02 = l_m.m00*r_m.m02 + l_m.m01*r_m.m12 + l_m.m02*r_m.m22 + l_m.m03*r_m.m32;
    var m12 = l_m.m10*r_m.m02 + l_m.m11*r_m.m12 + l_m.m12*r_m.m22 + l_m.m13*r_m.m32;
    var m22 = l_m.m20*r_m.m02 + l_m.m21*r_m.m12 + l_m.m22*r_m.m22 + l_m.m23*r_m.m32;
    var m32 = l_m.m30*r_m.m02 + l_m.m31*r_m.m12 + l_m.m32*r_m.m22 + l_m.m33*r_m.m32;

    var m03 = l_m.m00*r_m.m03 + l_m.m01*r_m.m13 + l_m.m02*r_m.m23 + l_m.m03*r_m.m33;
    var m13 = l_m.m10*r_m.m03 + l_m.m11*r_m.m13 + l_m.m12*r_m.m23 + l_m.m13*r_m.m33;
    var m23 = l_m.m20*r_m.m03 + l_m.m21*r_m.m13 + l_m.m22*r_m.m23 + l_m.m23*r_m.m33;
    var m33 = l_m.m30*r_m.m03 + l_m.m31*r_m.m13 + l_m.m32*r_m.m23 + l_m.m33*r_m.m33;

    return new ImmutableRowMajarMatrix44(
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33
    );
  }

  determinant() {
    return this.m00*this.m11*this.m22*this.m33 + this.m00*this.m12*this.m23*this.m31 + this.m00*this.m13*this.m21*this.m32 +
      this.m01*this.m10*this.m23*this.m32 + this.m01*this.m12*this.m20*this.m33 + this.m01*this.m13*this.m22*this.m30 +
      this.m02*this.m10*this.m21*this.m33 + this.m02*this.m11*this.m23*this.m30 + this.m02*this.m13*this.m20*this.m31 +
      this.m03*this.m10*this.m22*this.m31 + this.m03*this.m11*this.m20*this.m32 + this.m03*this.m12*this.m21*this.m30 -

      this.m00*this.m11*this.m23*this.m32 - this.m00*this.m12*this.m21*this.m33 - this.m00*this.m13*this.m22*this.m31 -
      this.m01*this.m10*this.m22*this.m33 - this.m01*this.m12*this.m23*this.m30 - this.m01*this.m13*this.m20*this.m32 -
      this.m02*this.m10*this.m23*this.m31 - this.m02*this.m11*this.m20*this.m33 - this.m02*this.m13*this.m21*this.m30 -
      this.m03*this.m10*this.m21*this.m32 - this.m03*this.m11*this.m22*this.m30 - this.m03*this.m12*this.m20*this.m31;
  }

  static determinant(mat: ImmutableRowMajarMatrix44) {
    return mat.m00*mat.m11*mat.m22*mat.m33 + mat.m00*mat.m12*mat.m23*mat.m31 + mat.m00*mat.m13*mat.m21*mat.m32 +
      mat.m01*mat.m10*mat.m23*mat.m32 + mat.m01*mat.m12*mat.m20*mat.m33 + mat.m01*mat.m13*mat.m22*mat.m30 +
      mat.m02*mat.m10*mat.m21*mat.m33 + mat.m02*mat.m11*mat.m23*mat.m30 + mat.m02*mat.m13*mat.m20*mat.m31 +
      mat.m03*mat.m10*mat.m22*mat.m31 + mat.m03*mat.m11*mat.m20*mat.m32 + mat.m03*mat.m12*mat.m21*mat.m30 -

      mat.m00*mat.m11*mat.m23*mat.m32 - mat.m00*mat.m12*mat.m21*mat.m33 - mat.m00*mat.m13*mat.m22*mat.m31 -
      mat.m01*mat.m10*mat.m22*mat.m33 - mat.m01*mat.m12*mat.m23*mat.m30 - mat.m01*mat.m13*mat.m20*mat.m32 -
      mat.m02*mat.m10*mat.m23*mat.m31 - mat.m02*mat.m11*mat.m20*mat.m33 - mat.m02*mat.m13*mat.m21*mat.m30 -
      mat.m03*mat.m10*mat.m21*mat.m32 - mat.m03*mat.m11*mat.m22*mat.m30 - mat.m03*mat.m12*mat.m20*mat.m31;
  }

  static invert(mat: ImmutableRowMajarMatrix44) {
    var det = mat.determinant();
    var m00 = (mat.m11*mat.m22*mat.m33 + mat.m12*mat.m23*mat.m31 + mat.m13*mat.m21*mat.m32 - mat.m11*mat.m23*mat.m32 - mat.m12*mat.m21*mat.m33 - mat.m13*mat.m22*mat.m31) / det;
    var m01 = (mat.m01*mat.m23*mat.m32 + mat.m02*mat.m21*mat.m33 + mat.m03*mat.m22*mat.m31 - mat.m01*mat.m22*mat.m33 - mat.m02*mat.m23*mat.m31 - mat.m03*mat.m21*mat.m32) / det;
    var m02 = (mat.m01*mat.m12*mat.m33 + mat.m02*mat.m13*mat.m31 + mat.m03*mat.m11*mat.m32 - mat.m01*mat.m13*mat.m32 - mat.m02*mat.m11*mat.m33 - mat.m03*mat.m12*mat.m31) / det;
    var m03 = (mat.m01*mat.m13*mat.m22 + mat.m02*mat.m11*mat.m23 + mat.m03*mat.m12*mat.m21 - mat.m01*mat.m12*mat.m23 - mat.m02*mat.m13*mat.m21 - mat.m03*mat.m11*mat.m22) / det;
    var m10 = (mat.m10*mat.m23*mat.m32 + mat.m12*mat.m20*mat.m33 + mat.m13*mat.m22*mat.m30 - mat.m10*mat.m22*mat.m33 - mat.m12*mat.m23*mat.m30 - mat.m13*mat.m20*mat.m32) / det;
    var m11 = (mat.m00*mat.m22*mat.m33 + mat.m02*mat.m23*mat.m30 + mat.m03*mat.m20*mat.m32 - mat.m00*mat.m23*mat.m32 - mat.m02*mat.m20*mat.m33 - mat.m03*mat.m22*mat.m30) / det;
    var m12 = (mat.m00*mat.m13*mat.m32 + mat.m02*mat.m10*mat.m33 + mat.m03*mat.m12*mat.m30 - mat.m00*mat.m12*mat.m33 - mat.m02*mat.m13*mat.m30 - mat.m03*mat.m10*mat.m32) / det;
    var m13 = (mat.m00*mat.m12*mat.m23 + mat.m02*mat.m13*mat.m20 + mat.m03*mat.m10*mat.m22 - mat.m00*mat.m13*mat.m22 - mat.m02*mat.m10*mat.m23 - mat.m03*mat.m12*mat.m20) / det;
    var m20 = (mat.m10*mat.m21*mat.m33 + mat.m11*mat.m23*mat.m30 + mat.m13*mat.m20*mat.m31 - mat.m10*mat.m23*mat.m31 - mat.m11*mat.m20*mat.m33 - mat.m13*mat.m21*mat.m30) / det;
    var m21 = (mat.m00*mat.m23*mat.m31 + mat.m01*mat.m20*mat.m33 + mat.m03*mat.m21*mat.m30 - mat.m00*mat.m21*mat.m33 - mat.m01*mat.m23*mat.m30 - mat.m03*mat.m20*mat.m31) / det;
    var m22 = (mat.m00*mat.m11*mat.m33 + mat.m01*mat.m13*mat.m30 + mat.m03*mat.m10*mat.m31 - mat.m00*mat.m13*mat.m31 - mat.m01*mat.m10*mat.m33 - mat.m03*mat.m11*mat.m30) / det;
    var m23 = (mat.m00*mat.m13*mat.m21 + mat.m01*mat.m10*mat.m23 + mat.m03*mat.m11*mat.m20 - mat.m00*mat.m11*mat.m23 - mat.m01*mat.m13*mat.m20 - mat.m03*mat.m10*mat.m21) / det;
    var m30 = (mat.m10*mat.m22*mat.m31 + mat.m11*mat.m20*mat.m32 + mat.m12*mat.m21*mat.m30 - mat.m10*mat.m21*mat.m32 - mat.m11*mat.m22*mat.m30 - mat.m12*mat.m20*mat.m31) / det;
    var m31 = (mat.m00*mat.m21*mat.m32 + mat.m01*mat.m22*mat.m30 + mat.m02*mat.m20*mat.m31 - mat.m00*mat.m22*mat.m31 - mat.m01*mat.m20*mat.m32 - mat.m02*mat.m21*mat.m30) / det;
    var m32 = (mat.m00*mat.m12*mat.m31 + mat.m01*mat.m10*mat.m32 + mat.m02*mat.m11*mat.m30 - mat.m00*mat.m11*mat.m32 - mat.m01*mat.m12*mat.m30 - mat.m02*mat.m10*mat.m31) / det;
    var m33 = (mat.m00*mat.m11*mat.m22 + mat.m01*mat.m12*mat.m20 + mat.m02*mat.m10*mat.m21 - mat.m00*mat.m12*mat.m21 - mat.m01*mat.m10*mat.m22 - mat.m02*mat.m11*mat.m20) / det;

    return new ImmutableRowMajarMatrix44(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  public get m00() {
    return this.v[0];
  }

  public get m01() {
    return this.v[1];
  }

  public get m02() {
    return this.v[2];
  }

  public get m03() {
    return this.v[3];
  }

  public get m10() {
    return this.v[4];
  }

  public get m11() {
    return this.v[5];
  }

  public get m12() {
    return this.v[6];
  }

  public get m13() {
    return this.v[7];
  }

  public get m20() {
    return this.v[8];
  }

  public get m21() {
    return this.v[9];
  }

  public get m22() {
    return this.v[10];
  }

  public get m23() {
    return this.v[11];
  }

  public get m30() {
    return this.v[12];
  }

  public get m31() {
    return this.v[13];
  }

  public get m32() {
    return this.v[14];
  }

  public get m33() {
    return this.v[15];
  }

  toString() {
    return this.m00 + ' ' + this.m01 + ' ' + this.m02 + ' ' + this.m03 + ' \n' +
      this.m10 + ' ' + this.m11 + ' ' + this.m12 + ' ' + this.m13 + ' \n' +
      this.m20 + ' ' + this.m21 + ' ' + this.m22 + ' ' + this.m23 + ' \n' +
      this.m30 + ' ' + this.m31 + ' ' + this.m32 + ' ' + this.m33 + ' \n';
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
    return this.nearZeroToZero(this.m00) + ' ' + this.nearZeroToZero(this.m01) + ' ' + this.nearZeroToZero(this.m02) + ' ' + this.nearZeroToZero(this.m03) + ' \n' +
      this.nearZeroToZero(this.m10) + ' ' + this.nearZeroToZero(this.m11) + ' ' + this.nearZeroToZero(this.m12) + ' ' + this.nearZeroToZero(this.m13) + ' \n' +
      this.nearZeroToZero(this.m20) + ' ' + this.nearZeroToZero(this.m21) + ' ' + this.nearZeroToZero(this.m22) + ' ' + this.nearZeroToZero(this.m23) + ' \n' +
      this.nearZeroToZero(this.m30) + ' ' + this.nearZeroToZero(this.m31) + ' ' + this.nearZeroToZero(this.m32) + ' ' + this.nearZeroToZero(this.m33) + ' \n';
  }

  getScale() {
    return new ImmutableVector3(
      Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02),
      Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12),
      Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22)
    );
  }

  getRotate() {
    const quat = ImmutableQuaternion.fromMatrix(this);
    const rotateMat = new ImmutableRowMajarMatrix44(quat);
    return rotateMat;
  }
}

