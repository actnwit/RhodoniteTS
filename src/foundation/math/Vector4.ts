import { IVector2, IVector3, IVector4, IVector, IMutableVector4 } from './IVector';
import { TypedArray, TypedArrayConstructor } from '../../commontypes/CommonTypes';
import { MathUtil } from './MathUtil';
import { CompositionType } from '../definitions/CompositionType';

export class Vector4_<T extends TypedArrayConstructor> implements IVector, IVector4 {
  v: TypedArray;

  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y: number, z: number, w: number, { type }: { type: T }) {

    if (ArrayBuffer.isView(x)) {
      this.v = (x as TypedArray);
      return;
    } else if (x == null) {
      this.v = new type(0);
      return;
    } else {
      this.v = new type(4);
    }

    if (Array.isArray(x)) {
      this.v[0] = x[0];
      this.v[1] = x[1];
      this.v[2] = x[2];
      this.v[3] = x[3];
    } else if (typeof x === 'number') {
      this.v[0] = x;
      this.v[1] = y;
      this.v[2] = z;
      this.v[3] = w;
    } else {
      if (typeof x.v[2] === 'undefined') {
        // IVector2
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = 0;
        this.v[3] = 1;
      } else if (typeof x.v[3] === 'undefined') {
        // IVector3
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = x.v[2];
        this.v[3] = 1;
      } else {
        // IVector4
        this.v[0] = x.v[0];
        this.v[1] = x.v[1];
        this.v[2] = x.v[2];
        this.v[3] = x.v[3];
      }
    }
  }

  get x(): number {
    return this.v[0];
  }

  get y(): number {
    return this.v[1];
  }

  get z(): number {
    return this.v[2];
  }

  get w(): number {
    return this.v[3];
  }

  get className() {
    return this.constructor.name;
  }

  get glslStrAsFloat() {
    return `vec4(${MathUtil.convertToStringAsGLSLFloat(this.v[0])}, ${MathUtil.convertToStringAsGLSLFloat(this.v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this.v[2])}, ${MathUtil.convertToStringAsGLSLFloat(this.v[3])})`;
  }

  get glslStrAsInt() {
    return `ivec4(${Math.floor(this.v[0])}, ${Math.floor(this.v[1])}, ${Math.floor(this.v[2])}, ${Math.floor(this.v[3])})`;
  }

  static get compositionType() {
    return CompositionType.Vec4;
  }

  /**
   * to square length(static version)
   */
  static lengthSquared(vec: IVector4) {
    return vec.lengthSquared();
  }

  static lengthBtw(l_vec: IVector4, r_vec: IVector4) {
    return l_vec.lengthTo(r_vec);
  }

  /**
   * Zero Vector
   */
  static _zero(type: TypedArrayConstructor) {
    return new this(0, 0, 0, 0, { type });
  }

  static _one(type: TypedArrayConstructor) {
    return new this(1, 1, 1, 1, { type });
  }

  static _dummy(type: TypedArrayConstructor) {
    return new this(null, 0, 0, 0, { type });
  }

  /**
   * normalize(static version)
   */
  static _normalize(vec: IVector4, type: TypedArrayConstructor) {
    const length = vec.length();
    return this._divide(vec, length, type);
  }

  /**
   * add value（static version）
   */
  static _add(l_vec: IVector4, r_vec: IVector4, type: TypedArrayConstructor) {
    const x = l_vec.v[0] + r_vec.v[0];
    const y = l_vec.v[1] + r_vec.v[1];
    const z = l_vec.v[2] + r_vec.v[2];
    const w = l_vec.v[3] + r_vec.v[3];
    return new this(x, y, z, w, { type });
  }

  /**
   * add value（static version）
   */
  static addTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out.v[0] = l_vec.v[0] + r_vec.v[0];
    out.v[1] = l_vec.v[1] + r_vec.v[1];
    out.v[2] = l_vec.v[2] + r_vec.v[2];
    out.v[3] = l_vec.v[3] + r_vec.v[3];
    return out;
  }

  /**
   * subtract(static version)
   */
  static _subtract(l_vec: IVector4, r_vec: IVector4, type: TypedArrayConstructor) {
    const x = l_vec.v[0] - r_vec.v[0];
    const y = l_vec.v[1] - r_vec.v[1];
    const z = l_vec.v[2] - r_vec.v[2];
    const w = l_vec.v[3] - r_vec.v[3];
    return new this(x, y, z, w, { type });
  }

  /**
   * subtract(static version)
   */
  static subtractTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out.v[0] = l_vec.v[0] - r_vec.v[0];
    out.v[1] = l_vec.v[1] - r_vec.v[1];
    out.v[2] = l_vec.v[2] - r_vec.v[2];
    out.v[3] = l_vec.v[3] - r_vec.v[3];
    return out;
  }

  /**
   * multiply(static version)
   */
  static _multiply(vec: IVector4, value: number, type: TypedArrayConstructor) {
    const x = vec.v[0] * value;
    const y = vec.v[1] * value;
    const z = vec.v[2] * value;
    const w = vec.v[3] * value;
    return new this(x, y, z, w, { type });
  }

  /**
   * multiplyTo(static version)
   */
  static multiplyTo(vec: IVector4, value: number, out: IMutableVector4) {
    out.v[0] = vec.v[0] * value;
    out.v[1] = vec.v[1] * value;
    out.v[2] = vec.v[2] * value;
    out.v[3] = vec.v[3] * value;
    return out;
  }

  /**
   * multiply vector(static version)
   */
  static _multiplyVector(l_vec: IVector4, r_vec: IVector4, type: TypedArrayConstructor) {
    const x = l_vec.v[0] * r_vec.v[0];
    const y = l_vec.v[1] * r_vec.v[1];
    const z = l_vec.v[2] * r_vec.v[2];
    const w = l_vec.v[3] * r_vec.v[3];
    return new this(x, y, z, w, { type });
  }

  /**
   * multiply vector(static version)
   */
  static multiplyVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out.v[0] = l_vec.v[0] * r_vec.v[0];
    out.v[1] = l_vec.v[1] * r_vec.v[1];
    out.v[2] = l_vec.v[2] * r_vec.v[2];
    out.v[3] = l_vec.v[3] * r_vec.v[3];
    return out;
  }

  /**
   * divide(static version)
   */
  static _divide(vec: IVector4, value: number, type: TypedArrayConstructor) {
    let x;
    let y;
    let z;
    let w;
    if (value !== 0) {
      x = vec.v[0] / value;
      y = vec.v[1] / value;
      z = vec.v[2] / value;
      w = vec.v[3] / value;
    } else {
      console.error("0 division occurred!");
      x = Infinity;
      y = Infinity;
      z = Infinity;
      w = Infinity;
    }
    return new this(x, y, z, w, { type });
  }

  /**
   * divide by value(static version)
   */
  static divideTo(vec: IVector4, value: number, out: IMutableVector4) {
    if (value !== 0) {
      out.v[0] = vec.v[0] / value;
      out.v[1] = vec.v[1] / value;
      out.v[2] = vec.v[2] / value;
      out.v[3] = vec.v[3] / value;
    } else {
      console.error("0 division occurred!");
      out.v[0] = Infinity;
      out.v[1] = Infinity;
      out.v[2] = Infinity;
      out.v[3] = Infinity;
    }
    return out;
  }

  /**
   * divide vector(static version)
   */
  static _divideVector(l_vec: IVector4, r_vec: IVector4, type: TypedArrayConstructor) {
    let x;
    let y;
    let z;
    let w;
    if (r_vec.v[0] !== 0 && r_vec.v[1] !== 0 && r_vec.v[2] !== 0 && r_vec.v[3] !== 0) {
      x = l_vec.v[0] / r_vec.v[0];
      y = l_vec.v[1] / r_vec.v[1];
      z = l_vec.v[2] / r_vec.v[2];
      w = l_vec.v[3] / r_vec.v[3];
    } else {
      console.error("0 division occurred!");
      x = r_vec.v[0] === 0 ? Infinity : l_vec.v[0] / r_vec.v[0];
      y = r_vec.v[1] === 0 ? Infinity : l_vec.v[1] / r_vec.v[1];
      z = r_vec.v[2] === 0 ? Infinity : l_vec.v[2] / r_vec.v[2];
      w = r_vec.v[3] === 0 ? Infinity : l_vec.v[3] / r_vec.v[3];
    }
    return new this(x, y, z, w, { type });
  }

  /**
   * divide by vector(static version)
   */
  static divideVectorTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    if (r_vec.v[0] !== 0 && r_vec.v[1] !== 0 && r_vec.v[2] !== 0 && r_vec.v[3] !== 0) {
      out.v[0] = l_vec.v[0] / r_vec.v[0];
      out.v[1] = l_vec.v[1] / r_vec.v[1];
      out.v[2] = l_vec.v[2] / r_vec.v[2];
      out.v[3] = l_vec.v[3] / r_vec.v[3];
    } else {
      console.error("0 division occurred!");
      out.v[0] = r_vec.v[0] === 0 ? Infinity : l_vec.v[0] / r_vec.v[0];
      out.v[1] = r_vec.v[1] === 0 ? Infinity : l_vec.v[1] / r_vec.v[1];
      out.v[2] = r_vec.v[2] === 0 ? Infinity : l_vec.v[2] / r_vec.v[2];
      out.v[3] = r_vec.v[3] === 0 ? Infinity : l_vec.v[3] / r_vec.v[3];
    }
    return out;
  }

  /**
   * dot product(static version)
   */
  static dot(l_vec: IVector4, r_vec: IVector4) {
    return l_vec.dot(r_vec);
  }

  toString() {
    return '(' + this.v[0] + ', ' + this.v[1] + ', ' + this.v[2] + ', ' + this.v[3] + ')';
  }

  toStringApproximately() {
    return MathUtil.nearZeroToZero(this.v[0]) + ' ' + MathUtil.nearZeroToZero(this.v[1]) +
      ' ' + MathUtil.nearZeroToZero(this.v[2]) + ' ' + MathUtil.nearZeroToZero(this.v[3]) + '\n';
  }

  flattenAsArray() {
    return [this.v[0], this.v[1], this.v[2], this.v[3]];
  }

  isDummy() {
    if (this.v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: IVector4, delta: number = Number.EPSILON) {
    if (
      Math.abs(vec.v[0] - this.v[0]) < delta &&
      Math.abs(vec.v[1] - this.v[1]) < delta &&
      Math.abs(vec.v[2] - this.v[2]) < delta &&
      Math.abs(vec.v[3] - this.v[3]) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(vec: IVector4): boolean {
    if (
      this.v[0] === vec.v[0] &&
      this.v[1] === vec.v[1] &&
      this.v[2] === vec.v[2] &&
      this.v[3] === vec.v[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(i: number) {
    return this.v[i];
  }

  length() {
    return Math.hypot(this.v[0], this.v[1], this.v[2], this.v[3]);
  }

  lengthSquared(): number {
    return this.v[0] ** 2 + this.v[1] ** 2 + this.v[2] ** 2 + this.v[3] ** 2;
  }

  lengthTo(vec: IVector4) {
    const deltaX = this.v[0] - vec.v[0];
    const deltaY = this.v[1] - vec.v[1];
    const deltaZ = this.v[2] - vec.v[2];
    const deltaW = this.v[3] - vec.v[3];
    return Math.hypot(deltaX, deltaY, deltaZ, deltaW);
  }

  /**
   * dot product
   */
  dot(vec: IVector4) {
    return this.v[0] * vec.v[0] + this.v[1] * vec.v[1] + this.v[2] * vec.v[2] + this.v[3] * vec.v[3];
  }

  clone() {
    return new (this.constructor as any)(this.v[0], this.v[1], this.v[2], this.v[3]);
  }
}

export default class Vector4 extends Vector4_<Float32ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float32Array })
  }

  static zero() {
    return super._zero(Float32Array) as Vector4;
  }

  static one() {
    return super._one(Float32Array) as Vector4;
  }

  static dummy() {
    return super._dummy(Float32Array) as Vector4;
  }

  static normalize(vec: IVector4) {
    return super._normalize(vec, Float32Array) as Vector4;
  }

  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float32Array) as Vector4;
  }

  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float32Array) as Vector4;
  }

  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float32Array) as Vector4;
  }

  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float32Array) as Vector4;
  }

  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float32Array) as Vector4;
  }

  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float32Array) as Vector4;
  }

  clone() {
    return super.clone() as Vector4;
  }
}

