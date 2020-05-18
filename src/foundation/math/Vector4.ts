import Vector2 from './Vector2';
import { IVector2, IVector3, IVector4 } from './IVector';
import { CompositionType } from '../definitions/CompositionType';
import { TypedArray, TypedArrayConstructor } from '../../commontypes/CommonTypes';
import { MathUtil } from './MathUtil';
import { MutableVector4_ } from './MutableVector4';

export class Vector4_<T extends TypedArrayConstructor> implements IVector4 {
  v: TypedArray;

  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, w: number, { type }: { type: T }) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else if (x == null) {
      this.v = new type(0);
      return;
    } else {
      this.v = new type(4);
    }

    if (Array.isArray(x)) {
      this.v[0] = x[0];
      this.v[1] = x[1];
      this.v[2] = x[2];
      this.v[3] = x[3];
    } else if (typeof (x as any).w !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = (x as any).z;
      this.v[3] = (x as any).w;
    } else if (typeof (x as any).z !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = (x as any).z
      this.v[3] = 1;
    } else if (typeof (x as any).y !== 'undefined') {
      this.v[0] = (x as any).x;
      this.v[1] = (x as any).y;
      this.v[2] = 0;
      this.v[3] = 1;
    } else {
      this.v[0] = ((x as any) as number);
      this.v[1] = ((y as any) as number);
      this.v[2] = ((z as any) as number);
      this.v[3] = ((w as any) as number);
    }
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

  get glslStrAsFloat() {
    return `vec4(${MathUtil.convertToStringAsGLSLFloat(this.x)}, ${MathUtil.convertToStringAsGLSLFloat(this.y)}, ${MathUtil.convertToStringAsGLSLFloat(this.z)}, ${MathUtil.convertToStringAsGLSLFloat(this.w)})`;
  }

  get glslStrAsInt() {
    return `ivec4(${Math.floor(this.x)}, ${Math.floor(this.y)}, ${Math.floor(this.z)}, ${Math.floor(this.w)})`;
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Vec4;
  }

  /**
   * add value（static version）
   */
  static add<T extends TypedArrayConstructor>(lv: Vector4_<T>, rv: Vector4_<T>) {
    return new (lv.constructor as any)(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.w + rv.w);
  }

  /**
 * add value（static version）
 */
  static addTo<T extends TypedArrayConstructor>(lv: Vector4_<T>, rv: Vector4_<T>, out: MutableVector4_<T>) {
    out.x = lv.x + rv.x;
    out.y = lv.y + rv.y;
    out.z = lv.z + rv.z;
    out.w = lv.w + rv.w;
    return out;
  }

  /**
   * subtract(static version)
   */
  static subtract<T extends TypedArrayConstructor>(lv: Vector4_<T>, rv: Vector4_<T>) {
    return new (lv.constructor as any)(lv.x - rv.x, lv.y - rv.y, lv.z - rv.z, lv.w - rv.w);
  }

  /**
   * subtract(static version)
   */
  static subtractTo<T extends TypedArrayConstructor>(lv: Vector4_<T>, rv: Vector4_<T>, out: MutableVector4_<T>) {
    out.x = lv.x - rv.x;
    out.y = lv.y - rv.y;
    out.z = lv.z - rv.z;
    out.w = lv.w - rv.w;

    return out;
  }

  /**
   * multiply(static version)
   */
  static multiply<T extends TypedArrayConstructor>(vec4: Vector4_<T>, val: number) {
    return new (vec4.constructor as any)(vec4.x * val, vec4.y * val, vec4.z * val, vec4.w * val);
  }

  /**
   * multiplyTo(static version)
   */
  static multiplyTo<T extends TypedArrayConstructor>(vec4: Vector4_<T>, val: number, out4: MutableVector4_<T>) {
    out4.x = vec4.x * val;
    out4.y = vec4.y * val;
    out4.z = vec4.z * val;
    out4.w = vec4.w * val;

    return out4;
  }

  /**
   * multiply vector(static version)
   */
  static multiplyVector<T extends TypedArrayConstructor>(vec4: Vector4_<T>, vec: Vector4_<T>) {
    return new (vec4.constructor as any)(vec4.x * vec.x, vec4.y * vec.y, vec4.z * vec.z, vec4.w * vec.w);
  }

  /**
   * divide(static version)
   */
  static divide<T extends TypedArrayConstructor>(vec4: Vector4_<T>, val: number) {
    if (val !== 0) {
      return new (vec4.constructor as any)(vec4.x / val, vec4.y / val, vec4.z / val, vec4.w / val);
    } else {
      console.warn("0 division occurred!");
      return new (vec4.constructor as any)(Infinity, Infinity, Infinity, Infinity);
    }
  }

  /**
   * divide vector(static version)
   */
  static divideVector<T extends TypedArrayConstructor>(lvec4: Vector4_<T>, rvec4: Vector4_<T>) {
    if (rvec4.x !== 0 && rvec4.y !== 0 && rvec4.z !== 0 && rvec4.w !== 0) {
      return new (lvec4.constructor as any)(lvec4.x / rvec4.x, lvec4.y / rvec4.y, lvec4.z / rvec4.z, lvec4.w / rvec4.w);
    } else {
      console.error("0 division occurred!");
      const x = rvec4.x === 0 ? Infinity : lvec4.x / rvec4.x;
      const y = rvec4.y === 0 ? Infinity : lvec4.y / rvec4.y;
      const z = rvec4.z === 0 ? Infinity : lvec4.z / rvec4.z;
      const w = rvec4.w === 0 ? Infinity : lvec4.w / rvec4.w;

      return new (lvec4.constructor as any)(x, y, z, w);
    }
  }

  /**
   * normalize(static version)
   */
  static normalize<T extends TypedArrayConstructor>(vec4: Vector4_<T>) {
    return (this as any).divide(vec4, vec4.length());
  }

  /**
   * dot product(static version)
   */
  static dot<T extends TypedArrayConstructor>(lv: Vector4_<T>, rv: Vector4_<T>) {
    return lv.x * rv.x + lv.y * rv.y + lv.z * rv.z + lv.w * rv.w;
  }

  static lengthBtw<T extends TypedArrayConstructor>(lhv: Vector4_<T>, rhv: Vector4_<T>) {
    const deltaX = rhv.x - lhv.x;
    const deltaY = rhv.y - lhv.y;
    const deltaZ = rhv.z - lhv.z;
    const deltaW = rhv.w - lhv.w;
    return Math.hypot(deltaX, deltaY, deltaZ, deltaW);
  }

  /**
* add value except w component（static version）
*/
  static addWithOutW<T extends TypedArrayConstructor>(lv: Vector4_<T>, rv: Vector4_<T>) {
    return new (lv.constructor as any)(lv.x + rv.x, lv.y + rv.y, lv.z + rv.z, lv.w);
  }

  /**
 * change to string
 */
  toString() {
    return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
  }

  flattenAsArray() {
    return [this.x, this.y, this.z, this.w];
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: Vector4_<T>, delta: number = Number.EPSILON) {
    if (Math.abs(vec.x - this.x) < delta &&
      Math.abs(vec.y - this.y) < delta &&
      Math.abs(vec.z - this.z) < delta &&
      Math.abs(vec.w - this.w) < delta) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(vec: Vector4_<T>): boolean {
    if (this.x === vec.x && this.y === vec.y && this.z === vec.z && this.w === vec.w) {
      return true;
    } else {
      return false;
    }
  }

  length() {
    return Math.hypot(this.x, this.y, this.z, this.w);
  }

  lengthTo(vec4: Vector4_<T>) {
    const deltaX = vec4.x - this.x;
    const deltaY = vec4.y - this.y;
    const deltaZ = vec4.z - this.z;
    const deltaW = vec4.w - this.w;
    return Math.hypot(deltaX, deltaY, deltaZ, deltaW);
  }

  squaredLength() {
    return this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w;
  }

  /**
   * dot product
   */
  dot(vec4: Vector4_<T>) {
    return this.x * vec4.x + this.y * vec4.y + this.z * vec4.z + this.w * vec4.w;
  }

}

export default class Vector4 extends Vector4_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float32Array })
  }

  static zeroWithWOne() {
    return new Vector4(0, 0, 0, 1);
  }

  static zero() {
    return new Vector4(0, 0, 0, 0);
  }

  static one() {
    return new Vector4(1, 1, 1, 1);
  }

  static dummy() {
    return new Vector4(null, 0, 0, 0);
  }

  clone() {
    return new Vector4(this.x, this.y, this.z, this.w);
  }
}

export class Vector4d extends Vector4_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | Vector2 | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float64Array })
  }

  static zeroWithWOne() {
    return new Vector4d(0, 0, 0, 1);
  }

  static zero() {
    return new Vector4d(0, 0, 0, 0);
  }

  static one() {
    return new Vector4d(1, 1, 1, 1);
  }

  static dummy() {
    return new Vector4d(null, 0, 0, 0);
  }

  clone() {
    return new Vector4d(this.x, this.y, this.z, this.w);
  }
}

export type Vector4f = Vector4;
