import type { Array3, FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { CompositionType } from '../definitions/CompositionType';
import { Logger } from '../misc/Logger';
import { AbstractVector } from './AbstractVector';
import type { IMatrix44 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IMutableVector3, IVector, IVector2, IVector3, IVector4 } from './IVector';
import { MathUtil } from './MathUtil';

/**
 * Generic base class for 3D vectors with floating-point components.
 * This class provides immutable 3D vector operations and serves as the foundation
 * for both 32-bit and 64-bit precision vector implementations.
 *
 * @template T - The typed array constructor (Float32Array or Float64Array)
 * @internal
 */
export class Vector3_<T extends FloatTypedArrayConstructor> extends AbstractVector implements IVector, IVector3 {
  /**
   * Creates a new Vector3_ instance.
   * @param v - The typed array containing the vector components
   * @param type - Configuration object containing the typed array constructor
   */
  constructor(v: TypedArray, _options: { type: T }) {
    super();
    this._v = v;
  }

  /**
   * Gets the X component of the vector.
   * @returns The X component value
   */
  get x() {
    return this._v[0];
  }

  /**
   * Gets the Y component of the vector.
   * @returns The Y component value
   */
  get y() {
    return this._v[1];
  }

  /**
   * Gets the Z component of the vector.
   * @returns The Z component value
   */
  get z() {
    return this._v[2];
  }

  /**
   * Gets the W component of the vector (always returns 1 for homogeneous coordinates).
   * @returns Always returns 1
   */
  get w() {
    return 1;
  }

  /**
   * Gets the GLSL representation of this vector as a float vec3.
   * @returns A string representation suitable for GLSL shaders
   */
  get glslStrAsFloat() {
    return `vec3(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[2])})`;
  }

  /**
   * Gets the GLSL representation of this vector as an integer ivec3.
   * @returns A string representation suitable for GLSL shaders with integer components
   */
  get glslStrAsInt() {
    return `ivec3(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(this._v[2])})`;
  }

  /**
   * Gets the WGSL representation of this vector as a float vec3f.
   * @returns A string representation suitable for WGSL shaders
   */
  get wgslStrAsFloat() {
    return `vec3f(${MathUtil.convertToStringAsGLSLFloat(this._v[0])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(this._v[2])})`;
  }

  /**
   * Gets the WGSL representation of this vector as an integer vec3i.
   * @returns A string representation suitable for WGSL shaders with integer components
   */
  get wgslStrAsInt() {
    return `vec3i(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(this._v[2])})`;
  }

  /**
   * Gets the composition type for this vector class.
   * @returns The composition type (Vec3)
   */
  static get compositionType() {
    return CompositionType.Vec3;
  }

  /**
   * Calculates the squared length of a vector (static version).
   * This is more efficient than calculating the actual length when only comparison is needed.
   * @param vec - The vector to calculate squared length for
   * @returns The squared length of the vector
   */
  static lengthSquared(vec: IVector3) {
    return vec.lengthSquared();
  }

  /**
   * Calculates the distance between two vectors.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The distance between the two vectors
   */
  static lengthBtw(l_vec: IVector3, r_vec: IVector3) {
    return l_vec.lengthTo(r_vec);
  }

  /**
   * Calculates the angle between two vectors in radians.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The angle between the vectors in radians
   * @throws Error if either vector has zero length
   */
  static angleOfVectors(l_vec: IVector3, r_vec: IVector3) {
    const multipliedLength = l_vec.length() * r_vec.length();
    if (multipliedLength === 0) {
      Logger.error('length of a vector is 0!');
    }
    const cos_sita = l_vec.dot(r_vec) / multipliedLength;
    const sita = Math.acos(cos_sita);
    return sita;
  }

  /**
   * Creates a zero vector (0, 0, 0).
   * @param type - The typed array constructor to use
   * @returns A new zero vector
   */
  static _zero(type: FloatTypedArrayConstructor) {
    return this._fromCopyArray([0, 0, 0], type);
  }

  /**
   * Creates a vector with all components set to 1 (1, 1, 1).
   * @param type - The typed array constructor to use
   * @returns A new vector with all components set to 1
   */
  static _one(type: FloatTypedArrayConstructor) {
    return this._fromCopyArray([1, 1, 1], type);
  }

  /**
   * Creates an empty dummy vector for placeholder purposes.
   * @param type - The typed array constructor to use
   * @returns A new dummy vector
   */
  static _dummy(type: FloatTypedArrayConstructor) {
    return new this(new type([]), { type });
  }

  /**
   * Normalizes a vector to unit length (static version).
   * @param vec - The vector to normalize
   * @param type - The typed array constructor to use
   * @returns A new normalized vector
   */
  static _normalize(vec: IVector3, type: FloatTypedArrayConstructor) {
    const length = vec.length();
    return this._divide(vec, length, type);
  }

  /**
   * Normalizes a vector and stores the result in the output vector.
   * @param vec - The vector to normalize
   * @param out - The output vector to store the result
   * @returns The output vector containing the normalized result
   */
  static normalizeTo(vec: IVector3, out: IMutableVector3) {
    const length = vec.length();
    this.divideTo(vec, length, out);
    return out;
  }

  /**
   * Adds two vectors component-wise (static version).
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @param type - The typed array constructor to use
   * @returns A new vector containing the sum
   */
  static _add(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] + r_vec._v[0];
    const y = l_vec._v[1] + r_vec._v[1];
    const z = l_vec._v[2] + r_vec._v[2];
    return this._fromCopyArray([x, y, z], type);
  }

  /**
   * Adds two vectors and stores the result in the output vector.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @param out - The output vector to store the result
   * @returns The output vector containing the sum
   */
  static addTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3) {
    out._v[0] = l_vec._v[0] + r_vec._v[0];
    out._v[1] = l_vec._v[1] + r_vec._v[1];
    out._v[2] = l_vec._v[2] + r_vec._v[2];
    return out;
  }

  /**
   * Adds a scaled vector to another vector and stores the result in the output vector.
   * @param l_vec - The vector to add to
   * @param r_vec - The vector to add
   * @param scale - The scale to apply to the second vector
   * @param out - The output vector to store the result
   * @returns The output vector containing the sum
   */
  static addScaledVectorTo(l_vec: IVector3, r_vec: IVector3, scale: number, out: IMutableVector3) {
    out._v[0] = l_vec._v[0] + r_vec._v[0] * scale;
    out._v[1] = l_vec._v[1] + r_vec._v[1] * scale;
    out._v[2] = l_vec._v[2] + r_vec._v[2] * scale;
    return out;
  }

  /**
   * Subtracts the second vector from the first vector (static version).
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @param type - The typed array constructor to use
   * @returns A new vector containing the difference
   */
  static _subtract(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] - r_vec._v[0];
    const y = l_vec._v[1] - r_vec._v[1];
    const z = l_vec._v[2] - r_vec._v[2];
    return this._fromCopyArray([x, y, z], type);
  }

  /**
   * Subtracts two vectors and stores the result in the output vector.
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @param out - The output vector to store the result
   * @returns The output vector containing the difference
   */
  static subtractTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3) {
    out._v[0] = l_vec._v[0] - r_vec._v[0];
    out._v[1] = l_vec._v[1] - r_vec._v[1];
    out._v[2] = l_vec._v[2] - r_vec._v[2];
    return out;
  }

  /**
   * Multiplies a vector by a scalar value (static version).
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param type - The typed array constructor to use
   * @returns A new vector containing the scaled result
   */
  static _multiply(vec: IVector3, value: number, type: FloatTypedArrayConstructor) {
    const x = vec._v[0] * value;
    const y = vec._v[1] * value;
    const z = vec._v[2] * value;
    return this._fromCopyArray([x, y, z], type);
  }

  /**
   * Multiplies a vector by a scalar and stores the result in the output vector.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param out - The output vector to store the result
   * @returns The output vector containing the scaled result
   */
  static multiplyTo(vec: IVector3, value: number, out: IMutableVector3) {
    out._v[0] = vec._v[0] * value;
    out._v[1] = vec._v[1] * value;
    out._v[2] = vec._v[2] * value;
    return out;
  }

  /**
   * Multiplies two vectors component-wise (static version).
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @param type - The typed array constructor to use
   * @returns A new vector containing the component-wise product
   */
  static _multiplyVector(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[0] * r_vec._v[0];
    const y = l_vec._v[1] * r_vec._v[1];
    const z = l_vec._v[2] * r_vec._v[2];
    return this._fromCopyArray([x, y, z], type);
  }

  /**
   * Multiplies two vectors component-wise and stores the result in the output vector.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @param out - The output vector to store the result
   * @returns The output vector containing the component-wise product
   */
  static multiplyVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3) {
    out._v[0] = l_vec._v[0] * r_vec._v[0];
    out._v[1] = l_vec._v[1] * r_vec._v[1];
    out._v[2] = l_vec._v[2] * r_vec._v[2];
    return out;
  }

  /**
   * Transforms a 3D vector by a 4x4 matrix, treating the vector as a point (w=1).
   * The result is perspective-divided if the w component is not 1.
   * @param vec - The vector to transform
   * @param mat - The 4x4 transformation matrix
   * @param type - The typed array constructor to use
   * @returns A new transformed vector
   */
  static _multiplyMatrix4(vec: IVector3, mat: IMatrix44, type: FloatTypedArrayConstructor) {
    const x = vec._v[0];
    const y = vec._v[1];
    const z = vec._v[2];
    const w = 1 / (mat._v[3] * x + mat._v[7] * y + mat._v[11] * z + mat._v[15]);
    const resultX = (mat._v[0] * x + mat._v[4] * y + mat._v[8] * z + mat._v[12]) * w;
    const resultY = (mat._v[1] * x + mat._v[5] * y + mat._v[9] * z + mat._v[13]) * w;
    const resultZ = (mat._v[2] * x + mat._v[6] * y + mat._v[10] * z + mat._v[14]) * w;

    return this._fromCopyArray([resultX, resultY, resultZ], type);
  }

  /**
   * Transforms a 3D vector by a 4x4 matrix, treating the vector as a point (w=1).
   * The result is perspective-divided if the w component is not 1.
   * @param vec - The vector to transform
   * @param mat - The 4x4 transformation matrix
   * @param out - The output vector to store the result
   * @returns A new transformed vector
   */
  static multiplyMatrix4To(vec: IVector3, mat: IMatrix44, out: IMutableVector3) {
    const x = vec._v[0];
    const y = vec._v[1];
    const z = vec._v[2];
    const w = 1 / (mat._v[3] * x + mat._v[7] * y + mat._v[11] * z + mat._v[15]);
    const resultX = (mat._v[0] * x + mat._v[4] * y + mat._v[8] * z + mat._v[12]) * w;
    const resultY = (mat._v[1] * x + mat._v[5] * y + mat._v[9] * z + mat._v[13]) * w;
    const resultZ = (mat._v[2] * x + mat._v[6] * y + mat._v[10] * z + mat._v[14]) * w;

    return out.setComponents(resultX, resultY, resultZ);
  }

  /**
   * Divides a vector by a scalar value (static version).
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param type - The typed array constructor to use
   * @returns A new vector containing the divided result
   * @throws Error if division by zero occurs
   */
  static _divide(vec: IVector3, value: number, type: FloatTypedArrayConstructor) {
    let x: number;
    let y: number;
    let z: number;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
      z = vec._v[2] / value;
    } else {
      Logger.error('0 division occurred!');
      x = Number.POSITIVE_INFINITY;
      y = Number.POSITIVE_INFINITY;
      z = Number.POSITIVE_INFINITY;
    }
    return this._fromCopyArray([x, y, z], type);
  }

  /**
   * Divides a vector by a scalar and stores the result in the output vector.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param out - The output vector to store the result
   * @returns The output vector containing the divided result
   * @throws Error if division by zero occurs
   */
  static divideTo(vec: IVector3, value: number, out: IMutableVector3) {
    if (value !== 0) {
      out._v[0] = vec._v[0] / value;
      out._v[1] = vec._v[1] / value;
      out._v[2] = vec._v[2] / value;
    } else {
      Logger.error('0 division occurred!');
      out._v[0] = Number.POSITIVE_INFINITY;
      out._v[1] = Number.POSITIVE_INFINITY;
      out._v[2] = Number.POSITIVE_INFINITY;
    }
    return out;
  }

  /**
   * Divides two vectors component-wise (static version).
   * @param l_vec - The vector to divide
   * @param r_vec - The vector to divide by
   * @param type - The typed array constructor to use
   * @returns A new vector containing the component-wise division result
   * @throws Error if division by zero occurs
   */
  static _divideVector(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor) {
    let x: number;
    let y: number;
    let z: number;
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0 && r_vec._v[2] !== 0) {
      x = l_vec._v[0] / r_vec._v[0];
      y = l_vec._v[1] / r_vec._v[1];
      z = l_vec._v[2] / r_vec._v[2];
    } else {
      Logger.error('0 division occurred!');
      x = r_vec._v[0] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[0] / r_vec._v[0];
      y = r_vec._v[1] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[1] / r_vec._v[1];
      z = r_vec._v[2] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[2] / r_vec._v[2];
    }
    return this._fromCopyArray([x, y, z], type);
  }

  /**
   * Divides two vectors component-wise and stores the result in the output vector.
   * @param l_vec - The vector to divide
   * @param r_vec - The vector to divide by
   * @param out - The output vector to store the result
   * @returns The output vector containing the component-wise division result
   * @throws Error if division by zero occurs
   */
  static divideVectorTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3) {
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0 && r_vec._v[2] !== 0) {
      out._v[0] = l_vec._v[0] / r_vec._v[0];
      out._v[1] = l_vec._v[1] / r_vec._v[1];
      out._v[2] = l_vec._v[2] / r_vec._v[2];
    } else {
      Logger.error('0 division occurred!');
      out._v[0] = r_vec._v[0] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[0] / r_vec._v[0];
      out._v[1] = r_vec._v[1] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[1] / r_vec._v[1];
      out._v[2] = r_vec._v[2] === 0 ? Number.POSITIVE_INFINITY : l_vec._v[2] / r_vec._v[2];
    }
    return out;
  }

  /**
   * Calculates the dot product of two vectors (static version).
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The dot product of the two vectors
   */
  static dot(l_vec: IVector3, r_vec: IVector3) {
    return l_vec.dot(r_vec);
  }

  /**
   * Calculates the cross product of two vectors (static version).
   * @param l_vec - The first vector (left operand)
   * @param r_vec - The second vector (right operand)
   * @param type - The typed array constructor to use
   * @returns A new vector containing the cross product result
   */
  static _cross(l_vec: IVector3, r_vec: IVector3, type: FloatTypedArrayConstructor) {
    const x = l_vec._v[1] * r_vec._v[2] - l_vec._v[2] * r_vec._v[1];
    const y = l_vec._v[2] * r_vec._v[0] - l_vec._v[0] * r_vec._v[2];
    const z = l_vec._v[0] * r_vec._v[1] - l_vec._v[1] * r_vec._v[0];
    return this._fromCopyArray([x, y, z], type);
  }

  /**
   * Calculates the cross product of two vectors and stores the result in the output vector.
   * @param l_vec - The first vector (left operand)
   * @param r_vec - The second vector (right operand)
   * @param out - The output vector to store the result
   * @returns The output vector containing the cross product result
   */
  static crossTo(l_vec: IVector3, r_vec: IVector3, out: IMutableVector3) {
    const x = l_vec._v[1] * r_vec._v[2] - l_vec._v[2] * r_vec._v[1];
    const y = l_vec._v[2] * r_vec._v[0] - l_vec._v[0] * r_vec._v[2];
    const z = l_vec._v[0] * r_vec._v[1] - l_vec._v[1] * r_vec._v[0];
    return out.setComponents(x, y, z);
  }

  /**
   * Transforms a vector by a quaternion rotation (static version).
   * This applies the quaternion rotation to the vector.
   * @param quat - The quaternion to apply
   * @param vec - The vector to transform
   * @param type - The typed array constructor to use
   * @returns A new vector containing the transformed result
   */
  static _multiplyQuaternion(quat: IQuaternion, vec: IVector3, type: FloatTypedArrayConstructor) {
    const num = quat._v[0] * 2;
    const num2 = quat._v[1] * 2;
    const num3 = quat._v[2] * 2;
    const num4 = quat._v[0] * num;
    const num5 = quat._v[1] * num2;
    const num6 = quat._v[2] * num3;
    const num7 = quat._v[0] * num2;
    const num8 = quat._v[0] * num3;
    const num9 = quat._v[1] * num3;
    const num10 = quat._v[3] * num;
    const num11 = quat._v[3] * num2;
    const num12 = quat._v[3] * num3;

    const x = (1 - (num5 + num6)) * vec._v[0] + (num7 - num12) * vec._v[1] + (num8 + num11) * vec._v[2];
    const y = (num7 + num12) * vec._v[0] + (1 - (num4 + num6)) * vec._v[1] + (num9 - num10) * vec._v[2];
    const z = (num8 - num11) * vec._v[0] + (num9 + num10) * vec._v[1] + (1 - (num4 + num5)) * vec._v[2];

    return this._fromCopyArray([x, y, z], type);
  }

  /**
   * Transforms a vector by a quaternion rotation and stores the result in the output vector.
   * This applies the quaternion rotation to the vector.
   * @param quat - The quaternion to apply
   * @param vec - The vector to transform
   * @param out - The output vector to store the result
   * @returns The output vector containing the transformed result
   */
  static multiplyQuaternionTo(quat: IQuaternion, vec: IVector3, out: IMutableVector3) {
    const num = quat._v[0] * 2;
    const num2 = quat._v[1] * 2;
    const num3 = quat._v[2] * 2;
    const num4 = quat._v[0] * num;
    const num5 = quat._v[1] * num2;
    const num6 = quat._v[2] * num3;
    const num7 = quat._v[0] * num2;
    const num8 = quat._v[0] * num3;
    const num9 = quat._v[1] * num3;
    const num10 = quat._v[3] * num;
    const num11 = quat._v[3] * num2;
    const num12 = quat._v[3] * num3;

    const x = (1 - (num5 + num6)) * vec._v[0] + (num7 - num12) * vec._v[1] + (num8 + num11) * vec._v[2];
    const y = (num7 + num12) * vec._v[0] + (1 - (num4 + num6)) * vec._v[1] + (num9 - num10) * vec._v[2];
    const z = (num8 - num11) * vec._v[0] + (num9 + num10) * vec._v[1] + (1 - (num4 + num5)) * vec._v[2];

    return out.setComponents(x, y, z);
  }

  /**
   * Converts the vector to a string representation.
   * @returns A string representation of the vector in the format "(x, y, z)"
   */
  toString() {
    return `(${this._v[0]}, ${this._v[1]}, ${this._v[2]})`;
  }

  /**
   * Converts the vector to an approximate string representation with limited decimal places.
   * @returns A string representation with financial formatting
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[2])}\n`;
  }

  /**
   * Converts the vector to a flat array.
   * @returns An array containing the x, y, and z components
   */
  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2]];
  }

  /**
   * Checks if this vector is a dummy vector (empty).
   * @returns True if the vector is dummy (has no components), false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this vector is approximately equal to another vector within a tolerance.
   * @param vec - The vector to compare with
   * @param delta - The tolerance for comparison (default: Number.EPSILON)
   * @returns True if vectors are approximately equal, false otherwise
   */
  isEqual(vec: IVector3, delta: number = Number.EPSILON) {
    if (
      Math.abs(vec._v[0] - this._v[0]) < delta &&
      Math.abs(vec._v[1] - this._v[1]) < delta &&
      Math.abs(vec._v[2] - this._v[2]) < delta
    ) {
      return true;
    }
    return false;
  }

  /**
   * Checks if this vector is strictly equal to another vector (exact comparison).
   * @param vec - The vector to compare with
   * @returns True if vectors are exactly equal, false otherwise
   */
  isStrictEqual(vec: IVector3) {
    if (this._v[0] === vec._v[0] && this._v[1] === vec._v[1] && this._v[2] === vec._v[2]) {
      return true;
    }
    return false;
  }

  /**
   * Gets the component at the specified index.
   * @param i - The index (0 for x, 1 for y, 2 for z)
   * @returns The component value at the specified index
   */
  at(i: number) {
    return this._v[i];
  }

  /**
   * Calculates the length (magnitude) of the vector.
   * @returns The length of the vector
   */
  length() {
    return Math.hypot(this._v[0], this._v[1], this._v[2]);
  }

  /**
   * Calculates the squared length of the vector.
   * This is more efficient than calculating the actual length when only comparison is needed.
   * @returns The squared length of the vector
   */
  lengthSquared(): number {
    return this._v[0] ** 2 + this._v[1] ** 2 + this._v[2] ** 2;
  }

  /**
   * Calculates the distance from this vector to another vector.
   * @param vec - The target vector
   * @returns The distance between the vectors
   */
  lengthTo(vec: IVector3) {
    const deltaX = this._v[0] - vec._v[0];
    const deltaY = this._v[1] - vec._v[1];
    const deltaZ = this._v[2] - vec._v[2];
    return Math.hypot(deltaX, deltaY, deltaZ);
  }

  /**
   * Calculates the dot product of this vector with another vector.
   * @param vec - The vector to calculate dot product with
   * @returns The dot product result
   */
  dot(vec: IVector3) {
    return this._v[0] * vec._v[0] + this._v[1] * vec._v[1] + this._v[2] * vec._v[2];
  }

  /**
   * Gets the class name.
   * @returns The class name "Vector3"
   */
  get className() {
    return 'Vector3';
  }

  /**
   * Creates a copy of this vector.
   * @returns A new vector with the same components
   */
  clone() {
    return new (this.constructor as any)(new (this._v.constructor as any)([this._v[0], this._v[1], this._v[2]], 0, 0));
  }

  /**
   * Gets the number of bytes per component.
   * @returns The number of bytes per component (4 for Float32Array, 8 for Float64Array)
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }

  /**
   * Performs linear interpolation between two vectors (static version).
   * @param lhs - The start vector
   * @param rhs - The end vector
   * @param ratio - The interpolation ratio (0.0 to 1.0)
   * @param type - The typed array constructor to use
   * @returns A new vector containing the interpolated result
   */
  static _lerp(lhs: IVector3, rhs: IVector3, ratio: number, type: FloatTypedArrayConstructor) {
    return new this(
      new type([
        lhs._v[0] * (1 - ratio) + rhs._v[0] * ratio,
        lhs._v[1] * (1 - ratio) + rhs._v[1] * ratio,
        lhs._v[2] * (1 - ratio) + rhs._v[2] * ratio,
      ]),
      { type }
    );
  }

  /**
   * Creates a vector from a 3-element array.
   * @param array - The array containing x, y, z components
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromCopyArray3(array: Array3<number>, type: FloatTypedArrayConstructor) {
    return new this(new type(array), { type });
  }

  /**
   * Creates a vector from individual x, y, z components.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromCopy3(x: number, y: number, z: number, type: FloatTypedArrayConstructor) {
    return new this(new type([x, y, z]), { type });
  }

  /**
   * Creates a vector from an array (takes first 3 elements).
   * @param array - The array containing the components
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromCopyArray(array: Array<number>, type: FloatTypedArrayConstructor) {
    return new this(new type(array.slice(0, 3)), { type });
  }

  /**
   * Creates a vector by copying from another Vector3.
   * @param vec3 - The source vector to copy from
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromCopyVector3(vec3: IVector3, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec3._v[0], vec3._v[1], vec3._v[2]]), {
      type,
    });
    return vec;
  }

  /**
   * Creates a Vector3 from a Vector4 (drops the w component).
   * @param vec4 - The source Vector4 to copy from
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromCopyVector4(vec4: IVector4, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec4._v[0], vec4._v[1], vec4._v[2]]), {
      type,
    });
    return vec;
  }

  /**
   * Creates a Vector3 from a Vector2 (sets z component to 0).
   * @param vec2 - The source Vector2 to copy from
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromVector2(vec2: IVector2, type: FloatTypedArrayConstructor) {
    const vec = new this(new type([vec2._v[0], vec2._v[1], 0]), {
      type,
    });
    return vec;
  }
}

/**
 * Immutable 3D vector class with 32-bit float components.
 * This is the standard precision implementation for most 3D graphics operations.
 * Provides efficient vector operations for position, direction, and other 3D calculations.
 *
 * @example
 * ```typescript
 * const v1 = Vector3.fromCopy3(1, 2, 3);
 * const v2 = Vector3.fromCopy3(4, 5, 6);
 * const sum = Vector3.add(v1, v2);
 * ```
 */
