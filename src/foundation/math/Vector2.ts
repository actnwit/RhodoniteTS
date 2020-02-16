import { IVector2, IVector3, IVector4 } from "./IVector";
import Vector4 from "./Vector4";
import Vector3 from "./Vector3";
import { TypedArray, TypedArrayConstructor } from "../../types/CommonTypes";
import { MathUtil } from "./MathUtil";

export class Vector2_<T extends TypedArrayConstructor> implements IVector2 {
  v: TypedArray;

  constructor(x:number|TypedArray|IVector2|IVector3|IVector4|Array<number>|null, y:number, {type}: {type: T}) {
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

  get className() {
    return this.constructor.name;
  }

  clone() {
    return new Vector2(this.x, this.y);
  }

  static add<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>) {
    return new (lvec.constructor as any)(lvec.x + rvec.x, lvec.y + rvec.y);
  }

  static subtract<T extends TypedArrayConstructor>(lvec: Vector2_<T>, rvec: Vector2_<T>) {
    return new (lvec.constructor as any)(lvec.x - rvec.x, lvec.y - rvec.y);
  }

  isStrictEqual(vec: Vector2_<T>) {
    if (this.x === vec.x && this.y === vec.y) {
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

  static multiply<T extends TypedArrayConstructor>(vec2:Vector2_<T>, val:number) {
    return new (vec2.constructor as any)(vec2.x * val, vec2.y * val);
  }

  get x() {
    return this.v[0];
  }

  get y() {
    return this.v[1];
  }

  get raw() {
    return this.v;
  }

  get glslStrAsFloat() {
    return `vec2(${MathUtil.convertToStringAsGLSLFloat(this.x)}, ${MathUtil.convertToStringAsGLSLFloat(this.y)})`;
  }

  get glslStrAsInt() {
    return `ivec2(${Math.floor(this.x)}, ${Math.floor(this.y)})`;
  }
}

export default class Vector2 extends Vector2_<Float32ArrayConstructor> {
  constructor(x:number|TypedArray|IVector2|IVector3|IVector4|Array<number>|null, y?:number) {
    super(x, y!, {type: Float32Array})
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
  constructor(x:number|TypedArray|IVector2|IVector3|IVector4|Array<number>|null, y?:number) {
    super(x, y!, {type: Float64Array})
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
