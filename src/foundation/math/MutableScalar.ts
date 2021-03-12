import {Scalar_} from './Scalar';
import {TypedArray, TypedArrayConstructor} from '../../commontypes/CommonTypes';

export class MutableScalar_<
  T extends TypedArrayConstructor
> extends Scalar_<T> {
  constructor(x: number | TypedArray | null, {type}: {type: T}) {
    super(x as any, {type});
  }

  copyComponents(vec: Scalar_<T>) {
    this.v[0] = vec.v[0];
  }

  get x() {
    return this.v[0];
  }

  set x(x: number) {
    this.v[0] = x;
  }

  get y() {
    return 0;
  }
  get z() {
    return 0;
  }
  get w() {
    return 1;
  }

  setValue(value: number) {
    this.x = value;
    return this;
  }
}

export default class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | null) {
    super(x, {type: Float32Array});
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

  get className() {
    return this.constructor.name;
  }
}

export class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | null) {
    super(x, {type: Float64Array});
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
