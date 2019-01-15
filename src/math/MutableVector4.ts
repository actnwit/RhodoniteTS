import Vector2 from "./Vector2";
import Vector3 from "./Vector3";
import ImmutableVector4 from "./ImmutableVector4";
import {IVector4} from "./IVector";
import { CompositionType } from "../definitions/CompositionType";

export default class MutableVector4 extends ImmutableVector4 implements IVector4 {
  constructor(x: number|TypedArray|Vector2|Vector3|IVector4, y?: number, z?: number, w?: number) {
    super(x, y, z, w);

  }

  static get compositionType() {
    return CompositionType.Vec4;
  }

  normalize() {
    var length = this.length();
    this.divide(length);

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
  addWithOutW(v: IVector4|Vector3) {
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
      console.error("0 division occured!");
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

  get x():number {
    return this.v[0];
  }

  get y():number {
    return this.v[1];
  }

  get z():number {
    return this.v[2];
  }

  get w():number {
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
    //console.error('Not avavailabe because this Vector class is immutable.');
    throw new Error('Not avavailabe because this Vector class is immutable.');
  }


}