export class Vector3 extends Vector3_<Float32ArrayConstructor> {
  /**
   * Creates a new Vector3 instance from a typed array.
   * @param v - The Float32Array containing the vector components
   */
  constructor(v: TypedArray) {
    super(v, { type: Float32Array });
  }

  /**
   * Creates a vector from a 3-element array.
   * @param array - Array containing [x, y, z] components
   * @returns A new Vector3 instance
   */
  static fromCopyArray3(array: Array3<number>): Vector3 {
    return super._fromCopyArray3(array, Float32Array);
  }

  /**
   * Creates a vector from individual x, y, z components.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new Vector3 instance
   */
  static fromCopy3(x: number, y: number, z: number): Vector3 {
    return super._fromCopy3(x, y, z, Float32Array);
  }

  /**
   * Creates a vector with all components set to the same value.
   * @param val - The value to set for all components
   * @returns A new Vector3 instance
   */
  static fromCopy1(val: number): Vector3 {
    return super._fromCopy3(val, val, val, Float32Array);
  }

  /**
   * Creates a vector from an array (takes first 3 elements).
   * @param array - The array containing the components
   * @returns A new Vector3 instance
   */
  static fromCopyArray(array: Array<number>): Vector3 {
    return super._fromCopyArray(array, Float32Array);
  }

