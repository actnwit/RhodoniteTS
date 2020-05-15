import { IVector2, IVector3, IVector4 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
import { MathUtil } from "./MathUtil";
import { CompositionType } from "../definitions/CompositionType";
import { MutableVector2_ } from "./MutableVector2";

export class Vector2_<T extends TypedArrayConstructor> implements IVector2 {
  v: TypedArray;

  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, { type }: { type: T }) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else if (x == null) {
      this.v = new type(0);
      return;
    } else {
      this.v = new type(2)
    }

    this.v[0] = ((x as any) as number);
    this.v[1] = ((y as any) as number);
  }

  get x() {
    return this.v[0];
  }

  get y() {
    return this.v[1];
  }

  get glslStrAsFloat() {
    return `vec2(${MathUtil.convertToStringAsGLSLFloat(this.x)}, ${MathUtil.convertToStringAsGLSLFloat(this.y)})`;
  }

  get glslStrAsInt() {
    return `ivec2(${Math.floor(this.x)}, ${Math.floor(this.y)})`;
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Vec2;
  }

  /**
    * add value（static version）
    */
  static add<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>) {
    return new (lvec.constructor as any)(lvec.x + rvec.x, lvec.y + rvec.y);
  }

  /**
   * add value（static version）
   */
  static addTo<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>, out2: MutableVector2_<T>) {
    out2.x = lvec.x + rvec.x;
    out2.y = lvec.y + rvec.y;
    return out2;
  }

  /**
   * subtract(subtract)
   */
  static subtract<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>) {
    return new (lvec.constructor as any)(lvec.x - rvec.x, lvec.y - rvec.y);
  }

  /**
   * subtract(subtract)
   */
  static subtractTo<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>, out2: MutableVector2_<T>) {
    out2.x = lvec.x - rvec.x;
    out2.y = lvec.y - rvec.y;
    return out2;
  }

  /**
   * multiply(static version)
   */
  static multiply<T extends TypedArrayConstructor>(vec2: Vector2_<T>, val: number) {
    return new (vec2.constructor as any)(vec2.x * val, vec2.y * val);
  }

  /**
   * multiplyTo(static version)
   */
  static multiplyTo<T extends TypedArrayConstructor>(in2: Vector2_<T>, val: number, out2: MutableVector2_<T>) {
    out2.x = in2.x * val;
    out2.y = in2.y * val;

    return out2;
  }

  /**
   * multiply vector(static version)
   */
  static multiplyVector<T extends TypedArrayConstructor>(vec2: Vector2_<T>, vec: Vector2_<T>) {
    return new (vec.constructor as any)(vec2.x * vec.x, vec2.y * vec.y);
  }

  /**
   * divide(static version)
   */
  static divide<T extends TypedArrayConstructor>(vec2: Vector2_<T>, val: number) {
    if (val !== 0) {
      return new (vec2.constructor as any)(vec2.x / val, vec2.y / val);
    } else {
      console.error("0 division occurred!");
      return new (vec2.constructor as any)(Infinity, Infinity);
    }
  }

  /**
   * divide vector(static version)
   */
  static divideVector<T extends TypedArrayConstructor>(lvec2: Vector2_<T>, rvec2: Vector2_<T>) {
    if (rvec2.x !== 0 && rvec2.y !== 0) {
      return new (lvec2.constructor as any)(lvec2.x / rvec2.x, lvec2.y / rvec2.y);
    } else {
      console.error("0 division occurred!");
      const x = rvec2.x === 0 ? Infinity : lvec2.x / rvec2.x;
      const y = rvec2.y === 0 ? Infinity : lvec2.y / rvec2.y;

      return new (lvec2.constructor as any)(x, y);
    }
  }

  /**
   * normalize(static version)
   */
  static normalize<T extends TypedArrayConstructor>(vec2: Vector2_<T>) {
    const length = vec2.length();
    return (this as any).divide(vec2, length);
  }

  /**
   * dot product(static version)
   */
  static dot<T extends TypedArrayConstructor>(lv: Vector2_<T>, rv: Vector2_<T>) {
    return lv.x * rv.x + lv.y * rv.y;
  }

  static lengthBtw<T extends TypedArrayConstructor>(lhv: Vector2_<T>, rhv: Vector2_<T>) {
    const deltaX = rhv.x - lhv.x;
    const deltaY = rhv.y - lhv.y;
    return Math.hypot(deltaX, deltaY);
  }

  static angleOfVectors<T extends TypedArrayConstructor>(lhv: Vector2_<T>, rhv: Vector2_<T>) {
    const cos_sita = this.dot(lhv, rhv) / (lhv.length() * rhv.length());

    const sita = Math.acos(cos_sita);

    return sita;
  }

  /**
   * change to string
   */
  toString() {
    return '(' + this.x + ', ' + this.y + ')';
  }

  flattenAsArray() {
    return [this.x, this.y];
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: Vector2_<T>, delta: number = Number.EPSILON) {
    if (Math.abs(vec.x - this.x) < delta &&
      Math.abs(vec.y - this.y) < delta) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(vec: Vector2_<T>) {
    if (this.x === vec.x && this.y === vec.y) {
      return true;
    } else {
      return false;
    }
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  lengthTo(vec2: Vector2_<T>) {
    const deltaX = vec2.x - this.x;
    const deltaY = vec2.y - this.y;
    return Math.hypot(deltaX, deltaY);
  }

  squaredLength() {
    return this.x * this.x + this.y + this.y;
  }

  /**
   * dot product
   */
  dot(vec2: Vector2_<T>) {
    return this.x * vec2.x + this.y * vec2.y;
  }

}

export default class Vector2 extends Vector2_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number) {
    super(x, y!, { type: Float32Array })
  }

  static zero() {
    return new Vector2(0, 0);
  }

  static one() {
    return new Vector2(1, 1);
  }

  static dummy() {
    return new Vector2(null, 0);
  }

  clone() {
    return new Vector2(this.x, this.y);
  }
}

export class Vector2d extends Vector2_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number) {
    super(x, y!, { type: Float64Array })
  }

  static zero() {
    return new Vector2d(0, 0);
  }

  static one() {
    return new Vector2d(1, 1);
  }

  static dummy() {
    return new Vector2d(null, 0);
  }

  clone() {
    return new Vector2d(this.x, this.y);
  }
}

export type Vector2f = Vector2;
