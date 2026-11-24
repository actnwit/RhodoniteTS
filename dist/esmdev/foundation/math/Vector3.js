// src/foundation/math/Vector3.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Logger } from "../misc/Logger.js";
import { AbstractVector } from "./AbstractVector.js";
import { MathUtil } from "./MathUtil.js";
var Vector3_ = class extends AbstractVector {
  /**
   * Creates a new Vector3_ instance.
   * @param v - The typed array containing the vector components
   * @param type - Configuration object containing the typed array constructor
   */
  constructor(v, _options) {
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
  static lengthSquared(vec) {
    return vec.lengthSquared();
  }
  /**
   * Calculates the distance between two vectors.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The distance between the two vectors
   */
  static lengthBtw(l_vec, r_vec) {
    return l_vec.lengthTo(r_vec);
  }
  /**
   * Calculates the angle between two vectors in radians.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The angle between the vectors in radians
   * @throws Error if either vector has zero length
   */
  static angleOfVectors(l_vec, r_vec) {
    const multipliedLength = l_vec.length() * r_vec.length();
    if (multipliedLength === 0) {
      Logger.default.error("length of a vector is 0!");
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
  static _zero(type) {
    return this._fromCopyArray([0, 0, 0], type);
  }
  /**
   * Creates a vector with all components set to 1 (1, 1, 1).
   * @param type - The typed array constructor to use
   * @returns A new vector with all components set to 1
   */
  static _one(type) {
    return this._fromCopyArray([1, 1, 1], type);
  }
  /**
   * Creates an empty dummy vector for placeholder purposes.
   * @param type - The typed array constructor to use
   * @returns A new dummy vector
   */
  static _dummy(type) {
    return new this(new type([]), { type });
  }
  /**
   * Normalizes a vector to unit length (static version).
   * A zero-length vector is normalized to the zero vector (an error is logged)
   * instead of becoming `Infinity`/`NaN`.
   * @param vec - The vector to normalize
   * @param type - The typed array constructor to use
   * @returns A new normalized vector
   */
  static _normalize(vec, type) {
    const length = vec.length();
    return this._divide(vec, length, type);
  }
  /**
   * Normalizes a vector and stores the result in the output vector.
   * @param vec - The vector to normalize
   * @param out - The output vector to store the result
   * @returns The output vector containing the normalized result
   */
  static normalizeTo(vec, out) {
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
  static _add(l_vec, r_vec, type) {
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
  static addTo(l_vec, r_vec, out) {
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
  static addScaledVectorTo(l_vec, r_vec, scale, out) {
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
  static _subtract(l_vec, r_vec, type) {
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
  static subtractTo(l_vec, r_vec, out) {
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
  static _multiply(vec, value, type) {
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
  static multiplyTo(vec, value, out) {
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
  static _multiplyVector(l_vec, r_vec, type) {
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
  static multiplyVectorTo(l_vec, r_vec, out) {
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
  static _multiplyMatrix4(vec, mat, type) {
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
  static multiplyMatrix4To(vec, mat, out) {
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
   * @remarks If division by zero occurs, the result is set to 0 and an error is logged
   */
  static _divide(vec, value, type) {
    let x;
    let y;
    let z;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
      z = vec._v[2] / value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      x = 0;
      y = 0;
      z = 0;
    }
    return this._fromCopyArray([x, y, z], type);
  }
  /**
   * Divides a vector by a scalar and stores the result in the output vector.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param out - The output vector to store the result
   * @returns The output vector containing the divided result
   * @remarks If division by zero occurs, the result is set to 0 and an error is logged
   */
  static divideTo(vec, value, out) {
    if (value !== 0) {
      out._v[0] = vec._v[0] / value;
      out._v[1] = vec._v[1] / value;
      out._v[2] = vec._v[2] / value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      out._v[0] = 0;
      out._v[1] = 0;
      out._v[2] = 0;
    }
    return out;
  }
  /**
   * Divides two vectors component-wise (static version).
   * @param l_vec - The vector to divide
   * @param r_vec - The vector to divide by
   * @param type - The typed array constructor to use
   * @returns A new vector containing the component-wise division result
   * @remarks If division by zero occurs, the result is set to 0 and an error is logged
   */
  static _divideVector(l_vec, r_vec, type) {
    let x;
    let y;
    let z;
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0 && r_vec._v[2] !== 0) {
      x = l_vec._v[0] / r_vec._v[0];
      y = l_vec._v[1] / r_vec._v[1];
      z = l_vec._v[2] / r_vec._v[2];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      x = r_vec._v[0] === 0 ? 0 : l_vec._v[0] / r_vec._v[0];
      y = r_vec._v[1] === 0 ? 0 : l_vec._v[1] / r_vec._v[1];
      z = r_vec._v[2] === 0 ? 0 : l_vec._v[2] / r_vec._v[2];
    }
    return this._fromCopyArray([x, y, z], type);
  }
  /**
   * Divides two vectors component-wise and stores the result in the output vector.
   * @param l_vec - The vector to divide
   * @param r_vec - The vector to divide by
   * @param out - The output vector to store the result
   * @returns The output vector containing the component-wise division result
   * @remarks If division by zero occurs, the result is set to 0 and an error is logged
   */
  static divideVectorTo(l_vec, r_vec, out) {
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0 && r_vec._v[2] !== 0) {
      out._v[0] = l_vec._v[0] / r_vec._v[0];
      out._v[1] = l_vec._v[1] / r_vec._v[1];
      out._v[2] = l_vec._v[2] / r_vec._v[2];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      out._v[0] = r_vec._v[0] === 0 ? 0 : l_vec._v[0] / r_vec._v[0];
      out._v[1] = r_vec._v[1] === 0 ? 0 : l_vec._v[1] / r_vec._v[1];
      out._v[2] = r_vec._v[2] === 0 ? 0 : l_vec._v[2] / r_vec._v[2];
    }
    return out;
  }
  /**
   * Calculates the dot product of two vectors (static version).
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The dot product of the two vectors
   */
  static dot(l_vec, r_vec) {
    return l_vec.dot(r_vec);
  }
  /**
   * Calculates the cross product of two vectors (static version).
   * @param l_vec - The first vector (left operand)
   * @param r_vec - The second vector (right operand)
   * @param type - The typed array constructor to use
   * @returns A new vector containing the cross product result
   */
  static _cross(l_vec, r_vec, type) {
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
  static crossTo(l_vec, r_vec, out) {
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
  static _multiplyQuaternion(quat, vec, type) {
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
  static multiplyQuaternionTo(quat, vec, out) {
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
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[2])}
`;
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
  isEqual(vec, delta = Number.EPSILON) {
    if (Math.abs(vec._v[0] - this._v[0]) < delta && Math.abs(vec._v[1] - this._v[1]) < delta && Math.abs(vec._v[2] - this._v[2]) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this vector is strictly equal to another vector (exact comparison).
   * @param vec - The vector to compare with
   * @returns True if vectors are exactly equal, false otherwise
   */
  isStrictEqual(vec) {
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
  at(i) {
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
  lengthSquared() {
    return this._v[0] ** 2 + this._v[1] ** 2 + this._v[2] ** 2;
  }
  /**
   * Calculates the distance from this vector to another vector.
   * @param vec - The target vector
   * @returns The distance between the vectors
   */
  lengthTo(vec) {
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
  dot(vec) {
    return this._v[0] * vec._v[0] + this._v[1] * vec._v[1] + this._v[2] * vec._v[2];
  }
  /**
   * Gets the class name.
   * @returns The class name "Vector3"
   */
  get className() {
    return "Vector3";
  }
  /**
   * Creates a copy of this vector.
   * @returns A new vector with the same components
   */
  clone() {
    return new this.constructor(new this._v.constructor([this._v[0], this._v[1], this._v[2]], 0, 0));
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
  static _lerp(lhs, rhs, ratio, type) {
    return new this(
      new type([
        lhs._v[0] * (1 - ratio) + rhs._v[0] * ratio,
        lhs._v[1] * (1 - ratio) + rhs._v[1] * ratio,
        lhs._v[2] * (1 - ratio) + rhs._v[2] * ratio
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
  static _fromCopyArray3(array, type) {
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
  static _fromCopy3(x, y, z, type) {
    return new this(new type([x, y, z]), { type });
  }
  /**
   * Creates a vector from an array (takes first 3 elements).
   * @param array - The array containing the components
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromCopyArray(array, type) {
    return new this(new type(array.slice(0, 3)), { type });
  }
  /**
   * Creates a vector by copying from another Vector3.
   * @param vec3 - The source vector to copy from
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromCopyVector3(vec3, type) {
    const vec = new this(new type([vec3._v[0], vec3._v[1], vec3._v[2]]), {
      type
    });
    return vec;
  }
  /**
   * Creates a Vector3 from a Vector4 (drops the w component).
   * @param vec4 - The source Vector4 to copy from
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromCopyVector4(vec4, type) {
    const vec = new this(new type([vec4._v[0], vec4._v[1], vec4._v[2]]), {
      type
    });
    return vec;
  }
  /**
   * Creates a Vector3 from a Vector2 (sets z component to 0).
   * @param vec2 - The source Vector2 to copy from
   * @param type - The typed array constructor to use
   * @returns A new vector
   */
  static _fromVector2(vec2, type) {
    const vec = new this(new type([vec2._v[0], vec2._v[1], 0]), {
      type
    });
    return vec;
  }
};
var Vector3 = class _Vector3 extends Vector3_ {
  /**
   * Creates a new Vector3 instance from a typed array.
   * @param v - The Float32Array containing the vector components
   */
  constructor(v) {
    super(v, { type: Float32Array });
  }
  /**
   * Creates a vector from a 3-element array.
   * @param array - Array containing [x, y, z] components
   * @returns A new Vector3 instance
   */
  static fromCopyArray3(array) {
    return super._fromCopyArray3(array, Float32Array);
  }
  /**
   * Creates a vector from individual x, y, z components.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new Vector3 instance
   */
  static fromCopy3(x, y, z) {
    return super._fromCopy3(x, y, z, Float32Array);
  }
  /**
   * Creates a vector with all components set to the same value.
   * @param val - The value to set for all components
   * @returns A new Vector3 instance
   */
  static fromCopy1(val) {
    return super._fromCopy3(val, val, val, Float32Array);
  }
  /**
   * Creates a vector from an array (takes first 3 elements).
   * @param array - The array containing the components
   * @returns A new Vector3 instance
   */
  static fromCopyArray(array) {
    return super._fromCopyArray(array, Float32Array);
  }
  /**
   * Creates a vector by copying from another Vector3.
   * @param vec3 - The source vector to copy from
   * @returns A new Vector3 instance
   */
  static fromCopyVector3(vec3) {
    return super._fromCopyVector3(vec3, Float32Array);
  }
  /**
   * Creates a Vector3 from a Vector4 (drops the w component).
   * @param vec4 - The source Vector4 to copy from
   * @returns A new Vector3 instance
   */
  static fromCopyVector4(vec4) {
    return super._fromCopyVector4(vec4, Float32Array);
  }
  /**
   * Creates a vector from an ArrayBuffer.
   * @param arrayBuffer - The ArrayBuffer containing the vector data
   * @returns A new Vector3 instance
   */
  static fromArrayBuffer(arrayBuffer) {
    return new _Vector3(new Float32Array(arrayBuffer));
  }
  /**
   * Creates a vector from a Float32Array.
   * @param float32Array - The Float32Array containing the vector data
   * @returns A new Vector3 instance
   */
  static fromFloat32Array(float32Array) {
    return new _Vector3(float32Array);
  }
  /**
   * Creates a vector by copying data from a Float32Array.
   * @param float32Array - The Float32Array to copy from
   * @returns A new Vector3 instance
   */
  static fromCopyFloat32Array(float32Array) {
    return new _Vector3(float32Array.slice(0));
  }
  /**
   * Creates a zero vector (0, 0, 0).
   * @returns A new Vector3 instance with all components set to 0
   */
  static zero() {
    return super._zero(Float32Array);
  }
  /**
   * Creates a vector with all components set to 1 (1, 1, 1).
   * @returns A new Vector3 instance with all components set to 1
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates an empty dummy vector for placeholder purposes.
   * @returns A new dummy Vector3 instance
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Normalizes a vector to unit length.
   * @param vec - The vector to normalize
   * @returns A new normalized Vector3 instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Adds two vectors component-wise.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns A new Vector3 instance containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Subtracts the second vector from the first vector.
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new Vector3 instance containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Multiplies a vector by a scalar value.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector3 instance containing the scaled result
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Multiplies two vectors component-wise.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns A new Vector3 instance containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Transforms a 3D vector by a 4x4 matrix.
   * @param vec - The vector to transform
   * @param mat - The 4x4 transformation matrix
   * @returns A new Vector3 instance containing the transformed result
   */
  static multiplyMatrix4(vec, mat) {
    return super._multiplyMatrix4(vec, mat, Float32Array);
  }
  /**
   * Divides a vector by a scalar value.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector3 instance containing the divided result
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Divides two vectors component-wise.
   * @param l_vec - The vector to divide
   * @param r_vec - The vector to divide by
   * @returns A new Vector3 instance containing the component-wise division result
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Calculates the cross product of two vectors.
   * @param l_vec - The first vector (left operand)
   * @param r_vec - The second vector (right operand)
   * @returns A new Vector3 instance containing the cross product result
   */
  static cross(l_vec, r_vec) {
    return super._cross(l_vec, r_vec, Float32Array);
  }
  /**
   * Transforms a vector by a quaternion rotation.
   * @param quat - The quaternion to apply
   * @param vec - The vector to transform
   * @returns A new Vector3 instance containing the transformed result
   */
  static multiplyQuaternion(quat, vec) {
    return super._multiplyQuaternion(quat, vec, Float32Array);
  }
  /**
   * Performs linear interpolation between two vectors.
   * @param lhs - The start vector
   * @param rhs - The end vector
   * @param ratio - The interpolation ratio (0.0 to 1.0)
   * @returns A new Vector3 instance containing the interpolated result
   */
  static lerp(lhs, rhs, ratio) {
    return super._lerp(lhs, rhs, ratio, Float32Array);
  }
};
var Vector3D = class _Vector3D extends Vector3_ {
  /**
   * Creates a new Vector3D instance from a typed array.
   * @param v - The Float64Array containing the vector components
   */
  constructor(v) {
    super(v, { type: Float64Array });
  }
  /**
   * Creates a vector from a 3-element array.
   * @param array - Array containing [x, y, z] components
   * @returns A new Vector3D instance
   */
  static fromCopyArray3(array) {
    return super._fromCopyArray3(array, Float64Array);
  }
  /**
   * Creates a vector from individual x, y, z components.
   * @param x - The x component
   * @param y - The y component
   * @param z - The z component
   * @returns A new Vector3D instance
   */
  static fromCopy3(x, y, z) {
    return super._fromCopy3(x, y, z, Float64Array);
  }
  /**
   * Creates a vector with all components set to the same value.
   * @param val - The value to set for all components
   * @returns A new Vector3D instance
   */
  static fromCopy1(val) {
    return super._fromCopy3(val, val, val, Float64Array);
  }
  /**
   * Creates a vector from an array (takes first 3 elements).
   * @param array - The array containing the components
   * @returns A new Vector3D instance
   */
  static fromCopyArray(array) {
    return super._fromCopyArray(array, Float64Array);
  }
  /**
   * Creates a vector from an ArrayBuffer.
   * @param arrayBuffer - The ArrayBuffer containing the vector data
   * @returns A new Vector3D instance
   */
  static fromArrayBuffer(arrayBuffer) {
    return new _Vector3D(new Float64Array(arrayBuffer));
  }
  /**
   * Creates a vector from a Float64Array.
   * @param float64Array - The Float64Array containing the vector data
   * @returns A new Vector3D instance
   */
  static fromFloat64Array(float64Array) {
    return new _Vector3D(float64Array);
  }
  /**
   * Creates a zero vector (0, 0, 0).
   * @returns A new Vector3D instance with all components set to 0
   */
  static zero() {
    return super._zero(Float64Array);
  }
  /**
   * Creates a vector with all components set to 1 (1, 1, 1).
   * @returns A new Vector3D instance with all components set to 1
   */
  static one() {
    return super._one(Float64Array);
  }
  /**
   * Creates an empty dummy vector for placeholder purposes.
   * @returns A new dummy Vector3D instance
   */
  static dummy() {
    return super._dummy(Float64Array);
  }
  /**
   * Normalizes a vector to unit length.
   * @param vec - The vector to normalize
   * @returns A new normalized Vector3D instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float64Array);
  }
  /**
   * Adds two vectors component-wise.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns A new Vector3D instance containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float64Array);
  }
  /**
   * Subtracts the second vector from the first vector.
   * @param l_vec - The vector to subtract from
   * @param r_vec - The vector to subtract
   * @returns A new Vector3D instance containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float64Array);
  }
  /**
   * Multiplies a vector by a scalar value.
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector3D instance containing the scaled result
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float64Array);
  }
  /**
   * Multiplies two vectors component-wise.
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns A new Vector3D instance containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Transforms a 3D vector by a 4x4 matrix.
   * @param vec - The vector to transform
   * @param mat - The 4x4 transformation matrix
   * @returns A new Vector3D instance containing the transformed result
   */
  static multiplyMatrix4(vec, mat) {
    return super._multiplyMatrix4(vec, mat, Float64Array);
  }
  /**
   * Divides a vector by a scalar value.
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector3D instance containing the divided result
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float64Array);
  }
  /**
   * Divides two vectors component-wise.
   * @param l_vec - The vector to divide
   * @param r_vec - The vector to divide by
   * @returns A new Vector3D instance containing the component-wise division result
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Calculates the cross product of two vectors.
   * @param l_vec - The first vector (left operand)
   * @param r_vec - The second vector (right operand)
   * @returns A new Vector3D instance containing the cross product result
   */
  static cross(l_vec, r_vec) {
    return super._cross(l_vec, r_vec, Float64Array);
  }
  /**
   * Transforms a vector by a quaternion rotation.
   * @param quat - The quaternion to apply
   * @param vec - The vector to transform
   * @returns A new Vector3D instance containing the transformed result
   */
  static multiplyQuaternion(quat, vec) {
    return super._multiplyQuaternion(quat, vec, Float64Array);
  }
  /**
   * Performs linear interpolation between two vectors.
   * @param lhs - The start vector
   * @param rhs - The end vector
   * @param ratio - The interpolation ratio (0.0 to 1.0)
   * @returns A new Vector3D instance containing the interpolated result
   */
  static lerp(lhs, rhs, ratio) {
    return super._lerp(lhs, rhs, ratio, Float64Array);
  }
};
var ConstVector3_1_1_1 = Vector3.fromCopy3(1, 1, 1);
var ConstVector3_0_0_0 = Vector3.fromCopy3(0, 0, 0);
export {
  ConstVector3_0_0_0,
  ConstVector3_1_1_1,
  Vector3,
  Vector3D,
  Vector3 as Vector3F,
  Vector3_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9WZWN0b3IzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEFycmF5MywgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQWJzdHJhY3RWZWN0b3IgfSBmcm9tICcuL0Fic3RyYWN0VmVjdG9yJztcbmltcG9ydCB0eXBlIHsgSU1hdHJpeDQ0IH0gZnJvbSAnLi9JTWF0cml4JztcbmltcG9ydCB0eXBlIHsgSVF1YXRlcm5pb24gfSBmcm9tICcuL0lRdWF0ZXJuaW9uJztcbmltcG9ydCB0eXBlIHsgSU11dGFibGVWZWN0b3IzLCBJVmVjdG9yLCBJVmVjdG9yMiwgSVZlY3RvcjMsIElWZWN0b3I0IH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi9NYXRoVXRpbCc7XG5cbi8qKlxuICogR2VuZXJpYyBiYXNlIGNsYXNzIGZvciAzRCB2ZWN0b3JzIHdpdGggZmxvYXRpbmctcG9pbnQgY29tcG9uZW50cy5cbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgaW1tdXRhYmxlIDNEIHZlY3RvciBvcGVyYXRpb25zIGFuZCBzZXJ2ZXMgYXMgdGhlIGZvdW5kYXRpb25cbiAqIGZvciBib3RoIDMyLWJpdCBhbmQgNjQtYml0IHByZWNpc2lvbiB2ZWN0b3IgaW1wbGVtZW50YXRpb25zLlxuICpcbiAqIEB0ZW1wbGF0ZSBUIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIChGbG9hdDMyQXJyYXkgb3IgRmxvYXQ2NEFycmF5KVxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjbGFzcyBWZWN0b3IzXzxUIGV4dGVuZHMgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3I+IGV4dGVuZHMgQWJzdHJhY3RWZWN0b3IgaW1wbGVtZW50cyBJVmVjdG9yLCBJVmVjdG9yMyB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjNfIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gdiAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50c1xuICAgKiBAcGFyYW0gdHlwZSAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih2OiBUeXBlZEFycmF5LCBfb3B0aW9uczogeyB0eXBlOiBUIH0pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3YgPSB2O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFggY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIFRoZSBYIGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHgoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWSBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cbiAgICogQHJldHVybnMgVGhlIFkgY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgeSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdlsxXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBaIGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKiBAcmV0dXJucyBUaGUgWiBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB6KCkge1xuICAgIHJldHVybiB0aGlzLl92WzJdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFcgY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IgKGFsd2F5cyByZXR1cm5zIDEgZm9yIGhvbW9nZW5lb3VzIGNvb3JkaW5hdGVzKS5cbiAgICogQHJldHVybnMgQWx3YXlzIHJldHVybnMgMVxuICAgKi9cbiAgZ2V0IHcoKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR0xTTCByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHZlY3RvciBhcyBhIGZsb2F0IHZlYzMuXG4gICAqIEByZXR1cm5zIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIHN1aXRhYmxlIGZvciBHTFNMIHNoYWRlcnNcbiAgICovXG4gIGdldCBnbHNsU3RyQXNGbG9hdCgpIHtcbiAgICByZXR1cm4gYHZlYzMoJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdChcbiAgICAgIHRoaXMuX3ZbMF1cbiAgICApfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzFdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsyXSl9KWA7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgR0xTTCByZXByZXNlbnRhdGlvbiBvZiB0aGlzIHZlY3RvciBhcyBhbiBpbnRlZ2VyIGl2ZWMzLlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBzdWl0YWJsZSBmb3IgR0xTTCBzaGFkZXJzIHdpdGggaW50ZWdlciBjb21wb25lbnRzXG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzSW50KCkge1xuICAgIHJldHVybiBgaXZlYzMoJHtNYXRoLmZsb29yKHRoaXMuX3ZbMF0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMV0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMl0pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFdHU0wgcmVwcmVzZW50YXRpb24gb2YgdGhpcyB2ZWN0b3IgYXMgYSBmbG9hdCB2ZWMzZi5cbiAgICogQHJldHVybnMgQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gc3VpdGFibGUgZm9yIFdHU0wgc2hhZGVyc1xuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc0Zsb2F0KCkge1xuICAgIHJldHVybiBgdmVjM2YoJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzBdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsxXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMl0pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFdHU0wgcmVwcmVzZW50YXRpb24gb2YgdGhpcyB2ZWN0b3IgYXMgYW4gaW50ZWdlciB2ZWMzaS5cbiAgICogQHJldHVybnMgQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gc3VpdGFibGUgZm9yIFdHU0wgc2hhZGVycyB3aXRoIGludGVnZXIgY29tcG9uZW50c1xuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc0ludCgpIHtcbiAgICByZXR1cm4gYHZlYzNpKCR7TWF0aC5mbG9vcih0aGlzLl92WzBdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzFdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzJdKX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb3NpdGlvbiB0eXBlIGZvciB0aGlzIHZlY3RvciBjbGFzcy5cbiAgICogQHJldHVybnMgVGhlIGNvbXBvc2l0aW9uIHR5cGUgKFZlYzMpXG4gICAqL1xuICBzdGF0aWMgZ2V0IGNvbXBvc2l0aW9uVHlwZSgpIHtcbiAgICByZXR1cm4gQ29tcG9zaXRpb25UeXBlLlZlYzM7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBsZW5ndGggb2YgYSB2ZWN0b3IgKHN0YXRpYyB2ZXJzaW9uKS5cbiAgICogVGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIGNhbGN1bGF0aW5nIHRoZSBhY3R1YWwgbGVuZ3RoIHdoZW4gb25seSBjb21wYXJpc29uIGlzIG5lZWRlZC5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gY2FsY3VsYXRlIHNxdWFyZWQgbGVuZ3RoIGZvclxuICAgKiBAcmV0dXJucyBUaGUgc3F1YXJlZCBsZW5ndGggb2YgdGhlIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIGxlbmd0aFNxdWFyZWQodmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiB2ZWMubGVuZ3RoU3F1YXJlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlY3RvcnMuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBmaXJzdCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHNlY29uZCB2ZWN0b3JcbiAgICogQHJldHVybnMgVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIHR3byB2ZWN0b3JzXG4gICAqL1xuICBzdGF0aWMgbGVuZ3RoQnR3KGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKSB7XG4gICAgcmV0dXJuIGxfdmVjLmxlbmd0aFRvKHJfdmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBhbmdsZSBiZXR3ZWVuIHR3byB2ZWN0b3JzIGluIHJhZGlhbnMuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBmaXJzdCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHNlY29uZCB2ZWN0b3JcbiAgICogQHJldHVybnMgVGhlIGFuZ2xlIGJldHdlZW4gdGhlIHZlY3RvcnMgaW4gcmFkaWFuc1xuICAgKiBAdGhyb3dzIEVycm9yIGlmIGVpdGhlciB2ZWN0b3IgaGFzIHplcm8gbGVuZ3RoXG4gICAqL1xuICBzdGF0aWMgYW5nbGVPZlZlY3RvcnMobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpIHtcbiAgICBjb25zdCBtdWx0aXBsaWVkTGVuZ3RoID0gbF92ZWMubGVuZ3RoKCkgKiByX3ZlYy5sZW5ndGgoKTtcbiAgICBpZiAobXVsdGlwbGllZExlbmd0aCA9PT0gMCkge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJ2xlbmd0aCBvZiBhIHZlY3RvciBpcyAwIScpO1xuICAgIH1cbiAgICBjb25zdCBjb3Nfc2l0YSA9IGxfdmVjLmRvdChyX3ZlYykgLyBtdWx0aXBsaWVkTGVuZ3RoO1xuICAgIGNvbnN0IHNpdGEgPSBNYXRoLmFjb3MoY29zX3NpdGEpO1xuICAgIHJldHVybiBzaXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB6ZXJvIHZlY3RvciAoMCwgMCwgMCkuXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZVxuICAgKiBAcmV0dXJucyBBIG5ldyB6ZXJvIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIF96ZXJvKHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5QXJyYXkoWzAsIDAsIDBdLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDEgKDEsIDEsIDEpLlxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDFcbiAgICovXG4gIHN0YXRpYyBfb25lKHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5QXJyYXkoWzEsIDEsIDFdLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGVtcHR5IGR1bW15IHZlY3RvciBmb3IgcGxhY2Vob2xkZXIgcHVycG9zZXMuXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZVxuICAgKiBAcmV0dXJucyBBIG5ldyBkdW1teSB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBfZHVtbXkodHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHR5cGUoW10pLCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogTm9ybWFsaXplcyBhIHZlY3RvciB0byB1bml0IGxlbmd0aCAoc3RhdGljIHZlcnNpb24pLlxuICAgKiBBIHplcm8tbGVuZ3RoIHZlY3RvciBpcyBub3JtYWxpemVkIHRvIHRoZSB6ZXJvIHZlY3RvciAoYW4gZXJyb3IgaXMgbG9nZ2VkKVxuICAgKiBpbnN0ZWFkIG9mIGJlY29taW5nIGBJbmZpbml0eWAvYE5hTmAuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG5vcm1hbGl6ZVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2VcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBfbm9ybWFsaXplKHZlYzogSVZlY3RvcjMsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gdmVjLmxlbmd0aCgpO1xuICAgIHJldHVybiB0aGlzLl9kaXZpZGUodmVjLCBsZW5ndGgsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIE5vcm1hbGl6ZXMgYSB2ZWN0b3IgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgbm9ybWFsaXplZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemVUbyh2ZWM6IElWZWN0b3IzLCBvdXQ6IElNdXRhYmxlVmVjdG9yMykge1xuICAgIGNvbnN0IGxlbmd0aCA9IHZlYy5sZW5ndGgoKTtcbiAgICB0aGlzLmRpdmlkZVRvKHZlYywgbGVuZ3RoLCBvdXQpO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSAoc3RhdGljIHZlcnNpb24pLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZmlyc3QgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBzZWNvbmQgdmVjdG9yXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgc3VtXG4gICAqL1xuICBzdGF0aWMgX2FkZChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMywgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBjb25zdCB4ID0gbF92ZWMuX3ZbMF0gKyByX3ZlYy5fdlswXTtcbiAgICBjb25zdCB5ID0gbF92ZWMuX3ZbMV0gKyByX3ZlYy5fdlsxXTtcbiAgICBjb25zdCB6ID0gbF92ZWMuX3ZbMl0gKyByX3ZlYy5fdlsyXTtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHlBcnJheShbeCwgeSwgel0sIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdHdvIHZlY3RvcnMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZmlyc3QgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBzZWNvbmQgdmVjdG9yXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIHN1bVxuICAgKi9cbiAgc3RhdGljIGFkZFRvKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzLCBvdXQ6IElNdXRhYmxlVmVjdG9yMykge1xuICAgIG91dC5fdlswXSA9IGxfdmVjLl92WzBdICsgcl92ZWMuX3ZbMF07XG4gICAgb3V0Ll92WzFdID0gbF92ZWMuX3ZbMV0gKyByX3ZlYy5fdlsxXTtcbiAgICBvdXQuX3ZbMl0gPSBsX3ZlYy5fdlsyXSArIHJfdmVjLl92WzJdO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyBhIHNjYWxlZCB2ZWN0b3IgdG8gYW5vdGhlciB2ZWN0b3IgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgdmVjdG9yIHRvIGFkZCB0b1xuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgdmVjdG9yIHRvIGFkZFxuICAgKiBAcGFyYW0gc2NhbGUgLSBUaGUgc2NhbGUgdG8gYXBwbHkgdG8gdGhlIHNlY29uZCB2ZWN0b3JcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgc3VtXG4gICAqL1xuICBzdGF0aWMgYWRkU2NhbGVkVmVjdG9yVG8obF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMsIHNjYWxlOiBudW1iZXIsIG91dDogSU11dGFibGVWZWN0b3IzKSB7XG4gICAgb3V0Ll92WzBdID0gbF92ZWMuX3ZbMF0gKyByX3ZlYy5fdlswXSAqIHNjYWxlO1xuICAgIG91dC5fdlsxXSA9IGxfdmVjLl92WzFdICsgcl92ZWMuX3ZbMV0gKiBzY2FsZTtcbiAgICBvdXQuX3ZbMl0gPSBsX3ZlYy5fdlsyXSArIHJfdmVjLl92WzJdICogc2NhbGU7XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdGhlIHNlY29uZCB2ZWN0b3IgZnJvbSB0aGUgZmlyc3QgdmVjdG9yIChzdGF0aWMgdmVyc2lvbikuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3QgZnJvbVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgdmVjdG9yIHRvIHN1YnRyYWN0XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgKi9cbiAgc3RhdGljIF9zdWJ0cmFjdChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMywgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBjb25zdCB4ID0gbF92ZWMuX3ZbMF0gLSByX3ZlYy5fdlswXTtcbiAgICBjb25zdCB5ID0gbF92ZWMuX3ZbMV0gLSByX3ZlYy5fdlsxXTtcbiAgICBjb25zdCB6ID0gbF92ZWMuX3ZbMl0gLSByX3ZlYy5fdlsyXTtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHlBcnJheShbeCwgeSwgel0sIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnRyYWN0cyB0d28gdmVjdG9ycyBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3QgZnJvbVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgdmVjdG9yIHRvIHN1YnRyYWN0XG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGRpZmZlcmVuY2VcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdFRvKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzLCBvdXQ6IElNdXRhYmxlVmVjdG9yMykge1xuICAgIG91dC5fdlswXSA9IGxfdmVjLl92WzBdIC0gcl92ZWMuX3ZbMF07XG4gICAgb3V0Ll92WzFdID0gbF92ZWMuX3ZbMV0gLSByX3ZlYy5fdlsxXTtcbiAgICBvdXQuX3ZbMl0gPSBsX3ZlYy5fdlsyXSAtIHJfdmVjLl92WzJdO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyBhIHZlY3RvciBieSBhIHNjYWxhciB2YWx1ZSAoc3RhdGljIHZlcnNpb24pLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgc2NhbGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIF9tdWx0aXBseSh2ZWM6IElWZWN0b3IzLCB2YWx1ZTogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIGNvbnN0IHggPSB2ZWMuX3ZbMF0gKiB2YWx1ZTtcbiAgICBjb25zdCB5ID0gdmVjLl92WzFdICogdmFsdWU7XG4gICAgY29uc3QgeiA9IHZlYy5fdlsyXSAqIHZhbHVlO1xuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weUFycmF5KFt4LCB5LCB6XSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyBhIHZlY3RvciBieSBhIHNjYWxhciBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gbXVsdGlwbHkgYnlcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgc2NhbGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VG8odmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlciwgb3V0OiBJTXV0YWJsZVZlY3RvcjMpIHtcbiAgICBvdXQuX3ZbMF0gPSB2ZWMuX3ZbMF0gKiB2YWx1ZTtcbiAgICBvdXQuX3ZbMV0gPSB2ZWMuX3ZbMV0gKiB2YWx1ZTtcbiAgICBvdXQuX3ZbMl0gPSB2ZWMuX3ZbMl0gKiB2YWx1ZTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UgKHN0YXRpYyB2ZXJzaW9uKS5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGZpcnN0IHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgc2Vjb25kIHZlY3RvclxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIHByb2R1Y3RcbiAgICovXG4gIHN0YXRpYyBfbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgeCA9IGxfdmVjLl92WzBdICogcl92ZWMuX3ZbMF07XG4gICAgY29uc3QgeSA9IGxfdmVjLl92WzFdICogcl92ZWMuX3ZbMV07XG4gICAgY29uc3QgeiA9IGxfdmVjLl92WzJdICogcl92ZWMuX3ZbMl07XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5QXJyYXkoW3gsIHksIHpdLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGZpcnN0IHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgc2Vjb25kIHZlY3RvclxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBjb21wb25lbnQtd2lzZSBwcm9kdWN0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3JUbyhsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMywgb3V0OiBJTXV0YWJsZVZlY3RvcjMpIHtcbiAgICBvdXQuX3ZbMF0gPSBsX3ZlYy5fdlswXSAqIHJfdmVjLl92WzBdO1xuICAgIG91dC5fdlsxXSA9IGxfdmVjLl92WzFdICogcl92ZWMuX3ZbMV07XG4gICAgb3V0Ll92WzJdID0gbF92ZWMuX3ZbMl0gKiByX3ZlYy5fdlsyXTtcbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSAzRCB2ZWN0b3IgYnkgYSA0eDQgbWF0cml4LCB0cmVhdGluZyB0aGUgdmVjdG9yIGFzIGEgcG9pbnQgKHc9MSkuXG4gICAqIFRoZSByZXN1bHQgaXMgcGVyc3BlY3RpdmUtZGl2aWRlZCBpZiB0aGUgdyBjb21wb25lbnQgaXMgbm90IDEuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIDR4NCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlXG4gICAqIEByZXR1cm5zIEEgbmV3IHRyYW5zZm9ybWVkIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIF9tdWx0aXBseU1hdHJpeDQodmVjOiBJVmVjdG9yMywgbWF0OiBJTWF0cml4NDQsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgeCA9IHZlYy5fdlswXTtcbiAgICBjb25zdCB5ID0gdmVjLl92WzFdO1xuICAgIGNvbnN0IHogPSB2ZWMuX3ZbMl07XG4gICAgY29uc3QgdyA9IDEgLyAobWF0Ll92WzNdICogeCArIG1hdC5fdls3XSAqIHkgKyBtYXQuX3ZbMTFdICogeiArIG1hdC5fdlsxNV0pO1xuICAgIGNvbnN0IHJlc3VsdFggPSAobWF0Ll92WzBdICogeCArIG1hdC5fdls0XSAqIHkgKyBtYXQuX3ZbOF0gKiB6ICsgbWF0Ll92WzEyXSkgKiB3O1xuICAgIGNvbnN0IHJlc3VsdFkgPSAobWF0Ll92WzFdICogeCArIG1hdC5fdls1XSAqIHkgKyBtYXQuX3ZbOV0gKiB6ICsgbWF0Ll92WzEzXSkgKiB3O1xuICAgIGNvbnN0IHJlc3VsdFogPSAobWF0Ll92WzJdICogeCArIG1hdC5fdls2XSAqIHkgKyBtYXQuX3ZbMTBdICogeiArIG1hdC5fdlsxNF0pICogdztcblxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weUFycmF5KFtyZXN1bHRYLCByZXN1bHRZLCByZXN1bHRaXSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBhIDNEIHZlY3RvciBieSBhIDR4NCBtYXRyaXgsIHRyZWF0aW5nIHRoZSB2ZWN0b3IgYXMgYSBwb2ludCAodz0xKS5cbiAgICogVGhlIHJlc3VsdCBpcyBwZXJzcGVjdGl2ZS1kaXZpZGVkIGlmIHRoZSB3IGNvbXBvbmVudCBpcyBub3QgMS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gdHJhbnNmb3JtXG4gICAqIEBwYXJhbSBtYXQgLSBUaGUgNHg0IHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBBIG5ldyB0cmFuc2Zvcm1lZCB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseU1hdHJpeDRUbyh2ZWM6IElWZWN0b3IzLCBtYXQ6IElNYXRyaXg0NCwgb3V0OiBJTXV0YWJsZVZlY3RvcjMpIHtcbiAgICBjb25zdCB4ID0gdmVjLl92WzBdO1xuICAgIGNvbnN0IHkgPSB2ZWMuX3ZbMV07XG4gICAgY29uc3QgeiA9IHZlYy5fdlsyXTtcbiAgICBjb25zdCB3ID0gMSAvIChtYXQuX3ZbM10gKiB4ICsgbWF0Ll92WzddICogeSArIG1hdC5fdlsxMV0gKiB6ICsgbWF0Ll92WzE1XSk7XG4gICAgY29uc3QgcmVzdWx0WCA9IChtYXQuX3ZbMF0gKiB4ICsgbWF0Ll92WzRdICogeSArIG1hdC5fdls4XSAqIHogKyBtYXQuX3ZbMTJdKSAqIHc7XG4gICAgY29uc3QgcmVzdWx0WSA9IChtYXQuX3ZbMV0gKiB4ICsgbWF0Ll92WzVdICogeSArIG1hdC5fdls5XSAqIHogKyBtYXQuX3ZbMTNdKSAqIHc7XG4gICAgY29uc3QgcmVzdWx0WiA9IChtYXQuX3ZbMl0gKiB4ICsgbWF0Ll92WzZdICogeSArIG1hdC5fdlsxMF0gKiB6ICsgbWF0Ll92WzE0XSkgKiB3O1xuXG4gICAgcmV0dXJuIG91dC5zZXRDb21wb25lbnRzKHJlc3VsdFgsIHJlc3VsdFksIHJlc3VsdFopO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUgKHN0YXRpYyB2ZXJzaW9uKS5cbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgZGl2aWRlZCByZXN1bHRcbiAgICogQHJlbWFya3MgSWYgZGl2aXNpb24gYnkgemVybyBvY2N1cnMsIHRoZSByZXN1bHQgaXMgc2V0IHRvIDAgYW5kIGFuIGVycm9yIGlzIGxvZ2dlZFxuICAgKi9cbiAgc3RhdGljIF9kaXZpZGUodmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlciwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBsZXQgeDogbnVtYmVyO1xuICAgIGxldCB5OiBudW1iZXI7XG4gICAgbGV0IHo6IG51bWJlcjtcbiAgICBpZiAodmFsdWUgIT09IDApIHtcbiAgICAgIHggPSB2ZWMuX3ZbMF0gLyB2YWx1ZTtcbiAgICAgIHkgPSB2ZWMuX3ZbMV0gLyB2YWx1ZTtcbiAgICAgIHogPSB2ZWMuX3ZbMl0gLyB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICB4ID0gMDtcbiAgICAgIHkgPSAwO1xuICAgICAgeiA9IDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weUFycmF5KFt4LCB5LCB6XSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyBhIHZlY3RvciBieSBhIHNjYWxhciBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBkaXZpZGVkIHJlc3VsdFxuICAgKiBAcmVtYXJrcyBJZiBkaXZpc2lvbiBieSB6ZXJvIG9jY3VycywgdGhlIHJlc3VsdCBpcyBzZXQgdG8gMCBhbmQgYW4gZXJyb3IgaXMgbG9nZ2VkXG4gICAqL1xuICBzdGF0aWMgZGl2aWRlVG8odmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlciwgb3V0OiBJTXV0YWJsZVZlY3RvcjMpIHtcbiAgICBpZiAodmFsdWUgIT09IDApIHtcbiAgICAgIG91dC5fdlswXSA9IHZlYy5fdlswXSAvIHZhbHVlO1xuICAgICAgb3V0Ll92WzFdID0gdmVjLl92WzFdIC8gdmFsdWU7XG4gICAgICBvdXQuX3ZbMl0gPSB2ZWMuX3ZbMl0gLyB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICBvdXQuX3ZbMF0gPSAwO1xuICAgICAgb3V0Ll92WzFdID0gMDtcbiAgICAgIG91dC5fdlsyXSA9IDA7XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSAoc3RhdGljIHZlcnNpb24pLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZSBieVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uIHJlc3VsdFxuICAgKiBAcmVtYXJrcyBJZiBkaXZpc2lvbiBieSB6ZXJvIG9jY3VycywgdGhlIHJlc3VsdCBpcyBzZXQgdG8gMCBhbmQgYW4gZXJyb3IgaXMgbG9nZ2VkXG4gICAqL1xuICBzdGF0aWMgX2RpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMywgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBsZXQgeDogbnVtYmVyO1xuICAgIGxldCB5OiBudW1iZXI7XG4gICAgbGV0IHo6IG51bWJlcjtcbiAgICBpZiAocl92ZWMuX3ZbMF0gIT09IDAgJiYgcl92ZWMuX3ZbMV0gIT09IDAgJiYgcl92ZWMuX3ZbMl0gIT09IDApIHtcbiAgICAgIHggPSBsX3ZlYy5fdlswXSAvIHJfdmVjLl92WzBdO1xuICAgICAgeSA9IGxfdmVjLl92WzFdIC8gcl92ZWMuX3ZbMV07XG4gICAgICB6ID0gbF92ZWMuX3ZbMl0gLyByX3ZlYy5fdlsyXTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICB4ID0gcl92ZWMuX3ZbMF0gPT09IDAgPyAwIDogbF92ZWMuX3ZbMF0gLyByX3ZlYy5fdlswXTtcbiAgICAgIHkgPSByX3ZlYy5fdlsxXSA9PT0gMCA/IDAgOiBsX3ZlYy5fdlsxXSAvIHJfdmVjLl92WzFdO1xuICAgICAgeiA9IHJfdmVjLl92WzJdID09PSAwID8gMCA6IGxfdmVjLl92WzJdIC8gcl92ZWMuX3ZbMl07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weUFycmF5KFt4LCB5LCB6XSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlIGJ5XG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0XG4gICAqIEByZXR1cm5zIFRoZSBvdXRwdXQgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uIHJlc3VsdFxuICAgKiBAcmVtYXJrcyBJZiBkaXZpc2lvbiBieSB6ZXJvIG9jY3VycywgdGhlIHJlc3VsdCBpcyBzZXQgdG8gMCBhbmQgYW4gZXJyb3IgaXMgbG9nZ2VkXG4gICAqL1xuICBzdGF0aWMgZGl2aWRlVmVjdG9yVG8obF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMsIG91dDogSU11dGFibGVWZWN0b3IzKSB7XG4gICAgaWYgKHJfdmVjLl92WzBdICE9PSAwICYmIHJfdmVjLl92WzFdICE9PSAwICYmIHJfdmVjLl92WzJdICE9PSAwKSB7XG4gICAgICBvdXQuX3ZbMF0gPSBsX3ZlYy5fdlswXSAvIHJfdmVjLl92WzBdO1xuICAgICAgb3V0Ll92WzFdID0gbF92ZWMuX3ZbMV0gLyByX3ZlYy5fdlsxXTtcbiAgICAgIG91dC5fdlsyXSA9IGxfdmVjLl92WzJdIC8gcl92ZWMuX3ZbMl07XG4gICAgfSBlbHNlIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCcwIGRpdmlzaW9uIG9jY3VycmVkISBUaGUgcmVzdWx0IGlzIHNldCB0byB6ZXJvLicpO1xuICAgICAgb3V0Ll92WzBdID0gcl92ZWMuX3ZbMF0gPT09IDAgPyAwIDogbF92ZWMuX3ZbMF0gLyByX3ZlYy5fdlswXTtcbiAgICAgIG91dC5fdlsxXSA9IHJfdmVjLl92WzFdID09PSAwID8gMCA6IGxfdmVjLl92WzFdIC8gcl92ZWMuX3ZbMV07XG4gICAgICBvdXQuX3ZbMl0gPSByX3ZlYy5fdlsyXSA9PT0gMCA/IDAgOiBsX3ZlYy5fdlsyXSAvIHJfdmVjLl92WzJdO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzIChzdGF0aWMgdmVyc2lvbikuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBmaXJzdCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHNlY29uZCB2ZWN0b3JcbiAgICogQHJldHVybnMgVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSB0d28gdmVjdG9yc1xuICAgKi9cbiAgc3RhdGljIGRvdChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiBsX3ZlYy5kb3Qocl92ZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGNyb3NzIHByb2R1Y3Qgb2YgdHdvIHZlY3RvcnMgKHN0YXRpYyB2ZXJzaW9uKS5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGZpcnN0IHZlY3RvciAobGVmdCBvcGVyYW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgc2Vjb25kIHZlY3RvciAocmlnaHQgb3BlcmFuZClcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBjb250YWluaW5nIHRoZSBjcm9zcyBwcm9kdWN0IHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIF9jcm9zcyhsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMywgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBjb25zdCB4ID0gbF92ZWMuX3ZbMV0gKiByX3ZlYy5fdlsyXSAtIGxfdmVjLl92WzJdICogcl92ZWMuX3ZbMV07XG4gICAgY29uc3QgeSA9IGxfdmVjLl92WzJdICogcl92ZWMuX3ZbMF0gLSBsX3ZlYy5fdlswXSAqIHJfdmVjLl92WzJdO1xuICAgIGNvbnN0IHogPSBsX3ZlYy5fdlswXSAqIHJfdmVjLl92WzFdIC0gbF92ZWMuX3ZbMV0gKiByX3ZlYy5fdlswXTtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHlBcnJheShbeCwgeSwgel0sIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGNyb3NzIHByb2R1Y3Qgb2YgdHdvIHZlY3RvcnMgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZmlyc3QgdmVjdG9yIChsZWZ0IG9wZXJhbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBzZWNvbmQgdmVjdG9yIChyaWdodCBvcGVyYW5kKVxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBjcm9zcyBwcm9kdWN0IHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIGNyb3NzVG8obF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMsIG91dDogSU11dGFibGVWZWN0b3IzKSB7XG4gICAgY29uc3QgeCA9IGxfdmVjLl92WzFdICogcl92ZWMuX3ZbMl0gLSBsX3ZlYy5fdlsyXSAqIHJfdmVjLl92WzFdO1xuICAgIGNvbnN0IHkgPSBsX3ZlYy5fdlsyXSAqIHJfdmVjLl92WzBdIC0gbF92ZWMuX3ZbMF0gKiByX3ZlYy5fdlsyXTtcbiAgICBjb25zdCB6ID0gbF92ZWMuX3ZbMF0gKiByX3ZlYy5fdlsxXSAtIGxfdmVjLl92WzFdICogcl92ZWMuX3ZbMF07XG4gICAgcmV0dXJuIG91dC5zZXRDb21wb25lbnRzKHgsIHksIHopO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSB2ZWN0b3IgYnkgYSBxdWF0ZXJuaW9uIHJvdGF0aW9uIChzdGF0aWMgdmVyc2lvbikuXG4gICAqIFRoaXMgYXBwbGllcyB0aGUgcXVhdGVybmlvbiByb3RhdGlvbiB0byB0aGUgdmVjdG9yLlxuICAgKiBAcGFyYW0gcXVhdCAtIFRoZSBxdWF0ZXJuaW9uIHRvIGFwcGx5XG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIHRyYW5zZm9ybWVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIF9tdWx0aXBseVF1YXRlcm5pb24ocXVhdDogSVF1YXRlcm5pb24sIHZlYzogSVZlY3RvcjMsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgbnVtID0gcXVhdC5fdlswXSAqIDI7XG4gICAgY29uc3QgbnVtMiA9IHF1YXQuX3ZbMV0gKiAyO1xuICAgIGNvbnN0IG51bTMgPSBxdWF0Ll92WzJdICogMjtcbiAgICBjb25zdCBudW00ID0gcXVhdC5fdlswXSAqIG51bTtcbiAgICBjb25zdCBudW01ID0gcXVhdC5fdlsxXSAqIG51bTI7XG4gICAgY29uc3QgbnVtNiA9IHF1YXQuX3ZbMl0gKiBudW0zO1xuICAgIGNvbnN0IG51bTcgPSBxdWF0Ll92WzBdICogbnVtMjtcbiAgICBjb25zdCBudW04ID0gcXVhdC5fdlswXSAqIG51bTM7XG4gICAgY29uc3QgbnVtOSA9IHF1YXQuX3ZbMV0gKiBudW0zO1xuICAgIGNvbnN0IG51bTEwID0gcXVhdC5fdlszXSAqIG51bTtcbiAgICBjb25zdCBudW0xMSA9IHF1YXQuX3ZbM10gKiBudW0yO1xuICAgIGNvbnN0IG51bTEyID0gcXVhdC5fdlszXSAqIG51bTM7XG5cbiAgICBjb25zdCB4ID0gKDEgLSAobnVtNSArIG51bTYpKSAqIHZlYy5fdlswXSArIChudW03IC0gbnVtMTIpICogdmVjLl92WzFdICsgKG51bTggKyBudW0xMSkgKiB2ZWMuX3ZbMl07XG4gICAgY29uc3QgeSA9IChudW03ICsgbnVtMTIpICogdmVjLl92WzBdICsgKDEgLSAobnVtNCArIG51bTYpKSAqIHZlYy5fdlsxXSArIChudW05IC0gbnVtMTApICogdmVjLl92WzJdO1xuICAgIGNvbnN0IHogPSAobnVtOCAtIG51bTExKSAqIHZlYy5fdlswXSArIChudW05ICsgbnVtMTApICogdmVjLl92WzFdICsgKDEgLSAobnVtNCArIG51bTUpKSAqIHZlYy5fdlsyXTtcblxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weUFycmF5KFt4LCB5LCB6XSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBhIHZlY3RvciBieSBhIHF1YXRlcm5pb24gcm90YXRpb24gYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBUaGlzIGFwcGxpZXMgdGhlIHF1YXRlcm5pb24gcm90YXRpb24gdG8gdGhlIHZlY3Rvci5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiB0byBhcHBseVxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgdHJhbnNmb3JtZWQgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlRdWF0ZXJuaW9uVG8ocXVhdDogSVF1YXRlcm5pb24sIHZlYzogSVZlY3RvcjMsIG91dDogSU11dGFibGVWZWN0b3IzKSB7XG4gICAgY29uc3QgbnVtID0gcXVhdC5fdlswXSAqIDI7XG4gICAgY29uc3QgbnVtMiA9IHF1YXQuX3ZbMV0gKiAyO1xuICAgIGNvbnN0IG51bTMgPSBxdWF0Ll92WzJdICogMjtcbiAgICBjb25zdCBudW00ID0gcXVhdC5fdlswXSAqIG51bTtcbiAgICBjb25zdCBudW01ID0gcXVhdC5fdlsxXSAqIG51bTI7XG4gICAgY29uc3QgbnVtNiA9IHF1YXQuX3ZbMl0gKiBudW0zO1xuICAgIGNvbnN0IG51bTcgPSBxdWF0Ll92WzBdICogbnVtMjtcbiAgICBjb25zdCBudW04ID0gcXVhdC5fdlswXSAqIG51bTM7XG4gICAgY29uc3QgbnVtOSA9IHF1YXQuX3ZbMV0gKiBudW0zO1xuICAgIGNvbnN0IG51bTEwID0gcXVhdC5fdlszXSAqIG51bTtcbiAgICBjb25zdCBudW0xMSA9IHF1YXQuX3ZbM10gKiBudW0yO1xuICAgIGNvbnN0IG51bTEyID0gcXVhdC5fdlszXSAqIG51bTM7XG5cbiAgICBjb25zdCB4ID0gKDEgLSAobnVtNSArIG51bTYpKSAqIHZlYy5fdlswXSArIChudW03IC0gbnVtMTIpICogdmVjLl92WzFdICsgKG51bTggKyBudW0xMSkgKiB2ZWMuX3ZbMl07XG4gICAgY29uc3QgeSA9IChudW03ICsgbnVtMTIpICogdmVjLl92WzBdICsgKDEgLSAobnVtNCArIG51bTYpKSAqIHZlYy5fdlsxXSArIChudW05IC0gbnVtMTApICogdmVjLl92WzJdO1xuICAgIGNvbnN0IHogPSAobnVtOCAtIG51bTExKSAqIHZlYy5fdlswXSArIChudW05ICsgbnVtMTApICogdmVjLl92WzFdICsgKDEgLSAobnVtNCArIG51bTUpKSAqIHZlYy5fdlsyXTtcblxuICAgIHJldHVybiBvdXQuc2V0Q29tcG9uZW50cyh4LCB5LCB6KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgdmVjdG9yIHRvIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uLlxuICAgKiBAcmV0dXJucyBBIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yIGluIHRoZSBmb3JtYXQgXCIoeCwgeSwgeilcIlxuICAgKi9cbiAgdG9TdHJpbmcoKSB7XG4gICAgcmV0dXJuIGAoJHt0aGlzLl92WzBdfSwgJHt0aGlzLl92WzFdfSwgJHt0aGlzLl92WzJdfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYW4gYXBwcm94aW1hdGUgc3RyaW5nIHJlcHJlc2VudGF0aW9uIHdpdGggbGltaXRlZCBkZWNpbWFsIHBsYWNlcy5cbiAgICogQHJldHVybnMgQSBzdHJpbmcgcmVwcmVzZW50YXRpb24gd2l0aCBmaW5hbmNpYWwgZm9ybWF0dGluZ1xuICAgKi9cbiAgdG9TdHJpbmdBcHByb3hpbWF0ZWx5KCkge1xuICAgIHJldHVybiBgJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdlswXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMV0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzJdKX1cXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYSBmbGF0IGFycmF5LlxuICAgKiBAcmV0dXJucyBBbiBhcnJheSBjb250YWluaW5nIHRoZSB4LCB5LCBhbmQgeiBjb21wb25lbnRzXG4gICAqL1xuICBmbGF0dGVuQXNBcnJheSgpIHtcbiAgICByZXR1cm4gW3RoaXMuX3ZbMF0sIHRoaXMuX3ZbMV0sIHRoaXMuX3ZbMl1dO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIHZlY3RvciBpcyBhIGR1bW15IHZlY3RvciAoZW1wdHkpLlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2ZWN0b3IgaXMgZHVtbXkgKGhhcyBubyBjb21wb25lbnRzKSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0R1bW15KCkge1xuICAgIGlmICh0aGlzLl92Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyB2ZWN0b3IgaXMgYXBwcm94aW1hdGVseSBlcXVhbCB0byBhbm90aGVyIHZlY3RvciB3aXRoaW4gYSB0b2xlcmFuY2UuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGNvbXBhcmUgd2l0aFxuICAgKiBAcGFyYW0gZGVsdGEgLSBUaGUgdG9sZXJhbmNlIGZvciBjb21wYXJpc29uIChkZWZhdWx0OiBOdW1iZXIuRVBTSUxPTilcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB2ZWN0b3JzIGFyZSBhcHByb3hpbWF0ZWx5IGVxdWFsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzRXF1YWwodmVjOiBJVmVjdG9yMywgZGVsdGE6IG51bWJlciA9IE51bWJlci5FUFNJTE9OKSB7XG4gICAgaWYgKFxuICAgICAgTWF0aC5hYnModmVjLl92WzBdIC0gdGhpcy5fdlswXSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnModmVjLl92WzFdIC0gdGhpcy5fdlsxXSkgPCBkZWx0YSAmJlxuICAgICAgTWF0aC5hYnModmVjLl92WzJdIC0gdGhpcy5fdlsyXSkgPCBkZWx0YVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyB2ZWN0b3IgaXMgc3RyaWN0bHkgZXF1YWwgdG8gYW5vdGhlciB2ZWN0b3IgKGV4YWN0IGNvbXBhcmlzb24pLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBjb21wYXJlIHdpdGhcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB2ZWN0b3JzIGFyZSBleGFjdGx5IGVxdWFsLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzU3RyaWN0RXF1YWwodmVjOiBJVmVjdG9yMykge1xuICAgIGlmICh0aGlzLl92WzBdID09PSB2ZWMuX3ZbMF0gJiYgdGhpcy5fdlsxXSA9PT0gdmVjLl92WzFdICYmIHRoaXMuX3ZbMl0gPT09IHZlYy5fdlsyXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICogQHBhcmFtIGkgLSBUaGUgaW5kZXggKDAgZm9yIHgsIDEgZm9yIHksIDIgZm9yIHopXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdmFsdWUgYXQgdGhlIHNwZWNpZmllZCBpbmRleFxuICAgKi9cbiAgYXQoaTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbaV07XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIChtYWduaXR1ZGUpIG9mIHRoZSB2ZWN0b3IuXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHZlY3RvclxuICAgKi9cbiAgbGVuZ3RoKCkge1xuICAgIHJldHVybiBNYXRoLmh5cG90KHRoaXMuX3ZbMF0sIHRoaXMuX3ZbMV0sIHRoaXMuX3ZbMl0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIHRoZSB2ZWN0b3IuXG4gICAqIFRoaXMgaXMgbW9yZSBlZmZpY2llbnQgdGhhbiBjYWxjdWxhdGluZyB0aGUgYWN0dWFsIGxlbmd0aCB3aGVuIG9ubHkgY29tcGFyaXNvbiBpcyBuZWVkZWQuXG4gICAqIEByZXR1cm5zIFRoZSBzcXVhcmVkIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gICAqL1xuICBsZW5ndGhTcXVhcmVkKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF0gKiogMiArIHRoaXMuX3ZbMV0gKiogMiArIHRoaXMuX3ZbMl0gKiogMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSBmcm9tIHRoaXMgdmVjdG9yIHRvIGFub3RoZXIgdmVjdG9yLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHRhcmdldCB2ZWN0b3JcbiAgICogQHJldHVybnMgVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIHZlY3RvcnNcbiAgICovXG4gIGxlbmd0aFRvKHZlYzogSVZlY3RvcjMpIHtcbiAgICBjb25zdCBkZWx0YVggPSB0aGlzLl92WzBdIC0gdmVjLl92WzBdO1xuICAgIGNvbnN0IGRlbHRhWSA9IHRoaXMuX3ZbMV0gLSB2ZWMuX3ZbMV07XG4gICAgY29uc3QgZGVsdGFaID0gdGhpcy5fdlsyXSAtIHZlYy5fdlsyXTtcbiAgICByZXR1cm4gTWF0aC5oeXBvdChkZWx0YVgsIGRlbHRhWSwgZGVsdGFaKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0aGlzIHZlY3RvciB3aXRoIGFub3RoZXIgdmVjdG9yLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBjYWxjdWxhdGUgZG90IHByb2R1Y3Qgd2l0aFxuICAgKiBAcmV0dXJucyBUaGUgZG90IHByb2R1Y3QgcmVzdWx0XG4gICAqL1xuICBkb3QodmVjOiBJVmVjdG9yMykge1xuICAgIHJldHVybiB0aGlzLl92WzBdICogdmVjLl92WzBdICsgdGhpcy5fdlsxXSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbMl0gKiB2ZWMuX3ZbMl07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2xhc3MgbmFtZS5cbiAgICogQHJldHVybnMgVGhlIGNsYXNzIG5hbWUgXCJWZWN0b3IzXCJcbiAgICovXG4gIGdldCBjbGFzc05hbWUoKSB7XG4gICAgcmV0dXJuICdWZWN0b3IzJztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgY29weSBvZiB0aGlzIHZlY3Rvci5cbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIHdpdGggdGhlIHNhbWUgY29tcG9uZW50c1xuICAgKi9cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jb25zdHJ1Y3RvciBhcyBhbnkpKG5ldyAodGhpcy5fdi5jb25zdHJ1Y3RvciBhcyBhbnkpKFt0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdXSwgMCwgMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG51bWJlciBvZiBieXRlcyBwZXIgY29tcG9uZW50LlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGJ5dGVzIHBlciBjb21wb25lbnQgKDQgZm9yIEZsb2F0MzJBcnJheSwgOCBmb3IgRmxvYXQ2NEFycmF5KVxuICAgKi9cbiAgZ2V0IGJ5dGVzUGVyQ29tcG9uZW50KCkge1xuICAgIHJldHVybiB0aGlzLl92LkJZVEVTX1BFUl9FTEVNRU5UO1xuICB9XG5cbiAgLyoqXG4gICAqIFBlcmZvcm1zIGxpbmVhciBpbnRlcnBvbGF0aW9uIGJldHdlZW4gdHdvIHZlY3RvcnMgKHN0YXRpYyB2ZXJzaW9uKS5cbiAgICogQHBhcmFtIGxocyAtIFRoZSBzdGFydCB2ZWN0b3JcbiAgICogQHBhcmFtIHJocyAtIFRoZSBlbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByYXRpbyAtIFRoZSBpbnRlcnBvbGF0aW9uIHJhdGlvICgwLjAgdG8gMS4wKVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGludGVycG9sYXRlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBfbGVycChsaHM6IElWZWN0b3IzLCByaHM6IElWZWN0b3IzLCByYXRpbzogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBuZXcgdGhpcyhcbiAgICAgIG5ldyB0eXBlKFtcbiAgICAgICAgbGhzLl92WzBdICogKDEgLSByYXRpbykgKyByaHMuX3ZbMF0gKiByYXRpbyxcbiAgICAgICAgbGhzLl92WzFdICogKDEgLSByYXRpbykgKyByaHMuX3ZbMV0gKiByYXRpbyxcbiAgICAgICAgbGhzLl92WzJdICogKDEgLSByYXRpbykgKyByaHMuX3ZbMl0gKiByYXRpbyxcbiAgICAgIF0pLFxuICAgICAgeyB0eXBlIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhIDMtZWxlbWVudCBhcnJheS5cbiAgICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IGNvbnRhaW5pbmcgeCwgeSwgeiBjb21wb25lbnRzXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHlBcnJheTMoYXJyYXk6IEFycmF5MzxudW1iZXI+LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBuZXcgdGhpcyhuZXcgdHlwZShhcnJheSksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gaW5kaXZpZHVhbCB4LCB5LCB6IGNvbXBvbmVudHMuXG4gICAqIEBwYXJhbSB4IC0gVGhlIHggY29tcG9uZW50XG4gICAqIEBwYXJhbSB5IC0gVGhlIHkgY29tcG9uZW50XG4gICAqIEBwYXJhbSB6IC0gVGhlIHogY29tcG9uZW50XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHkzKHg6IG51bWJlciwgeTogbnVtYmVyLCB6OiBudW1iZXIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKFt4LCB5LCB6XSksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gYW4gYXJyYXkgKHRha2VzIGZpcnN0IDMgZWxlbWVudHMpLlxuICAgKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgY29udGFpbmluZyB0aGUgY29tcG9uZW50c1xuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXkoYXJyYXk6IEFycmF5PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKGFycmF5LnNsaWNlKDAsIDMpKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgYnkgY29weWluZyBmcm9tIGFub3RoZXIgVmVjdG9yMy5cbiAgICogQHBhcmFtIHZlYzMgLSBUaGUgc291cmNlIHZlY3RvciB0byBjb3B5IGZyb21cbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvclxuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weVZlY3RvcjModmVjMzogSVZlY3RvcjMsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgdmVjID0gbmV3IHRoaXMobmV3IHR5cGUoW3ZlYzMuX3ZbMF0sIHZlYzMuX3ZbMV0sIHZlYzMuX3ZbMl1dKSwge1xuICAgICAgdHlwZSxcbiAgICB9KTtcbiAgICByZXR1cm4gdmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBWZWN0b3IzIGZyb20gYSBWZWN0b3I0IChkcm9wcyB0aGUgdyBjb21wb25lbnQpLlxuICAgKiBAcGFyYW0gdmVjNCAtIFRoZSBzb3VyY2UgVmVjdG9yNCB0byBjb3B5IGZyb21cbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvclxuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weVZlY3RvcjQodmVjNDogSVZlY3RvcjQsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgdmVjID0gbmV3IHRoaXMobmV3IHR5cGUoW3ZlYzQuX3ZbMF0sIHZlYzQuX3ZbMV0sIHZlYzQuX3ZbMl1dKSwge1xuICAgICAgdHlwZSxcbiAgICB9KTtcbiAgICByZXR1cm4gdmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBWZWN0b3IzIGZyb20gYSBWZWN0b3IyIChzZXRzIHogY29tcG9uZW50IHRvIDApLlxuICAgKiBAcGFyYW0gdmVjMiAtIFRoZSBzb3VyY2UgVmVjdG9yMiB0byBjb3B5IGZyb21cbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvclxuICAgKi9cbiAgc3RhdGljIF9mcm9tVmVjdG9yMih2ZWMyOiBJVmVjdG9yMiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBjb25zdCB2ZWMgPSBuZXcgdGhpcyhuZXcgdHlwZShbdmVjMi5fdlswXSwgdmVjMi5fdlsxXSwgMF0pLCB7XG4gICAgICB0eXBlLFxuICAgIH0pO1xuICAgIHJldHVybiB2ZWM7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgM0QgdmVjdG9yIGNsYXNzIHdpdGggMzItYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gKiBUaGlzIGlzIHRoZSBzdGFuZGFyZCBwcmVjaXNpb24gaW1wbGVtZW50YXRpb24gZm9yIG1vc3QgM0QgZ3JhcGhpY3Mgb3BlcmF0aW9ucy5cbiAqIFByb3ZpZGVzIGVmZmljaWVudCB2ZWN0b3Igb3BlcmF0aW9ucyBmb3IgcG9zaXRpb24sIGRpcmVjdGlvbiwgYW5kIG90aGVyIDNEIGNhbGN1bGF0aW9ucy5cbiAqXG4gKiBAZXhhbXBsZVxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgdjEgPSBWZWN0b3IzLmZyb21Db3B5MygxLCAyLCAzKTtcbiAqIGNvbnN0IHYyID0gVmVjdG9yMy5mcm9tQ29weTMoNCwgNSwgNik7XG4gKiBjb25zdCBzdW0gPSBWZWN0b3IzLmFkZCh2MSwgdjIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBWZWN0b3IzIGV4dGVuZHMgVmVjdG9yM188RmxvYXQzMkFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVmVjdG9yMyBpbnN0YW5jZSBmcm9tIGEgdHlwZWQgYXJyYXkuXG4gICAqIEBwYXJhbSB2IC0gVGhlIEZsb2F0MzJBcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IodjogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKHYsIHsgdHlwZTogRmxvYXQzMkFycmF5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhIDMtZWxlbWVudCBhcnJheS5cbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXkgY29udGFpbmluZyBbeCwgeSwgel0gY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTMoYXJyYXk6IEFycmF5MzxudW1iZXI+KTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5MyhhcnJheSwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gaW5kaXZpZHVhbCB4LCB5LCB6IGNvbXBvbmVudHMuXG4gICAqIEBwYXJhbSB4IC0gVGhlIHggY29tcG9uZW50XG4gICAqIEBwYXJhbSB5IC0gVGhlIHkgY29tcG9uZW50XG4gICAqIEBwYXJhbSB6IC0gVGhlIHogY29tcG9uZW50XG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjMgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weTMoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcik6IFZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHkzKHgsIHksIHosIEZsb2F0MzJBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciB3aXRoIGFsbCBjb21wb25lbnRzIHNldCB0byB0aGUgc2FtZSB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbCAtIFRoZSB2YWx1ZSB0byBzZXQgZm9yIGFsbCBjb21wb25lbnRzXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjMgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weTEodmFsOiBudW1iZXIpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5Myh2YWwsIHZhbCwgdmFsLCBGbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhbiBhcnJheSAodGFrZXMgZmlyc3QgMyBlbGVtZW50cykuXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIHRoZSBjb21wb25lbnRzXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjMgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTxudW1iZXI+KTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5KGFycmF5LCBGbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgYnkgY29weWluZyBmcm9tIGFub3RoZXIgVmVjdG9yMy5cbiAgICogQHBhcmFtIHZlYzMgLSBUaGUgc291cmNlIHZlY3RvciB0byBjb3B5IGZyb21cbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMyBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5VmVjdG9yMyh2ZWMzOiBJVmVjdG9yMyk6IFZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlWZWN0b3IzKHZlYzMsIEZsb2F0MzJBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIFZlY3RvcjMgZnJvbSBhIFZlY3RvcjQgKGRyb3BzIHRoZSB3IGNvbXBvbmVudCkuXG4gICAqIEBwYXJhbSB2ZWM0IC0gVGhlIHNvdXJjZSBWZWN0b3I0IHRvIGNvcHkgZnJvbVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlWZWN0b3I0KHZlYzQ6IElWZWN0b3I0KTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVZlY3RvcjQodmVjNCwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gYW4gQXJyYXlCdWZmZXIuXG4gICAqIEBwYXJhbSBhcnJheUJ1ZmZlciAtIFRoZSBBcnJheUJ1ZmZlciBjb250YWluaW5nIHRoZSB2ZWN0b3IgZGF0YVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUFycmF5QnVmZmVyKGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlcik6IFZlY3RvcjMge1xuICAgIHJldHVybiBuZXcgVmVjdG9yMyhuZXcgRmxvYXQzMkFycmF5KGFycmF5QnVmZmVyKSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGEgRmxvYXQzMkFycmF5LlxuICAgKiBAcGFyYW0gZmxvYXQzMkFycmF5IC0gVGhlIEZsb2F0MzJBcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgZGF0YVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUZsb2F0MzJBcnJheShmbG9hdDMyQXJyYXk6IEZsb2F0MzJBcnJheSk6IFZlY3RvcjMge1xuICAgIHJldHVybiBuZXcgVmVjdG9yMyhmbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgYnkgY29weWluZyBkYXRhIGZyb20gYSBGbG9hdDMyQXJyYXkuXG4gICAqIEBwYXJhbSBmbG9hdDMyQXJyYXkgLSBUaGUgRmxvYXQzMkFycmF5IHRvIGNvcHkgZnJvbVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlGbG9hdDMyQXJyYXkoZmxvYXQzMkFycmF5OiBGbG9hdDMyQXJyYXkpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gbmV3IFZlY3RvcjMoZmxvYXQzMkFycmF5LnNsaWNlKDApKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgemVybyB2ZWN0b3IgKDAsIDAsIDApLlxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDBcbiAgICovXG4gIHN0YXRpYyB6ZXJvKCk6IFZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMSAoMSwgMSwgMSkuXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjMgaW5zdGFuY2Ugd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMVxuICAgKi9cbiAgc3RhdGljIG9uZSgpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gc3VwZXIuX29uZShGbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gZW1wdHkgZHVtbXkgdmVjdG9yIGZvciBwbGFjZWhvbGRlciBwdXJwb3Nlcy5cbiAgICogQHJldHVybnMgQSBuZXcgZHVtbXkgVmVjdG9yMyBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGR1bW15KCk6IFZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBWZWN0b3IzIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplKHZlYzogSVZlY3RvcjMpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gc3VwZXIuX25vcm1hbGl6ZSh2ZWMsIEZsb2F0MzJBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZS5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGZpcnN0IHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgc2Vjb25kIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIHN1bVxuICAgKi9cbiAgc3RhdGljIGFkZChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMyk6IFZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5fYWRkKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdGhlIHNlY29uZCB2ZWN0b3IgZnJvbSB0aGUgZmlyc3QgdmVjdG9yLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgdmVjdG9yIHRvIHN1YnRyYWN0IGZyb21cbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHZlY3RvciB0byBzdWJ0cmFjdFxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGRpZmZlcmVuY2VcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMyk6IFZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5fc3VidHJhY3QobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gbXVsdGlwbHkgYnlcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMyBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBzY2FsZWQgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkodmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlcik6IFZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHkodmVjLCB2YWx1ZSwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZmlyc3QgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBzZWNvbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjMgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VmVjdG9yKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogVHJhbnNmb3JtcyBhIDNEIHZlY3RvciBieSBhIDR4NCBtYXRyaXguXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICAgKiBAcGFyYW0gbWF0IC0gVGhlIDR4NCB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMyBpbnN0YW5jZSBjb250YWluaW5nIHRoZSB0cmFuc2Zvcm1lZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseU1hdHJpeDQodmVjOiBJVmVjdG9yMywgbWF0OiBJTWF0cml4NDQpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5TWF0cml4NCh2ZWMsIG1hdCwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBkaXZpZGVcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBkaXZpZGUgYnlcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMyBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBkaXZpZGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIGRpdmlkZSh2ZWM6IElWZWN0b3IzLCB2YWx1ZTogbnVtYmVyKTogVmVjdG9yMyB7XG4gICAgcmV0dXJuIHN1cGVyLl9kaXZpZGUodmVjLCB2YWx1ZSwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIGRpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMyk6IFZlY3RvcjMge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlVmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZmlyc3QgdmVjdG9yIChsZWZ0IG9wZXJhbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBzZWNvbmQgdmVjdG9yIChyaWdodCBvcGVyYW5kKVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGNyb3NzIHByb2R1Y3QgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgY3Jvc3MobF92ZWM6IElWZWN0b3IzLCByX3ZlYzogSVZlY3RvcjMpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gc3VwZXIuX2Nyb3NzKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGEgdmVjdG9yIGJ5IGEgcXVhdGVybmlvbiByb3RhdGlvbi5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiB0byBhcHBseVxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMyBpbnN0YW5jZSBjb250YWluaW5nIHRoZSB0cmFuc2Zvcm1lZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseVF1YXRlcm5pb24ocXVhdDogSVF1YXRlcm5pb24sIHZlYzogSVZlY3RvcjMpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5UXVhdGVybmlvbihxdWF0LCB2ZWMsIEZsb2F0MzJBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybXMgbGluZWFyIGludGVycG9sYXRpb24gYmV0d2VlbiB0d28gdmVjdG9ycy5cbiAgICogQHBhcmFtIGxocyAtIFRoZSBzdGFydCB2ZWN0b3JcbiAgICogQHBhcmFtIHJocyAtIFRoZSBlbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByYXRpbyAtIFRoZSBpbnRlcnBvbGF0aW9uIHJhdGlvICgwLjAgdG8gMS4wKVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGludGVycG9sYXRlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBsZXJwKGxoczogSVZlY3RvcjMsIHJoczogSVZlY3RvcjMsIHJhdGlvOiBudW1iZXIpOiBWZWN0b3IzIHtcbiAgICByZXR1cm4gc3VwZXIuX2xlcnAobGhzLCByaHMsIHJhdGlvLCBGbG9hdDMyQXJyYXkpO1xuICB9XG59XG5cbi8qKlxuICogSW1tdXRhYmxlIDNEIHZlY3RvciBjbGFzcyB3aXRoIDY0LWJpdCBmbG9hdCBjb21wb25lbnRzLlxuICogVGhpcyBoaWdoLXByZWNpc2lvbiBpbXBsZW1lbnRhdGlvbiBpcyBzdWl0YWJsZSBmb3IgYXBwbGljYXRpb25zIHJlcXVpcmluZ1xuICogZG91YmxlIHByZWNpc2lvbiBmbG9hdGluZy1wb2ludCBjYWxjdWxhdGlvbnMsIHN1Y2ggYXMgc2NpZW50aWZpYyBjb21wdXRpbmdcbiAqIG9yIHdoZW4gZGVhbGluZyB3aXRoIHZlcnkgbGFyZ2UgY29vcmRpbmF0ZSBzeXN0ZW1zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCB2MSA9IFZlY3RvcjNELmZyb21Db3B5MygxLjEyMzQ1Njc4OSwgMi45ODc2NTQzMjEsIDMuNDU2Nzg5MTIzKTtcbiAqIGNvbnN0IHYyID0gVmVjdG9yM0QuZnJvbUNvcHkzKDQuMTExMTExMTExLCA1LjIyMjIyMjIyMiwgNi4zMzMzMzMzMzMpO1xuICogY29uc3Qgc3VtID0gVmVjdG9yM0QuYWRkKHYxLCB2Mik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFZlY3RvcjNEIGV4dGVuZHMgVmVjdG9yM188RmxvYXQ2NEFycmF5Q29uc3RydWN0b3I+IHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVmVjdG9yM0QgaW5zdGFuY2UgZnJvbSBhIHR5cGVkIGFycmF5LlxuICAgKiBAcGFyYW0gdiAtIFRoZSBGbG9hdDY0QXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIGNvbXBvbmVudHNcbiAgICovXG4gIHByaXZhdGUgY29uc3RydWN0b3IodjogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKHYsIHsgdHlwZTogRmxvYXQ2NEFycmF5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhIDMtZWxlbWVudCBhcnJheS5cbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXkgY29udGFpbmluZyBbeCwgeSwgel0gY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzRCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXkzKGFycmF5OiBBcnJheTM8bnVtYmVyPik6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXkzKGFycmF5LCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBpbmRpdmlkdWFsIHgsIHksIHogY29tcG9uZW50cy5cbiAgICogQHBhcmFtIHggLSBUaGUgeCBjb21wb25lbnRcbiAgICogQHBhcmFtIHkgLSBUaGUgeSBjb21wb25lbnRcbiAgICogQHBhcmFtIHogLSBUaGUgeiBjb21wb25lbnRcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weTMoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlcik6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5Myh4LCB5LCB6LCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gdGhlIHNhbWUgdmFsdWUuXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgdmFsdWUgdG8gc2V0IGZvciBhbGwgY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzRCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5MSh2YWw6IG51bWJlcik6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5Myh2YWwsIHZhbCwgdmFsLCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhbiBhcnJheSAodGFrZXMgZmlyc3QgMyBlbGVtZW50cykuXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIHRoZSBjb21wb25lbnRzXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjNEIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheShhcnJheTogQXJyYXk8bnVtYmVyPik6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXkoYXJyYXksIEZsb2F0NjRBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGFuIEFycmF5QnVmZmVyLlxuICAgKiBAcGFyYW0gYXJyYXlCdWZmZXIgLSBUaGUgQXJyYXlCdWZmZXIgY29udGFpbmluZyB0aGUgdmVjdG9yIGRhdGFcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQXJyYXlCdWZmZXIoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKTogVmVjdG9yM0Qge1xuICAgIHJldHVybiBuZXcgVmVjdG9yM0QobmV3IEZsb2F0NjRBcnJheShhcnJheUJ1ZmZlcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhIEZsb2F0NjRBcnJheS5cbiAgICogQHBhcmFtIGZsb2F0NjRBcnJheSAtIFRoZSBGbG9hdDY0QXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIGRhdGFcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tRmxvYXQ2NEFycmF5KGZsb2F0NjRBcnJheTogRmxvYXQ2NEFycmF5KTogVmVjdG9yM0Qge1xuICAgIHJldHVybiBuZXcgVmVjdG9yM0QoZmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgemVybyB2ZWN0b3IgKDAsIDAsIDApLlxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IzRCBpbnN0YW5jZSB3aXRoIGFsbCBjb21wb25lbnRzIHNldCB0byAwXG4gICAqL1xuICBzdGF0aWMgemVybygpOiBWZWN0b3IzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl96ZXJvKEZsb2F0NjRBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciB3aXRoIGFsbCBjb21wb25lbnRzIHNldCB0byAxICgxLCAxLCAxKS5cbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2Ugd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMVxuICAgKi9cbiAgc3RhdGljIG9uZSgpOiBWZWN0b3IzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9vbmUoRmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGVtcHR5IGR1bW15IHZlY3RvciBmb3IgcGxhY2Vob2xkZXIgcHVycG9zZXMuXG4gICAqIEByZXR1cm5zIEEgbmV3IGR1bW15IFZlY3RvcjNEIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZHVtbXkoKTogVmVjdG9yM0Qge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBWZWN0b3IzRCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZSh2ZWM6IElWZWN0b3IzKTogVmVjdG9yM0Qge1xuICAgIHJldHVybiBzdXBlci5fbm9ybWFsaXplKHZlYywgRmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZmlyc3QgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBzZWNvbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjNEIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIHN1bVxuICAgKi9cbiAgc3RhdGljIGFkZChsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMyk6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2FkZChsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIHRoZSBzZWNvbmQgdmVjdG9yIGZyb20gdGhlIGZpcnN0IHZlY3Rvci5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIHZlY3RvciB0byBzdWJ0cmFjdCBmcm9tXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gc3VidHJhY3RcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKTogVmVjdG9yM0Qge1xuICAgIHJldHVybiBzdXBlci5fc3VidHJhY3QobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUuXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG11bHRpcGx5XG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gbXVsdGlwbHkgYnlcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgc2NhbGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KHZlYzogSVZlY3RvcjMsIHZhbHVlOiBudW1iZXIpOiBWZWN0b3IzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseSh2ZWMsIHZhbHVlLCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBmaXJzdCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHNlY29uZCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgcHJvZHVjdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VmVjdG9yKGxfdmVjOiBJVmVjdG9yMywgcl92ZWM6IElWZWN0b3IzKTogVmVjdG9yM0Qge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlWZWN0b3IobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYSAzRCB2ZWN0b3IgYnkgYSA0eDQgbWF0cml4LlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAgICogQHBhcmFtIG1hdCAtIFRoZSA0eDQgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjNEIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIHRyYW5zZm9ybWVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5TWF0cml4NCh2ZWM6IElWZWN0b3IzLCBtYXQ6IElNYXRyaXg0NCk6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5TWF0cml4NCh2ZWMsIG1hdCwgRmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBkaXZpZGVcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBkaXZpZGUgYnlcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgZGl2aWRlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGUodmVjOiBJVmVjdG9yMywgdmFsdWU6IG51bWJlcik6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZSh2ZWMsIHZhbHVlLCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UuXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlIGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjNEIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIGRpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMyk6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgY3Jvc3MgcHJvZHVjdCBvZiB0d28gdmVjdG9ycy5cbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGZpcnN0IHZlY3RvciAobGVmdCBvcGVyYW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgc2Vjb25kIHZlY3RvciAocmlnaHQgb3BlcmFuZClcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgY3Jvc3MgcHJvZHVjdCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBjcm9zcyhsX3ZlYzogSVZlY3RvcjMsIHJfdmVjOiBJVmVjdG9yMyk6IFZlY3RvcjNEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Nyb3NzKGxfdmVjLCByX3ZlYywgRmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm1zIGEgdmVjdG9yIGJ5IGEgcXVhdGVybmlvbiByb3RhdGlvbi5cbiAgICogQHBhcmFtIHF1YXQgLSBUaGUgcXVhdGVybmlvbiB0byBhcHBseVxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yM0QgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgdHJhbnNmb3JtZWQgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlRdWF0ZXJuaW9uKHF1YXQ6IElRdWF0ZXJuaW9uLCB2ZWM6IElWZWN0b3IzKTogVmVjdG9yM0Qge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlRdWF0ZXJuaW9uKHF1YXQsIHZlYywgRmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtcyBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICAgKiBAcGFyYW0gbGhzIC0gVGhlIHN0YXJ0IHZlY3RvclxuICAgKiBAcGFyYW0gcmhzIC0gVGhlIGVuZCB2ZWN0b3JcbiAgICogQHBhcmFtIHJhdGlvIC0gVGhlIGludGVycG9sYXRpb24gcmF0aW8gKDAuMCB0byAxLjApXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjNEIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGludGVycG9sYXRlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBsZXJwKGxoczogSVZlY3RvcjMsIHJoczogSVZlY3RvcjMsIHJhdGlvOiBudW1iZXIpOiBWZWN0b3IzRCB7XG4gICAgcmV0dXJuIHN1cGVyLl9sZXJwKGxocywgcmhzLCByYXRpbywgRmxvYXQ2NEFycmF5KTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0YW50IHZlY3RvciByZXByZXNlbnRpbmcgKDEsIDEsIDEpLlxuICogVXNlZnVsIGZvciBzY2FsaW5nIG9wZXJhdGlvbnMgb3IgYXMgYSBkZWZhdWx0IFwib25lXCIgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBDb25zdFZlY3RvcjNfMV8xXzEgPSBWZWN0b3IzLmZyb21Db3B5MygxLCAxLCAxKTtcblxuLyoqXG4gKiBDb25zdGFudCB2ZWN0b3IgcmVwcmVzZW50aW5nICgwLCAwLCAwKS5cbiAqIFVzZWZ1bCBhcyBhbiBvcmlnaW4gcG9pbnQgb3IgZm9yIHplcm8vbnVsbCB2ZWN0b3Igb3BlcmF0aW9ucy5cbiAqL1xuZXhwb3J0IGNvbnN0IENvbnN0VmVjdG9yM18wXzBfMCA9IFZlY3RvcjMuZnJvbUNvcHkzKDAsIDAsIDApO1xuXG4vKipcbiAqIEFsaWFzIGZvciB0aGUgMzItYml0IChGbG9hdDMyQXJyYXkpIGltcGxlbWVudGF0aW9uLCBtYWtpbmcgdGhlIHByZWNpc2lvbiBleHBsaWNpdC5cbiAqL1xuZXhwb3J0IHsgVmVjdG9yMyBhcyBWZWN0b3IzRiB9O1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsY0FBYztBQUN2QixTQUFTLHNCQUFzQjtBQUkvQixTQUFTLGdCQUFnQjtBQVVsQixJQUFNLFdBQU4sY0FBNkQsZUFBNEM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNOUcsWUFBWSxHQUFlLFVBQXVCO0FBQ2hELFVBQU07QUFDTixTQUFLLEtBQUs7QUFBQSxFQUNaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksSUFBSTtBQUNOLFdBQU8sS0FBSyxHQUFHLENBQUM7QUFBQSxFQUNsQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLElBQUk7QUFDTixXQUFPLEtBQUssR0FBRyxDQUFDO0FBQUEsRUFDbEI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBTUEsSUFBSSxJQUFJO0FBQ04sV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksSUFBSTtBQUNOLFdBQU87QUFBQSxFQUNUO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQU1BLElBQUksaUJBQWlCO0FBQ25CLFdBQU8sUUFBUSxTQUFTO0FBQUEsTUFDdEIsS0FBSyxHQUFHLENBQUM7QUFBQSxJQUNYLENBQUMsS0FBSyxTQUFTLDJCQUEyQixLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLDJCQUEyQixLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFBQSxFQUMzRztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFNQSxJQUFJLGVBQWU7QUFDakIsV0FBTyxTQUFTLEtBQUssTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxLQUFLLE1BQU0s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QUFJLEdBQUcsQ0FBQyxLQUFLLE9BQU8sU0FBUyxJQUFJLEdBQUcsQ0FBQztBQUNsRyxVQUFNLEtBQUssT0FBTyxTQUFTLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSyxPQUFPLFNBQVMsSUFBSSxHQUFHLENBQUMsS0FBSyxPQUFPLFNBQVMsSUFBSSxHQUFHLENBQUM7QUFDbEcsVUFBTSxLQUFLLE9BQU8sU0FBUyxJQUFJLEdBQUcsQ0FBQyxLQUFLLE9BQU8sU0FBUyxJQUFJLEdBQUcsQ0FBQyxLQUFLLEtBQUssT0FBTyxTQUFTLElBQUksR0FBRyxDQUFDO0FBRWxHLFdBQU8sS0FBSyxlQUFlLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJO0FBQUEsRUFDNUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFVQSxPQUFPLHFCQUFxQixNQUFtQixLQUFlLEtBQXNCO0FBQ2xGLFVBQU0sTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQ3pCLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzFCLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzFCLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzFCLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzFCLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzFCLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzFCLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzFCLFVBQU0sT0FBTyxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzFCLFVBQU0sUUFBUSxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzNCLFVBQU0sUUFBUSxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBQzNCLFVBQU0sUUFBUSxLQUFLLEdBQUcsQ0FBQyxJQUFJO0FBRTNCLFVBQU0sS0FBSyxLQUFLLE9BQU8sU0FBUyxJQUFJLEdBQUcsQ0FBQyxLQUFLLE9BQU8sU0FBUyxJQUFJLEdBQUcs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
