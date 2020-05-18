import { IScalar } from "./IVector";
import { Scalar_ } from "./Scalar";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";

export class MutableScalar_<T extends TypedArrayConstructor> extends Scalar_<T> implements IScalar {
  constructor(x: number | TypedArray | null, { type }: { type: T }) {
    super(x as any, { type });
  }

  set x(x: number) {
    this.v[0] = x;
  }

  get x() {
    return this.v[0];
  }

  copyComponents(vec: Scalar_<T>) {
    this.v[0] = vec.v[0];
  }

}

export default class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | null) {
    super(x, { type: Float32Array })
  }

  static zero() {
    return new MutableScalar(0);
  }

  static one() {
    return new MutableScalar(1);
  }

  static dummy() {
    return new MutableScalar(null);
  }

  clone() {
    return new MutableScalar(this.x);
  }

}

export class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | null) {
    super(x, { type: Float64Array })
  }

  static zero() {
    return new MutableScalard(0);
  }

  static one() {
    return new MutableScalard(1);
  }

  static dummy() {
    return new MutableScalard(null);
  }

  clone() {
    return new MutableScalard(this.x);
  }
}

export type MutableScalarf = MutableScalar;
