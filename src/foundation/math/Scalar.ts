import {IScalar} from './IVector';
import {TypedArray, TypedArrayConstructor} from '../../types/CommonTypes';
import {MathUtil} from './MathUtil';
import AbstractVector from './AbstractVector';

export class Scalar_<T extends TypedArrayConstructor> extends AbstractVector {

  constructor(x: number | TypedArray | null, {type}: {type: T}) {
    super();
    if (ArrayBuffer.isView(x)) {
      this._v = (x as any) as TypedArray;
      return;
    } else if (x == null) {
      this._v = new type(0);
      return;
    } else {
      this._v = new type(1);
    }

    this._v[0] = (x as any) as number;
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
}

export default class Scalar
  extends Scalar_<Float32ArrayConstructor>
  implements IScalar {
  constructor(x: number | TypedArray | null) {
    super(x, {type: Float32Array});
  }

  static zero() {
    return new Scalar(0);
  }

  static one() {
    return new Scalar(1);
  }

  static dummy() {
    return new Scalar(null);
  }

  get className() {
    return this.constructor.name;
  }
  
  /**
   * change to string
   */
  toString() {
    return '(' + this._v[0] + ')';
  }
  
  clone() {
    return new Scalar(this.x);
  }
}

export class Scalard extends Scalar_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | null) {
    super(x, {type: Float64Array});
  }

  static zero() {
    return new Scalard(0);
  }

  static one() {
    return new Scalard(1);
  }

  static dummy() {
    return new Scalard(null);
  }

  clone() {
    return new Scalard(this.x);
  }
}

export type Scalarf = Scalar;