  /**
   * Creates a vector by copying from another Vector3.
   * @param vec3 - The source vector to copy from
   * @returns A new Vector3 instance
   */
  static fromCopyVector3(vec3: IVector3): Vector3 {
    return super._fromCopyVector3(vec3, Float32Array);
  }

  /**
   * Creates a Vector3 from a Vector4 (drops the w component).
   * @param vec4 - The source Vector4 to copy from
   * @returns A new Vector3 instance
   */
  static fromCopyVector4(vec4: IVector4): Vector3 {
    return super._fromCopyVector4(vec4, Float32Array);
  }

  /**
   * Creates a vector from an ArrayBuffer.
   * @param arrayBuffer - The ArrayBuffer containing the vector data
   * @returns A new Vector3 instance
   */
  static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector3 {
    return new Vector3(new Float32Array(arrayBuffer));
  }

  /**
   * Creates a vector from a Float32Array.
   * @param float32Array - The Float32Array containing the vector data
   * @returns A new Vector3 instance
   */
  static fromFloat32Array(float32Array: Float32Array): Vector3 {
    return new Vector3(float32Array);
  }

  /**
   * Creates a vector by copying data from a Float32Array.
   * @param float32Array - The Float32Array to copy from
   * @returns A new Vector3 instance
   */
  static fromCopyFloat32Array(float32Array: Float32Array): Vector3 {
    return new Vector3(float32Array.slice(0));
  }