export class Vector4d extends Vector4_<Float64ArrayConstructor> {
  constructor(x: number | TypedArray | IVector2 | IVector3 | IVector4 | Array<number> | null, y?: number, z?: number, w?: number) {
    super(x, y!, z!, w!, { type: Float64Array })
  }

  static zero() {
    return super._zero(Float64Array) as Vector4d;
  }

  static one() {
    return super._one(Float64Array) as Vector4d;
  }

  static dummy() {
    return super._dummy(Float64Array) as Vector4d;
  }

  static normalize(vec: IVector4) {
    return super._normalize(vec, Float64Array) as Vector4d;
  }

  static add(l_vec: IVector4, r_vec: IVector4) {
    return super._add(l_vec, r_vec, Float64Array) as Vector4d;
  }

  static subtract(l_vec: IVector4, r_vec: IVector4) {
    return super._subtract(l_vec, r_vec, Float64Array) as Vector4d;
  }

  static multiply(vec: IVector4, value: number) {
    return super._multiply(vec, value, Float64Array) as Vector4d;
  }

  static multiplyVector(l_vec: IVector4, r_vec: IVector4) {
    return super._multiplyVector(l_vec, r_vec, Float64Array) as Vector4d;
  }

  static divide(vec: IVector4, value: number) {
    return super._divide(vec, value, Float64Array) as Vector4d;
  }

  static divideVector(l_vec: IVector4, r_vec: IVector4) {
    return super._divideVector(l_vec, r_vec, Float64Array) as Vector4d;
  }

  clone() {
    return super.clone() as Vector4d;
  }
}

export type Vector4f = Vector4;
