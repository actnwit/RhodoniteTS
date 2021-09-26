import {IVector2, IVector3, IVector4, IMutableVector4} from './IVector';
import {Array4, FloatTypedArrayConstructor} from '../../types/CommonTypes';
import {MathUtil} from './MathUtil';
import {CompositionType} from '../definitions/CompositionType';
import AbstractVector from './AbstractVector';

export class Vector4_<T extends FloatTypedArrayConstructor>
  extends AbstractVector
  implements IVector4
{
  constructor(x: Float32Array | Float64Array, {type}: {type: T}) {
    super();
    this._v = x;
  }

  get x(): number {
    return this._v[0];
  }

  get y(): number {
    return this._v[1];
  }

  get z(): number {
    return this._v[2];
  }

  get w(): number {
    return this._v[3];
  }

  get glslStrAsFloat() {
    return `vec4(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(
      this._v[1]
    )}, ${MathUtil.convertToStringAsGLSLFloat(
      this._v[2]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])})`;
  }

  get glslStrAsInt() {
    return `ivec4(${Math.floor(this._v[0])}, ${Math.floor(
      this._v[1]
    )}, ${Math.floor(this._v[2])}, ${Math.floor(this._v[3])})`;
  }

  static _fromCopyArray(
    array: Array4<number>,
    type: FloatTypedArrayConstructor
  ) {
    return new this(new type(array), {type});
  }

  static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor) {
    const vec = new this(
      new type([vec4._v[0], vec4._v[1], vec4._v[2], vec4._v[3]]),
      {type}
    );
    return vec;
  }

  static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec3._v[0], vec3._v[1], vec3._v[2], 1]), {
      type,
    });
    return vec;
  }

  static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec2._v[0], vec2._v[1], 0, 1]), {
      type,
    });
    return vec;
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
  static _zero(type: FloatTypedArrayConstructor) {
    return new this(new type([0, 0, 0, 0]), {type});
  }

  static _one(type: FloatTypedArrayConstructor) {
    return new this(new type([1, 1, 1, 1]), {type});
  }

  static _dummy(type: FloatTypedArrayConstructor) {
    return new this(new type([]), {type});
  }

  /**
   * normalize(static version)
   */
  static _normalize(vec: IVector4, type: FloatTypedArrayConstructor) {
    const length = vec.length();
    return this._divide(vec, length, type);
  }

  /**
   * add value（static version）
   */
  static _add(
    l_vec: IVector4,
    r_vec: IVector4,
    type: FloatTypedArrayConstructor
  ) {
    const x = l_vec._v[0] + r_vec._v[0];
    const y = l_vec._v[1] + r_vec._v[1];
    const z = l_vec._v[2] + r_vec._v[2];
    const w = l_vec._v[3] + r_vec._v[3];
    return new this(new type([x, y, z, w]), {type});
  }

  /**
   * add value（static version）
   */
  static addTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out._v[0] = l_vec._v[0] + r_vec._v[0];
    out._v[1] = l_vec._v[1] + r_vec._v[1];
    out._v[2] = l_vec._v[2] + r_vec._v[2];
    out._v[3] = l_vec._v[3] + r_vec._v[3];
    return out;
  }

  /**
   * subtract(static version)
   */
  static _subtract(
    l_vec: IVector4,
    r_vec: IVector4,
    type: FloatTypedArrayConstructor
  ) {
    const x = l_vec._v[0] - r_vec._v[0];
    const y = l_vec._v[1] - r_vec._v[1];
    const z = l_vec._v[2] - r_vec._v[2];
    const w = l_vec._v[3] - r_vec._v[3];
    return new this(new type([x, y, z, w]), {type});
  }

  /**
   * subtract(static version)
   */
  static subtractTo(l_vec: IVector4, r_vec: IVector4, out: IMutableVector4) {
    out._v[0] = l_vec._v[0] - r_vec._v[0];
    out._v[1] = l_vec._v[1] - r_vec._v[1];
    out._v[2] = l_vec._v[2] - r_vec._v[2];
    out._v[3] = l_vec._v[3] - r_vec._v[3];
    return out;
  }

  /**
   * multiply(static version)
   */
  static _multiply(
    vec: IVector4,
    value: number,
    type: FloatTypedArrayConstructor
  ) {
    const x = vec._v[0] * value;
    const y = vec._v[1] * value;
    const z = vec._v[2] * value;
    const w = vec._v[3] * value;
    return new this(new type([x, y, z, w]), {type});
  }

  /**
   * multiplyTo(static version)
   */
  static multiplyTo(vec: IVector4, value: number, out: IMutableVector4) {
    out._v[0] = vec._v[0] * value;
    out._v[1] = vec._v[1] * value;
    out._v[2] = vec._v[2] * value;
    out._v[3] = vec._v[3] * value;
    return out;
  }

  /**
   * multiply vector(static version)
   */
  static _multiplyVector(
    l_vec: IVector4,
    r_vec: IVector4,
    type: FloatTypedArrayConstructor
  ) {
    const x = l_vec._v[0] * r_vec._v[0];
    const y = l_vec._v[1] * r_vec._v[1];
    const z = l_vec._v[2] * r_vec._v[2];
    const w = l_vec._v[3] * r_vec._v[3];
    return new this(new type([x, y, z, w]), {type});
  }

  /**
   * multiply vector(static version)
   */
  static multiplyVectorTo(
    l_vec: IVector4,
    r_vec: IVector4,
    out: IMutableVector4
  ) {
    out._v[0] = l_vec._v[0] * r_vec._v[0];
    out._v[1] = l_vec._v[1] * r_vec._v[1];
    out._v[2] = l_vec._v[2] * r_vec._v[2];
    out._v[3] = l_vec._v[3] * r_vec._v[3];
    return out;
  }

  /**
   * divide(static version)
   */
  static _divide(
    vec: IVector4,
    value: number,
    type: FloatTypedArrayConstructor
  ) {
    let x;
    let y;
    let z;
    let w;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
      z = vec._v[2] / value;
      w = vec._v[3] / value;
    } else {
      console.error('0 division occurred!');
      x = Infinity;
      y = Infinity;
      z = Infinity;
      w = Infinity;
    }
    return new this(new type([x, y, z, w]), {type});
  }

  /**
   * divide by value(static version)
   */
  static divideTo(vec: IVector4, value: number, out: IMutableVector4) {
    if (value !== 0) {
      out._v[0] = vec._v[0] / value;
      out._v[1] = vec._v[1] / value;
      out._v[2] = vec._v[2] / value;
      out._v[3] = vec._v[3] / value;
    } else {
      console.error('0 division occurred!');
      out._v[0] = Infinity;
      out._v[1] = Infinity;
      out._v[2] = Infinity;
      out._v[3] = Infinity;
    }
    return out;
  }

  /**
   * divide vector(static version)
   */
  static _divideVector(
    l_vec: IVector4,
    r_vec: IVector4,
    type: FloatTypedArrayConstructor
  ) {
    let x;
    let y;
    let z;
    let w;
    if (
      r_vec._v[0] !== 0 &&
      r_vec._v[1] !== 0 &&
      r_vec._v[2] !== 0 &&
      r_vec._v[3] !== 0
    ) {
      x = l_vec._v[0] / r_vec._v[0];
      y = l_vec._v[1] / r_vec._v[1];
      z = l_vec._v[2] / r_vec._v[2];
      w = l_vec._v[3] / r_vec._v[3];
    } else {
      console.error('0 division occurred!');
      x = r_vec._v[0] === 0 ? Infinity : l_vec._v[0] / r_vec._v[0];
      y = r_vec._v[1] === 0 ? Infinity : l_vec._v[1] / r_vec._v[1];
      z = r_vec._v[2] === 0 ? Infinity : l_vec._v[2] / r_vec._v[2];
      w = r_vec._v[3] === 0 ? Infinity : l_vec._v[3] / r_vec._v[3];
    }
    return new this(new type([x, y, z, w]), {type});
  }

  /**
   * divide by vector(static version)
   */
  static divideVectorTo(
    l_vec: IVector4,
    r_vec: IVector4,
    out: IMutableVector4
  ) {
    if (
      r_vec._v[0] !== 0 &&
      r_vec._v[1] !== 0 &&
      r_vec._v[2] !== 0 &&
      r_vec._v[3] !== 0
    ) {
      out._v[0] = l_vec._v[0] / r_vec._v[0];
      out._v[1] = l_vec._v[1] / r_vec._v[1];
      out._v[2] = l_vec._v[2] / r_vec._v[2];
      out._v[3] = l_vec._v[3] / r_vec._v[3];
    } else {
      console.error('0 division occurred!');
      out._v[0] = r_vec._v[0] === 0 ? Infinity : l_vec._v[0] / r_vec._v[0];
      out._v[1] = r_vec._v[1] === 0 ? Infinity : l_vec._v[1] / r_vec._v[1];
      out._v[2] = r_vec._v[2] === 0 ? Infinity : l_vec._v[2] / r_vec._v[2];
      out._v[3] = r_vec._v[3] === 0 ? Infinity : l_vec._v[3] / r_vec._v[3];
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
    return (
      '(' +
      this._v[0] +
      ', ' +
      this._v[1] +
      ', ' +
      this._v[2] +
      ', ' +
      this._v[3] +
      ')'
    );
  }

  toStringApproximately() {
    return (
      MathUtil.financial(this._v[0]) +
      ' ' +
      MathUtil.financial(this._v[1]) +
      ' ' +
      MathUtil.financial(this._v[2]) +
      ' ' +
      MathUtil.financial(this._v[3]) +
      '\n'
    );
  }

  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3]];
  }

  isDummy() {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  isEqual(vec: IVector4, delta: number = Number.EPSILON) {
    if (
      Math.abs(vec._v[0] - this._v[0]) < delta &&
      Math.abs(vec._v[1] - this._v[1]) < delta &&
      Math.abs(vec._v[2] - this._v[2]) < delta &&
      Math.abs(vec._v[3] - this._v[3]) < delta
    ) {
      return true;
    } else {
      return false;
    }
  }

  isStrictEqual(vec: IVector4): boolean {
    if (
      this._v[0] === vec._v[0] &&
      this._v[1] === vec._v[1] &&
      this._v[2] === vec._v[2] &&
      this._v[3] === vec._v[3]
    ) {
      return true;
    } else {
      return false;
    }
  }

  at(i: number) {
    return this._v[i];
  }

  length() {
    return Math.hypot(this._v[0], this._v[1], this._v[2], this._v[3]);
  }

  lengthSquared(): number {
    return (
      this._v[0] ** 2 + this._v[1] ** 2 + this._v[2] ** 2 + this._v[3] ** 2
    );
  }

  lengthTo(vec: IVector4) {
    const deltaX = this._v[0] - vec._v[0];
    const deltaY = this._v[1] - vec._v[1];
    const deltaZ = this._v[2] - vec._v[2];
    const deltaW = this._v[3] - vec._v[3];
    return Math.hypot(deltaX, deltaY, deltaZ, deltaW);
  }

  /**
   * dot product
   */
  dot(vec: IVector4) {
    return (
      this._v[0] * vec._v[0] +
      this._v[1] * vec._v[1] +
      this._v[2] * vec._v[2] +
      this._v[3] * vec._v[3]
    );
  }

  get className() {
    return 'Vector4';
  }

  clone() {
    return new (this.constructor as any)(
      new (this._v.constructor as any)([
        this._v[0],
        this._v[1],
        this._v[2],
        this._v[3],
      ])
    );
  }
}

