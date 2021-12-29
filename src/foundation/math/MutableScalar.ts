import {Scalar_} from './Scalar';
import {TypedArray, TypedArrayConstructor} from '../../types/CommonTypes';

export class MutableScalar_<
  T extends TypedArrayConstructor
> extends Scalar_<T> {
  constructor(x: TypedArray, {type}: {type: T}) {
    super(x, {type});
  }

  copyComponents(vec: Scalar_<T>) {
    this._v[0] = vec._v[0];
  }

  get x() {
    return this._v[0];
  }

  set x(x: number) {
    this._v[0] = x;
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

  /**
   * change to string
   */
  toString() {
    return '(' + this._v[0] + ')';
  }

  setValue(value: number) {
    this.x = value;
    return this;
  }
}

export default class MutableScalar extends MutableScalar_<Float32ArrayConstructor> {
  constructor(x: TypedArray) {
    super(x, {type: Float32Array});
  }

  clone() {
    return new MutableScalar(new Float32Array([this.x]));
  }

  static one() {
    return new MutableScalar(new Float32Array([1]));
  }

  static dummy() {
    return new MutableScalar(new Float32Array([]));
  }

  static zero() {
    return new MutableScalar(new Float32Array([0]));
  }

  get className() {
    return 'MutableScalar';
  }
}

export class MutableScalard extends MutableScalar_<Float64ArrayConstructor> {
  constructor(x: TypedArray) {
    super(x, {type: Float64Array});
  }

  clone() {
    return new MutableScalard(new Float64Array([this.x]));
  }

  static one() {
    return new MutableScalard(new Float64Array([1]));
  }

  static dummy() {
    return new MutableScalard(new Float64Array([]));
  }

  static zero() {
    return new MutableScalard(new Float64Array([0]));
  }
}

export type MutableScalarf = MutableScalar;