  /**
   * Creates a zero vector (0, 0, 0).
   * @returns A new Vector3 instance with all components set to 0
   */
  static zero(): Vector3 {
    return super._zero(Float32Array);
  }

  /**
   * Creates a vector with all components set to 1 (1, 1, 1).
   * @returns A new Vector3 instance with all components set to 1
   */
  static one(): Vector3 {
    return super._one(Float32Array);
  }

  /**
   * Creates an empty dummy vector for placeholder purposes.
   * @returns A new dummy Vector3 instance
   */
  static dummy(): Vector3 {
    return super._dummy(Float32Array);
  }

  /**
   * Normalizes a vector to unit length.
   * @param vec - The vector to normalize
   * @returns A new normalized Vector3 instance
   */
  static normalize(vec: IVector3): Vector3 {
    return super._normalize(vec, Float32Array);
  }

  /**
   * Adds two vectors component-wise.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns A new Vector3 instance containing the sum
   */
  static add(l_vec: IVector3, r_vec: IVector3): Vector3 {
    return super._add(l_vec, r_vec, Float32Array);
  }

  /**
   * Subtracts the second vector from the first vector.
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new Vector3 instance containing the difference
   */
  static subtract(l_vec: IVector3, r_vec: IVector3): Vector3 {
    return super._subtract(l_vec, r_vec, Float32Array);
  }

