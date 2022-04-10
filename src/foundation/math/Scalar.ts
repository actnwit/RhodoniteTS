import {IScalar} from './IVector';
import {
  FloatTypedArrayConstructor,
  TypedArray,
  TypedArrayConstructor,
} from '../../types/CommonTypes';
import {MathUtil} from './MathUtil';
import AbstractVector from './AbstractVector';

export class Scalar_<T extends TypedArrayConstructor> extends AbstractVector {
  constructor(v: TypedArray, {type}: {type: T}) {
    super();
    this._v = v;
  }

  getValue() {
    return this._v[0];
  }

  getValueInArray() {
    return [this._v[0]];
  }

  get x() {
    return this._v[0];
  }

  get raw() {
    return this._v;
  }

  isStrictEqual(scalar: Scalar_<T>) {
    if (this.x === scalar.x) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(scalar: Scalar_<T>, delta: number = Number.EPSILON) {
    if (Math.abs(scalar.x - this.x) < delta) {
      return true;
    } else {
      return false;
    }
  }

  get glslStrAsFloat() {
    return `${MathUtil.convertToStringAsGLSLFloat(this.x)}`;
  }

  get glslStrAsInt() {
    return `${Math.floor(this.x)}`;
  }

  static _fromCopyNumber(value: number, type: FloatTypedArrayConstructor) {
    return new this(new type([value]), {type});
  }

  static _dummy(type: FloatTypedArrayConstructor) {
    return new this(new type(), {type});
  }
}

export class Scalar
  extends Scalar_<Float32ArrayConstructor>
  implements IScalar
{
  constructor(x: TypedArray) {
    super(x, {type: Float32Array});
  }

  static fromCopyNumber(value: number): Scalar {
    return super._fromCopyNumber(value, Float32Array) as Scalar;
  }

  static zero(): Scalar {
    return Scalar.fromCopyNumber(0);
  }

  static one(): Scalar {
    return Scalar.fromCopyNumber(1);
  }

  static dummy(): Scalar {
    return super._dummy(Float32Array) as Scalar;
  }

  get className() {
    return 'Scalar';
  }

  /**
   * change to string
   */
  toString() {
    return '(' + this._v[0] + ')';
  }

  clone(): Scalar {
    return new Scalar(this._v) as Scalar;
  }
}

export class Scalard extends Scalar_<Float64ArrayConstructor> {
  constructor(x: TypedArray) {
    super(x, {type: Float64Array});
  }

  static fromCopyNumber(value: number): Scalard {
    return super._fromCopyNumber(value, Float64Array) as Scalard;
  }

  static zero(): Scalard {
    return Scalard.fromCopyNumber(0);
  }

  static one(): Scalard {
    return Scalard.fromCopyNumber(1);
  }

  static dummy(): Scalard {
    return super._dummy(Float64Array) as Scalard;
  }

  clone(): Scalard {
    return new Scalard(this._v) as Scalard;
  }
}

export type Scalarf = Scalar;
