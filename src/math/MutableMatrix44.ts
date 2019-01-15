import ImmutableMatrix44 from "./ImmutableMatrix44";
import {IMutableMatrix44} from "./IMatrix";
import ImmutableMatrix33 from "./ImmutableMatrix33";
import ImmutableQuaternion from "./ImmutableQuaternion";
import ImmutableRowMajarMatrix44 from "./ImmutableRowMajarMatrix44";
import Vector3 from "./Vector3";
import { CompositionType } from "../definitions/CompositionType";

const FloatArray = Float32Array;
type FloatArray = Float32Array;

export default class MutableMatrix44 extends ImmutableMatrix44 implements IMutableMatrix44 {
  constructor(m: FloatArray, isColumnMajor?:boolean, notCopyFloatArray?:boolean);
  constructor(m: Array<number>, isColumnMajor?:boolean, notCopyFloatArray?:boolean);
  constructor(m: ImmutableMatrix33, isColumnMajor?:boolean, notCopyFloatArray?:boolean);
  constructor(m: ImmutableMatrix44, isColumnMajor?:boolean, notCopyFloatArray?:boolean);
  constructor(m: ImmutableQuaternion, isColumnMajor?:boolean, notCopyFloatArray?:boolean);
  constructor(m: ImmutableRowMajarMatrix44, isColumnMajor?:boolean, notCopyFloatArray?:boolean);
  constructor(m: null);
  constructor(
    m0: number, m1: number, m2: number, m3: number,
    m4: number, m5: number, m6: number, m7: number,
    m8: number, m9: number, m10: number, m11: number,
    m12: number, m13: number, m14: number, m15: number,
    isColumnMajor?:boolean, notCopyFloatArray?:boolean);
  constructor(
    m0: any, m1?: any, m2?: any, m3?: any,
    m4?: number, m5?: number, m6?: number, m7?: number,
    m8?: number, m9?: number, m10?: number, m11?: number,
    m12?: number, m13?: number, m14?: number, m15?: number,
    isColumnMajor:boolean = false, notCopyFloatArray:boolean = false) {
      const _isColumnMajor = (arguments.length >= 16) ? isColumnMajor : m1;
      const _notCopyFloatArray = (arguments.length >= 16) ? notCopyFloatArray : m2;

    if (arguments.length >= 16) {
      super(m0, m1, m2, m3, m4!, m5!, m6!, m7!, m8!, m9!, m10!, m11!, m12!, m13!, m14!, m15!, _isColumnMajor, _notCopyFloatArray);
    } else {
      super(m0, _isColumnMajor, _notCopyFloatArray);
    }
  }

  setComponents(
    m00:number, m01:number, m02:number, m03:number,
    m10:number, m11:number, m12:number, m13:number,
    m20:number, m21:number, m22:number, m23:number,
    m30:number, m31:number, m32:number, m33:number
    ) {
    this.v[0] = m00; this.v[4] = m01; this.v[8] = m02; this.v[12] = m03;
    this.v[1] = m10; this.v[5] = m11; this.v[9] = m12; this.v[13] = m13;
    this.v[2] = m20; this.v[6] = m21; this.v[10] = m22; this.v[14] = m23;
    this.v[3] = m30; this.v[7] = m31; this.v[11] = m32; this.v[15] = m33;

    return this;
  }

  copyComponents(mat4: ImmutableMatrix44) {
    //this.setComponents.apply(this, mat4.m); // 'm' must be row major array if isColumnMajor is false
    const m = mat4.v;
    this.v[0] = m[0];
    this.v[1] = m[1];
    this.v[2] = m[2];
    this.v[3] = m[3];
    this.v[4] = m[4];
    this.v[5] = m[5];
    this.v[6] = m[6];
    this.v[7] = m[7];
    this.v[8] = m[8];
    this.v[9] = m[9];
    this.v[10] = m[10];
    this.v[11] = m[11];
    this.v[12] = m[12];
    this.v[13] = m[13];
    this.v[14] = m[14];
    this.v[15] = m[15];
  }

  static get compositionType() {
    return CompositionType.Mat4;
  }

  static dummy() {
    return new MutableMatrix44(null);
  }

  /**
   * to the identity matrix（static版）
   */
  static identity() {
    return new MutableMatrix44(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    );
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

  scale(vec: Vector3) {
    return this.setComponents(
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

    this.v[0] = zm00*yxm00;
    this.v[4] = zm00*yxm01 + zm01*yxm11;
    this.v[8] = zm00*yxm02 + zm01*yxm12;
    this.v[12] = 0;
    this.v[1] = zm10*yxm00;
    this.v[5] = zm10*yxm01 + zm11*yxm11;
    this.v[9] = zm10*yxm02 + zm11*yxm12;
    this.v[13] = 0;
    this.v[2] = zm22*yxm20;
    this.v[6] = zm22*yxm21;
    this.v[10] = zm22*yxm22;
    this.v[14] = 0;
    this.v[3] = 0;
    this.v[7] = 0;
    this.v[11] = 0;
    this.v[15] = 1;

    return this;

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


  _swap(l:Index, r:Index) {
    this.v[r] = [this.v[l], this.v[l] = this.v[r]][0]; // Swap
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
   * multiply zero matrix and zero matrix
   */
  multiply(mat: ImmutableMatrix44) {
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


  multiplyByLeft(mat:ImmutableMatrix44 | ImmutableRowMajarMatrix44) {
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

  /**
   * multiply zero matrix and zero matrix(static version)
   */
  static multiply(l_m: ImmutableMatrix44, r_m: ImmutableMatrix44) {
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

    return new MutableMatrix44(
        m00, m01, m02, m03,
        m10, m11, m12, m13,
        m20, m21, m22, m23,
        m30, m31, m32, m33
    );
  }


  /**
   * zero matrix
   */
  zero() {
    this.setComponents(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    return this;
  }


  public set m00(val) {
    this.v[0] = val;  }

  public get m00() {
    return this.v[0];
  }

  public set m10(val) {
    this.v[1] = val;
  }

  public get m10() {
    return this.v[1];
  }

  public set m20(val) {
    this.v[2] = val;
  }

  public get m20() {
    return this.v[2];
  }

  public set m30(val) {
    this.v[3] = val;
  }

  public get m30() {
    return this.v[3];
  }

  public set m01(val) {
    this.v[4] = val;
  }

  public get m01() {
    return this.v[4];
  }

  public set m11(val) {
    this.v[5] = val;
  }

  public get m11() {
    return this.v[5];
  }

  public set m21(val) {
    this.v[6] = val;
  }

  public get m21() {
    return this.v[6];
  }

  public set m31(val) {
    this.v[7] = val;
  }

  public get m31() {
    return this.v[7];
  }

  public set m02(val) {
    this.v[8] = val;
  }

  public get m02() {
    return this.v[8];
  }

  public set m12(val) {
    this.v[9] = val;
  }

  public get m12() {
    return this.v[9];
  }

  public set m22(val) {
    this.v[10] = val;
  }

  public get m22() {
    return this.v[10];
  }

  public set m32(val) {
    this.v[11] = val;
  }

  public get m32() {
    return this.v[11];
  }

  public set m03(val) {
    this.v[12] = val;
  }

  public get m03() {
    return this.v[12];
  }

  public set m13(val) {
    this.v[13] = val;
  }

  public get m13() {
    return this.v[13];
  }

  public set m23(val) {
    this.v[14] = val;
  }

  public get m23() {
    return this.v[14];
  }

  public set m33(val) {
    this.v[15] = val;
  }

  public get m33() {
    return this.v[15];
  }

}