  /**
   * Multiplies a vector by a scalar value.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector3 instance containing the scaled result
   */
  static multiply(vec: IVector3, value: number): Vector3 {
    return super._multiply(vec, value, Float32Array);
  }

  /**
   * Multiplies two vectors component-wise.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns A new Vector3 instance containing the component-wise product
   */
  static multiplyVector(l_vec: IVector3, r_vec: IVector3): Vector3 {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }

  /**
   * Transforms a 3D vector by a 4x4 matrix.
   * @param vec - The vector to transform
   * @param mat - The 4x4 transformation matrix
   * @returns A new Vector3 instance containing the transformed result
   */
  static multiplyMatrix4(vec: IVector3, mat: IMatrix44): Vector3 {
    return super._multiplyMatrix4(vec, mat, Float32Array);
  }

  /**
   * Divides a vector by a scalar value.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector3 instance containing the divided result
   */
  static divide(vec: IVector3, value: number): Vector3 {
    return super._divide(vec, value, Float32Array);
  }

  /**
   * Divides two vectors component-wise.
   * @param l_vec - The vector to divide
   * @param r_vec - The vector to divide by
   * @returns A new Vector3 instance containing the component-wise division result
   */
  static divideVector(l_vec: IVector3, r_vec: IVector3): Vector3 {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }

