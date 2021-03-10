import {IScalar, IVector} from './IVector';
import {TypedArray, TypedArrayConstructor} from '../../commontypes/CommonTypes';
import {MathUtil} from './MathUtil';

export class Scalar_<T extends TypedArrayConstructor>
  implements IVector, IScalar {
  v: TypedArray;

  constructor(x: number | TypedArray | null, {type}: {type: T}) {
    if (ArrayBuffer.isView(x)) {
      this.v = (x as unknown) as TypedArray;
      return;
    } else if (x == null) {
      this.v = new type(0);
      return;
    } else {
      this.v = new type(1);
    }

    this.v[0] = (x as any) as number;
  }
  clone(): IScalar {
    throw new Error('Method not implemented.');
  }
  get className() {
    return this.constructor.name;
  }

  toString() {
    return '(' + this.v[0] + ')';
  }

  toStringApproximately() {
    return MathUtil.nearZeroToZero(this.v[0]) + '\n';
  }

  flattenAsArray(): number[] {
    throw new Error('Method not implemented.');
  }
  at(i: number) {
    return this.v[i];
  }
  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  length(): number {
    throw this.v[0];
  }

  lengthTo(vec: IScalar) {
    const deltaX = this.v[0] - vec.v[0];
    return Math.hypot(deltaX);
  }
  lengthSquared(): number {
    throw this.v[0] * this.v[0];
  }

  dot(vec: IVector): number {
    throw this.v[0] * vec.v[0];
  }

  getValue() {
    return this.v[0];
  }

  getValueInArray() {
    return [this.v[0]];
  }

  get x() {
    return this.v[0];
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

  get raw() {
    return this.v;
  }

  isStrictEqual(scalar: IScalar) {
    if (this.x === scalar.x) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(scalar: IScalar, delta: number = Number.EPSILON) {
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

export default class Scalar extends Scalar_<Float32ArrayConstructor> {
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
