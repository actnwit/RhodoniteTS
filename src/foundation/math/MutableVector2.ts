import { Vector2_ } from "./Vector2";
import { IVector2, IVector3, IVector4 } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";

export class MutableVector2_<T extends TypedArrayConstructor> extends Vector2_<T> implements IVector2 {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, { type }: { type: T }) {
    super(x as any, y, { type });
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

  raw() {
    return this.v;
  }

  copyComponents(vec: Vector2_<T>) {
    this.v[0] = vec.v[0];
    this.v[1] = vec.v[1];
  }

  multiply(val: number) {
    this.x *= val;
    this.y *= val;

    return this;
  }
}

export default class MutableVector2 extends MutableVector2_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number) {
    super(x, y!, { type: Float32Array })
  }

  static zero() {
    return new MutableVector2(0, 0);
  }

  static one() {
    return new MutableVector2(1, 1);
  }

  static dummy() {
    return new MutableVector2(null, 0);
  }

  clone() {
    return new MutableVector2(this.x, this.y);
  }
}

export class MutableVector2d extends MutableVector2_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number) {
    super(x, y!, { type: Float64Array })
  }

  static zero() {
    return new MutableVector2d(0, 0);
  }

  static one() {
    return new MutableVector2d(1, 1);
  }

  static dummy() {
    return new MutableVector2d(null, 0);
  }

  clone() {
    return new MutableVector2d(this.x, this.y);
  }
}

export type MutableVector2f = MutableVector2;