  /**
   * Calculates the cross product of two vectors.
   * @param l_vec - The first vector (left operand)
   * @param r_vec - The second vector (right operand)
   * @returns A new Vector3 instance containing the cross product result
   */
  static cross(l_vec: IVector3, r_vec: IVector3): Vector3 {
    return super._cross(l_vec, r_vec, Float32Array);
  }

  /**
   * Transforms a vector by a quaternion rotation.
   * @param quat - The quaternion to apply
   * @param vec - The vector to transform
   * @returns A new Vector3 instance containing the transformed result
   */
  static multiplyQuaternion(quat: IQuaternion, vec: IVector3): Vector3 {
    return super._multiplyQuaternion(quat, vec, Float32Array);
  }

  /**
   * Performs linear interpolation between two vectors.
   * @param lhs - The start vector
   * @param rhs - The end vector
   * @param ratio - The interpolation ratio (0.0 to 1.0)
   * @returns A new Vector3 instance containing the interpolated result
   */
  static lerp(lhs: IVector3, rhs: IVector3, ratio: number): Vector3 {
    return super._lerp(lhs, rhs, ratio, Float32Array);
  }
}

/**
 * Immutable 3D vector class with 64-bit float components.
 * This high-precision implementation is suitable for applications requiring
 * double precision floating-point calculations, such as scientific computing
 * or when dealing with very large coordinate systems.
 *
 * @example
 * ```typescript
 * const v1 = Vector3d.fromCopy3(1.123456789, 2.987654321, 3.456789123);
 * const v2 = Vector3d.fromCopy3(4.111111111, 5.222222222, 6.333333333);
 * const sum = Vector3d.add(v1, v2);
 * ```
 */
