import { IVector2, IVector3, IVector4, IMutableVector, IMutableVector4 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
import { Vector4_ } from "./Vector4";

export class MutableVector4_<T extends TypedArrayConstructor> extends Vector4_<T> implements IMutableVector, IMutableVector4 {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, w: number, { type }: { type: T }) {
    super(x, y, z, w, { type });
  }

  set x(x: number) {
    this.v[0] = x;
  }

  get x(): number {
    return this.v[0];
  }

  set y(y: number) {
    this.v[1] = y;
  }

  get y(): number {
    return this.v[1];
  }

  set z(z: number) {
    this.v[2] = z;
  }

  get z(): number {
    return this.v[2];
  }

  set w(w: number) {
    this.v[3] = w;
  }

  get w(): number {
    return this.v[3];
  }

  raw() {
    return this.v;
  }

  setAt(i: number, val: number) {
    this.v[i] = val;
    return this;
  }

  setComponents(x: number, y: number, z: number, w: number) {
    this.v[0] = x;
    this.v[1] = y;
    this.v[2] = z;
    this.v[3] = w;
    return this;
  }

  copyComponents(vec: IVector4) {
    return this.setComponents(vec.v[0], vec.v[1], vec.v[2], vec.v[3]);
  }

  zero() {
    return this.setComponents(0, 0, 0, 0);
  }

  one() {
    return this.setComponents(1, 1, 1, 1);
  }

  /**
   * normalize
   */
  normalize() {
    const length = this.length();
    this.divide(length);
    return this;
  }

  normalize3() {
    const length = Math.hypot(this.v[0], this.v[1], this.v[2]);
    this.divide(length);
    return this;
  }

  /**
   * add value
   */
  add(vec: IVector4) {
    this.x += vec.x;
    this.y += vec.y;
    this.z += vec.z;
    this.w += vec.w;
    return this;
  }

  /**
   * subtract
   */
  subtract(vec: IVector4) {
    this.x -= vec.x;
    this.y -= vec.y;
    this.z -= vec.z;
    this.w -= vec.w;
    return this;
  }

  /**
   * multiply
   */
  multiply(val: number) {
    this.x *= val;
    this.y *= val;
    this.z *= val;
    this.w *= val;
    return this;
  }

  /**
   * multiply vector
   */
  multiplyVector(vec: IVector4) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;
    this.w *= vec.w;
    return this;
  }

  /**
   * divide
   */
  divide(val: number) {
    if (val !== 0) {
      this.x /= val;
      this.y /= val;
      this.z /= val;
      this.w /= val;
    } else {
      console.error("0 division occurred!");
      this.x = Infinity;
      this.y = Infinity;
      this.z = Infinity;
      this.w = Infinity;
    }
    return this;
  }

  /**
   * divide vector
   */
  divideVector(vec: IVector4) {
    if (vec.v[0] !== 0 && vec.v[1] !== 0 && vec.v[2] !== 0 && vec.v[3] !== 0) {
      this.v[0] /= vec.v[0];
      this.v[1] /= vec.v[1];
      this.v[2] /= vec.v[2];
      this.v[3] /= vec.v[3];
    } else {
      console.error("0 division occurred!");
      this.v[0] = vec.v[0] === 0 ? Infinity : this.v[0] / vec.v[0];
      this.v[1] = vec.v[1] === 0 ? Infinity : this.v[1] / vec.v[1];
      this.v[2] = vec.v[2] === 0 ? Infinity : this.v[2] / vec.v[2];
      this.v[3] = vec.v[3] === 0 ? Infinity : this.v[3] / vec.v[3];
    }
    return this;
  }
}


export default class MutableVector4 extends MutableVector4_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float32Array })
  }

  static zero() {
    return new MutableVector4(0, 0, 0, 0);
  }

  static one() {
    return new MutableVector4(1, 1, 1, 1);
  }

  static dummy() {
    return new MutableVector4(null, 0, 0, 0);
  }

  clone() {
    return new MutableVector4(this.x, this.y, this.z, this.w);
  }
}

export class MutableVector4d extends MutableVector4_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float64Array })
  }

  static zero() {
    return new MutableVector4d(0, 0, 0, 0);
  }

  static one() {
    return new MutableVector4d(1, 1, 1, 1);
  }

  static dummy() {
    return new MutableVector4d(null, 0, 0, 0);
  }

  clone() {
    return new MutableVector4d(this.x, this.y, this.z, this.w);
  }
}

export type MutableVector4f = MutableVector4;