export default class Vector4 extends Vector4_<Float32ArrayConstructor> {
  constructor(x: Float32Array) {
    super(x, {type: Float32Array});
  }

  static fromCopyArray(array: Array4<number>): Vector4 {
    return super._fromCopyArray(array, Float32Array);
  }

  static fromCopyVector3(vec3: IVector3): Vector4 {
    return super._fromCopyVector3(vec3, Float32Array);
  }

  static fromCopyVector4(vec4: IVector4): Vector4 {
    return super._fromCopyVector4(vec4, Float32Array);
  }

  static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4 {
    return new Vector4(new Float32Array(arrayBuffer));
  }

  static fromFloat32Array(float32Array: Float32Array): Vector4 {
    return new Vector4(float32Array);
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
  constructor(x: Float64Array) {
    super(x, {type: Float64Array});
  }

  static fromCopyArray(array: Array4<number>): Vector4d {
    return super._fromCopyArray(array, Float64Array) as Vector4d;
  }

  static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector4d {
    return new Vector4d(new Float64Array(arrayBuffer));
  }

  static fromFloat64Array(float64Array: Float64Array): Vector4d {
    return new Vector4d(float64Array);
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

export const ConstVector4_1_1_1_1 = Vector4.fromCopyArray([1, 1, 1, 1]);
export const ConstVector4_0_0_0_1 = Vector4.fromCopyArray([0, 0, 0, 1]);
export const ConstVector4_0_0_0_0 = Vector4.fromCopyArray([0, 0, 0, 0]);
