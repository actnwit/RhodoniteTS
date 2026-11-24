// src/foundation/math/Vector2.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Logger } from "../misc/Logger.js";
import { AbstractVector } from "./AbstractVector.js";
import { MathUtil } from "./MathUtil.js";
var Vector2_ = class extends AbstractVector {
  /**
   * Creates a new Vector2_ instance.
   *
   * @param v - The typed array containing the vector components
   * @param options - Configuration object containing the array type
   */
  constructor(v, _options) {
    super();
    this._v = v;
  }
  /**
   * Gets the X component of the vector.
   *
   * @returns The X component value
   */
  get x() {
    return this._v[0];
  }
  /**
   * Gets the Y component of the vector.
   *
   * @returns The Y component value
   */
  get y() {
    return this._v[1];
  }
  /**
   * Converts the vector to a GLSL vec2 string representation with float precision.
   *
   * @returns GLSL-compatible vec2 string
   */
  get glslStrAsFloat() {
    return `vec2(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])})`;
  }
  /**
   * Converts the vector to a GLSL ivec2 string representation with integer precision.
   *
   * @returns GLSL-compatible ivec2 string
   */
  get glslStrAsInt() {
    return `ivec2(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])})`;
  }
  /**
   * Converts the vector to a WGSL vec2f string representation with float precision.
   *
   * @returns WGSL-compatible vec2f string
   */
  get wgslStrAsFloat() {
    return `vec2f(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])})`;
  }
  /**
   * Converts the vector to a WGSL vec2i string representation with integer precision.
   *
   * @returns WGSL-compatible vec2i string
   */
  get wgslStrAsInt() {
    return `vec2i(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])})`;
  }
  /**
   * Gets the composition type of this vector.
   *
   * @returns The composition type (Vec2)
   */
  static get compositionType() {
    return CompositionType.Vec2;
  }
  /**
   * Calculates the squared length of a vector (static version).
   * This is more efficient than calculating the actual length when only comparison is needed.
   *
   * @param vec - The vector to calculate squared length for
   * @returns The squared length of the vector
   */
  static lengthSquared(vec) {
    return vec.lengthSquared();
  }
  /**
   * Calculates the distance between two vectors.
   *
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The distance between the vectors
   */
  static lengthBtw(l_vec, r_vec) {
    return l_vec.lengthTo(r_vec);
  }
  /**
   * Calculates the angle between two vectors in radians.
   *
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The angle between the vectors in radians
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
   * Creates a zero vector (0, 0).
   *
   * @param type - The typed array constructor
   * @returns A new zero vector
   */
  static _zero(type) {
    return this._fromCopyArray2([0, 0], type);
  }
  /**
   * Creates a one vector (1, 1).
   *
   * @param type - The typed array constructor
   * @returns A new one vector
   */
  static _one(type) {
    return this._fromCopyArray2([1, 1], type);
  }
  /**
   * Creates a dummy vector with no components.
   *
   * @param type - The typed array constructor
   * @returns A new dummy vector
   */
  static _dummy(type) {
    return new this(new type(), { type });
  }
  /**
   * Normalizes a vector to unit length (static version).
   *
   * @param vec - The vector to normalize
   * @param type - The typed array constructor
   * @returns A new normalized vector
   */
  static _normalize(vec, type) {
    const length = vec.length();
    return this._divide(vec, length, type);
  }
  /**
   * Adds two vectors component-wise (static version).
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param type - The typed array constructor
   * @returns A new vector containing the sum
   */
  static _add(l_vec, r_vec, type) {
    const x = l_vec._v[0] + r_vec._v[0];
    const y = l_vec._v[1] + r_vec._v[1];
    return this._fromCopyArray2([x, y], type);
  }
  /**
   * Adds two vectors component-wise and stores the result in the output vector.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param out - The output vector to store the result
   * @returns The output vector containing the sum
   */
  static addTo(l_vec, r_vec, out) {
    out._v[0] = l_vec._v[0] + r_vec._v[0];
    out._v[1] = l_vec._v[1] + r_vec._v[1];
    return out;
  }
  /**
   * Subtracts the right vector from the left vector component-wise (static version).
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param type - The typed array constructor
   * @returns A new vector containing the difference
   */
  static _subtract(l_vec, r_vec, type) {
    const x = l_vec._v[0] - r_vec._v[0];
    const y = l_vec._v[1] - r_vec._v[1];
    return this._fromCopyArray2([x, y], type);
  }
  /**
   * Subtracts the right vector from the left vector component-wise and stores the result in the output vector.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param out - The output vector to store the result
   * @returns The output vector containing the difference
   */
  static subtractTo(l_vec, r_vec, out) {
    out._v[0] = l_vec._v[0] - r_vec._v[0];
    out._v[1] = l_vec._v[1] - r_vec._v[1];
    return out;
  }
  /**
   * Multiplies a vector by a scalar value (static version).
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param type - The typed array constructor
   * @returns A new vector containing the scaled result
   */
  static _multiply(vec, value, type) {
    const x = vec._v[0] * value;
    const y = vec._v[1] * value;
    return this._fromCopyArray2([x, y], type);
  }
  /**
   * Multiplies a vector by a scalar value and stores the result in the output vector.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param out - The output vector to store the result
   * @returns The output vector containing the scaled result
   */
  static multiplyTo(vec, value, out) {
    out._v[0] = vec._v[0] * value;
    out._v[1] = vec._v[1] * value;
    return out;
  }
  /**
   * Multiplies two vectors component-wise (static version).
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param type - The typed array constructor
   * @returns A new vector containing the component-wise product
   */
  static _multiplyVector(l_vec, r_vec, type) {
    const x = l_vec._v[0] * r_vec._v[0];
    const y = l_vec._v[1] * r_vec._v[1];
    return this._fromCopyArray2([x, y], type);
  }
  /**
   * Multiplies two vectors component-wise and stores the result in the output vector.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @param out - The output vector to store the result
   * @returns The output vector containing the component-wise product
   */
  static multiplyVectorTo(l_vec, r_vec, out) {
    out._v[0] = l_vec._v[0] * r_vec._v[0];
    out._v[1] = l_vec._v[1] * r_vec._v[1];
    return out;
  }
  /**
   * Divides a vector by a scalar value (static version).
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param type - The typed array constructor
   * @returns A new vector containing the divided result
   */
  static _divide(vec, value, type) {
    let x;
    let y;
    if (value !== 0) {
      x = vec._v[0] / value;
      y = vec._v[1] / value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      x = 0;
      y = 0;
    }
    return this._fromCopyArray2([x, y], type);
  }
  /**
   * Divides a vector by a scalar value and stores the result in the output vector.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param out - The output vector to store the result
   * @returns The output vector containing the divided result
   */
  static divideTo(vec, value, out) {
    if (value !== 0) {
      out._v[0] = vec._v[0] / value;
      out._v[1] = vec._v[1] / value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      out._v[0] = 0;
      out._v[1] = 0;
    }
    return out;
  }
  /**
   * Divides the left vector by the right vector component-wise (static version).
   *
   * @param l_vec - The left vector operand (dividend)
   * @param r_vec - The right vector operand (divisor)
   * @param type - The typed array constructor
   * @returns A new vector containing the component-wise division result
   */
  static _divideVector(l_vec, r_vec, type) {
    let x;
    let y;
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0) {
      x = l_vec._v[0] / r_vec._v[0];
      y = l_vec._v[1] / r_vec._v[1];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      x = r_vec._v[0] === 0 ? 0 : l_vec._v[0] / r_vec._v[0];
      y = r_vec._v[1] === 0 ? 0 : l_vec._v[1] / r_vec._v[1];
    }
    return this._fromCopyArray2([x, y], type);
  }
  /**
   * Divides the left vector by the right vector component-wise and stores the result in the output vector.
   *
   * @param l_vec - The left vector operand (dividend)
   * @param r_vec - The right vector operand (divisor)
   * @param out - The output vector to store the result
   * @returns The output vector containing the component-wise division result
   */
  static divideVectorTo(l_vec, r_vec, out) {
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0) {
      out._v[0] = l_vec._v[0] / r_vec._v[0];
      out._v[1] = l_vec._v[1] / r_vec._v[1];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      out._v[0] = r_vec._v[0] === 0 ? 0 : l_vec._v[0] / r_vec._v[0];
      out._v[1] = r_vec._v[1] === 0 ? 0 : l_vec._v[1] / r_vec._v[1];
    }
    return out;
  }
  /**
   * Calculates the dot product of two vectors (static version).
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns The dot product of the two vectors
   */
  static dot(l_vec, r_vec) {
    return l_vec.dot(r_vec);
  }
  /**
   * Converts the vector to a string representation.
   *
   * @returns String representation in the format "(x, y)"
   */
  toString() {
    return `(${this._v[0]}, ${this._v[1]})`;
  }
  /**
   * Converts the vector to an approximate string representation with financial precision.
   *
   * @returns String representation with reduced decimal places
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[1])}
`;
  }
  /**
   * Converts the vector to a flat array representation.
   *
   * @returns Array containing [x, y] components
   */
  flattenAsArray() {
    return [this._v[0], this._v[1]];
  }
  /**
   * Checks if this vector is a dummy (empty) vector.
   *
   * @returns True if the vector has no components, false otherwise
   */
  isDummy() {
    if (this._v.length === 0) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this vector is approximately equal to another vector within a tolerance.
   *
   * @param vec - The vector to compare with
   * @param delta - The tolerance value (default: Number.EPSILON)
   * @returns True if vectors are approximately equal, false otherwise
   */
  isEqual(vec, delta = Number.EPSILON) {
    if (Math.abs(vec._v[0] - this._v[0]) < delta && Math.abs(vec._v[1] - this._v[1]) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this vector is strictly equal to another vector (exact comparison).
   *
   * @param vec - The vector to compare with
   * @returns True if vectors are exactly equal, false otherwise
   */
  isStrictEqual(vec) {
    if (this._v[0] === vec._v[0] && this._v[1] === vec._v[1]) {
      return true;
    }
    return false;
  }
  /**
   * Gets the component at the specified index.
   *
   * @param i - The index (0 for x, 1 for y)
   * @returns The component value at the specified index
   */
  at(i) {
    return this._v[i];
  }
  /**
   * Calculates the length (magnitude) of the vector.
   *
   * @returns The length of the vector
   */
  length() {
    return Math.hypot(this._v[0], this._v[1]);
  }
  /**
   * Calculates the squared length of the vector.
   * This is more efficient than calculating the actual length when only comparison is needed.
   *
   * @returns The squared length of the vector
   */
  lengthSquared() {
    return this._v[0] ** 2 + this._v[1] ** 2;
  }
  /**
   * Calculates the distance from this vector to another vector.
   *
   * @param vec - The target vector
   * @returns The distance between the vectors
   */
  lengthTo(vec) {
    const deltaX = this._v[0] - vec._v[0];
    const deltaY = this._v[1] - vec._v[1];
    return Math.hypot(deltaX, deltaY);
  }
  /**
   * Calculates the dot product with another vector.
   *
   * @param vec - The vector to calculate dot product with
   * @returns The dot product result
   */
  dot(vec) {
    return this._v[0] * vec._v[0] + this._v[1] * vec._v[1];
  }
  /**
   * Creates a clone of this vector.
   *
   * @returns A new vector with the same components
   */
  clone() {
    return new this.constructor(new this._v.constructor([this._v[0], this._v[1]]));
  }
  /**
   * Creates a vector from a 2-element array.
   *
   * @param array - The array containing [x, y] components
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyArray2(array, type) {
    return new this(new type(array), { type });
  }
  /**
   * Creates a vector from individual x and y components.
   *
   * @param x - The x component
   * @param y - The y component
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopy2(x, y, type) {
    return new this(new type([x, y]), { type });
  }
  /**
   * Creates a vector from an array, taking the first 2 elements.
   *
   * @param array - The array containing components
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyArray(array, type) {
    return new this(new type(array.slice(0, 2)), { type });
  }
  /**
   * Creates a vector from another IVector2 by sharing the underlying array.
   *
   * @param vec2 - The source vector
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromVector2(vec2, type) {
    const vec = new this(new type(vec2._v), {
      type
    });
    return vec;
  }
  /**
   * Creates a vector by copying components from another IVector2.
   *
   * @param vec2 - The source vector
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyVector2(vec2, type) {
    const vec = new this(new type([vec2._v[0], vec2._v[1]]), {
      type
    });
    return vec;
  }
  /**
   * Creates a vector by copying the first 2 components from a 3D vector.
   *
   * @param vec3 - The source 3D vector
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyVector3(vec3, type) {
    const vec = new this(new type([vec3._v[0], vec3._v[1], vec3._v[2]]), {
      type
    });
    return vec;
  }
  /**
   * Creates a vector by copying the first 2 components from a 4D vector.
   *
   * @param vec4 - The source 4D vector
   * @param type - The typed array constructor
   * @returns A new vector instance
   */
  static _fromCopyVector4(vec4, type) {
    const vec = new this(new type([vec4._v[0], vec4._v[1], vec4._v[2]]), {
      type
    });
    return vec;
  }
  /**
   * Gets the number of bytes per component in the underlying typed array.
   *
   * @returns The number of bytes per component
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
};
var Vector2 = class extends Vector2_ {
  /**
   * Creates a new Vector2 instance.
   *
   * @param x - The typed array containing the vector components
   */
  constructor(x) {
    super(x, { type: Float32Array });
  }
  /**
   * Creates a vector from a 2-element array.
   *
   * @param array - The array containing [x, y] components
   * @returns A new Vector2 instance
   */
  static fromCopyArray2(array) {
    return super._fromCopyArray2(array, Float32Array);
  }
  /**
   * Creates a vector from individual x and y components.
   *
   * @param x - The x component
   * @param y - The y component
   * @returns A new Vector2 instance
   */
  static fromCopy2(x, y) {
    return super._fromCopy2(x, y, Float32Array);
  }
  /**
   * Creates a vector from an array, taking the first 2 elements.
   *
   * @param array - The array containing components
   * @returns A new Vector2 instance
   */
  static fromCopyArray(array) {
    return super._fromCopyArray(array, Float32Array);
  }
  /**
   * Creates a vector by copying components from another IVector2.
   *
   * @param vec2 - The source vector
   * @returns A new Vector2 instance
   */
  static fromCopyVector2(vec2) {
    return super._fromCopyVector2(vec2, Float32Array);
  }
  /**
   * Creates a vector by copying the first 2 components from a 4D vector.
   *
   * @param vec4 - The source 4D vector
   * @returns A new Vector2 instance
   */
  static fromCopyVector4(vec4) {
    return super._fromCopyVector4(vec4, Float32Array);
  }
  /**
   * Creates a zero vector (0, 0).
   *
   * @returns A new zero Vector2 instance
   */
  static zero() {
    return super._zero(Float32Array);
  }
  /**
   * Creates a one vector (1, 1).
   *
   * @returns A new one Vector2 instance
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy vector with no components.
   *
   * @returns A new dummy Vector2 instance
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Normalizes a vector to unit length.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized Vector2 instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Adds two vectors component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2 instance containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Subtracts the right vector from the left vector component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2 instance containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Multiplies a vector by a scalar value.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector2 instance containing the scaled result
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Multiplies two vectors component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2 instance containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Divides a vector by a scalar value.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector2 instance containing the divided result
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Divides the left vector by the right vector component-wise.
   *
   * @param l_vec - The left vector operand (dividend)
   * @param r_vec - The right vector operand (divisor)
   * @returns A new Vector2 instance containing the component-wise division result
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Gets the class name.
   *
   * @returns The string "Vector2"
   */
  get className() {
    return "Vector2";
  }
  /**
   * Creates a clone of this vector.
   *
   * @returns A new Vector2 instance with the same components
   */
  clone() {
    return super.clone();
  }
};
var Vector2D = class _Vector2D extends Vector2_ {
  /**
   * Creates a new Vector2D instance.
   *
   * @param x - The typed array containing the vector components
   */
  constructor(x) {
    super(x, { type: Float64Array });
  }
  /**
   * Creates a vector from a 2-element array.
   *
   * @param array - The array containing [x, y] components
   * @returns A new Vector2D instance
   */
  static fromCopyArray2(array) {
    return super._fromCopyArray2(array, Float64Array);
  }
  /**
   * Creates a vector from individual x and y components.
   *
   * @param x - The x component
   * @param y - The y component
   * @returns A new Vector2D instance
   */
  static fromCopy2(x, y) {
    return super._fromCopy2(x, y, Float64Array);
  }
  /**
   * Creates a vector from an array, taking the first 2 elements.
   *
   * @param array - The array containing components
   * @returns A new Vector2D instance
   */
  static fromCopyArray(array) {
    return super._fromCopyArray(array, Float64Array);
  }
  /**
   * Creates a vector from an ArrayBuffer.
   *
   * @param arrayBuffer - The ArrayBuffer containing the vector data
   * @returns A new Vector2D instance
   */
  static fromArrayBuffer(arrayBuffer) {
    return new _Vector2D(new Float64Array(arrayBuffer));
  }
  /**
   * Creates a vector from a Float64Array.
   *
   * @param float64Array - The Float64Array containing the vector data
   * @returns A new Vector2D instance
   */
  static fromFloat64Array(float64Array) {
    return new _Vector2D(float64Array);
  }
  /**
   * Creates a zero vector (0, 0).
   *
   * @returns A new zero Vector2D instance
   */
  static zero() {
    return super._zero(Float64Array);
  }
  /**
   * Creates a one vector (1, 1).
   *
   * @returns A new one Vector2D instance
   */
  static one() {
    return super._one(Float64Array);
  }
  /**
   * Creates a dummy vector with no components.
   *
   * @returns A new dummy Vector2D instance
   */
  static dummy() {
    return super._dummy(Float64Array);
  }
  /**
   * Normalizes a vector to unit length.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized Vector2D instance
   */
  static normalize(vec) {
    return super._normalize(vec, Float64Array);
  }
  /**
   * Adds two vectors component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2D instance containing the sum
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float64Array);
  }
  /**
   * Subtracts the right vector from the left vector component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2D instance containing the difference
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float64Array);
  }
  /**
   * Multiplies a vector by a scalar value.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector2D instance containing the scaled result
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float64Array);
  }
  /**
   * Multiplies two vectors component-wise.
   *
   * @param l_vec - The left vector operand
   * @param r_vec - The right vector operand
   * @returns A new Vector2D instance containing the component-wise product
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Divides a vector by a scalar value.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector2D instance containing the divided result
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float64Array);
  }
  /**
   * Divides the left vector by the right vector component-wise.
   *
   * @param l_vec - The left vector operand (dividend)
   * @param r_vec - The right vector operand (divisor)
   * @returns A new Vector2D instance containing the component-wise division result
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a clone of this vector.
   *
   * @returns A new Vector2D instance with the same components
   */
  clone() {
    return super.clone();
  }
};
var ConstVector2_1_1 = Vector2.fromCopy2(1, 1);
var ConstVector2_0_0 = Vector2.fromCopy2(0, 0);
export {
  ConstVector2_0_0,
  ConstVector2_1_1,
  Vector2,
  Vector2D,
  Vector2 as Vector2F,
  Vector2_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9WZWN0b3IyLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEFycmF5MiwgRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IsIFR5cGVkQXJyYXkgfSBmcm9tICcuLi8uLi90eXBlcy9Db21tb25UeXBlcyc7XG5pbXBvcnQgeyBDb21wb3NpdGlvblR5cGUgfSBmcm9tICcuLi9kZWZpbml0aW9ucy9Db21wb3NpdGlvblR5cGUnO1xuaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSAnLi4vbWlzYy9Mb2dnZXInO1xuaW1wb3J0IHsgQWJzdHJhY3RWZWN0b3IgfSBmcm9tICcuL0Fic3RyYWN0VmVjdG9yJztcbmltcG9ydCB0eXBlIHsgSU11dGFibGVWZWN0b3IyLCBJVmVjdG9yLCBJVmVjdG9yMiwgSVZlY3RvcjMsIElWZWN0b3I0IH0gZnJvbSAnLi9JVmVjdG9yJztcbmltcG9ydCB7IE1hdGhVdGlsIH0gZnJvbSAnLi9NYXRoVXRpbCc7XG5cbi8qKlxuICogQmFzZSBjbGFzcyBmb3IgMkQgdmVjdG9yIGltcGxlbWVudGF0aW9ucyB3aXRoIGRpZmZlcmVudCBwcmVjaXNpb24gdHlwZXMuXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGNvbW1vbiBmdW5jdGlvbmFsaXR5IGZvciBib3RoIDMyLWJpdCBhbmQgNjQtYml0IGZsb2F0aW5nIHBvaW50IHZlY3RvcnMuXG4gKlxuICogQHRlbXBsYXRlIFQgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdHlwZSAoRmxvYXQzMkFycmF5IG9yIEZsb2F0NjRBcnJheSlcbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY2xhc3MgVmVjdG9yMl88VCBleHRlbmRzIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yPiBleHRlbmRzIEFic3RyYWN0VmVjdG9yIHtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVmVjdG9yMl8gaW5zdGFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB2IC0gVGhlIHR5cGVkIGFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gQ29uZmlndXJhdGlvbiBvYmplY3QgY29udGFpbmluZyB0aGUgYXJyYXkgdHlwZVxuICAgKi9cbiAgY29uc3RydWN0b3IodjogVHlwZWRBcnJheSwgX29wdGlvbnM6IHsgdHlwZTogVCB9KSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLl92ID0gdjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBYIGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgWCBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB4KCkge1xuICAgIHJldHVybiB0aGlzLl92WzBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFkgY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBZIGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHZlY3RvciB0byBhIEdMU0wgdmVjMiBzdHJpbmcgcmVwcmVzZW50YXRpb24gd2l0aCBmbG9hdCBwcmVjaXNpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEdMU0wtY29tcGF0aWJsZSB2ZWMyIHN0cmluZ1xuICAgKi9cbiAgZ2V0IGdsc2xTdHJBc0Zsb2F0KCkge1xuICAgIHJldHVybiBgdmVjMigke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KFxuICAgICAgdGhpcy5fdlswXVxuICAgICl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbMV0pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYSBHTFNMIGl2ZWMyIHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIGludGVnZXIgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBHTFNMLWNvbXBhdGlibGUgaXZlYzIgc3RyaW5nXG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzSW50KCkge1xuICAgIHJldHVybiBgaXZlYzIoJHtNYXRoLmZsb29yKHRoaXMuX3ZbMF0pfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMV0pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYSBXR1NMIHZlYzJmIHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIGZsb2F0IHByZWNpc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgV0dTTC1jb21wYXRpYmxlIHZlYzJmIHN0cmluZ1xuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc0Zsb2F0KCkge1xuICAgIHJldHVybiBgdmVjMmYoJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdChcbiAgICAgIHRoaXMuX3ZbMF1cbiAgICApfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzFdKX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgdmVjdG9yIHRvIGEgV0dTTCB2ZWMyaSBzdHJpbmcgcmVwcmVzZW50YXRpb24gd2l0aCBpbnRlZ2VyIHByZWNpc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgV0dTTC1jb21wYXRpYmxlIHZlYzJpIHN0cmluZ1xuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc0ludCgpIHtcbiAgICByZXR1cm4gYHZlYzJpKCR7TWF0aC5mbG9vcih0aGlzLl92WzBdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzFdKX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb3NpdGlvbiB0eXBlIG9mIHRoaXMgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9zaXRpb24gdHlwZSAoVmVjMilcbiAgICovXG4gIHN0YXRpYyBnZXQgY29tcG9zaXRpb25UeXBlKCkge1xuICAgIHJldHVybiBDb21wb3NpdGlvblR5cGUuVmVjMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHZlY3RvciAoc3RhdGljIHZlcnNpb24pLlxuICAgKiBUaGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gY2FsY3VsYXRpbmcgdGhlIGFjdHVhbCBsZW5ndGggd2hlbiBvbmx5IGNvbXBhcmlzb24gaXMgbmVlZGVkLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBjYWxjdWxhdGUgc3F1YXJlZCBsZW5ndGggZm9yXG4gICAqIEByZXR1cm5zIFRoZSBzcXVhcmVkIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgbGVuZ3RoU3F1YXJlZCh2ZWM6IElWZWN0b3IyKSB7XG4gICAgcmV0dXJuIHZlYy5sZW5ndGhTcXVhcmVkKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjdG9ycy5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGZpcnN0IHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgc2Vjb25kIHZlY3RvclxuICAgKiBAcmV0dXJucyBUaGUgZGlzdGFuY2UgYmV0d2VlbiB0aGUgdmVjdG9yc1xuICAgKi9cbiAgc3RhdGljIGxlbmd0aEJ0dyhsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMikge1xuICAgIHJldHVybiBsX3ZlYy5sZW5ndGhUbyhyX3ZlYyk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgYW5nbGUgYmV0d2VlbiB0d28gdmVjdG9ycyBpbiByYWRpYW5zLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZmlyc3QgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBzZWNvbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIFRoZSBhbmdsZSBiZXR3ZWVuIHRoZSB2ZWN0b3JzIGluIHJhZGlhbnNcbiAgICovXG4gIHN0YXRpYyBhbmdsZU9mVmVjdG9ycyhsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMikge1xuICAgIGNvbnN0IG11bHRpcGxpZWRMZW5ndGggPSBsX3ZlYy5sZW5ndGgoKSAqIHJfdmVjLmxlbmd0aCgpO1xuICAgIGlmIChtdWx0aXBsaWVkTGVuZ3RoID09PSAwKSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignbGVuZ3RoIG9mIGEgdmVjdG9yIGlzIDAhJyk7XG4gICAgfVxuICAgIGNvbnN0IGNvc19zaXRhID0gbF92ZWMuZG90KHJfdmVjKSAvIG11bHRpcGxpZWRMZW5ndGg7XG4gICAgY29uc3Qgc2l0YSA9IE1hdGguYWNvcyhjb3Nfc2l0YSk7XG4gICAgcmV0dXJuIHNpdGE7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHplcm8gdmVjdG9yICgwLCAwKS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgemVybyB2ZWN0b3JcbiAgICovXG4gIHN0YXRpYyBfemVybyh0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weUFycmF5MihbMCwgMF0sIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBvbmUgdmVjdG9yICgxLCAxKS5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgb25lIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIF9vbmUodHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHlBcnJheTIoWzEsIDFdLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgdmVjdG9yIHdpdGggbm8gY29tcG9uZW50cy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgZHVtbXkgdmVjdG9yXG4gICAqL1xuICBzdGF0aWMgX2R1bW15KHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKCksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoIChzdGF0aWMgdmVyc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIG5vcm1hbGl6ZVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBub3JtYWxpemVkIHZlY3RvclxuICAgKi9cbiAgc3RhdGljIF9ub3JtYWxpemUodmVjOiBJVmVjdG9yMiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBjb25zdCBsZW5ndGggPSB2ZWMubGVuZ3RoKCk7XG4gICAgcmV0dXJuIHRoaXMuX2RpdmlkZSh2ZWMsIGxlbmd0aCwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSAoc3RhdGljIHZlcnNpb24pLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmRcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIHN1bVxuICAgKi9cbiAgc3RhdGljIF9hZGQobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgeCA9IGxfdmVjLl92WzBdICsgcl92ZWMuX3ZbMF07XG4gICAgY29uc3QgeSA9IGxfdmVjLl92WzFdICsgcl92ZWMuX3ZbMV07XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5QXJyYXkyKFt4LCB5XSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IHZlY3RvciBvcGVyYW5kXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBzdW1cbiAgICovXG4gIHN0YXRpYyBhZGRUbyhsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMiwgb3V0OiBJTXV0YWJsZVZlY3RvcjIpIHtcbiAgICBvdXQuX3ZbMF0gPSBsX3ZlYy5fdlswXSArIHJfdmVjLl92WzBdO1xuICAgIG91dC5fdlsxXSA9IGxfdmVjLl92WzFdICsgcl92ZWMuX3ZbMV07XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdGhlIHJpZ2h0IHZlY3RvciBmcm9tIHRoZSBsZWZ0IHZlY3RvciBjb21wb25lbnQtd2lzZSAoc3RhdGljIHZlcnNpb24pLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmRcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGRpZmZlcmVuY2VcbiAgICovXG4gIHN0YXRpYyBfc3VidHJhY3QobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgeCA9IGxfdmVjLl92WzBdIC0gcl92ZWMuX3ZbMF07XG4gICAgY29uc3QgeSA9IGxfdmVjLl92WzFdIC0gcl92ZWMuX3ZbMV07XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5QXJyYXkyKFt4LCB5XSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIHRoZSByaWdodCB2ZWN0b3IgZnJvbSB0aGUgbGVmdCB2ZWN0b3IgY29tcG9uZW50LXdpc2UgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmRcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0VG8obF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIsIG91dDogSU11dGFibGVWZWN0b3IyKSB7XG4gICAgb3V0Ll92WzBdID0gbF92ZWMuX3ZbMF0gLSByX3ZlYy5fdlswXTtcbiAgICBvdXQuX3ZbMV0gPSBsX3ZlYy5fdlsxXSAtIHJfdmVjLl92WzFdO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyBhIHZlY3RvciBieSBhIHNjYWxhciB2YWx1ZSAoc3RhdGljIHZlcnNpb24pLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBjb250YWluaW5nIHRoZSBzY2FsZWQgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgX211bHRpcGx5KHZlYzogSVZlY3RvcjIsIHZhbHVlOiBudW1iZXIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgeCA9IHZlYy5fdlswXSAqIHZhbHVlO1xuICAgIGNvbnN0IHkgPSB2ZWMuX3ZbMV0gKiB2YWx1ZTtcbiAgICByZXR1cm4gdGhpcy5fZnJvbUNvcHlBcnJheTIoW3gsIHldLCB0eXBlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbXVsdGlwbHlcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBtdWx0aXBseSBieVxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBzY2FsZWQgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlUbyh2ZWM6IElWZWN0b3IyLCB2YWx1ZTogbnVtYmVyLCBvdXQ6IElNdXRhYmxlVmVjdG9yMikge1xuICAgIG91dC5fdlswXSA9IHZlYy5fdlswXSAqIHZhbHVlO1xuICAgIG91dC5fdlsxXSA9IHZlYy5fdlsxXSAqIHZhbHVlO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSAoc3RhdGljIHZlcnNpb24pLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmRcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIHByb2R1Y3RcbiAgICovXG4gIHN0YXRpYyBfbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgeCA9IGxfdmVjLl92WzBdICogcl92ZWMuX3ZbMF07XG4gICAgY29uc3QgeSA9IGxfdmVjLl92WzFdICogcl92ZWMuX3ZbMV07XG4gICAgcmV0dXJuIHRoaXMuX2Zyb21Db3B5QXJyYXkyKFt4LCB5XSwgdHlwZSk7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IHZlY3RvciBvcGVyYW5kXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBjb21wb25lbnQtd2lzZSBwcm9kdWN0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3JUbyhsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMiwgb3V0OiBJTXV0YWJsZVZlY3RvcjIpIHtcbiAgICBvdXQuX3ZbMF0gPSBsX3ZlYy5fdlswXSAqIHJfdmVjLl92WzBdO1xuICAgIG91dC5fdlsxXSA9IGxfdmVjLl92WzFdICogcl92ZWMuX3ZbMV07XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlIChzdGF0aWMgdmVyc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgZGl2aWRlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBfZGl2aWRlKHZlYzogSVZlY3RvcjIsIHZhbHVlOiBudW1iZXIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgbGV0IHg6IG51bWJlcjtcbiAgICBsZXQgeTogbnVtYmVyO1xuICAgIGlmICh2YWx1ZSAhPT0gMCkge1xuICAgICAgeCA9IHZlYy5fdlswXSAvIHZhbHVlO1xuICAgICAgeSA9IHZlYy5fdlsxXSAvIHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignMCBkaXZpc2lvbiBvY2N1cnJlZCEgVGhlIHJlc3VsdCBpcyBzZXQgdG8gemVyby4nKTtcbiAgICAgIHggPSAwO1xuICAgICAgeSA9IDA7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weUFycmF5MihbeCwgeV0sIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBkaXZpZGVcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBkaXZpZGUgYnlcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgZGl2aWRlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVUbyh2ZWM6IElWZWN0b3IyLCB2YWx1ZTogbnVtYmVyLCBvdXQ6IElNdXRhYmxlVmVjdG9yMikge1xuICAgIGlmICh2YWx1ZSAhPT0gMCkge1xuICAgICAgb3V0Ll92WzBdID0gdmVjLl92WzBdIC8gdmFsdWU7XG4gICAgICBvdXQuX3ZbMV0gPSB2ZWMuX3ZbMV0gLyB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICBvdXQuX3ZbMF0gPSAwO1xuICAgICAgb3V0Ll92WzFdID0gMDtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIHRoZSBsZWZ0IHZlY3RvciBieSB0aGUgcmlnaHQgdmVjdG9yIGNvbXBvbmVudC13aXNlIChzdGF0aWMgdmVyc2lvbikuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IHZlY3RvciBvcGVyYW5kIChkaXZpZGVuZClcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IHZlY3RvciBvcGVyYW5kIChkaXZpc29yKVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgZGl2aXNpb24gcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgX2RpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBsZXQgeDogbnVtYmVyO1xuICAgIGxldCB5OiBudW1iZXI7XG4gICAgaWYgKHJfdmVjLl92WzBdICE9PSAwICYmIHJfdmVjLl92WzFdICE9PSAwKSB7XG4gICAgICB4ID0gbF92ZWMuX3ZbMF0gLyByX3ZlYy5fdlswXTtcbiAgICAgIHkgPSBsX3ZlYy5fdlsxXSAvIHJfdmVjLl92WzFdO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignMCBkaXZpc2lvbiBvY2N1cnJlZCEgVGhlIHJlc3VsdCBpcyBzZXQgdG8gemVyby4nKTtcbiAgICAgIHggPSByX3ZlYy5fdlswXSA9PT0gMCA/IDAgOiBsX3ZlYy5fdlswXSAvIHJfdmVjLl92WzBdO1xuICAgICAgeSA9IHJfdmVjLl92WzFdID09PSAwID8gMCA6IGxfdmVjLl92WzFdIC8gcl92ZWMuX3ZbMV07XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9mcm9tQ29weUFycmF5MihbeCwgeV0sIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgdGhlIGxlZnQgdmVjdG9yIGJ5IHRoZSByaWdodCB2ZWN0b3IgY29tcG9uZW50LXdpc2UgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3Igb3BlcmFuZCAoZGl2aWRlbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3Igb3BlcmFuZCAoZGl2aXNvcilcbiAgICogQHBhcmFtIG91dCAtIFRoZSBvdXRwdXQgdmVjdG9yIHRvIHN0b3JlIHRoZSByZXN1bHRcbiAgICogQHJldHVybnMgVGhlIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgZGl2aXNpb24gcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgZGl2aWRlVmVjdG9yVG8obF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIsIG91dDogSU11dGFibGVWZWN0b3IyKSB7XG4gICAgaWYgKHJfdmVjLl92WzBdICE9PSAwICYmIHJfdmVjLl92WzFdICE9PSAwKSB7XG4gICAgICBvdXQuX3ZbMF0gPSBsX3ZlYy5fdlswXSAvIHJfdmVjLl92WzBdO1xuICAgICAgb3V0Ll92WzFdID0gbF92ZWMuX3ZbMV0gLyByX3ZlYy5fdlsxXTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICBvdXQuX3ZbMF0gPSByX3ZlYy5fdlswXSA9PT0gMCA/IDAgOiBsX3ZlYy5fdlswXSAvIHJfdmVjLl92WzBdO1xuICAgICAgb3V0Ll92WzFdID0gcl92ZWMuX3ZbMV0gPT09IDAgPyAwIDogbF92ZWMuX3ZbMV0gLyByX3ZlYy5fdlsxXTtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkb3QgcHJvZHVjdCBvZiB0d28gdmVjdG9ycyAoc3RhdGljIHZlcnNpb24pLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmRcbiAgICogQHJldHVybnMgVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSB0d28gdmVjdG9yc1xuICAgKi9cbiAgc3RhdGljIGRvdChsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMikge1xuICAgIHJldHVybiBsX3ZlYy5kb3Qocl92ZWMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYSBzdHJpbmcgcmVwcmVzZW50YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFN0cmluZyByZXByZXNlbnRhdGlvbiBpbiB0aGUgZm9ybWF0IFwiKHgsIHkpXCJcbiAgICovXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgKCR7dGhpcy5fdlswXX0sICR7dGhpcy5fdlsxXX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgdmVjdG9yIHRvIGFuIGFwcHJveGltYXRlIHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIGZpbmFuY2lhbCBwcmVjaXNpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIHJlZHVjZWQgZGVjaW1hbCBwbGFjZXNcbiAgICovXG4gIHRvU3RyaW5nQXBwcm94aW1hdGVseSgpIHtcbiAgICByZXR1cm4gYCR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMF0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzFdKX1cXG5gO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYSBmbGF0IGFycmF5IHJlcHJlc2VudGF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBcnJheSBjb250YWluaW5nIFt4LCB5XSBjb21wb25lbnRzXG4gICAqL1xuICBmbGF0dGVuQXNBcnJheSgpIHtcbiAgICByZXR1cm4gW3RoaXMuX3ZbMF0sIHRoaXMuX3ZbMV1dO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIHZlY3RvciBpcyBhIGR1bW15IChlbXB0eSkgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSB2ZWN0b3IgaGFzIG5vIGNvbXBvbmVudHMsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgaXNEdW1teSgpIHtcbiAgICBpZiAodGhpcy5fdi5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgdmVjdG9yIGlzIGFwcHJveGltYXRlbHkgZXF1YWwgdG8gYW5vdGhlciB2ZWN0b3Igd2l0aGluIGEgdG9sZXJhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBjb21wYXJlIHdpdGhcbiAgICogQHBhcmFtIGRlbHRhIC0gVGhlIHRvbGVyYW5jZSB2YWx1ZSAoZGVmYXVsdDogTnVtYmVyLkVQU0lMT04pXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdmVjdG9ycyBhcmUgYXBwcm94aW1hdGVseSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0VxdWFsKHZlYzogSVZlY3RvcjIsIGRlbHRhOiBudW1iZXIgPSBOdW1iZXIuRVBTSUxPTikge1xuICAgIGlmIChNYXRoLmFicyh2ZWMuX3ZbMF0gLSB0aGlzLl92WzBdKSA8IGRlbHRhICYmIE1hdGguYWJzKHZlYy5fdlsxXSAtIHRoaXMuX3ZbMV0pIDwgZGVsdGEpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgdmVjdG9yIGlzIHN0cmljdGx5IGVxdWFsIHRvIGFub3RoZXIgdmVjdG9yIChleGFjdCBjb21wYXJpc29uKS5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gY29tcGFyZSB3aXRoXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdmVjdG9ycyBhcmUgZXhhY3RseSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc1N0cmljdEVxdWFsKHZlYzogSVZlY3RvcjIpIHtcbiAgICBpZiAodGhpcy5fdlswXSA9PT0gdmVjLl92WzBdICYmIHRoaXMuX3ZbMV0gPT09IHZlYy5fdlsxXSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBjb21wb25lbnQgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICpcbiAgICogQHBhcmFtIGkgLSBUaGUgaW5kZXggKDAgZm9yIHgsIDEgZm9yIHkpXG4gICAqIEByZXR1cm5zIFRoZSBjb21wb25lbnQgdmFsdWUgYXQgdGhlIHNwZWNpZmllZCBpbmRleFxuICAgKi9cbiAgYXQoaTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbaV07XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgbGVuZ3RoIChtYWduaXR1ZGUpIG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsZW5ndGggb2YgdGhlIHZlY3RvclxuICAgKi9cbiAgbGVuZ3RoKCkge1xuICAgIHJldHVybiBNYXRoLmh5cG90KHRoaXMuX3ZbMF0sIHRoaXMuX3ZbMV0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIG9mIHRoZSB2ZWN0b3IuXG4gICAqIFRoaXMgaXMgbW9yZSBlZmZpY2llbnQgdGhhbiBjYWxjdWxhdGluZyB0aGUgYWN0dWFsIGxlbmd0aCB3aGVuIG9ubHkgY29tcGFyaXNvbiBpcyBuZWVkZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzcXVhcmVkIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gICAqL1xuICBsZW5ndGhTcXVhcmVkKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF0gKiogMiArIHRoaXMuX3ZbMV0gKiogMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSBmcm9tIHRoaXMgdmVjdG9yIHRvIGFub3RoZXIgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHRhcmdldCB2ZWN0b3JcbiAgICogQHJldHVybnMgVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIHZlY3RvcnNcbiAgICovXG4gIGxlbmd0aFRvKHZlYzogSVZlY3RvcjIpIHtcbiAgICBjb25zdCBkZWx0YVggPSB0aGlzLl92WzBdIC0gdmVjLl92WzBdO1xuICAgIGNvbnN0IGRlbHRhWSA9IHRoaXMuX3ZbMV0gLSB2ZWMuX3ZbMV07XG4gICAgcmV0dXJuIE1hdGguaHlwb3QoZGVsdGFYLCBkZWx0YVkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IHdpdGggYW5vdGhlciB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGNhbGN1bGF0ZSBkb3QgcHJvZHVjdCB3aXRoXG4gICAqIEByZXR1cm5zIFRoZSBkb3QgcHJvZHVjdCByZXN1bHRcbiAgICovXG4gIGRvdCh2ZWM6IElWZWN0b3IyKSB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMF0gKiB2ZWMuX3ZbMF0gKyB0aGlzLl92WzFdICogdmVjLl92WzFdO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjbG9uZSBvZiB0aGlzIHZlY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIHdpdGggdGhlIHNhbWUgY29tcG9uZW50c1xuICAgKi9cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuIG5ldyAodGhpcy5jb25zdHJ1Y3RvciBhcyBhbnkpKG5ldyAodGhpcy5fdi5jb25zdHJ1Y3RvciBhcyBhbnkpKFt0aGlzLl92WzBdLCB0aGlzLl92WzFdXSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhIDItZWxlbWVudCBhcnJheS5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IGNvbnRhaW5pbmcgW3gsIHldIGNvbXBvbmVudHNcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXkyKGFycmF5OiBBcnJheTI8bnVtYmVyPiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHR5cGUoYXJyYXkpLCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGluZGl2aWR1YWwgeCBhbmQgeSBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB4IGNvbXBvbmVudFxuICAgKiBAcGFyYW0geSAtIFRoZSB5IGNvbXBvbmVudFxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHkyKHg6IG51bWJlciwgeTogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBuZXcgdGhpcyhuZXcgdHlwZShbeCwgeV0pLCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGFuIGFycmF5LCB0YWtpbmcgdGhlIGZpcnN0IDIgZWxlbWVudHMuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIGNvbXBvbmVudHNcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXkoYXJyYXk6IEFycmF5PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKGFycmF5LnNsaWNlKDAsIDIpKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhbm90aGVyIElWZWN0b3IyIGJ5IHNoYXJpbmcgdGhlIHVuZGVybHlpbmcgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMyIC0gVGhlIHNvdXJjZSB2ZWN0b3JcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21WZWN0b3IyKHZlYzI6IElWZWN0b3IyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIGNvbnN0IHZlYyA9IG5ldyB0aGlzKG5ldyB0eXBlKHZlYzIuX3YpLCB7XG4gICAgICB0eXBlLFxuICAgIH0pO1xuICAgIHJldHVybiB2ZWM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBieSBjb3B5aW5nIGNvbXBvbmVudHMgZnJvbSBhbm90aGVyIElWZWN0b3IyLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjMiAtIFRoZSBzb3VyY2UgdmVjdG9yXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weVZlY3RvcjIodmVjMjogSVZlY3RvcjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgdmVjID0gbmV3IHRoaXMobmV3IHR5cGUoW3ZlYzIuX3ZbMF0sIHZlYzIuX3ZbMV1dKSwge1xuICAgICAgdHlwZSxcbiAgICB9KTtcbiAgICByZXR1cm4gdmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgYnkgY29weWluZyB0aGUgZmlyc3QgMiBjb21wb25lbnRzIGZyb20gYSAzRCB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMzIC0gVGhlIHNvdXJjZSAzRCB2ZWN0b3JcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5VmVjdG9yMyh2ZWMzOiBJVmVjdG9yMywgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBjb25zdCB2ZWMgPSBuZXcgdGhpcyhuZXcgdHlwZShbdmVjMy5fdlswXSwgdmVjMy5fdlsxXSwgdmVjMy5fdlsyXV0pLCB7XG4gICAgICB0eXBlLFxuICAgIH0pO1xuICAgIHJldHVybiB2ZWM7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBieSBjb3B5aW5nIHRoZSBmaXJzdCAyIGNvbXBvbmVudHMgZnJvbSBhIDREIHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHZlYzQgLSBUaGUgc291cmNlIDREIHZlY3RvclxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHlWZWN0b3I0KHZlYzQ6IElWZWN0b3I0LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIGNvbnN0IHZlYyA9IG5ldyB0aGlzKG5ldyB0eXBlKFt2ZWM0Ll92WzBdLCB2ZWM0Ll92WzFdLCB2ZWM0Ll92WzJdXSksIHtcbiAgICAgIHR5cGUsXG4gICAgfSk7XG4gICAgcmV0dXJuIHZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBudW1iZXIgb2YgYnl0ZXMgcGVyIGNvbXBvbmVudCBpbiB0aGUgdW5kZXJseWluZyB0eXBlZCBhcnJheS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG51bWJlciBvZiBieXRlcyBwZXIgY29tcG9uZW50XG4gICAqL1xuICBnZXQgYnl0ZXNQZXJDb21wb25lbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3YuQllURVNfUEVSX0VMRU1FTlQ7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgMkQgdmVjdG9yIGNsYXNzIHdpdGggMzItYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGNvbXByZWhlbnNpdmUgdmVjdG9yIG9wZXJhdGlvbnMgZm9yIDJEIGdyYXBoaWNzIGFuZCBtYXRoZW1hdGljcy5cbiAqIEFsbCBvcGVyYXRpb25zIHJldHVybiBuZXcgdmVjdG9yIGluc3RhbmNlcywgcHJlc2VydmluZyBpbW11dGFiaWxpdHkuXG4gKi9cbmV4cG9ydCBjbGFzcyBWZWN0b3IyIGV4dGVuZHMgVmVjdG9yMl88RmxvYXQzMkFycmF5Q29uc3RydWN0b3I+IGltcGxlbWVudHMgSVZlY3RvciwgSVZlY3RvcjIge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBWZWN0b3IyIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50c1xuICAgKi9cbiAgY29uc3RydWN0b3IoeDogVHlwZWRBcnJheSkge1xuICAgIHN1cGVyKHgsIHsgdHlwZTogRmxvYXQzMkFycmF5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhIDItZWxlbWVudCBhcnJheS5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IGNvbnRhaW5pbmcgW3gsIHldIGNvbXBvbmVudHNcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMiBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXkyKGFycmF5OiBBcnJheTI8bnVtYmVyPik6IFZlY3RvcjIge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTIoYXJyYXksIEZsb2F0MzJBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGluZGl2aWR1YWwgeCBhbmQgeSBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB4IGNvbXBvbmVudFxuICAgKiBAcGFyYW0geSAtIFRoZSB5IGNvbXBvbmVudFxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHkyKHg6IG51bWJlciwgeTogbnVtYmVyKTogVmVjdG9yMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTIoeCwgeSwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gYW4gYXJyYXksIHRha2luZyB0aGUgZmlyc3QgMiBlbGVtZW50cy5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gVGhlIGFycmF5IGNvbnRhaW5pbmcgY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheShhcnJheTogQXJyYXk8bnVtYmVyPik6IFZlY3RvcjIge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheShhcnJheSwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGJ5IGNvcHlpbmcgY29tcG9uZW50cyBmcm9tIGFub3RoZXIgSVZlY3RvcjIuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMyIC0gVGhlIHNvdXJjZSB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMiBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5VmVjdG9yMih2ZWMyOiBJVmVjdG9yMik6IFZlY3RvcjIge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlWZWN0b3IyKHZlYzIsIEZsb2F0MzJBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBieSBjb3B5aW5nIHRoZSBmaXJzdCAyIGNvbXBvbmVudHMgZnJvbSBhIDREIHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHZlYzQgLSBUaGUgc291cmNlIDREIHZlY3RvclxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlWZWN0b3I0KHZlYzQ6IElWZWN0b3I0KTogVmVjdG9yMiB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVZlY3RvcjQodmVjNCwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgemVybyB2ZWN0b3IgKDAsIDApLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyB6ZXJvIFZlY3RvcjIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyB6ZXJvKCkge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDMyQXJyYXkpIGFzIFZlY3RvcjI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG9uZSB2ZWN0b3IgKDEsIDEpLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBvbmUgVmVjdG9yMiBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIG9uZSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX29uZShGbG9hdDMyQXJyYXkpIGFzIFZlY3RvcjI7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIGR1bW15IHZlY3RvciB3aXRoIG5vIGNvbXBvbmVudHMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IGR1bW15IFZlY3RvcjIgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBkdW1teSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX2R1bW15KEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBWZWN0b3IyIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgbm9ybWFsaXplKHZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX25vcm1hbGl6ZSh2ZWMsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmRcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMiBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBzdW1cbiAgICovXG4gIHN0YXRpYyBhZGQobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2FkZChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdGhlIHJpZ2h0IHZlY3RvciBmcm9tIHRoZSBsZWZ0IHZlY3RvciBjb21wb25lbnQtd2lzZS5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgdmVjdG9yIG9wZXJhbmRcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IHZlY3RvciBvcGVyYW5kXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjIgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZVxuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfdmVjOiBJVmVjdG9yMiwgcl92ZWM6IElWZWN0b3IyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9zdWJ0cmFjdChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjIgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgc2NhbGVkIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KHZlYzogSVZlY3RvcjIsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KHZlYywgdmFsdWUsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yMjtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmRcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMiBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBjb21wb25lbnQtd2lzZSBwcm9kdWN0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQzMkFycmF5KSBhcyBWZWN0b3IyO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGRpdmlkZWQgcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgZGl2aWRlKHZlYzogSVZlY3RvcjIsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZSh2ZWMsIHZhbHVlLCBGbG9hdDMyQXJyYXkpIGFzIFZlY3RvcjI7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB0aGUgbGVmdCB2ZWN0b3IgYnkgdGhlIHJpZ2h0IHZlY3RvciBjb21wb25lbnQtd2lzZS5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgdmVjdG9yIG9wZXJhbmQgKGRpdmlkZW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmQgKGRpdmlzb3IpXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjIgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgY29tcG9uZW50LXdpc2UgZGl2aXNpb24gcmVzdWx0XG4gICAqL1xuICBzdGF0aWMgZGl2aWRlVmVjdG9yKGxfdmVjOiBJVmVjdG9yMiwgcl92ZWM6IElWZWN0b3IyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9kaXZpZGVWZWN0b3IobF92ZWMsIHJfdmVjLCBGbG9hdDMyQXJyYXkpIGFzIFZlY3RvcjI7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2xhc3MgbmFtZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHN0cmluZyBcIlZlY3RvcjJcIlxuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpIHtcbiAgICByZXR1cm4gJ1ZlY3RvcjInO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBjbG9uZSBvZiB0aGlzIHZlY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMiBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIGNvbXBvbmVudHNcbiAgICovXG4gIGNsb25lKCkge1xuICAgIHJldHVybiBzdXBlci5jbG9uZSgpIGFzIFZlY3RvcjI7XG4gIH1cbn1cblxuLyoqXG4gKiBJbW11dGFibGUgMkQgdmVjdG9yIGNsYXNzIHdpdGggNjQtYml0IGZsb2F0IGNvbXBvbmVudHMuXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGhpZ2gtcHJlY2lzaW9uIHZlY3RvciBvcGVyYXRpb25zIGZvciBhcHBsaWNhdGlvbnMgcmVxdWlyaW5nIGRvdWJsZSBwcmVjaXNpb24uXG4gKiBBbGwgb3BlcmF0aW9ucyByZXR1cm4gbmV3IHZlY3RvciBpbnN0YW5jZXMsIHByZXNlcnZpbmcgaW1tdXRhYmlsaXR5LlxuICovXG5leHBvcnQgY2xhc3MgVmVjdG9yMkQgZXh0ZW5kcyBWZWN0b3IyXzxGbG9hdDY0QXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBWZWN0b3IyRCBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHggLSBUaGUgdHlwZWQgYXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIGNvbXBvbmVudHNcbiAgICovXG4gIGNvbnN0cnVjdG9yKHg6IFR5cGVkQXJyYXkpIHtcbiAgICBzdXBlcih4LCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIGZyb20gYSAyLWVsZW1lbnQgYXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIFt4LCB5XSBjb21wb25lbnRzXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjJEIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTIoYXJyYXk6IEFycmF5MjxudW1iZXI+KTogVmVjdG9yMkQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTIoYXJyYXksIEZsb2F0NjRBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGluZGl2aWR1YWwgeCBhbmQgeSBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSB4IGNvbXBvbmVudFxuICAgKiBAcGFyYW0geSAtIFRoZSB5IGNvbXBvbmVudFxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyRCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5Mih4OiBudW1iZXIsIHk6IG51bWJlcik6IFZlY3RvcjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5Mih4LCB5LCBGbG9hdDY0QXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhbiBhcnJheSwgdGFraW5nIHRoZSBmaXJzdCAyIGVsZW1lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXkgLSBUaGUgYXJyYXkgY29udGFpbmluZyBjb21wb25lbnRzXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjJEIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheShhcnJheTogQXJyYXk8bnVtYmVyPik6IFZlY3RvcjJEIHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5QXJyYXkoYXJyYXksIEZsb2F0NjRBcnJheSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHZlY3RvciBmcm9tIGFuIEFycmF5QnVmZmVyLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXlCdWZmZXIgLSBUaGUgQXJyYXlCdWZmZXIgY29udGFpbmluZyB0aGUgdmVjdG9yIGRhdGFcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMkQgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tQXJyYXlCdWZmZXIoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKTogVmVjdG9yMkQge1xuICAgIHJldHVybiBuZXcgVmVjdG9yMkQobmV3IEZsb2F0NjRBcnJheShhcnJheUJ1ZmZlcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3IgZnJvbSBhIEZsb2F0NjRBcnJheS5cbiAgICpcbiAgICogQHBhcmFtIGZsb2F0NjRBcnJheSAtIFRoZSBGbG9hdDY0QXJyYXkgY29udGFpbmluZyB0aGUgdmVjdG9yIGRhdGFcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMkQgaW5zdGFuY2VcbiAgICovXG4gIHN0YXRpYyBmcm9tRmxvYXQ2NEFycmF5KGZsb2F0NjRBcnJheTogRmxvYXQ2NEFycmF5KTogVmVjdG9yMkQge1xuICAgIHJldHVybiBuZXcgVmVjdG9yMkQoZmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgemVybyB2ZWN0b3IgKDAsIDApLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyB6ZXJvIFZlY3RvcjJEIGluc3RhbmNlXG4gICAqL1xuICBzdGF0aWMgemVybygpIHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgb25lIHZlY3RvciAoMSwgMSkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IG9uZSBWZWN0b3IyRCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIG9uZSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX29uZShGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjJEO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSB2ZWN0b3Igd2l0aCBubyBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBkdW1teSBWZWN0b3IyRCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIGR1bW15KCkge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBOb3JtYWxpemVzIGEgdmVjdG9yIHRvIHVuaXQgbGVuZ3RoLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBWZWN0b3IyRCBpbnN0YW5jZVxuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZSh2ZWM6IElWZWN0b3IyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9ub3JtYWxpemUodmVjLCBGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjJEO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IHZlY3RvciBvcGVyYW5kXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyRCBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBzdW1cbiAgICovXG4gIHN0YXRpYyBhZGQobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2FkZChsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSkgYXMgVmVjdG9yMkQ7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIHRoZSByaWdodCB2ZWN0b3IgZnJvbSB0aGUgbGVmdCB2ZWN0b3IgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IHZlY3RvciBvcGVyYW5kXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyRCBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBkaWZmZXJlbmNlXG4gICAqL1xuICBzdGF0aWMgc3VidHJhY3QobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX3N1YnRyYWN0KGxfdmVjLCByX3ZlYywgRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjJEIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIHNjYWxlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseSh2ZWM6IElWZWN0b3IyLCB2YWx1ZTogbnVtYmVyKSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseSh2ZWMsIHZhbHVlLCBGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjJEO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IHZlY3RvciBvcGVyYW5kXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCB2ZWN0b3Igb3BlcmFuZFxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3IyRCBpbnN0YW5jZSBjb250YWluaW5nIHRoZSBjb21wb25lbnQtd2lzZSBwcm9kdWN0XG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3IyLCByX3ZlYzogSVZlY3RvcjIpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5VmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBkaXZpZGVcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBkaXZpZGUgYnlcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yMkQgaW5zdGFuY2UgY29udGFpbmluZyB0aGUgZGl2aWRlZCByZXN1bHRcbiAgICovXG4gIHN0YXRpYyBkaXZpZGUodmVjOiBJVmVjdG9yMiwgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlKHZlYywgdmFsdWUsIEZsb2F0NjRBcnJheSkgYXMgVmVjdG9yMkQ7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB0aGUgbGVmdCB2ZWN0b3IgYnkgdGhlIHJpZ2h0IHZlY3RvciBjb21wb25lbnQtd2lzZS5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgdmVjdG9yIG9wZXJhbmQgKGRpdmlkZW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgdmVjdG9yIG9wZXJhbmQgKGRpdmlzb3IpXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjJEIGluc3RhbmNlIGNvbnRhaW5pbmcgdGhlIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uIHJlc3VsdFxuICAgKi9cbiAgc3RhdGljIGRpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjIsIHJfdmVjOiBJVmVjdG9yMikge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlVmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3IyRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgY2xvbmUgb2YgdGhpcyB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjJEIGluc3RhbmNlIHdpdGggdGhlIHNhbWUgY29tcG9uZW50c1xuICAgKi9cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuIHN1cGVyLmNsb25lKCkgYXMgVmVjdG9yMkQ7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdGFudCBWZWN0b3IyIGluc3RhbmNlIHJlcHJlc2VudGluZyAoMSwgMSkuXG4gKi9cbmV4cG9ydCBjb25zdCBDb25zdFZlY3RvcjJfMV8xID0gVmVjdG9yMi5mcm9tQ29weTIoMSwgMSk7XG5cbi8qKlxuICogQ29uc3RhbnQgVmVjdG9yMiBpbnN0YW5jZSByZXByZXNlbnRpbmcgKDAsIDApLlxuICovXG5leHBvcnQgY29uc3QgQ29uc3RWZWN0b3IyXzBfMCA9IFZlY3RvcjIuZnJvbUNvcHkyKDAsIDApO1xuXG4vKipcbiAqIEFsaWFzIGZvciB0aGUgMzItYml0IChGbG9hdDMyQXJyYXkpIGltcGxlbWVudGF0aW9uLCBtYWtpbmcgdGhlIHByZWNpc2lvbiBleHBsaWNpdC5cbiAqL1xuZXhwb3J0IHsgVmVjdG9yMiBhcyBWZWN0b3IyRiB9O1xuIl0sCiAgIm1hcHBp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LFFBQUksTUFBTSxHQUFHLENBQUMsTUFBTSxLQUFLLE1BQU0sR0FBRyxDQUFDLE1BQU0sR0FBRztBQUMxQyxVQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFDNUIsVUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDOUIsT0FBTztBQUNMLGFBQU8sUUFBUSxNQUFNLGlEQUFpRDtBQUN0RSxVQUFJLE1BQU0sR0FBRyxDQUFDLE1BQU0sSUFBSSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFDcEQsVUFBSSxNQUFNLEdBQUcsQ0FBQyxNQUFNLElBQUksSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDdEQ7QUFDQSxXQUFPLEtBQUssZ0JBQWdCLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSTtBQUFBLEVBQzFDO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVUEsT0FBTyxlQUFlLE9BQWlCLE9BQWlCLEtBQXNCO0FBQzVFLFFBQUksTUFBTSxHQUFHLENBQUMsTUFBTSxLQUFLLE1BQU0sR0FBRyxDQUFDLE1BQU0sR0FBRztBQUMxQyxVQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFDcEMsVUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDdEMsT0FBTztBQUNMLGFBQU8sUUFBUSxNQUFNLGlEQUFpRDtBQUN0RSxVQUFJLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDLE1BQU0sSUFBSSxJQUFJLE1BQU0sR0FBRyxDQUFDLElBQUksTUFBTSxHQUFHLENBQUM7QUFDNUQsVUFBSSxHQUFHLENBQUMsSUFBSSxNQUFNLEdBQUcsQ0FBQyxNQUFNLElBQUksSUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLE1BQU0sR0FBRyxDQUFDO0FB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