export class Vector3d extends Vector3_<Float64ArrayConstructor> {
  /**
   * Creates a new Vector3d instance from a typed array.
   * @param v - The Float64Array containing the vector components
   */
  private constructor(v: TypedArray) {
    super(v, { type: Float64Array });
  }

  /**
   * Creates a vector from a 3-element array.
   * @param array - Array containing [x, y, z] components
   * @returns A new Vector3d instance
   */
  static fromCopyArray3(array: Array3<number>): Vector3d {
    return super._fromCopyArray3(array, Float64Array);
  }

  /**
   * Creates a vector from individual x, y, z components.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new Vector3d instance
   */
  static fromCopy3(x: number, y: number, z: number): Vector3d {
    return super._fromCopy3(x, y, z, Float64Array);
  }

  /**
   * Creates a vector with all components set to the same value.
   * @param val - The value to set for all components
   * @returns A new Vector3d instance
   */
  static fromCopy1(val: number): Vector3d {
    return super._fromCopy3(val, val, val, Float64Array);
  }

  /**
   * Creates a vector from an array (takes first 3 elements).
   * @param array - The array containing the components
   * @returns A new Vector3d instance
   */
  static fromCopyArray(array: Array<number>): Vector3d {
    return super._fromCopyArray(array, Float64Array);
  }

  /**
   * Creates a vector from an ArrayBuffer.
   * @param arrayBuffer - The ArrayBuffer containing the vector data
   * @returns A new Vector3d instance
   */
  static fromArrayBuffer(arrayBuffer: ArrayBuffer): Vector3d {
    return new Vector3d(new Float64Array(arrayBuffer));
  }

