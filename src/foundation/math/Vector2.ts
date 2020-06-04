import { IVector2, IVector3, IVector4, IVector } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
import { MathUtil } from "./MathUtil";

export class Vector2_<T extends TypedArrayConstructor> implements IVector, IVector2 {
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

  get className() {
    return this.constructor.name;
  }

  get glslStrAsFloat() {
    return `vec2(${MathUtil.convertToStringAsGLSLFloat(this.x)}, ${MathUtil.convertToStringAsGLSLFloat(this.y)})`;
  }

  get glslStrAsInt() {
    return `ivec2(${Math.floor(this.x)}, ${Math.floor(this.y)})`;
  }

  static add<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>) {
    return new (lvec.constructor as any)(lvec.x + rvec.x, lvec.y + rvec.y);
  }

  static subtract<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>) {
    return new (lvec.constructor as any)(lvec.x - rvec.x, lvec.y - rvec.y);
  }

  static multiply<T extends TypedArrayConstructor>(vec2: Vector2_<T>, val: number) {
    return new (vec2.constructor as any)(vec2.x * val, vec2.y * val);
  }

  /**
 * change to string
 */
  toString() {
    return '(' + this.x + ', ' + this.y + ')';
  }

  toStringApproximately() {
    return MathUtil.nearZeroToZero(this.x) + ' ' + MathUtil.nearZeroToZero(this.y) + '\n';
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

  isEqual(vec: IVector2, delta: number = Number.EPSILON) {
    if (Math.abs(vec.x - this.x) < delta &&
      Math.abs(vec.y - this.y) < delta) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(vec: IVector2) {
    if (this.x === vec.x && this.y === vec.y) {
      return true;
    } else {
      return false;
    }
  }

  at(i: number) {
    return this.v[i];
  }

  length() {
    return Math.hypot(this.x, this.y);
  }

  lengthSquared(): number {
    return this.x * this.x + this.y * this.y;
  }

  lengthTo(vec: IVector2) {
    const deltaX = this.x - vec.x;
    const deltaY = this.y - vec.y;
    return Math.hypot(deltaX, deltaY);
  }

  /**
   * dot product
   */
  dot(vec: IVector2) {
    return this.x * vec.x + this.y * vec.y;
  }

  clone() {
    return new Vector2(this.x, this.y);
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
