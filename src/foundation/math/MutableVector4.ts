import { Vector4_ } from "./Vector4";
import { IVector2, IVector3, IVector4, IMutableVector4, } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
import { Vector3_ } from "./Vector3";

export class MutableVector4_<T extends TypedArrayConstructor> extends Vector4_<T> implements IMutableVector4 {
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

  setComponents(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  copyComponents(vec: Vector4_<T>) {
    this.x = vec.x;
    this.y = vec.y;
    this.z = vec.z;
    this.w = vec.w;
    return this;
  }

  zero() {
    return this.setComponents(0, 0, 0, 0);
  }

  one() {
    return this.setComponents(1, 1, 1, 1);
  }

  /**
   * add value
   */
  add(v: Vector4_<T>) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    this.w += v.w;

    return this;
  }

  /**
 * add value except w component
 */
  addWithOutW(v: Vector4_<T> | Vector3_<T>) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  subtract(v: Vector4_<T>) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    this.w -= v.w;

    return this;
  }

  multiply(val: number) {
    this.x *= val;
    this.y *= val;
    this.z *= val;
    this.w *= val;

    return this;
  }

  multiplyVector(vec: Vector4_<T>) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;
    this.w *= vec.w;

    return this;
  }

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

  divideVector(vec4: Vector4_<T>) {
    this.x /= vec4.x;
    this.y /= vec4.y;
    this.z /= vec4.z;
    this.w /= vec4.w;

    return this;
  }

  normalize() {
    return this.divide(this.length());
  }

  normalize3() {
    const length = Math.hypot(this.x, this.y, this.z);
    return this.divide(length);
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

  static zeroWithWOne() {
    return new MutableVector4(0, 0, 0, 1);
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

  static zeroWithWOne() {
    return new MutableVector4d(0, 0, 0, 1);
  }

  clone() {
    return new MutableVector4d(this.x, this.y, this.z, this.w);
  }
}

export type MutableVector4f = MutableVector4;