  /**
   * Creates a vector from a Float64Array.
   * @param float64Array - The Float64Array containing the vector data
   * @returns A new Vector3d instance
   */
  static fromFloat64Array(float64Array: Float64Array): Vector3d {
    return new Vector3d(float64Array);
  }

  /**
   * Creates a zero vector (0, 0, 0).
   * @returns A new Vector3d instance with all components set to 0
   */
  static zero(): Vector3d {
    return super._zero(Float64Array);
  }

  /**
   * Creates a vector with all components set to 1 (1, 1, 1).
   * @returns A new Vector3d instance with all components set to 1
   */
  static one(): Vector3d {
    return super._one(Float64Array);
  }

  /**
   * Creates an empty dummy vector for placeholder purposes.
   * @returns A new dummy Vector3d instance
   */
  static dummy(): Vector3d {
    return super._dummy(Float64Array);
  }

  /**
   * Normalizes a vector to unit length.
   * @param vec - The vector to normalize
   * @returns A new normalized Vector3d instance
   */
  static normalize(vec: IVector3): Vector3d {
    return super._normalize(vec, Float64Array);
  }

  /**
   * Adds two vectors component-wise.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns A new Vector3d instance containing the sum
   */
  static add(l_vec: IVector3, r_vec: IVector3): Vector3d {
    return super._add(l_vec, r_vec, Float64Array);
  }

  /**
   * Subtracts the second vector from the first vector.
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new Vector3d instance containing the difference
   */
  static subtract(l_vec: IVector3, r_vec: IVector3): Vector3d {
    return super._subtract(l_vec, r_vec, Float64Array);
  }

  /**
   * Multiplies a vector by a scalar value.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector3d instance containing the scaled result
   */
  static multiply(vec: IVector3, value: number): Vector3d {
    return super._multiply(vec, value, Float64Array);
  }

  /**
   * Multiplies two vectors component-wise.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns A new Vector3d instance containing the component-wise product
   */
  static multiplyVector(l_vec: IVector3, r_vec: IVector3): Vector3d {
    return super._multiplyVector(l_vec, r_vec, Float64Array);
  }

  /**
   * Transforms a 3D vector by a 4x4 matrix.
   * @param vec - The vector to transform
   * @param mat - The 4x4 transformation matrix
   * @returns A new Vector3d instance containing the transformed result
   */
  static multiplyMatrix4(vec: IVector3, mat: IMatrix44): Vector3d {
    return super._multiplyMatrix4(vec, mat, Float64Array);
  }

  /**
   * Divides a vector by a scalar value.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector3d instance containing the divided result
   */
  static divide(vec: IVector3, value: number): Vector3d {
    return super._divide(vec, value, Float64Array);
  }

  /**
   * Divides two vectors component-wise.
   * @param l_vec - The vector to divide
   * @param r_vec - The vector to divide by
   * @returns A new Vector3d instance containing the component-wise division result
   */
  static divideVector(l_vec: IVector3, r_vec: IVector3): Vector3d {
    return super._divideVector(l_vec, r_vec, Float64Array);
  }

  /**
   * Calculates the cross product of two vectors.
   * @param l_vec - The first vector (left operand)
   * @param r_vec - The second vector (right operand)
   * @returns A new Vector3d instance containing the cross product result
   */
  static cross(l_vec: IVector3, r_vec: IVector3): Vector3d {
    return super._cross(l_vec, r_vec, Float64Array);
  }

  /**
   * Transforms a vector by a quaternion rotation.
   * @param quat - The quaternion to apply
   * @param vec - The vector to transform
   * @returns A new Vector3d instance containing the transformed result
   */
  static multiplyQuaternion(quat: IQuaternion, vec: IVector3): Vector3d {
    return super._multiplyQuaternion(quat, vec, Float64Array);
  }

  /**
   * Performs linear interpolation between two vectors.
   * @param lhs - The start vector
   * @param rhs - The end vector
   * @param ratio - The interpolation ratio (0.0 to 1.0)
   * @returns A new Vector3d instance containing the interpolated result
   */
  static lerp(lhs: IVector3, rhs: IVector3, ratio: number): Vector3d {
    return super._lerp(lhs, rhs, ratio, Float64Array);
  }
}

/**
 * Type alias for Vector3 with 32-bit float precision.
 * @deprecated Use Vector3 directly instead
 */
export type Vector3f = Vector3;

/**
 * Constant vector representing (1, 1, 1).
 * Useful for scaling operations or as a default "one" value.
 */
export const ConstVector3_1_1_1 = Vector3.fromCopy3(1, 1, 1);

/**
 * Constant vector representing (0, 0, 0).
 * Useful as an origin point or for zero/null vector operations.
 */
export const ConstVector3_0_0_0 = Vector3.fromCopy3(0, 0, 0);
