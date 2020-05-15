import { IScalar } from "./IVector";
import { TypedArray, TypedArrayConstructor } from "../../commontypes/CommonTypes";
import { MathUtil } from "./MathUtil";
import { CompositionType } from "../definitions/CompositionType";

export class Scalar_<T extends TypedArrayConstructor> implements IScalar {
  v: TypedArray;

  constructor(x: number | TypedArray | null, { type }: { type: T }) {
    if (ArrayBuffer.isView(x)) {
      this.v = ((x as any) as TypedArray);
      return;
    } else if (x == null) {
      this.v = new type(0);
      return;
    } else {
      this.v = new type(1)
    }

    this.v[0] = ((x as any) as number);
  }

  get x() {
    return this.v[0];
  }

  get glslStrAsFloat() {
    return `${MathUtil.convertToStringAsGLSLFloat(this.x)}`;
  }

  get glslStrAsInt() {
    return `${Math.floor(this.x)}`;
  }

  get className() {
    return this.constructor.name;
  }

  static get compositionType() {
    return CompositionType.Scalar;
  }

  /**
   * change to string
   */
  toString() {
    return '(' + this.x + ')';
  }

  flattenAsArray() {
    return [this.x];
  }

  isDummy() {
    if (this.v.length === 0) {
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

  isStrictEqual(scalar: Scalar_<T>) {
    if (this.x === scalar.x) {
      return true;
    } else {
      return false;
    }
  }

  getValue() {
    return this.v[0];
  }

  getValueInArray() {
    return [this.v[0]];
  }
}

export default class Scalar extends Scalar_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | null) {
    super(x, { type: Float32Array })
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
    super(x, { type: Float64Array })
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
