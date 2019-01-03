//import GLBoost from '../../globals';
import Vector4 from './Vector4';
import Vector3 from './Vector3';
import Matrix33 from './Matrix33';
import Quaternion from './Quaternion';
import Matrix44 from './Matrix44';

const FloatArray = Float32Array;
type FloatArray = Float32Array;

export default class RowMajarMatrix44 {
  m: TypedArray;

  constructor(m: FloatArray, notCopyFloatArray?:Boolean);
  constructor(m: Array<number>, notCopyFloatArray?:Boolean);
  constructor(m: Matrix33, notCopyFloatArray?:Boolean);
  constructor(m: RowMajarMatrix44, notCopyFloatArray?:Boolean);
  constructor(m: Quaternion, notCopyFloatArray?:Boolean);
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
    notCopyFloatArray:Boolean = false) {

    const _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m1;

    const m = m0;

    if (m == null) {
      this.m = new FloatArray(0);
      return;
    }

    if (arguments.length >= 16) {
      this.m = new FloatArray(16); // Data order is row major
        this.setComponents.apply(this, arguments as any);
    } else if (Array.isArray(m as Array<number>)) {
      this.m = new FloatArray(16);
      this.setComponents.apply(this, m);
    } else if (m instanceof FloatArray) {
      if (_notCopyFloatArray) {
        this.m = m;
      } else {
        this.m = new FloatArray(16);
        this.setComponents.apply(this, m as any); // 'm' must be row major array if isColumnMajor is false
      }
    } else if (!!m && typeof m.m33 === 'undefined' && typeof m.m22 !== 'undefined') {
      if (_notCopyFloatArray) {
        this.m = m.m;
      } else {
        this.m = new FloatArray(16);
        this.setComponents(m.m00, m.m01, m.m02, 0, m.m10, m.m11, m.m12, 0, m.m20, m.m21, m.m22, 0, 0, 0, 0, 1); // 'm' must be row major array if isColumnMajor is false
      }
    } else if (!!m && typeof m.className !== 'undefined' && m.className === 'Quaternion') {
      this.m = new FloatArray(16);

      const sx = m.x * m.x;
      const sy = m.y * m.y;
      const sz = m.z * m.z;
      const cx = m.y * m.z;
      const cy = m.x * m.z;
      const cz = m.x * m.y;
      const wx = m.w * m.x;
      const wy = m.w * m.y;
      const wz = m.w * m.z;
  
      this.setComponents(
        1.0 - 2.0 * (sy + sz), 2.0 * (cz - wz), 2.0 * (cy + wy), 0.0,
        2.0 * (cz + wz), 1.0 - 2.0 * (sx + sz), 2.0 * (cx - wx), 0.0,
        2.0 * (cy - wy), 2.0 * (cx + wx), 1.0 - 2.0 * (sx + sy), 0.0,
        0.0, 0.0, 0.0, 1.0
      );
    } else {
      this.m = new FloatArray(16);
      this.identity();
    }
  }

  static dummy() {
    return new RowMajarMatrix44(null);
  }

  isDummy() {
    if (this.m.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  setComponents(
    m00:number, m01:number, m02:number, m03:number,
    m10:number, m11:number, m12:number, m13:number,
    m20:number, m21:number, m22:number, m23:number,
    m30:number, m31:number, m32:number, m33:number
    ) {
    this.m[0] = m00; this.m[4] = m10; this.m[8] = m20; this.m[12] = m30;
    this.m[1] = m01; this.m[5] = m11; this.m[9] = m21; this.m[13] = m31;
    this.m[2] = m02; this.m[6] = m12; this.m[10] = m22; this.m[14] = m32;
    this.m[3] = m03; this.m[7] = m13; this.m[11] = m23; this.m[15] = m33;

    return this;
  }

  copyComponents(mat4: RowMajarMatrix44) {
    //this.m.set(mat4.m);
    //this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false    
    const m = mat4;
    // this.m[0] = m[0];
    // this.m[1] = m[1];
    // this.m[2] = m[2];
    // this.m[3] = m[3];
    // this.m[4] = m[4];
    // this.m[5] = m[5];
    // this.m[6] = m[6];
    // this.m[7] = m[7];
    // this.m[8] = m[8];
    // this.m[9] = m[9];
    // this.m[10] = m[10];
    // this.m[11] = m[11];
    // this.m[12] = m[12];
    // this.m[13] = m[13];
    // this.m[14] = m[14];
    // this.m[15] = m[15];

    this.m00 = m.m00;
    this.m01 = m.m01;
    this.m02 = m.m02;
    this.m03 = m.m03;
    this.m10 = m.m10;
    this.m11 = m.m11;
    this.m12 = m.m12;
    this.m13 = m.m13;
    this.m20 = m.m20;
    this.m21 = m.m21;
    this.m22 = m.m22;
    this.m23 = m.m23;
    this.m30 = m.m30;
    this.m31 = m.m31;
    this.m32 = m.m32;
    this.m33 = m.m33;

  }

  get className() {
    return this.constructor.name;
  }

  clone() {
    return new RowMajarMatrix44(
      this.m[0], this.m[1], this.m[2], this.m[3],
      this.m[4], this.m[5], this.m[6], this.m[7],
      this.m[8], this.m[9], this.m[10], this.m[11],
      this.m[12], this.m[13], this.m[14], this.m[15]
    );
  }

  /**
   * to the identity matrix
   */
  identity() {
    this.setComponents(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
    return this;
  }

  /**
   * to the identity matrix（static版）
   */
  static identity() {
    return new RowMajarMatrix44(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
  }

  isEqual(mat: RowMajarMatrix44, delta: number = Number.EPSILON) {
    if (Math.abs(mat.m[0] - this.m[0]) < delta &&
      Math.abs(mat.m[1] - this.m[1]) < delta &&
      Math.abs(mat.m[2] - this.m[2]) < delta &&
      Math.abs(mat.m[3] - this.m[3]) < delta &&
      Math.abs(mat.m[4] - this.m[4]) < delta &&
      Math.abs(mat.m[5] - this.m[5]) < delta &&
      Math.abs(mat.m[6] - this.m[6]) < delta &&
      Math.abs(mat.m[7] - this.m[7]) < delta &&
      Math.abs(mat.m[8] - this.m[8]) < delta &&
      Math.abs(mat.m[9] - this.m[9]) < delta &&
      Math.abs(mat.m[10] - this.m[10]) < delta &&
      Math.abs(mat.m[11] - this.m[11]) < delta &&
      Math.abs(mat.m[12] - this.m[12]) < delta &&
      Math.abs(mat.m[13] - this.m[13]) < delta &&
      Math.abs(mat.m[14] - this.m[14]) < delta &&
      Math.abs(mat.m[15] - this.m[15]) < delta) {
      return true;
    } else {
      return false;
    }
  }

  translate(vec: Vector3) {
    return this.setComponents(
      1, 0, 0, vec.x,
      0, 1, 0, vec.y,
      0, 0, 1, vec.z,
      0, 0, 0, 1
    );
  }

  putTranslate(vec: Vector3) {
    this.m03 = vec.x;
    this.m13 = vec.y;
    this.m23 = vec.z;
  }

  getTranslate() {
    return new Vector3(this.m03, this.m13, this.m23);
  }

  static translate(vec:Vector3) {
    return new RowMajarMatrix44(
      1, 0, 0, vec.x,
      0, 1, 0, vec.y,
      0, 0, 1, vec.z,
      0, 0, 0, 1
    );
  }

  scale(vec: Vector3) {
    return this.setComponents(
      vec.x, 0, 0, 0,
      0, vec.y, 0, 0,
      0, 0, vec.z, 0,
      0, 0, 0, 1
    );
  }

  static scale(vec: Vector3) {
    return new RowMajarMatrix44(
      vec.x, 0, 0, 0,
      0, vec.y, 0, 0,
      0, 0, vec.z, 0,
      0, 0, 0, 1
    );
  }

  addScale(vec: Vector3) {
    this.m00 *= vec.x;
    this.m11 *= vec.y;
    this.m22 *= vec.z;

    return this;
  }

  /**
   * Create X oriented Rotation Matrix
   */
  rotateX(radian:number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return this.setComponents(
      1, 0, 0, 0,
      0, cos, -sin, 0,
      0, sin, cos, 0,
      0, 0, 0, 1
    );
  }
  /**
   * Create X oriented Rotation Matrix
  */
  static rotateX(radian:number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new RowMajarMatrix44(
      1, 0, 0, 0,
      0, cos, -sin, 0,
      0, sin, cos, 0,
      0, 0, 0, 1
    );
  }

  /**
   * Create Y oriented Rotation Matrix
   */
  rotateY(radian:number) {
    
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return this.setComponents(
      cos, 0, sin, 0,
      0, 1, 0, 0,
      -sin, 0, cos, 0,
      0, 0, 0, 1
    );
  }
  /**
   * Create Y oriented Rotation Matrix
   */
  static rotateY(radian: number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new RowMajarMatrix44(
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
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return this.setComponents(
      cos, -sin, 0, 0,
      sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }
  /**
   * Create Z oriented Rotation Matrix
   */
  static rotateZ(radian: number) {
    var cos = Math.cos(radian);
    var sin = Math.sin(radian);
    return new RowMajarMatrix44(
      cos, -sin, 0, 0,
      sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    );
  }

  rotateXYZ(x: number, y: number, z: number) {
    var cosX = Math.cos(x);
    var sinX = Math.sin(x);
    var cosY = Math.cos(y);
    var sinY = Math.sin(y);
    var cosZ = Math.cos(z);
    var sinZ = Math.sin(z);

    const xm00 = 1;
    //const xm01 = 0;
    //const xm02 = 0;
    //const xm10 = 0;
    const xm11 = cosX;
    const xm12 = -sinX;
    //const xm20 = 0;
    const xm21 = sinX;
    const xm22 = cosX;

    const ym00 = cosY;
    //const ym01 = 0;
    const ym02 = sinY;
    //const ym10 = 0;
    const ym11 = 1;
    //const ym12 = 0;
    const ym20 = -sinY;
    //const ym21 = 0;
    const ym22 = cosY;

    const zm00 = cosZ;
    const zm01 = -sinZ;
    //const zm02 = 0;
    const zm10 = sinZ;
    const zm11 = cosZ;
    //const zm12 = 0;
    //const zm20 = 0;
    //const zm21 = 0;
    const zm22 = 1;

    const yxm00 = ym00*xm00;
    const yxm01 = ym02*xm21;
    const yxm02 = ym02*xm22;
    //const yxm10 = 0;
    const yxm11 = ym11*xm11;
    const yxm12 = ym11*xm12;
    const yxm20 = ym20*xm00;
    const yxm21 = ym22*xm21;
    const yxm22 = ym22*xm22;

    this.m[0] = zm00*yxm00;
    this.m[1] = zm00*yxm01 + zm01*yxm11;
    this.m[2] = zm00*yxm02 + zm01*yxm12;
    this.m[3] = 0;
    this.m[4] = zm10*yxm00;
    this.m[5] = zm10*yxm01 + zm11*yxm11;
    this.m[6] = zm10*yxm02 + zm11*yxm12;
    this.m[7] = 0;
    this.m[8] = zm22*yxm20;
    this.m[9] = zm22*yxm21;
    this.m[10] = zm22*yxm22;
    this.m[11] = 0;
    this.m[12] = 0;
    this.m[13] = 0;
    this.m[14] = 0;
    this.m[15] = 1;

    return this;


    //return new RowMajarMatrix44(Matrix33.rotateXYZ(x, y, z));
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
      rotate = new Vector3(x, y, z);
    } else if (this.m20 === -1.0) {
      rotate = new Vector3(Math.atan2(this.m01, this.m02), Math.PI/2.0, 0.0);
    } else {
      rotate = new Vector3(Math.atan2(-this.m01, -this.m02), -Math.PI/2.0, 0.0);
    }

    return rotate;
  }

  /**
   * ゼロ行列
   */
  zero() {
    this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    return this;
  }

  static zero() {
    return new RowMajarMatrix44(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }

  flatten() {
    return this.m;
  }

  flattenAsArray() {
    return [this.m[0], this.m[1], this.m[2], this.m[3],
      this.m[4], this.m[5], this.m[6], this.m[7],
      this.m[8], this.m[9], this.m[10], this.m[11],
      this.m[12], this.m[13], this.m[14], this.m[15]];
  }

  _swap(l:Index, r:Index) {
    this.m[r] = [this.m[l], this.m[l] = this.m[r]][0]; // Swap
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

  /**
   * transpose(static version)
   */
  static transpose(mat: RowMajarMatrix44) {

    var mat_t = new RowMajarMatrix44(
      mat.m00, mat.m10, mat.m20, mat.m30,
      mat.m01, mat.m11, mat.m21, mat.m31,
      mat.m02, mat.m12, mat.m22, mat.m32,
      mat.m03, mat.m13, mat.m23, mat.m33
    );

    return mat_t;
  }

  multiplyVector(vec: Vector4) {
    var x = this.m00*vec.x + this.m01*vec.y + this.m02*vec.z + this.m03*vec.w;
    var y = this.m10*vec.x + this.m11*vec.y + this.m12*vec.z + this.m13*vec.w;
    var z = this.m20*vec.x + this.m21*vec.y + this.m22*vec.z + this.m23*vec.w;
    var w = this.m30*vec.x + this.m31*vec.y + this.m32*vec.z + this.m33*vec.w;

    return new Vector4(x, y, z, w);
  }

  /**
   * multiply zero matrix and zero matrix
   */
  multiply(mat: RowMajarMatrix44) {
    var m00 = this.m00*mat.m00 + this.m01*mat.m10 + this.m02*mat.m20 + this.m03*mat.m30;
    var m01 = this.m00*mat.m01 + this.m01*mat.m11 + this.m02*mat.m21 + this.m03*mat.m31;
    var m02 = this.m00*mat.m02 + this.m01*mat.m12 + this.m02*mat.m22 + this.m03*mat.m32;
    var m03 = this.m00*mat.m03 + this.m01*mat.m13 + this.m02*mat.m23 + this.m03*mat.m33;

    var m10 = this.m10*mat.m00 + this.m11*mat.m10 + this.m12*mat.m20 + this.m13*mat.m30;
    var m11 = this.m10*mat.m01 + this.m11*mat.m11 + this.m12*mat.m21 + this.m13*mat.m31;
    var m12 = this.m10*mat.m02 + this.m11*mat.m12 + this.m12*mat.m22 + this.m13*mat.m32;
    var m13 = this.m10*mat.m03 + this.m11*mat.m13 + this.m12*mat.m23 + this.m13*mat.m33;

    var m20 = this.m20*mat.m00 + this.m21*mat.m10 + this.m22*mat.m20 + this.m23*mat.m30;
    var m21 = this.m20*mat.m01 + this.m21*mat.m11 + this.m22*mat.m21 + this.m23*mat.m31;
    var m22 = this.m20*mat.m02 + this.m21*mat.m12 + this.m22*mat.m22 + this.m23*mat.m32;
    var m23 = this.m20*mat.m03 + this.m21*mat.m13 + this.m22*mat.m23 + this.m23*mat.m33;

    var m30 = this.m30*mat.m00 + this.m31*mat.m10 + this.m32*mat.m20 + this.m33*mat.m30;
    var m31 = this.m30*mat.m01 + this.m31*mat.m11 + this.m32*mat.m21 + this.m33*mat.m31;
    var m32 = this.m30*mat.m02 + this.m31*mat.m12 + this.m32*mat.m22 + this.m33*mat.m32;
    var m33 = this.m30*mat.m03 + this.m31*mat.m13 + this.m32*mat.m23 + this.m33*mat.m33;

    return this.setComponents(
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33
    );
  }

  multiplyByLeft(mat: RowMajarMatrix44) {
    var m00 = mat.m00*this.m00 + mat.m01*this.m10 + mat.m02*this.m20 + mat.m03*this.m30;
    var m01 = mat.m00*this.m01 + mat.m01*this.m11 + mat.m02*this.m21 + mat.m03*this.m31;
    var m02 = mat.m00*this.m02 + mat.m01*this.m12 + mat.m02*this.m22 + mat.m03*this.m32;
    var m03 = mat.m00*this.m03 + mat.m01*this.m13 + mat.m02*this.m23 + mat.m03*this.m33;

    var m10 = mat.m10*this.m00 + mat.m11*this.m10 + mat.m12*this.m20 + mat.m13*this.m30;
    var m11 = mat.m10*this.m01 + mat.m11*this.m11 + mat.m12*this.m21 + mat.m13*this.m31;
    var m12 = mat.m10*this.m02 + mat.m11*this.m12 + mat.m12*this.m22 + mat.m13*this.m32;
    var m13 = mat.m10*this.m03 + mat.m11*this.m13 + mat.m12*this.m23 + mat.m13*this.m33;

    var m20 = mat.m20*this.m00 + mat.m21*this.m10 + mat.m22*this.m20 + mat.m23*this.m30;
    var m21 = mat.m20*this.m01 + mat.m21*this.m11 + mat.m22*this.m21 + mat.m23*this.m31;
    var m22 = mat.m20*this.m02 + mat.m21*this.m12 + mat.m22*this.m22 + mat.m23*this.m32;
    var m23 = mat.m20*this.m03 + mat.m21*this.m13 + mat.m22*this.m23 + mat.m23*this.m33;

    var m30 = mat.m30*this.m00 + mat.m31*this.m10 + mat.m32*this.m20 + mat.m33*this.m30;
    var m31 = mat.m30*this.m01 + mat.m31*this.m11 + mat.m32*this.m21 + mat.m33*this.m31;
    var m32 = mat.m30*this.m02 + mat.m31*this.m12 + mat.m32*this.m22 + mat.m33*this.m32;
    var m33 = mat.m30*this.m03 + mat.m31*this.m13 + mat.m32*this.m23 + mat.m33*this.m33;

    return this.setComponents(
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33
    );
  }

  /**
   * multiply zero matrix and zero matrix(static version)
   */
  static multiply(l_m: RowMajarMatrix44, r_m: RowMajarMatrix44) {
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

    return new RowMajarMatrix44(
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

  static determinant(mat: RowMajarMatrix44) {
    return mat.m00*mat.m11*mat.m22*mat.m33 + mat.m00*mat.m12*mat.m23*mat.m31 + mat.m00*mat.m13*mat.m21*mat.m32 +
      mat.m01*mat.m10*mat.m23*mat.m32 + mat.m01*mat.m12*mat.m20*mat.m33 + mat.m01*mat.m13*mat.m22*mat.m30 +
      mat.m02*mat.m10*mat.m21*mat.m33 + mat.m02*mat.m11*mat.m23*mat.m30 + mat.m02*mat.m13*mat.m20*mat.m31 +
      mat.m03*mat.m10*mat.m22*mat.m31 + mat.m03*mat.m11*mat.m20*mat.m32 + mat.m03*mat.m12*mat.m21*mat.m30 -

      mat.m00*mat.m11*mat.m23*mat.m32 - mat.m00*mat.m12*mat.m21*mat.m33 - mat.m00*mat.m13*mat.m22*mat.m31 -
      mat.m01*mat.m10*mat.m22*mat.m33 - mat.m01*mat.m12*mat.m23*mat.m30 - mat.m01*mat.m13*mat.m20*mat.m32 -
      mat.m02*mat.m10*mat.m23*mat.m31 - mat.m02*mat.m11*mat.m20*mat.m33 - mat.m02*mat.m13*mat.m21*mat.m30 -
      mat.m03*mat.m10*mat.m21*mat.m32 - mat.m03*mat.m11*mat.m22*mat.m30 - mat.m03*mat.m12*mat.m20*mat.m31;
  }

  invert() {
    var det = this.determinant();
    var m00 = (this.m11*this.m22*this.m33 + this.m12*this.m23*this.m31 + this.m13*this.m21*this.m32 - this.m11*this.m23*this.m32 - this.m12*this.m21*this.m33 - this.m13*this.m22*this.m31) / det;
    var m01 = (this.m01*this.m23*this.m32 + this.m02*this.m21*this.m33 + this.m03*this.m22*this.m31 - this.m01*this.m22*this.m33 - this.m02*this.m23*this.m31 - this.m03*this.m21*this.m32) / det;
    var m02 = (this.m01*this.m12*this.m33 + this.m02*this.m13*this.m31 + this.m03*this.m11*this.m32 - this.m01*this.m13*this.m32 - this.m02*this.m11*this.m33 - this.m03*this.m12*this.m31) / det;
    var m03 = (this.m01*this.m13*this.m22 + this.m02*this.m11*this.m23 + this.m03*this.m12*this.m21 - this.m01*this.m12*this.m23 - this.m02*this.m13*this.m21 - this.m03*this.m11*this.m22) / det;
    var m10 = (this.m10*this.m23*this.m32 + this.m12*this.m20*this.m33 + this.m13*this.m22*this.m30 - this.m10*this.m22*this.m33 - this.m12*this.m23*this.m30 - this.m13*this.m20*this.m32) / det;
    var m11 = (this.m00*this.m22*this.m33 + this.m02*this.m23*this.m30 + this.m03*this.m20*this.m32 - this.m00*this.m23*this.m32 - this.m02*this.m20*this.m33 - this.m03*this.m22*this.m30) / det;
    var m12 = (this.m00*this.m13*this.m32 + this.m02*this.m10*this.m33 + this.m03*this.m12*this.m30 - this.m00*this.m12*this.m33 - this.m02*this.m13*this.m30 - this.m03*this.m10*this.m32) / det;
    var m13 = (this.m00*this.m12*this.m23 + this.m02*this.m13*this.m20 + this.m03*this.m10*this.m22 - this.m00*this.m13*this.m22 - this.m02*this.m10*this.m23 - this.m03*this.m12*this.m20) / det;
    var m20 = (this.m10*this.m21*this.m33 + this.m11*this.m23*this.m30 + this.m13*this.m20*this.m31 - this.m10*this.m23*this.m31 - this.m11*this.m20*this.m33 - this.m13*this.m21*this.m30) / det;
    var m21 = (this.m00*this.m23*this.m31 + this.m01*this.m20*this.m33 + this.m03*this.m21*this.m30 - this.m00*this.m21*this.m33 - this.m01*this.m23*this.m30 - this.m03*this.m20*this.m31) / det;
    var m22 = (this.m00*this.m11*this.m33 + this.m01*this.m13*this.m30 + this.m03*this.m10*this.m31 - this.m00*this.m13*this.m31 - this.m01*this.m10*this.m33 - this.m03*this.m11*this.m30) / det;
    var m23 = (this.m00*this.m13*this.m21 + this.m01*this.m10*this.m23 + this.m03*this.m11*this.m20 - this.m00*this.m11*this.m23 - this.m01*this.m13*this.m20 - this.m03*this.m10*this.m21) / det;
    var m30 = (this.m10*this.m22*this.m31 + this.m11*this.m20*this.m32 + this.m12*this.m21*this.m30 - this.m10*this.m21*this.m32 - this.m11*this.m22*this.m30 - this.m12*this.m20*this.m31) / det;
    var m31 = (this.m00*this.m21*this.m32 + this.m01*this.m22*this.m30 + this.m02*this.m20*this.m31 - this.m00*this.m22*this.m31 - this.m01*this.m20*this.m32 - this.m02*this.m21*this.m30) / det;
    var m32 = (this.m00*this.m12*this.m31 + this.m01*this.m10*this.m32 + this.m02*this.m11*this.m30 - this.m00*this.m11*this.m32 - this.m01*this.m12*this.m30 - this.m02*this.m10*this.m31) / det;
    var m33 = (this.m00*this.m11*this.m22 + this.m01*this.m12*this.m20 + this.m02*this.m10*this.m21 - this.m00*this.m12*this.m21 - this.m01*this.m10*this.m22 - this.m02*this.m11*this.m20) / det;

    return this.setComponents(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  static invert(mat: RowMajarMatrix44) {
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

    return new RowMajarMatrix44(
      m00, m01, m02, m03,
      m10, m11, m12, m13,
      m20, m21, m22, m23,
      m30, m31, m32, m33
    );
  }

  public set m00(val) {
    this.m[0] = val;  }

  public get m00() {
    return this.m[0];
  }

  public set m01(val) {
    this.m[1] = val;
  }

  public get m01() {
    return this.m[1];
  }

  public set m02(val) {
    this.m[2] = val;
  }

  public get m02() {
    return this.m[2];
  }

  public set m03(val) {
    this.m[3] = val;
  }

  public get m03() {
    return this.m[3];
  }

  public set m10(val) {
    this.m[4] = val;
  }

  public get m10() {
    return this.m[4];
  }

  public set m11(val) {
    this.m[5] = val;
  }

  public get m11() {
    return this.m[5];
  }

  public set m12(val) {
    this.m[6] = val;
  }

  public get m12() {
    return this.m[6];
  }

  public set m13(val) {
    this.m[7] = val;
  }

  public get m13() {
    return this.m[7];
  }

  public set m20(val) {
    this.m[8] = val;
  }

  public get m20() {
    return this.m[8];
  }

  public set m21(val) {
    this.m[9] = val;
  }

  public get m21() {
    return this.m[9];
  }

  public set m22(val) {
    this.m[10] = val;
  }

  public get m22() {
    return this.m[10];
  }

  public set m23(val) {
    this.m[11] = val;
  }

  public get m23() {
    return this.m[11];
  }

  public set m30(val) {
    this.m[12] = val;
  }

  public get m30() {
    return this.m[12];
  }

  public set m31(val) {
    this.m[13] = val;
  }

  public get m31() {
    return this.m[13];
  }

  public set m32(val) {
    this.m[14] = val;
  }

  public get m32() {
    return this.m[14];
  }

  public set m33(val) {
    this.m[15] = val;
  }

  public get m33() {
    return this.m[15];
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
    return new Vector3(
      Math.sqrt(this.m00 * this.m00 + this.m01 * this.m01 + this.m02 * this.m02),
      Math.sqrt(this.m10 * this.m10 + this.m11 * this.m11 + this.m12 * this.m12),
      Math.sqrt(this.m20 * this.m20 + this.m21 * this.m21 + this.m22 * this.m22)
    );
  }

  getRotate() {
    const quat = Quaternion.fromMatrix(this);
    const rotateMat = new RowMajarMatrix44(quat);
    return rotateMat;
  }
}

