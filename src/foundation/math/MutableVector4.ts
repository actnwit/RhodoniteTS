import Vector2 from "./Vector2";
import Vector3 from "./Vector3";
import { Vector4_ } from "./Vector4";
import { IVector4, IMutableVector4, IVector3 } from "./IVector";
import { CompositionType } from "../definitions/CompositionType";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";

export class MutableVector4_<T extends TypedArrayConstructor> extends Vector4_<T> implements IMutableVector4 {
  constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, w: number, { type }: { type: T }) {
    super(x, y, z, w, { type });
  }

  static get compositionType() {
    return CompositionType.Vec4;
  }

  normalize() {
    var length = this.length();
    this.divide(length);

    return this;
  }

  normalize3() {
    var length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    this.x /= length;
    this.y /= length;
    this.z /= length;
    this.w /= length;

    return this;
  }

  /**
   * add value
   */
  add(v: IVector4) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    this.w += v.w;

    return this;
  }

  /**
 * add value except w component
 */
  addWithOutW(v: IVector4 | Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  subtract(v: IVector4) {
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

  multiplyVector(vec: IVector4) {
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

  divideVector(vec4: IVector4) {
    this.x /= vec4.x;
    this.y /= vec4.y;
    this.z /= vec4.z;
    this.w /= vec4.w;

    return this;
  }

  get x(): number {
    return this.v[0];
  }

  get y(): number {
    return this.v[1];
  }

  get z(): number {
    return this.v[2];
  }

  get w(): number {
    return this.v[3];
  }

  set x(x: number) {
    this.v[0] = x;
  }

  set y(y: number) {
    this.v[1] = y;
  }

  set z(z: number) {
    this.v[2] = z;
  }

  set w(w: number) {
    this.v[3] = w;
  }

  get raw() {
    return this.v;
  }

  // set w(w:number) {
  //   this.__Error();
  // }
  // get w(): number {
  //   return this.v[3];
  // }

  // get raw(): TypedArray {
  //   this.__Error();
  //   return new Float32Array(0);
  // }

  private __Error() {
    //console.error('Not available because this Vector class is immutable.');
    throw new Error('Not available because this Vector class is immutable.');
  }


}


export default class MutableVector4 extends MutableVector4_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float32Array })
  }

  clone() {
    return new MutableVector4(this.x, this.y, this.z, this.w);
  }

  static one() {
    return new MutableVector4(1, 1, 1, 1);
  }

  static dummy() {
    return new MutableVector4(null, 0, 0, 0);
  }

  static zero() {
    return new MutableVector4(0, 0, 0, 0);
  }

  static zeroWithWOne() {
    return new MutableVector4(0, 0, 0, 1);
  }
}

export class MutableVector4d extends MutableVector4_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | Vector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float64Array })
  }

  clone() {
    return new MutableVector4d(this.x, this.y, this.z, this.w);
  }

  static one() {
    return new MutableVector4d(1, 1, 1, 1);
  }

  static dummy() {
    return new MutableVector4d(null, 0, 0, 0);
  }

  static zero() {
    return new MutableVector4d(0, 0, 0, 0);
  }

  static zeroWithWOne() {
    return new MutableVector4d(0, 0, 0, 1);
  }
}

export type MutableVector4f = MutableVector4;
