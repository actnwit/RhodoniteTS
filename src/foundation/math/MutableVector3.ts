import Vector3, { Vector3_ } from "./Vector3";
import { IVector2, IVector3, IVector4, IMutableVector, IMutableVector3 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";

export class MutableVector3_<T extends TypedArrayConstructor> extends Vector3_<T> implements IMutableVector, IMutableVector3 {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, { type }: { type: T }) {
    super(x, y, z, { type });
  }

  set x(x: number) {
    this.v[0] = x;
  }

  get x() {
    return this.v[0];
  }

  set y(y: number) {
    this.v[1] = y;
  }

  get y() {
    return this.v[1];
  }

  set z(z: number) {
    this.v[2] = z;
  }

  get z() {
    return this.v[2];
  }

  raw() {
    return this.v;
  }


  setAt(i: number, value: number) {
    this.v[i] = value;
    return this;
  }

  copyComponents(vec: Vector3_<T>) {
    this.v[0] = vec.v[0];
    this.v[1] = vec.v[1];
    this.v[2] = vec.v[2];
  }

  zero() {
    this.x = 0;
    this.y = 0;
    this.z = 0;

    return this;
  }

  one() {
    this.x = 1;
    this.y = 1;
    this.z = 1;

    return this;
  }

  /**
 * normalize
 */
  normalize() {
    var length = this.length();
    this.divide(length);

    return this;
  }

  /**
 * add value
 */
  add(v: Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;

    return this;
  }

  /**
 * subtract
 */
  subtract(v: Vector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;

    return this;
  }


  /**
   * multiply
   */
  multiply(val: number) {
    this.x *= val;
    this.y *= val;
    this.z *= val;

    return this;
  }

  /**
   * multiply vector
   */
  multiplyVector(vec: Vector3) {
    this.x *= vec.x;
    this.y *= vec.y;
    this.z *= vec.z;

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
    } else {
      console.error("0 division occurred!");
      this.x = Infinity;
      this.y = Infinity;
      this.z = Infinity;
    }

    return this;
  }

  /**
 * divide vector
 */
  divideVector(vec3: Vector3) {
    this.x /= vec3.x;
    this.y /= vec3.y;
    this.z /= vec3.z;

    return this;
  }

  /**
   * cross product
   */
  cross(v: Vector3) {
    var x = this.y * v.z - this.z * v.y;
    var y = this.z * v.x - this.x * v.z;
    var z = this.x * v.y - this.y * v.x;

    this.x = x;
    this.y = y;
    this.z = z;

    return this;
  }
}


export default class MutableVector3 extends MutableVector3_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number) {
    super(x, y!, z!, { type: Float32Array })
  }

  static zero() {
    return new MutableVector3(0, 0, 0);
  }

  static one() {
    return new MutableVector3(1, 1, 1);
  }

  static dummy() {
    return new MutableVector3(null, 0, 0);
  }

  clone() {
    return new MutableVector3(this.x, this.y, this.z);
  }
}

export class MutableVector3d extends MutableVector3_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number) {
    super(x, y!, z!, { type: Float64Array })
  }

  static zero() {
    return new MutableVector3d(0, 0, 0);
  }

  static one() {
    return new MutableVector3d(1, 1, 1);
  }

  static dummy() {
    return new MutableVector3d(null, 0, 0);
  }

  clone() {
    return new MutableVector3d(this.x, this.y, this.z);
  }
}

export type MutableVector3f = MutableVector3;
