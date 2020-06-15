import { Vector3_ } from "./Vector3";
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

  setAt(i: number, val: number) {
    this.v[i] = val;
    return this;
  }

  setComponents(x: number, y: number, z: number) {
    this.v[0] = x;
    this.v[1] = y;
    this.v[2] = z;
    return this;
  }

  copyComponents(vec: IVector3) {
    return this.setComponents(vec.v[0], vec.v[1], vec.v[2]);
  }

  zero() {
    return this.setComponents(0, 0, 0);
  }

  one() {
    return this.setComponents(1, 1, 1);
  }

  /**
 * normalize
 */
  normalize() {
    const length = this.length();
    this.divide(length);
    return this;
  }

  /**
 * add value
 */
  add(vec: IVector3) {
    this.x += vec.x;
    this.y += vec.y;
    this.z += vec.z;
    return this;
  }

  /**
 * subtract
 */
  subtract(vec: IVector3) {
    this.x -= vec.x;
    this.y -= vec.y;
    this.z -= vec.z;
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
  multiplyVector(vec: IVector3) {
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
  divideVector(vec: IVector3) {
    if (vec.v[0] !== 0 && vec.v[1] !== 0 && vec.v[2] !== 0) {
      this.v[0] /= vec.v[0];
      this.v[1] /= vec.v[1];
      this.v[2] /= vec.v[2];
    } else {
      console.error("0 division occurred!");
      this.v[0] = vec.v[0] === 0 ? Infinity : this.v[0] / vec.v[0];
      this.v[1] = vec.v[1] === 0 ? Infinity : this.v[1] / vec.v[1];
      this.v[2] = vec.v[2] === 0 ? Infinity : this.v[2] / vec.v[2];
    }
    return this;
  }
  /**
   * cross product
   */
  cross(vec: IVector3) {
    const x = this.y * vec.z - this.z * vec.y;
    const y = this.z * vec.x - this.x * vec.z;
    const z = this.x * vec.y - this.y * vec.x;

    return this.setComponents(x, y, z);
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
    return super.clone() as MutableVector3;
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
    return super.clone() as MutableVector3d;
  }
}

export type MutableVector3f = MutableVector3;
