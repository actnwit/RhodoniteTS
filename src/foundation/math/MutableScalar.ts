import { IScalar } from "./IVector";
import Scalar, { Scalar_ } from "./Scalar";
import { TypedArray, TypedArrayConstructor } from "../../types/CommonTypes";

export class MutableScalar_<T extends TypedArrayConstructor> extends Scalar_<T> implements IScalar {
  constructor(x: number|TypedArray|null, {type}: {type: T}) {
    super(x as any, {type});
  }

  set x(x:number) {
    this.v[0] = x;
  }

  setValue(value: number) {
    this.x = value;
  }

}

export default class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
  constructor(x:number|TypedArray|null) {
    super(x, {type: Float32Array})
  }

  clone() {
    return new MutableScalar(this.x);
  }

  static one() {
    return new MutableScalar(1);
  }

  static dummy() {
    return new MutableScalar(null);
  }

  static zero() {
    return new MutableScalar(0);
  }
}

export class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
  constructor(x:number|TypedArray|null) {
    super(x, {type: Float64Array})
  }

  clone() {
    return new MutableScalard(this.x);
  }

  static one() {
    return new MutableScalard(1);
  }

  static dummy() {
    return new MutableScalard(null);
  }

  static zero() {
    return new MutableScalard(0);
  }
}

export type MutableScalarf = MutableScalar;
