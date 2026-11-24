// src/foundation/math/Vector4.ts
import { CompositionType } from "../definitions/CompositionType.js";
import { Logger } from "../misc/Logger.js";
import { AbstractVector } from "./AbstractVector.js";
import { MathUtil } from "./MathUtil.js";
var Vector4_ = class extends AbstractVector {
  /**
   * Creates a new Vector4_ instance.
   *
   * @param v - The underlying typed array containing the vector components
   * @param options - Configuration object containing the array type constructor
   * @protected This constructor is protected to prevent direct instantiation
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
   * Gets the Z component of the vector.
   *
   * @returns The Z component value
   */
  get z() {
    return this._v[2];
  }
  /**
   * Gets the W component of the vector.
   *
   * @returns The W component value
   */
  get w() {
    return this._v[3];
  }
  /**
   * Converts the vector to a GLSL vec4 string representation with float precision.
   *
   * @returns A GLSL-compatible vec4 string (e.g., "vec4(1.0, 2.0, 3.0, 4.0)")
   */
  get glslStrAsFloat() {
    return `vec4(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(
      this._v[2]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])})`;
  }
  /**
   * Converts the vector to a GLSL ivec4 string representation with integer values.
   *
   * @returns A GLSL-compatible ivec4 string (e.g., "ivec4(1, 2, 3, 4)")
   */
  get glslStrAsInt() {
    return `ivec4(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(
      this._v[2]
    )}, ${Math.floor(this._v[3])})`;
  }
  /**
   * Converts the vector to a GLSL uvec4 string representation with unsigned integer values.
   *
   * @returns A GLSL-compatible uvec4 string (e.g., "uvec4(1u, 2u, 3u, 4u)")
   */
  get glslStrAsUint() {
    return `uvec4(${Math.floor(this._v[0])}u, ${Math.floor(this._v[1])}u, ${Math.floor(
      this._v[2]
    )}u, ${Math.floor(this._v[3])}u)`;
  }
  /**
   * Converts the vector to a WGSL vec4f string representation with float precision.
   *
   * @returns A WGSL-compatible vec4f string (e.g., "vec4f(1.0, 2.0, 3.0, 4.0)")
   */
  get wgslStrAsFloat() {
    return `vec4f(${MathUtil.convertToStringAsGLSLFloat(
      this._v[0]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[1])}, ${MathUtil.convertToStringAsGLSLFloat(
      this._v[2]
    )}, ${MathUtil.convertToStringAsGLSLFloat(this._v[3])})`;
  }
  /**
   * Converts the vector to a WGSL vec4i string representation with integer values.
   *
   * @returns A WGSL-compatible vec4i string (e.g., "vec4i(1, 2, 3, 4)")
   */
  get wgslStrAsInt() {
    return `vec4i(${Math.floor(this._v[0])}, ${Math.floor(this._v[1])}, ${Math.floor(
      this._v[2]
    )}, ${Math.floor(this._v[3])})`;
  }
  /**
   * Converts the vector to a WGSL vec4u string representation with unsigned integer values.
   *
   * @returns A WGSL-compatible vec4u string (e.g., "vec4u(1u, 2u, 3u, 4u)")
   */
  get wgslStrAsUint() {
    return `vec4u(${Math.floor(this._v[0])}u, ${Math.floor(this._v[1])}u, ${Math.floor(
      this._v[2]
    )}u, ${Math.floor(this._v[3])}u)`;
  }
  /**
   * Creates a new vector from a 4-element array by copying the values.
   *
   * @param array - Array containing exactly 4 numeric values [x, y, z, w]
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector instance with the copied values
   * @static
   */
  static _fromCopyArray4(array, type) {
    return new this(new type(array), { type });
  }
  /**
   * Creates a new vector from individual component values.
   *
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param w - The W component value
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector instance with the specified component values
   * @static
   */
  static _fromCopy4(x, y, z, w, type) {
    return new this(new type([x, y, z, w]), { type });
  }
  /**
   * Creates a new vector from an array by copying the first 4 values.
   * If the array has fewer than 4 elements, the remaining components will be undefined.
   *
   * @param array - Array containing numeric values (at least 4 elements recommended)
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector instance with the first 4 values from the array
   * @static
   */
  static _fromCopyArray(array, type) {
    return new this(new type(array.slice(0, 4)), { type });
  }
  /**
   * Creates a new vector by copying values from another Vector4.
   *
   * @param vec4 - The source Vector4 to copy from
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector instance with copied values from the source vector
   * @static
   */
  static _fromCopyVector4(vec4, type) {
    const vec = new this(new type([vec4._v[0], vec4._v[1], vec4._v[2], vec4._v[3]]), { type });
    return vec;
  }
  /**
   * Creates a new Vector4 from a Vector3, setting the W component to 1.
   * This is commonly used for converting 3D positions to homogeneous coordinates.
   *
   * @param vec3 - The source Vector3 to copy from
   * @param type - The typed array constructor to use for internal storage
   * @returns A new Vector4 with (vec3.x, vec3.y, vec3.z, 1.0)
   * @static
   */
  static _fromCopyVector3(vec3, type) {
    const vec = new this(new type([vec3._v[0], vec3._v[1], vec3._v[2], 1]), {
      type
    });
    return vec;
  }
  /**
   * Creates a new Vector4 from a Vector2, setting Z to 0 and W to 1.
   * This is commonly used for converting 2D positions to homogeneous coordinates.
   *
   * @param vec2 - The source Vector2 to copy from
   * @param type - The typed array constructor to use for internal storage
   * @returns A new Vector4 with (vec2.x, vec2.y, 0.0, 1.0)
   * @static
   */
  static _fromVector2(vec2, type) {
    const vec = new this(new type([vec2._v[0], vec2._v[1], 0, 1]), {
      type
    });
    return vec;
  }
  /**
   * Gets the composition type identifier for this vector type.
   *
   * @returns The CompositionType.Vec4 identifier
   * @static
   */
  static get compositionType() {
    return CompositionType.Vec4;
  }
  /**
   * Calculates the squared length (magnitude) of a vector.
   * This is more efficient than length() when only comparing magnitudes.
   *
   * @param vec - The vector to calculate squared length for
   * @returns The squared length of the vector
   * @static
   */
  static lengthSquared(vec) {
    return vec.lengthSquared();
  }
  /**
   * Calculates the distance between two vectors.
   *
   * @param l_vec - The first vector
   * @param r_vec - The second vector
   * @returns The distance between the two vectors
   * @static
   */
  static lengthBtw(l_vec, r_vec) {
    return l_vec.lengthTo(r_vec);
  }
  /**
   * Creates a zero vector (0, 0, 0, 0).
   *
   * @param type - The typed array constructor to use for internal storage
   * @returns A new zero vector
   * @static
   */
  static _zero(type) {
    return new this(new type([0, 0, 0, 0]), { type });
  }
  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1).
   *
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with all components set to 1
   * @static
   */
  static _one(type) {
    return new this(new type([1, 1, 1, 1]), { type });
  }
  /**
   * Creates a dummy vector with no components (empty array).
   * This is used as a placeholder when a vector is needed but not yet initialized.
   *
   * @param type - The typed array constructor to use for internal storage
   * @returns A new dummy vector with empty components
   * @static
   */
  static _dummy(type) {
    return new this(new type([]), { type });
  }
  /**
   * Creates a normalized version of the given vector.
   * A normalized vector has a length of 1 while maintaining its direction.
   *
   * @param vec - The vector to normalize
   * @param type - The typed array constructor to use for internal storage
   * @returns A new normalized vector
   * @static
   */
  static _normalize(vec, type) {
    const length = vec.length();
    return this._divide(vec, length, type);
  }
  /**
   * Adds two vectors component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector containing the sum (l_vec + r_vec)
   * @static
   */
  static _add(l_vec, r_vec, type) {
    const x = l_vec._v[0] + r_vec._v[0];
    const y = l_vec._v[1] + r_vec._v[1];
    const z = l_vec._v[2] + r_vec._v[2];
    const w = l_vec._v[3] + r_vec._v[3];
    return new this(new type([x, y, z, w]), { type });
  }
  /**
   * Adds two vectors component-wise and stores the result in the output vector.
   * This method modifies the output vector in-place for better performance.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector containing the sum
   * @static
   */
  static addTo(l_vec, r_vec, out) {
    out._v[0] = l_vec._v[0] + r_vec._v[0];
    out._v[1] = l_vec._v[1] + r_vec._v[1];
    out._v[2] = l_vec._v[2] + r_vec._v[2];
    out._v[3] = l_vec._v[3] + r_vec._v[3];
    return out;
  }
  /**
   * Subtracts the right vector from the left vector component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector containing the difference (l_vec - r_vec)
   * @static
   */
  static _subtract(l_vec, r_vec, type) {
    const x = l_vec._v[0] - r_vec._v[0];
    const y = l_vec._v[1] - r_vec._v[1];
    const z = l_vec._v[2] - r_vec._v[2];
    const w = l_vec._v[3] - r_vec._v[3];
    return new this(new type([x, y, z, w]), { type });
  }
  /**
   * Subtracts the right vector from the left vector component-wise and stores the result in the output vector.
   * This method modifies the output vector in-place for better performance.
   *
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector containing the difference
   * @static
   */
  static subtractTo(l_vec, r_vec, out) {
    out._v[0] = l_vec._v[0] - r_vec._v[0];
    out._v[1] = l_vec._v[1] - r_vec._v[1];
    out._v[2] = l_vec._v[2] - r_vec._v[2];
    out._v[3] = l_vec._v[3] - r_vec._v[3];
    return out;
  }
  /**
   * Multiplies a vector by a scalar value and returns a new vector.
   * This operation scales the vector while preserving its direction.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with each component multiplied by the scalar
   * @static
   */
  static _multiply(vec, value, type) {
    const x = vec._v[0] * value;
    const y = vec._v[1] * value;
    const z = vec._v[2] * value;
    const w = vec._v[3] * value;
    return new this(new type([x, y, z, w]), { type });
  }
  /**
   * Multiplies a vector by a scalar value and stores the result in the output vector.
   * This method modifies the output vector in-place for better performance.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector with each component multiplied by the scalar
   * @static
   */
  static multiplyTo(vec, value, out) {
    out._v[0] = vec._v[0] * value;
    out._v[1] = vec._v[1] * value;
    out._v[2] = vec._v[2] * value;
    out._v[3] = vec._v[3] * value;
    return out;
  }
  /**
   * Multiplies two vectors component-wise and returns a new vector.
   * This is also known as the Hadamard product or element-wise multiplication.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with each component being the product of corresponding components
   * @static
   */
  static _multiplyVector(l_vec, r_vec, type) {
    const x = l_vec._v[0] * r_vec._v[0];
    const y = l_vec._v[1] * r_vec._v[1];
    const z = l_vec._v[2] * r_vec._v[2];
    const w = l_vec._v[3] * r_vec._v[3];
    return new this(new type([x, y, z, w]), { type });
  }
  /**
   * Multiplies two vectors component-wise and stores the result in the output vector.
   * This method modifies the output vector in-place for better performance.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector with component-wise multiplication result
   * @static
   */
  static multiplyVectorTo(l_vec, r_vec, out) {
    out._v[0] = l_vec._v[0] * r_vec._v[0];
    out._v[1] = l_vec._v[1] * r_vec._v[1];
    out._v[2] = l_vec._v[2] * r_vec._v[2];
    out._v[3] = l_vec._v[3] * r_vec._v[3];
    return out;
  }
  /**
   * Divides a vector by a scalar value and returns a new vector.
   * If the divisor is zero, the result components will be set to 0 and an error will be logged.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with each component divided by the scalar
   * @static
   */
  static _divide(vec, value, type) {
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
      Logger.default.error("0 division occurred! The result is set to zero.");
      x = 0;
      y = 0;
      z = 0;
      w = 0;
    }
    return new this(new type([x, y, z, w]), { type });
  }
  /**
   * Divides a vector by a scalar value and stores the result in the output vector.
   * If the divisor is zero, the result components will be set to 0 and an error will be logged.
   * This method modifies the output vector in-place for better performance.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector with each component divided by the scalar
   * @static
   */
  static divideTo(vec, value, out) {
    if (value !== 0) {
      out._v[0] = vec._v[0] / value;
      out._v[1] = vec._v[1] / value;
      out._v[2] = vec._v[2] / value;
      out._v[3] = vec._v[3] / value;
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      out._v[0] = 0;
      out._v[1] = 0;
      out._v[2] = 0;
      out._v[3] = 0;
    }
    return out;
  }
  /**
   * Divides the left vector by the right vector component-wise and returns a new vector.
   * If any component of the right vector is zero, the corresponding result component will be set to 0.
   *
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @param type - The typed array constructor to use for internal storage
   * @returns A new vector with component-wise division result
   * @static
   */
  static _divideVector(l_vec, r_vec, type) {
    let x;
    let y;
    let z;
    let w;
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0 && r_vec._v[2] !== 0 && r_vec._v[3] !== 0) {
      x = l_vec._v[0] / r_vec._v[0];
      y = l_vec._v[1] / r_vec._v[1];
      z = l_vec._v[2] / r_vec._v[2];
      w = l_vec._v[3] / r_vec._v[3];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      x = r_vec._v[0] === 0 ? 0 : l_vec._v[0] / r_vec._v[0];
      y = r_vec._v[1] === 0 ? 0 : l_vec._v[1] / r_vec._v[1];
      z = r_vec._v[2] === 0 ? 0 : l_vec._v[2] / r_vec._v[2];
      w = r_vec._v[3] === 0 ? 0 : l_vec._v[3] / r_vec._v[3];
    }
    return new this(new type([x, y, z, w]), { type });
  }
  /**
   * Divides the left vector by the right vector component-wise and stores the result in the output vector.
   * If any component of the right vector is zero, the corresponding result component will be set to 0.
   * This method modifies the output vector in-place for better performance.
   *
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @param out - The output vector to store the result (will be modified)
   * @returns The modified output vector with component-wise division result
   * @static
   */
  static divideVectorTo(l_vec, r_vec, out) {
    if (r_vec._v[0] !== 0 && r_vec._v[1] !== 0 && r_vec._v[2] !== 0 && r_vec._v[3] !== 0) {
      out._v[0] = l_vec._v[0] / r_vec._v[0];
      out._v[1] = l_vec._v[1] / r_vec._v[1];
      out._v[2] = l_vec._v[2] / r_vec._v[2];
      out._v[3] = l_vec._v[3] / r_vec._v[3];
    } else {
      Logger.default.error("0 division occurred! The result is set to zero.");
      out._v[0] = r_vec._v[0] === 0 ? 0 : l_vec._v[0] / r_vec._v[0];
      out._v[1] = r_vec._v[1] === 0 ? 0 : l_vec._v[1] / r_vec._v[1];
      out._v[2] = r_vec._v[2] === 0 ? 0 : l_vec._v[2] / r_vec._v[2];
      out._v[3] = r_vec._v[3] === 0 ? 0 : l_vec._v[3] / r_vec._v[3];
    }
    return out;
  }
  /**
   * Calculates the dot product of two vectors.
   * The dot product is the sum of the products of corresponding components.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns The dot product of the two vectors
   * @static
   */
  static dot(l_vec, r_vec) {
    return l_vec.dot(r_vec);
  }
  /**
   * Converts the vector to a string representation in the format "(x, y, z, w)".
   *
   * @returns A string representation of the vector
   */
  toString() {
    return `(${this._v[0]}, ${this._v[1]}, ${this._v[2]}, ${this._v[3]})`;
  }
  /**
   * Converts the vector to an approximately formatted string representation with financial precision.
   * Each component is formatted to a fixed number of decimal places.
   *
   * @returns A string with space-separated components followed by a newline
   */
  toStringApproximately() {
    return `${MathUtil.financial(this._v[0])} ${MathUtil.financial(this._v[1])} ${MathUtil.financial(this._v[2])} ${MathUtil.financial(this._v[3])}
`;
  }
  /**
   * Converts the vector to a flat array representation.
   *
   * @returns An array containing the vector components [x, y, z, w]
   */
  flattenAsArray() {
    return [this._v[0], this._v[1], this._v[2], this._v[3]];
  }
  /**
   * Checks if this vector is a dummy vector (has no components).
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
   * Checks if this vector is approximately equal to another vector within a specified tolerance.
   *
   * @param vec - The vector to compare with
   * @param delta - The tolerance value for comparison (default: Number.EPSILON)
   * @returns True if the vectors are approximately equal, false otherwise
   */
  isEqual(vec, delta = Number.EPSILON) {
    if (Math.abs(vec._v[0] - this._v[0]) < delta && Math.abs(vec._v[1] - this._v[1]) < delta && Math.abs(vec._v[2] - this._v[2]) < delta && Math.abs(vec._v[3] - this._v[3]) < delta) {
      return true;
    }
    return false;
  }
  /**
   * Checks if this vector is strictly equal to another vector (exact component equality).
   *
   * @param vec - The vector to compare with
   * @returns True if all components are exactly equal, false otherwise
   */
  isStrictEqual(vec) {
    if (this._v[0] === vec._v[0] && this._v[1] === vec._v[1] && this._v[2] === vec._v[2] && this._v[3] === vec._v[3]) {
      return true;
    }
    return false;
  }
  /**
   * Gets the component value at the specified index.
   *
   * @param i - The index (0=x, 1=y, 2=z, 3=w)
   * @returns The component value at the specified index
   */
  at(i) {
    return this._v[i];
  }
  /**
   * Calculates the length (magnitude) of the vector using the Euclidean norm.
   *
   * @returns The length of the vector
   */
  length() {
    return Math.hypot(this._v[0], this._v[1], this._v[2], this._v[3]);
  }
  /**
   * Calculates the squared length (magnitude) of the vector.
   * This is more efficient than length() when only comparing magnitudes.
   *
   * @returns The squared length of the vector
   */
  lengthSquared() {
    return this._v[0] ** 2 + this._v[1] ** 2 + this._v[2] ** 2 + this._v[3] ** 2;
  }
  /**
   * Calculates the distance from this vector to another vector.
   *
   * @param vec - The target vector to calculate distance to
   * @returns The distance between the two vectors
   */
  lengthTo(vec) {
    const deltaX = this._v[0] - vec._v[0];
    const deltaY = this._v[1] - vec._v[1];
    const deltaZ = this._v[2] - vec._v[2];
    const deltaW = this._v[3] - vec._v[3];
    return Math.hypot(deltaX, deltaY, deltaZ, deltaW);
  }
  /**
   * Calculates the dot product between this vector and another vector.
   * The dot product is the sum of the products of corresponding components.
   *
   * @param vec - The vector to calculate dot product with
   * @returns The dot product of the two vectors
   */
  dot(vec) {
    return this._v[0] * vec._v[0] + this._v[1] * vec._v[1] + this._v[2] * vec._v[2] + this._v[3] * vec._v[3];
  }
  /**
   * Gets the class name of this vector type.
   *
   * @returns The string "Vector4"
   */
  get className() {
    return "Vector4";
  }
  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new vector instance with the same component values
   */
  clone() {
    return new this.constructor(
      new this._v.constructor([this._v[0], this._v[1], this._v[2], this._v[3]])
    );
  }
  /**
   * Gets the number of bytes per component in the underlying typed array.
   *
   * @returns The number of bytes per element (4 for Float32Array, 8 for Float64Array)
   */
  get bytesPerComponent() {
    return this._v.BYTES_PER_ELEMENT;
  }
};
var Vector4 = class _Vector4 extends Vector4_ {
  /**
   * Creates a new Vector4 instance from a Float32Array.
   *
   * @param x - The Float32Array containing vector components
   */
  constructor(x) {
    super(x, { type: Float32Array });
  }
  /**
   * Creates a new Vector4 by copying values from an array.
   * Takes the first 4 elements from the array. If the array has fewer than 4 elements,
   * the remaining components will be undefined.
   *
   * @param array - Array containing numeric values (at least 4 elements recommended)
   * @returns A new Vector4 instance with copied values
   * @static
   */
  static fromCopyArray(array) {
    return super._fromCopyArray(array, Float32Array);
  }
  /**
   * Creates a new Vector4 from a 4-element array by copying the values.
   *
   * @param array - Array containing exactly 4 numeric values [x, y, z, w]
   * @returns A new Vector4 instance with the copied values
   * @static
   */
  static fromCopyArray4(array) {
    return super._fromCopyArray4(array, Float32Array);
  }
  /**
   * Creates a new Vector4 from individual component values.
   *
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param w - The W component value
   * @returns A new Vector4 instance with the specified component values
   * @static
   */
  static fromCopy4(x, y, z, w) {
    return super._fromCopy4(x, y, z, w, Float32Array);
  }
  /**
   * Creates a new Vector4 from a Vector3, setting the W component to 1.
   * This is commonly used for converting 3D positions to homogeneous coordinates.
   *
   * @param vec3 - The source Vector3 to copy from
   * @returns A new Vector4 with (vec3.x, vec3.y, vec3.z, 1.0)
   * @static
   */
  static fromCopyVector3(vec3) {
    return super._fromCopyVector3(vec3, Float32Array);
  }
  /**
   * Creates a new Vector4 by copying values from another Vector4.
   *
   * @param vec4 - The source Vector4 to copy from
   * @returns A new Vector4 instance with copied values from the source vector
   * @static
   */
  static fromCopyVector4(vec4) {
    return super._fromCopyVector4(vec4, Float32Array);
  }
  /**
   * Creates a new Vector4 from an ArrayBuffer.
   * The ArrayBuffer should contain at least 16 bytes (4 float32 values).
   *
   * @param arrayBuffer - The ArrayBuffer containing vector data
   * @returns A new Vector4 instance using the ArrayBuffer data
   * @static
   */
  static fromArrayBuffer(arrayBuffer) {
    return new _Vector4(new Float32Array(arrayBuffer));
  }
  /**
   * Creates a new Vector4 from a Float32Array.
   * The Float32Array is used directly without copying.
   *
   * @param float32Array - The Float32Array containing vector components
   * @returns A new Vector4 instance using the provided Float32Array
   * @static
   */
  static fromFloat32Array(float32Array) {
    return new _Vector4(float32Array);
  }
  /**
   * Creates a new Vector4 by copying from a Float32Array.
   * This creates a new Float32Array copy of the input data.
   *
   * @param float32Array - The Float32Array to copy from
   * @returns A new Vector4 instance with copied Float32Array data
   * @static
   */
  static fromCopyFloat32Array(float32Array) {
    return new _Vector4(float32Array.slice(0));
  }
  /**
   * Creates a zero vector (0, 0, 0, 0).
   *
   * @returns A new Vector4 with all components set to zero
   * @static
   */
  static zero() {
    return super._zero(Float32Array);
  }
  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1).
   *
   * @returns A new Vector4 with all components set to 1
   * @static
   */
  static one() {
    return super._one(Float32Array);
  }
  /**
   * Creates a dummy vector with no components (empty array).
   * This is used as a placeholder when a vector is needed but not yet initialized.
   *
   * @returns A new dummy Vector4 with empty components
   * @static
   */
  static dummy() {
    return super._dummy(Float32Array);
  }
  /**
   * Creates a normalized version of the given vector.
   * A normalized vector has a length of 1 while maintaining its direction.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized Vector4
   * @static
   */
  static normalize(vec) {
    return super._normalize(vec, Float32Array);
  }
  /**
   * Adds two vectors component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new Vector4 containing the sum (l_vec + r_vec)
   * @static
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float32Array);
  }
  /**
   * Subtracts the right vector from the left vector component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @returns A new Vector4 containing the difference (l_vec - r_vec)
   * @static
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float32Array);
  }
  /**
   * Multiplies a vector by a scalar value and returns a new vector.
   * This operation scales the vector while preserving its direction.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector4 with each component multiplied by the scalar
   * @static
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float32Array);
  }
  /**
   * Multiplies two vectors component-wise and returns a new vector.
   * This is also known as the Hadamard product or element-wise multiplication.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new Vector4 with each component being the product of corresponding components
   * @static
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Divides a vector by a scalar value and returns a new vector.
   * If the divisor is zero, the result components will be set to 0 and an error will be logged.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector4 with each component divided by the scalar
   * @static
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float32Array);
  }
  /**
   * Divides the left vector by the right vector component-wise and returns a new vector.
   * If any component of the right vector is zero, the corresponding result component will be set to 0.
   *
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @returns A new Vector4 with component-wise division result
   * @static
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float32Array);
  }
  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new Vector4 instance with the same component values
   */
  clone() {
    return super.clone();
  }
};
var Vector4D = class _Vector4D extends Vector4_ {
  /**
   * Creates a new Vector4D instance from a Float64Array.
   *
   * @param x - The Float64Array containing vector components
   * @private This constructor is private to prevent direct instantiation
   */
  constructor(x) {
    super(x, { type: Float64Array });
  }
  /**
   * Creates a new Vector4D from a 4-element array by copying the values.
   *
   * @param array - Array containing exactly 4 numeric values [x, y, z, w]
   * @returns A new Vector4D instance with the copied values
   * @static
   */
  static fromCopyArray4(array) {
    return super._fromCopyArray4(array, Float64Array);
  }
  /**
   * Creates a new Vector4D from individual component values.
   *
   * @param x - The X component value
   * @param y - The Y component value
   * @param z - The Z component value
   * @param w - The W component value
   * @returns A new Vector4D instance with the specified component values
   * @static
   */
  static fromCopy4(x, y, z, w) {
    return super._fromCopy4(x, y, z, w, Float64Array);
  }
  /**
   * Creates a new Vector4D by copying values from an array.
   * Takes the first 4 elements from the array. If the array has fewer than 4 elements,
   * the remaining components will be undefined.
   *
   * @param array - Array containing numeric values (at least 4 elements recommended)
   * @returns A new Vector4D instance with copied values
   * @static
   */
  static fromCopyArray(array) {
    return super._fromCopyArray(array, Float64Array);
  }
  /**
   * Creates a new Vector4D from an ArrayBuffer.
   * The ArrayBuffer should contain at least 32 bytes (4 float64 values).
   *
   * @param arrayBuffer - The ArrayBuffer containing vector data
   * @returns A new Vector4D instance using the ArrayBuffer data
   * @static
   */
  static fromArrayBuffer(arrayBuffer) {
    return new _Vector4D(new Float64Array(arrayBuffer));
  }
  /**
   * Creates a new Vector4D from a Float64Array.
   * The Float64Array is used directly without copying.
   *
   * @param float64Array - The Float64Array containing vector components
   * @returns A new Vector4D instance using the provided Float64Array
   * @static
   */
  static fromFloat64Array(float64Array) {
    return new _Vector4D(float64Array);
  }
  /**
   * Creates a zero vector (0, 0, 0, 0).
   *
   * @returns A new Vector4D with all components set to zero
   * @static
   */
  static zero() {
    return super._zero(Float64Array);
  }
  /**
   * Creates a vector with all components set to 1 (1, 1, 1, 1).
   *
   * @returns A new Vector4D with all components set to 1
   * @static
   */
  static one() {
    return super._one(Float64Array);
  }
  /**
   * Creates a dummy vector with no components (empty array).
   * This is used as a placeholder when a vector is needed but not yet initialized.
   *
   * @returns A new dummy Vector4D with empty components
   * @static
   */
  static dummy() {
    return super._dummy(Float64Array);
  }
  /**
   * Creates a normalized version of the given vector.
   * A normalized vector has a length of 1 while maintaining its direction.
   *
   * @param vec - The vector to normalize
   * @returns A new normalized Vector4D
   * @static
   */
  static normalize(vec) {
    return super._normalize(vec, Float64Array);
  }
  /**
   * Adds two vectors component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new Vector4D containing the sum (l_vec + r_vec)
   * @static
   */
  static add(l_vec, r_vec) {
    return super._add(l_vec, r_vec, Float64Array);
  }
  /**
   * Subtracts the right vector from the left vector component-wise and returns a new vector.
   *
   * @param l_vec - The left operand vector (minuend)
   * @param r_vec - The right operand vector (subtrahend)
   * @returns A new Vector4D containing the difference (l_vec - r_vec)
   * @static
   */
  static subtract(l_vec, r_vec) {
    return super._subtract(l_vec, r_vec, Float64Array);
  }
  /**
   * Multiplies a vector by a scalar value and returns a new vector.
   * This operation scales the vector while preserving its direction.
   *
   * @param vec - The vector to multiply
   * @param value - The scalar value to multiply by
   * @returns A new Vector4D with each component multiplied by the scalar
   * @static
   */
  static multiply(vec, value) {
    return super._multiply(vec, value, Float64Array);
  }
  /**
   * Multiplies two vectors component-wise and returns a new vector.
   * This is also known as the Hadamard product or element-wise multiplication.
   *
   * @param l_vec - The left operand vector
   * @param r_vec - The right operand vector
   * @returns A new Vector4D with each component being the product of corresponding components
   * @static
   */
  static multiplyVector(l_vec, r_vec) {
    return super._multiplyVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Divides a vector by a scalar value and returns a new vector.
   * If the divisor is zero, the result components will be set to 0 and an error will be logged.
   *
   * @param vec - The vector to divide
   * @param value - The scalar value to divide by
   * @returns A new Vector4D with each component divided by the scalar
   * @static
   */
  static divide(vec, value) {
    return super._divide(vec, value, Float64Array);
  }
  /**
   * Divides the left vector by the right vector component-wise and returns a new vector.
   * If any component of the right vector is zero, the corresponding result component will be set to 0.
   *
   * @param l_vec - The left operand vector (dividend)
   * @param r_vec - The right operand vector (divisor)
   * @returns A new Vector4D with component-wise division result
   * @static
   */
  static divideVector(l_vec, r_vec) {
    return super._divideVector(l_vec, r_vec, Float64Array);
  }
  /**
   * Creates a deep copy of this vector.
   *
   * @returns A new Vector4D instance with the same component values
   */
  clone() {
    return super.clone();
  }
};
var ConstVector4_1_1_1_1 = Vector4.fromCopy4(1, 1, 1, 1);
var ConstVector4_0_0_0_1 = Vector4.fromCopy4(0, 0, 0, 1);
var ConstVector4_0_0_0_0 = Vector4.fromCopy4(0, 0, 0, 0);
export {
  ConstVector4_0_0_0_0,
  ConstVector4_0_0_0_1,
  ConstVector4_1_1_1_1,
  Vector4,
  Vector4D,
  Vector4 as Vector4F,
  Vector4_
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9WZWN0b3I0LnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEFycmF5NCwgRmxvYXRUeXBlZEFycmF5LCBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3RvciB9IGZyb20gJy4uLy4uL3R5cGVzL0NvbW1vblR5cGVzJztcbmltcG9ydCB7IENvbXBvc2l0aW9uVHlwZSB9IGZyb20gJy4uL2RlZmluaXRpb25zL0NvbXBvc2l0aW9uVHlwZSc7XG5pbXBvcnQgeyBMb2dnZXIgfSBmcm9tICcuLi9taXNjL0xvZ2dlcic7XG5pbXBvcnQgeyBBYnN0cmFjdFZlY3RvciB9IGZyb20gJy4vQWJzdHJhY3RWZWN0b3InO1xuaW1wb3J0IHR5cGUgeyBJTXV0YWJsZVZlY3RvcjQsIElWZWN0b3IyLCBJVmVjdG9yMywgSVZlY3RvcjQgfSBmcm9tICcuL0lWZWN0b3InO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuL01hdGhVdGlsJztcblxuLyoqXG4gKiBHZW5lcmljIDREIHZlY3RvciBjbGFzcyB0aGF0IHNlcnZlcyBhcyB0aGUgYmFzZSBpbXBsZW1lbnRhdGlvbiBmb3IgYm90aCAzMi1iaXQgYW5kIDY0LWJpdCB2ZWN0b3IgdHlwZXMuXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGltbXV0YWJsZSB2ZWN0b3Igb3BlcmF0aW9ucyB3aXRoIHN1cHBvcnQgZm9yIGRpZmZlcmVudCBmbG9hdGluZy1wb2ludCBwcmVjaXNpb25zLlxuICpcbiAqIEB0ZW1wbGF0ZSBUIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHR5cGUgKEZsb2F0MzJBcnJheUNvbnN0cnVjdG9yIG9yIEZsb2F0NjRBcnJheUNvbnN0cnVjdG9yKVxuICogQGludGVybmFsIFRoaXMgY2xhc3MgaXMgbm90IGludGVuZGVkIGZvciBkaXJlY3QgaW5zdGFudGlhdGlvbiBieSB1c2Vyc1xuICovXG5leHBvcnQgY2xhc3MgVmVjdG9yNF88VCBleHRlbmRzIEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yPiBleHRlbmRzIEFic3RyYWN0VmVjdG9yIGltcGxlbWVudHMgSVZlY3RvcjQge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBWZWN0b3I0XyBpbnN0YW5jZS5cbiAgICpcbiAgICogQHBhcmFtIHYgLSBUaGUgdW5kZXJseWluZyB0eXBlZCBhcnJheSBjb250YWluaW5nIHRoZSB2ZWN0b3IgY29tcG9uZW50c1xuICAgKiBAcGFyYW0gb3B0aW9ucyAtIENvbmZpZ3VyYXRpb24gb2JqZWN0IGNvbnRhaW5pbmcgdGhlIGFycmF5IHR5cGUgY29uc3RydWN0b3JcbiAgICogQHByb3RlY3RlZCBUaGlzIGNvbnN0cnVjdG9yIGlzIHByb3RlY3RlZCB0byBwcmV2ZW50IGRpcmVjdCBpbnN0YW50aWF0aW9uXG4gICAqL1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IodjogRmxvYXRUeXBlZEFycmF5LCBfb3B0aW9uczogeyB0eXBlOiBUIH0pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX3YgPSB2O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFggY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBYIGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHgoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlswXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBZIGNvbXBvbmVudCBvZiB0aGUgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgWSBjb21wb25lbnQgdmFsdWVcbiAgICovXG4gIGdldCB5KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuX3ZbMV07XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgWiBjb21wb25lbnQgb2YgdGhlIHZlY3Rvci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIFogY29tcG9uZW50IHZhbHVlXG4gICAqL1xuICBnZXQgeigpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLl92WzJdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIFcgY29tcG9uZW50IG9mIHRoZSB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBXIGNvbXBvbmVudCB2YWx1ZVxuICAgKi9cbiAgZ2V0IHcoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlszXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgdmVjdG9yIHRvIGEgR0xTTCB2ZWM0IHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIGZsb2F0IHByZWNpc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgQSBHTFNMLWNvbXBhdGlibGUgdmVjNCBzdHJpbmcgKGUuZy4sIFwidmVjNCgxLjAsIDIuMCwgMy4wLCA0LjApXCIpXG4gICAqL1xuICBnZXQgZ2xzbFN0ckFzRmxvYXQoKSB7XG4gICAgcmV0dXJuIGB2ZWM0KCR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQoXG4gICAgICB0aGlzLl92WzBdXG4gICAgKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlsxXSl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KFxuICAgICAgdGhpcy5fdlsyXVxuICAgICl9LCAke01hdGhVdGlsLmNvbnZlcnRUb1N0cmluZ0FzR0xTTEZsb2F0KHRoaXMuX3ZbM10pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYSBHTFNMIGl2ZWM0IHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIGludGVnZXIgdmFsdWVzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIEdMU0wtY29tcGF0aWJsZSBpdmVjNCBzdHJpbmcgKGUuZy4sIFwiaXZlYzQoMSwgMiwgMywgNClcIilcbiAgICovXG4gIGdldCBnbHNsU3RyQXNJbnQoKSB7XG4gICAgcmV0dXJuIGBpdmVjNCgke01hdGguZmxvb3IodGhpcy5fdlswXSl9LCAke01hdGguZmxvb3IodGhpcy5fdlsxXSl9LCAke01hdGguZmxvb3IoXG4gICAgICB0aGlzLl92WzJdXG4gICAgKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzNdKX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgdmVjdG9yIHRvIGEgR0xTTCB1dmVjNCBzdHJpbmcgcmVwcmVzZW50YXRpb24gd2l0aCB1bnNpZ25lZCBpbnRlZ2VyIHZhbHVlcy5cbiAgICpcbiAgICogQHJldHVybnMgQSBHTFNMLWNvbXBhdGlibGUgdXZlYzQgc3RyaW5nIChlLmcuLCBcInV2ZWM0KDF1LCAydSwgM3UsIDR1KVwiKVxuICAgKi9cbiAgZ2V0IGdsc2xTdHJBc1VpbnQoKSB7XG4gICAgcmV0dXJuIGB1dmVjNCgke01hdGguZmxvb3IodGhpcy5fdlswXSl9dSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbMV0pfXUsICR7TWF0aC5mbG9vcihcbiAgICAgIHRoaXMuX3ZbMl1cbiAgICApfXUsICR7TWF0aC5mbG9vcih0aGlzLl92WzNdKX11KWA7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHZlY3RvciB0byBhIFdHU0wgdmVjNGYgc3RyaW5nIHJlcHJlc2VudGF0aW9uIHdpdGggZmxvYXQgcHJlY2lzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIFdHU0wtY29tcGF0aWJsZSB2ZWM0ZiBzdHJpbmcgKGUuZy4sIFwidmVjNGYoMS4wLCAyLjAsIDMuMCwgNC4wKVwiKVxuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc0Zsb2F0KCkge1xuICAgIHJldHVybiBgdmVjNGYoJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdChcbiAgICAgIHRoaXMuX3ZbMF1cbiAgICApfSwgJHtNYXRoVXRpbC5jb252ZXJ0VG9TdHJpbmdBc0dMU0xGbG9hdCh0aGlzLl92WzFdKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQoXG4gICAgICB0aGlzLl92WzJdXG4gICAgKX0sICR7TWF0aFV0aWwuY29udmVydFRvU3RyaW5nQXNHTFNMRmxvYXQodGhpcy5fdlszXSl9KWA7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHZlY3RvciB0byBhIFdHU0wgdmVjNGkgc3RyaW5nIHJlcHJlc2VudGF0aW9uIHdpdGggaW50ZWdlciB2YWx1ZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgV0dTTC1jb21wYXRpYmxlIHZlYzRpIHN0cmluZyAoZS5nLiwgXCJ2ZWM0aSgxLCAyLCAzLCA0KVwiKVxuICAgKi9cbiAgZ2V0IHdnc2xTdHJBc0ludCgpIHtcbiAgICByZXR1cm4gYHZlYzRpKCR7TWF0aC5mbG9vcih0aGlzLl92WzBdKX0sICR7TWF0aC5mbG9vcih0aGlzLl92WzFdKX0sICR7TWF0aC5mbG9vcihcbiAgICAgIHRoaXMuX3ZbMl1cbiAgICApfSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbM10pfSlgO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnRzIHRoZSB2ZWN0b3IgdG8gYSBXR1NMIHZlYzR1IHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIHVuc2lnbmVkIGludGVnZXIgdmFsdWVzLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIFdHU0wtY29tcGF0aWJsZSB2ZWM0dSBzdHJpbmcgKGUuZy4sIFwidmVjNHUoMXUsIDJ1LCAzdSwgNHUpXCIpXG4gICAqL1xuICBnZXQgd2dzbFN0ckFzVWludCgpIHtcbiAgICByZXR1cm4gYHZlYzR1KCR7TWF0aC5mbG9vcih0aGlzLl92WzBdKX11LCAke01hdGguZmxvb3IodGhpcy5fdlsxXSl9dSwgJHtNYXRoLmZsb29yKFxuICAgICAgdGhpcy5fdlsyXVxuICAgICl9dSwgJHtNYXRoLmZsb29yKHRoaXMuX3ZbM10pfXUpYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IHZlY3RvciBmcm9tIGEgNC1lbGVtZW50IGFycmF5IGJ5IGNvcHlpbmcgdGhlIHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXkgY29udGFpbmluZyBleGFjdGx5IDQgbnVtZXJpYyB2YWx1ZXMgW3gsIHksIHosIHddXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZSBmb3IgaW50ZXJuYWwgc3RvcmFnZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgaW5zdGFuY2Ugd2l0aCB0aGUgY29waWVkIHZhbHVlc1xuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXk0KGFycmF5OiBBcnJheTQ8bnVtYmVyPiwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHR5cGUoYXJyYXkpLCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgZnJvbSBpbmRpdmlkdWFsIGNvbXBvbmVudCB2YWx1ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIFggY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB5IC0gVGhlIFkgY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB6IC0gVGhlIFogY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB3IC0gVGhlIFcgY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZSBmb3IgaW50ZXJuYWwgc3RvcmFnZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3IgaW5zdGFuY2Ugd2l0aCB0aGUgc3BlY2lmaWVkIGNvbXBvbmVudCB2YWx1ZXNcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIF9mcm9tQ29weTQoeDogbnVtYmVyLCB5OiBudW1iZXIsIHo6IG51bWJlciwgdzogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIHJldHVybiBuZXcgdGhpcyhuZXcgdHlwZShbeCwgeSwgeiwgd10pLCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyB2ZWN0b3IgZnJvbSBhbiBhcnJheSBieSBjb3B5aW5nIHRoZSBmaXJzdCA0IHZhbHVlcy5cbiAgICogSWYgdGhlIGFycmF5IGhhcyBmZXdlciB0aGFuIDQgZWxlbWVudHMsIHRoZSByZW1haW5pbmcgY29tcG9uZW50cyB3aWxsIGJlIHVuZGVmaW5lZC5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXkgY29udGFpbmluZyBudW1lcmljIHZhbHVlcyAoYXQgbGVhc3QgNCBlbGVtZW50cyByZWNvbW1lbmRlZClcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlIGZvciBpbnRlcm5hbCBzdG9yYWdlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZSB3aXRoIHRoZSBmaXJzdCA0IHZhbHVlcyBmcm9tIHRoZSBhcnJheVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5QXJyYXkoYXJyYXk6IEFycmF5PG51bWJlcj4sIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKGFycmF5LnNsaWNlKDAsIDQpKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgdmVjdG9yIGJ5IGNvcHlpbmcgdmFsdWVzIGZyb20gYW5vdGhlciBWZWN0b3I0LlxuICAgKlxuICAgKiBAcGFyYW0gdmVjNCAtIFRoZSBzb3VyY2UgVmVjdG9yNCB0byBjb3B5IGZyb21cbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlIGZvciBpbnRlcm5hbCBzdG9yYWdlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZSB3aXRoIGNvcGllZCB2YWx1ZXMgZnJvbSB0aGUgc291cmNlIHZlY3RvclxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgX2Zyb21Db3B5VmVjdG9yNCh2ZWM0OiBJVmVjdG9yNCwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBjb25zdCB2ZWMgPSBuZXcgdGhpcyhuZXcgdHlwZShbdmVjNC5fdlswXSwgdmVjNC5fdlsxXSwgdmVjNC5fdlsyXSwgdmVjNC5fdlszXV0pLCB7IHR5cGUgfSk7XG4gICAgcmV0dXJuIHZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjQgZnJvbSBhIFZlY3RvcjMsIHNldHRpbmcgdGhlIFcgY29tcG9uZW50IHRvIDEuXG4gICAqIFRoaXMgaXMgY29tbW9ubHkgdXNlZCBmb3IgY29udmVydGluZyAzRCBwb3NpdGlvbnMgdG8gaG9tb2dlbmVvdXMgY29vcmRpbmF0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMzIC0gVGhlIHNvdXJjZSBWZWN0b3IzIHRvIGNvcHkgZnJvbVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2UgZm9yIGludGVybmFsIHN0b3JhZ2VcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNCB3aXRoICh2ZWMzLngsIHZlYzMueSwgdmVjMy56LCAxLjApXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBfZnJvbUNvcHlWZWN0b3IzKHZlYzM6IElWZWN0b3IzLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIGNvbnN0IHZlYyA9IG5ldyB0aGlzKG5ldyB0eXBlKFt2ZWMzLl92WzBdLCB2ZWMzLl92WzFdLCB2ZWMzLl92WzJdLCAxXSksIHtcbiAgICAgIHR5cGUsXG4gICAgfSk7XG4gICAgcmV0dXJuIHZlYztcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjQgZnJvbSBhIFZlY3RvcjIsIHNldHRpbmcgWiB0byAwIGFuZCBXIHRvIDEuXG4gICAqIFRoaXMgaXMgY29tbW9ubHkgdXNlZCBmb3IgY29udmVydGluZyAyRCBwb3NpdGlvbnMgdG8gaG9tb2dlbmVvdXMgY29vcmRpbmF0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMyIC0gVGhlIHNvdXJjZSBWZWN0b3IyIHRvIGNvcHkgZnJvbVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2UgZm9yIGludGVybmFsIHN0b3JhZ2VcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNCB3aXRoICh2ZWMyLngsIHZlYzIueSwgMC4wLCAxLjApXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBfZnJvbVZlY3RvcjIodmVjMjogSVZlY3RvcjIsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgdmVjID0gbmV3IHRoaXMobmV3IHR5cGUoW3ZlYzIuX3ZbMF0sIHZlYzIuX3ZbMV0sIDAsIDFdKSwge1xuICAgICAgdHlwZSxcbiAgICB9KTtcbiAgICByZXR1cm4gdmVjO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvc2l0aW9uIHR5cGUgaWRlbnRpZmllciBmb3IgdGhpcyB2ZWN0b3IgdHlwZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIENvbXBvc2l0aW9uVHlwZS5WZWM0IGlkZW50aWZpZXJcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGdldCBjb21wb3NpdGlvblR5cGUoKSB7XG4gICAgcmV0dXJuIENvbXBvc2l0aW9uVHlwZS5WZWM0O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIHNxdWFyZWQgbGVuZ3RoIChtYWduaXR1ZGUpIG9mIGEgdmVjdG9yLlxuICAgKiBUaGlzIGlzIG1vcmUgZWZmaWNpZW50IHRoYW4gbGVuZ3RoKCkgd2hlbiBvbmx5IGNvbXBhcmluZyBtYWduaXR1ZGVzLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBjYWxjdWxhdGUgc3F1YXJlZCBsZW5ndGggZm9yXG4gICAqIEByZXR1cm5zIFRoZSBzcXVhcmVkIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBsZW5ndGhTcXVhcmVkKHZlYzogSVZlY3RvcjQpIHtcbiAgICByZXR1cm4gdmVjLmxlbmd0aFNxdWFyZWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byB2ZWN0b3JzLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgZmlyc3QgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSBzZWNvbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIFRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSB0d28gdmVjdG9yc1xuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgbGVuZ3RoQnR3KGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIGxfdmVjLmxlbmd0aFRvKHJfdmVjKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgemVybyB2ZWN0b3IgKDAsIDAsIDAsIDApLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2UgZm9yIGludGVybmFsIHN0b3JhZ2VcbiAgICogQHJldHVybnMgQSBuZXcgemVybyB2ZWN0b3JcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIF96ZXJvKHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKFswLCAwLCAwLCAwXSksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgdmVjdG9yIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDEgKDEsIDEsIDEsIDEpLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2UgZm9yIGludGVybmFsIHN0b3JhZ2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDFcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIF9vbmUodHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHR5cGUoWzEsIDEsIDEsIDFdKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSB2ZWN0b3Igd2l0aCBubyBjb21wb25lbnRzIChlbXB0eSBhcnJheSkuXG4gICAqIFRoaXMgaXMgdXNlZCBhcyBhIHBsYWNlaG9sZGVyIHdoZW4gYSB2ZWN0b3IgaXMgbmVlZGVkIGJ1dCBub3QgeWV0IGluaXRpYWxpemVkLlxuICAgKlxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2UgZm9yIGludGVybmFsIHN0b3JhZ2VcbiAgICogQHJldHVybnMgQSBuZXcgZHVtbXkgdmVjdG9yIHdpdGggZW1wdHkgY29tcG9uZW50c1xuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgX2R1bW15KHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKFtdKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhlIGdpdmVuIHZlY3Rvci5cbiAgICogQSBub3JtYWxpemVkIHZlY3RvciBoYXMgYSBsZW5ndGggb2YgMSB3aGlsZSBtYWludGFpbmluZyBpdHMgZGlyZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlIGZvciBpbnRlcm5hbCBzdG9yYWdlXG4gICAqIEByZXR1cm5zIEEgbmV3IG5vcm1hbGl6ZWQgdmVjdG9yXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBfbm9ybWFsaXplKHZlYzogSVZlY3RvcjQsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgbGVuZ3RoID0gdmVjLmxlbmd0aCgpO1xuICAgIHJldHVybiB0aGlzLl9kaXZpZGUodmVjLCBsZW5ndGgsIHR5cGUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UgYW5kIHJldHVybnMgYSBuZXcgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlIGZvciBpbnRlcm5hbCBzdG9yYWdlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBjb250YWluaW5nIHRoZSBzdW0gKGxfdmVjICsgcl92ZWMpXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBfYWRkKGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0LCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIGNvbnN0IHggPSBsX3ZlYy5fdlswXSArIHJfdmVjLl92WzBdO1xuICAgIGNvbnN0IHkgPSBsX3ZlYy5fdlsxXSArIHJfdmVjLl92WzFdO1xuICAgIGNvbnN0IHogPSBsX3ZlYy5fdlsyXSArIHJfdmVjLl92WzJdO1xuICAgIGNvbnN0IHcgPSBsX3ZlYy5fdlszXSArIHJfdmVjLl92WzNdO1xuICAgIHJldHVybiBuZXcgdGhpcyhuZXcgdHlwZShbeCwgeSwgeiwgd10pLCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogQWRkcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIFRoaXMgbWV0aG9kIG1vZGlmaWVzIHRoZSBvdXRwdXQgdmVjdG9yIGluLXBsYWNlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdCAod2lsbCBiZSBtb2RpZmllZClcbiAgICogQHJldHVybnMgVGhlIG1vZGlmaWVkIG91dHB1dCB2ZWN0b3IgY29udGFpbmluZyB0aGUgc3VtXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBhZGRUbyhsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCwgb3V0OiBJTXV0YWJsZVZlY3RvcjQpIHtcbiAgICBvdXQuX3ZbMF0gPSBsX3ZlYy5fdlswXSArIHJfdmVjLl92WzBdO1xuICAgIG91dC5fdlsxXSA9IGxfdmVjLl92WzFdICsgcl92ZWMuX3ZbMV07XG4gICAgb3V0Ll92WzJdID0gbF92ZWMuX3ZbMl0gKyByX3ZlYy5fdlsyXTtcbiAgICBvdXQuX3ZbM10gPSBsX3ZlYy5fdlszXSArIHJfdmVjLl92WzNdO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogU3VidHJhY3RzIHRoZSByaWdodCB2ZWN0b3IgZnJvbSB0aGUgbGVmdCB2ZWN0b3IgY29tcG9uZW50LXdpc2UgYW5kIHJldHVybnMgYSBuZXcgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvciAobWludWVuZClcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yIChzdWJ0cmFoZW5kKVxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2UgZm9yIGludGVybmFsIHN0b3JhZ2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIGNvbnRhaW5pbmcgdGhlIGRpZmZlcmVuY2UgKGxfdmVjIC0gcl92ZWMpXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBfc3VidHJhY3QobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgeCA9IGxfdmVjLl92WzBdIC0gcl92ZWMuX3ZbMF07XG4gICAgY29uc3QgeSA9IGxfdmVjLl92WzFdIC0gcl92ZWMuX3ZbMV07XG4gICAgY29uc3QgeiA9IGxfdmVjLl92WzJdIC0gcl92ZWMuX3ZbMl07XG4gICAgY29uc3QgdyA9IGxfdmVjLl92WzNdIC0gcl92ZWMuX3ZbM107XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKFt4LCB5LCB6LCB3XSksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdGhlIHJpZ2h0IHZlY3RvciBmcm9tIHRoZSBsZWZ0IHZlY3RvciBjb21wb25lbnQtd2lzZSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIFRoaXMgbWV0aG9kIG1vZGlmaWVzIHRoZSBvdXRwdXQgdmVjdG9yIGluLXBsYWNlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yIChtaW51ZW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3IgKHN1YnRyYWhlbmQpXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0ICh3aWxsIGJlIG1vZGlmaWVkKVxuICAgKiBAcmV0dXJucyBUaGUgbW9kaWZpZWQgb3V0cHV0IHZlY3RvciBjb250YWluaW5nIHRoZSBkaWZmZXJlbmNlXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBzdWJ0cmFjdFRvKGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0LCBvdXQ6IElNdXRhYmxlVmVjdG9yNCkge1xuICAgIG91dC5fdlswXSA9IGxfdmVjLl92WzBdIC0gcl92ZWMuX3ZbMF07XG4gICAgb3V0Ll92WzFdID0gbF92ZWMuX3ZbMV0gLSByX3ZlYy5fdlsxXTtcbiAgICBvdXQuX3ZbMl0gPSBsX3ZlYy5fdlsyXSAtIHJfdmVjLl92WzJdO1xuICAgIG91dC5fdlszXSA9IGxfdmVjLl92WzNdIC0gcl92ZWMuX3ZbM107XG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlIGFuZCByZXR1cm5zIGEgbmV3IHZlY3Rvci5cbiAgICogVGhpcyBvcGVyYXRpb24gc2NhbGVzIHRoZSB2ZWN0b3Igd2hpbGUgcHJlc2VydmluZyBpdHMgZGlyZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZSBmb3IgaW50ZXJuYWwgc3RvcmFnZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3Igd2l0aCBlYWNoIGNvbXBvbmVudCBtdWx0aXBsaWVkIGJ5IHRoZSBzY2FsYXJcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIF9tdWx0aXBseSh2ZWM6IElWZWN0b3I0LCB2YWx1ZTogbnVtYmVyLCB0eXBlOiBGbG9hdFR5cGVkQXJyYXlDb25zdHJ1Y3Rvcikge1xuICAgIGNvbnN0IHggPSB2ZWMuX3ZbMF0gKiB2YWx1ZTtcbiAgICBjb25zdCB5ID0gdmVjLl92WzFdICogdmFsdWU7XG4gICAgY29uc3QgeiA9IHZlYy5fdlsyXSAqIHZhbHVlO1xuICAgIGNvbnN0IHcgPSB2ZWMuX3ZbM10gKiB2YWx1ZTtcbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHR5cGUoW3gsIHksIHosIHddKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIE11bHRpcGxpZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBUaGlzIG1ldGhvZCBtb2RpZmllcyB0aGUgb3V0cHV0IHZlY3RvciBpbi1wbGFjZSBmb3IgYmV0dGVyIHBlcmZvcm1hbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0ICh3aWxsIGJlIG1vZGlmaWVkKVxuICAgKiBAcmV0dXJucyBUaGUgbW9kaWZpZWQgb3V0cHV0IHZlY3RvciB3aXRoIGVhY2ggY29tcG9uZW50IG11bHRpcGxpZWQgYnkgdGhlIHNjYWxhclxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlUbyh2ZWM6IElWZWN0b3I0LCB2YWx1ZTogbnVtYmVyLCBvdXQ6IElNdXRhYmxlVmVjdG9yNCkge1xuICAgIG91dC5fdlswXSA9IHZlYy5fdlswXSAqIHZhbHVlO1xuICAgIG91dC5fdlsxXSA9IHZlYy5fdlsxXSAqIHZhbHVlO1xuICAgIG91dC5fdlsyXSA9IHZlYy5fdlsyXSAqIHZhbHVlO1xuICAgIG91dC5fdlszXSA9IHZlYy5fdlszXSAqIHZhbHVlO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyB0d28gdmVjdG9ycyBjb21wb25lbnQtd2lzZSBhbmQgcmV0dXJucyBhIG5ldyB2ZWN0b3IuXG4gICAqIFRoaXMgaXMgYWxzbyBrbm93biBhcyB0aGUgSGFkYW1hcmQgcHJvZHVjdCBvciBlbGVtZW50LXdpc2UgbXVsdGlwbGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gdHlwZSAtIFRoZSB0eXBlZCBhcnJheSBjb25zdHJ1Y3RvciB0byB1c2UgZm9yIGludGVybmFsIHN0b3JhZ2VcbiAgICogQHJldHVybnMgQSBuZXcgdmVjdG9yIHdpdGggZWFjaCBjb21wb25lbnQgYmVpbmcgdGhlIHByb2R1Y3Qgb2YgY29ycmVzcG9uZGluZyBjb21wb25lbnRzXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBfbXVsdGlwbHlWZWN0b3IobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQsIHR5cGU6IEZsb2F0VHlwZWRBcnJheUNvbnN0cnVjdG9yKSB7XG4gICAgY29uc3QgeCA9IGxfdmVjLl92WzBdICogcl92ZWMuX3ZbMF07XG4gICAgY29uc3QgeSA9IGxfdmVjLl92WzFdICogcl92ZWMuX3ZbMV07XG4gICAgY29uc3QgeiA9IGxfdmVjLl92WzJdICogcl92ZWMuX3ZbMl07XG4gICAgY29uc3QgdyA9IGxfdmVjLl92WzNdICogcl92ZWMuX3ZbM107XG4gICAgcmV0dXJuIG5ldyB0aGlzKG5ldyB0eXBlKFt4LCB5LCB6LCB3XSksIHsgdHlwZSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlIGFuZCBzdG9yZXMgdGhlIHJlc3VsdCBpbiB0aGUgb3V0cHV0IHZlY3Rvci5cbiAgICogVGhpcyBtZXRob2QgbW9kaWZpZXMgdGhlIG91dHB1dCB2ZWN0b3IgaW4tcGxhY2UgZm9yIGJldHRlciBwZXJmb3JtYW5jZS5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEBwYXJhbSBvdXQgLSBUaGUgb3V0cHV0IHZlY3RvciB0byBzdG9yZSB0aGUgcmVzdWx0ICh3aWxsIGJlIG1vZGlmaWVkKVxuICAgKiBAcmV0dXJucyBUaGUgbW9kaWZpZWQgb3V0cHV0IHZlY3RvciB3aXRoIGNvbXBvbmVudC13aXNlIG11bHRpcGxpY2F0aW9uIHJlc3VsdFxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHlWZWN0b3JUbyhsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCwgb3V0OiBJTXV0YWJsZVZlY3RvcjQpIHtcbiAgICBvdXQuX3ZbMF0gPSBsX3ZlYy5fdlswXSAqIHJfdmVjLl92WzBdO1xuICAgIG91dC5fdlsxXSA9IGxfdmVjLl92WzFdICogcl92ZWMuX3ZbMV07XG4gICAgb3V0Ll92WzJdID0gbF92ZWMuX3ZbMl0gKiByX3ZlYy5fdlsyXTtcbiAgICBvdXQuX3ZbM10gPSBsX3ZlYy5fdlszXSAqIHJfdmVjLl92WzNdO1xuICAgIHJldHVybiBvdXQ7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyBhIHZlY3RvciBieSBhIHNjYWxhciB2YWx1ZSBhbmQgcmV0dXJucyBhIG5ldyB2ZWN0b3IuXG4gICAqIElmIHRoZSBkaXZpc29yIGlzIHplcm8sIHRoZSByZXN1bHQgY29tcG9uZW50cyB3aWxsIGJlIHNldCB0byAwIGFuZCBhbiBlcnJvciB3aWxsIGJlIGxvZ2dlZC5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gZGl2aWRlXG4gICAqIEBwYXJhbSB2YWx1ZSAtIFRoZSBzY2FsYXIgdmFsdWUgdG8gZGl2aWRlIGJ5XG4gICAqIEBwYXJhbSB0eXBlIC0gVGhlIHR5cGVkIGFycmF5IGNvbnN0cnVjdG9yIHRvIHVzZSBmb3IgaW50ZXJuYWwgc3RvcmFnZVxuICAgKiBAcmV0dXJucyBBIG5ldyB2ZWN0b3Igd2l0aCBlYWNoIGNvbXBvbmVudCBkaXZpZGVkIGJ5IHRoZSBzY2FsYXJcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIF9kaXZpZGUodmVjOiBJVmVjdG9yNCwgdmFsdWU6IG51bWJlciwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBsZXQgeDogbnVtYmVyO1xuICAgIGxldCB5OiBudW1iZXI7XG4gICAgbGV0IHo6IG51bWJlcjtcbiAgICBsZXQgdzogbnVtYmVyO1xuICAgIGlmICh2YWx1ZSAhPT0gMCkge1xuICAgICAgeCA9IHZlYy5fdlswXSAvIHZhbHVlO1xuICAgICAgeSA9IHZlYy5fdlsxXSAvIHZhbHVlO1xuICAgICAgeiA9IHZlYy5fdlsyXSAvIHZhbHVlO1xuICAgICAgdyA9IHZlYy5fdlszXSAvIHZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICBMb2dnZXIuZGVmYXVsdC5lcnJvcignMCBkaXZpc2lvbiBvY2N1cnJlZCEgVGhlIHJlc3VsdCBpcyBzZXQgdG8gemVyby4nKTtcbiAgICAgIHggPSAwO1xuICAgICAgeSA9IDA7XG4gICAgICB6ID0gMDtcbiAgICAgIHcgPSAwO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IHRoaXMobmV3IHR5cGUoW3gsIHksIHosIHddKSwgeyB0eXBlIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUgYW5kIHN0b3JlcyB0aGUgcmVzdWx0IGluIHRoZSBvdXRwdXQgdmVjdG9yLlxuICAgKiBJZiB0aGUgZGl2aXNvciBpcyB6ZXJvLCB0aGUgcmVzdWx0IGNvbXBvbmVudHMgd2lsbCBiZSBzZXQgdG8gMCBhbmQgYW4gZXJyb3Igd2lsbCBiZSBsb2dnZWQuXG4gICAqIFRoaXMgbWV0aG9kIG1vZGlmaWVzIHRoZSBvdXRwdXQgdmVjdG9yIGluLXBsYWNlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdCAod2lsbCBiZSBtb2RpZmllZClcbiAgICogQHJldHVybnMgVGhlIG1vZGlmaWVkIG91dHB1dCB2ZWN0b3Igd2l0aCBlYWNoIGNvbXBvbmVudCBkaXZpZGVkIGJ5IHRoZSBzY2FsYXJcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGRpdmlkZVRvKHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIsIG91dDogSU11dGFibGVWZWN0b3I0KSB7XG4gICAgaWYgKHZhbHVlICE9PSAwKSB7XG4gICAgICBvdXQuX3ZbMF0gPSB2ZWMuX3ZbMF0gLyB2YWx1ZTtcbiAgICAgIG91dC5fdlsxXSA9IHZlYy5fdlsxXSAvIHZhbHVlO1xuICAgICAgb3V0Ll92WzJdID0gdmVjLl92WzJdIC8gdmFsdWU7XG4gICAgICBvdXQuX3ZbM10gPSB2ZWMuX3ZbM10gLyB2YWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICBvdXQuX3ZbMF0gPSAwO1xuICAgICAgb3V0Ll92WzFdID0gMDtcbiAgICAgIG91dC5fdlsyXSA9IDA7XG4gICAgICBvdXQuX3ZbM10gPSAwO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgdGhlIGxlZnQgdmVjdG9yIGJ5IHRoZSByaWdodCB2ZWN0b3IgY29tcG9uZW50LXdpc2UgYW5kIHJldHVybnMgYSBuZXcgdmVjdG9yLlxuICAgKiBJZiBhbnkgY29tcG9uZW50IG9mIHRoZSByaWdodCB2ZWN0b3IgaXMgemVybywgdGhlIGNvcnJlc3BvbmRpbmcgcmVzdWx0IGNvbXBvbmVudCB3aWxsIGJlIHNldCB0byAwLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvciAoZGl2aWRlbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvciAoZGl2aXNvcilcbiAgICogQHBhcmFtIHR5cGUgLSBUaGUgdHlwZWQgYXJyYXkgY29uc3RydWN0b3IgdG8gdXNlIGZvciBpbnRlcm5hbCBzdG9yYWdlXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciB3aXRoIGNvbXBvbmVudC13aXNlIGRpdmlzaW9uIHJlc3VsdFxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgX2RpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCwgdHlwZTogRmxvYXRUeXBlZEFycmF5Q29uc3RydWN0b3IpIHtcbiAgICBsZXQgeDogbnVtYmVyO1xuICAgIGxldCB5OiBudW1iZXI7XG4gICAgbGV0IHo6IG51bWJlcjtcbiAgICBsZXQgdzogbnVtYmVyO1xuICAgIGlmIChyX3ZlYy5fdlswXSAhPT0gMCAmJiByX3ZlYy5fdlsxXSAhPT0gMCAmJiByX3ZlYy5fdlsyXSAhPT0gMCAmJiByX3ZlYy5fdlszXSAhPT0gMCkge1xuICAgICAgeCA9IGxfdmVjLl92WzBdIC8gcl92ZWMuX3ZbMF07XG4gICAgICB5ID0gbF92ZWMuX3ZbMV0gLyByX3ZlYy5fdlsxXTtcbiAgICAgIHogPSBsX3ZlYy5fdlsyXSAvIHJfdmVjLl92WzJdO1xuICAgICAgdyA9IGxfdmVjLl92WzNdIC8gcl92ZWMuX3ZbM107XG4gICAgfSBlbHNlIHtcbiAgICAgIExvZ2dlci5kZWZhdWx0LmVycm9yKCcwIGRpdmlzaW9uIG9jY3VycmVkISBUaGUgcmVzdWx0IGlzIHNldCB0byB6ZXJvLicpO1xuICAgICAgeCA9IHJfdmVjLl92WzBdID09PSAwID8gMCA6IGxfdmVjLl92WzBdIC8gcl92ZWMuX3ZbMF07XG4gICAgICB5ID0gcl92ZWMuX3ZbMV0gPT09IDAgPyAwIDogbF92ZWMuX3ZbMV0gLyByX3ZlYy5fdlsxXTtcbiAgICAgIHogPSByX3ZlYy5fdlsyXSA9PT0gMCA/IDAgOiBsX3ZlYy5fdlsyXSAvIHJfdmVjLl92WzJdO1xuICAgICAgdyA9IHJfdmVjLl92WzNdID09PSAwID8gMCA6IGxfdmVjLl92WzNdIC8gcl92ZWMuX3ZbM107XG4gICAgfVxuICAgIHJldHVybiBuZXcgdGhpcyhuZXcgdHlwZShbeCwgeSwgeiwgd10pLCB7IHR5cGUgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB0aGUgbGVmdCB2ZWN0b3IgYnkgdGhlIHJpZ2h0IHZlY3RvciBjb21wb25lbnQtd2lzZSBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gdGhlIG91dHB1dCB2ZWN0b3IuXG4gICAqIElmIGFueSBjb21wb25lbnQgb2YgdGhlIHJpZ2h0IHZlY3RvciBpcyB6ZXJvLCB0aGUgY29ycmVzcG9uZGluZyByZXN1bHQgY29tcG9uZW50IHdpbGwgYmUgc2V0IHRvIDAuXG4gICAqIFRoaXMgbWV0aG9kIG1vZGlmaWVzIHRoZSBvdXRwdXQgdmVjdG9yIGluLXBsYWNlIGZvciBiZXR0ZXIgcGVyZm9ybWFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yIChkaXZpZGVuZClcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yIChkaXZpc29yKVxuICAgKiBAcGFyYW0gb3V0IC0gVGhlIG91dHB1dCB2ZWN0b3IgdG8gc3RvcmUgdGhlIHJlc3VsdCAod2lsbCBiZSBtb2RpZmllZClcbiAgICogQHJldHVybnMgVGhlIG1vZGlmaWVkIG91dHB1dCB2ZWN0b3Igd2l0aCBjb21wb25lbnQtd2lzZSBkaXZpc2lvbiByZXN1bHRcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGRpdmlkZVZlY3RvclRvKGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0LCBvdXQ6IElNdXRhYmxlVmVjdG9yNCkge1xuICAgIGlmIChyX3ZlYy5fdlswXSAhPT0gMCAmJiByX3ZlYy5fdlsxXSAhPT0gMCAmJiByX3ZlYy5fdlsyXSAhPT0gMCAmJiByX3ZlYy5fdlszXSAhPT0gMCkge1xuICAgICAgb3V0Ll92WzBdID0gbF92ZWMuX3ZbMF0gLyByX3ZlYy5fdlswXTtcbiAgICAgIG91dC5fdlsxXSA9IGxfdmVjLl92WzFdIC8gcl92ZWMuX3ZbMV07XG4gICAgICBvdXQuX3ZbMl0gPSBsX3ZlYy5fdlsyXSAvIHJfdmVjLl92WzJdO1xuICAgICAgb3V0Ll92WzNdID0gbF92ZWMuX3ZbM10gLyByX3ZlYy5fdlszXTtcbiAgICB9IGVsc2Uge1xuICAgICAgTG9nZ2VyLmRlZmF1bHQuZXJyb3IoJzAgZGl2aXNpb24gb2NjdXJyZWQhIFRoZSByZXN1bHQgaXMgc2V0IHRvIHplcm8uJyk7XG4gICAgICBvdXQuX3ZbMF0gPSByX3ZlYy5fdlswXSA9PT0gMCA/IDAgOiBsX3ZlYy5fdlswXSAvIHJfdmVjLl92WzBdO1xuICAgICAgb3V0Ll92WzFdID0gcl92ZWMuX3ZbMV0gPT09IDAgPyAwIDogbF92ZWMuX3ZbMV0gLyByX3ZlYy5fdlsxXTtcbiAgICAgIG91dC5fdlsyXSA9IHJfdmVjLl92WzJdID09PSAwID8gMCA6IGxfdmVjLl92WzJdIC8gcl92ZWMuX3ZbMl07XG4gICAgICBvdXQuX3ZbM10gPSByX3ZlYy5fdlszXSA9PT0gMCA/IDAgOiBsX3ZlYy5fdlszXSAvIHJfdmVjLl92WzNdO1xuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IG9mIHR3byB2ZWN0b3JzLlxuICAgKiBUaGUgZG90IHByb2R1Y3QgaXMgdGhlIHN1bSBvZiB0aGUgcHJvZHVjdHMgb2YgY29ycmVzcG9uZGluZyBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHJldHVybnMgVGhlIGRvdCBwcm9kdWN0IG9mIHRoZSB0d28gdmVjdG9yc1xuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgZG90KGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIGxfdmVjLmRvdChyX3ZlYyk7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHZlY3RvciB0byBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBpbiB0aGUgZm9ybWF0IFwiKHgsIHksIHosIHcpXCIuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB2ZWN0b3JcbiAgICovXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiBgKCR7dGhpcy5fdlswXX0sICR7dGhpcy5fdlsxXX0sICR7dGhpcy5fdlsyXX0sICR7dGhpcy5fdlszXX0pYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb252ZXJ0cyB0aGUgdmVjdG9yIHRvIGFuIGFwcHJveGltYXRlbHkgZm9ybWF0dGVkIHN0cmluZyByZXByZXNlbnRhdGlvbiB3aXRoIGZpbmFuY2lhbCBwcmVjaXNpb24uXG4gICAqIEVhY2ggY29tcG9uZW50IGlzIGZvcm1hdHRlZCB0byBhIGZpeGVkIG51bWJlciBvZiBkZWNpbWFsIHBsYWNlcy5cbiAgICpcbiAgICogQHJldHVybnMgQSBzdHJpbmcgd2l0aCBzcGFjZS1zZXBhcmF0ZWQgY29tcG9uZW50cyBmb2xsb3dlZCBieSBhIG5ld2xpbmVcbiAgICovXG4gIHRvU3RyaW5nQXBwcm94aW1hdGVseSgpIHtcbiAgICByZXR1cm4gYCR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbMF0pfSAke01hdGhVdGlsLmZpbmFuY2lhbCh0aGlzLl92WzFdKX0gJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5fdlsyXSl9ICR7TWF0aFV0aWwuZmluYW5jaWFsKHRoaXMuX3ZbM10pfVxcbmA7XG4gIH1cblxuICAvKipcbiAgICogQ29udmVydHMgdGhlIHZlY3RvciB0byBhIGZsYXQgYXJyYXkgcmVwcmVzZW50YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIEFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIHZlY3RvciBjb21wb25lbnRzIFt4LCB5LCB6LCB3XVxuICAgKi9cbiAgZmxhdHRlbkFzQXJyYXkoKSB7XG4gICAgcmV0dXJuIFt0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdLCB0aGlzLl92WzNdXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgdGhpcyB2ZWN0b3IgaXMgYSBkdW1teSB2ZWN0b3IgKGhhcyBubyBjb21wb25lbnRzKS5cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmVjdG9yIGhhcyBubyBjb21wb25lbnRzLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGlzRHVtbXkoKSB7XG4gICAgaWYgKHRoaXMuX3YubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiB0aGlzIHZlY3RvciBpcyBhcHByb3hpbWF0ZWx5IGVxdWFsIHRvIGFub3RoZXIgdmVjdG9yIHdpdGhpbiBhIHNwZWNpZmllZCB0b2xlcmFuY2UuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGNvbXBhcmUgd2l0aFxuICAgKiBAcGFyYW0gZGVsdGEgLSBUaGUgdG9sZXJhbmNlIHZhbHVlIGZvciBjb21wYXJpc29uIChkZWZhdWx0OiBOdW1iZXIuRVBTSUxPTilcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGUgdmVjdG9ycyBhcmUgYXBwcm94aW1hdGVseSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc0VxdWFsKHZlYzogSVZlY3RvcjQsIGRlbHRhOiBudW1iZXIgPSBOdW1iZXIuRVBTSUxPTikge1xuICAgIGlmIChcbiAgICAgIE1hdGguYWJzKHZlYy5fdlswXSAtIHRoaXMuX3ZbMF0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKHZlYy5fdlsxXSAtIHRoaXMuX3ZbMV0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKHZlYy5fdlsyXSAtIHRoaXMuX3ZbMl0pIDwgZGVsdGEgJiZcbiAgICAgIE1hdGguYWJzKHZlYy5fdlszXSAtIHRoaXMuX3ZbM10pIDwgZGVsdGFcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoaXMgdmVjdG9yIGlzIHN0cmljdGx5IGVxdWFsIHRvIGFub3RoZXIgdmVjdG9yIChleGFjdCBjb21wb25lbnQgZXF1YWxpdHkpLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBjb21wYXJlIHdpdGhcbiAgICogQHJldHVybnMgVHJ1ZSBpZiBhbGwgY29tcG9uZW50cyBhcmUgZXhhY3RseSBlcXVhbCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBpc1N0cmljdEVxdWFsKHZlYzogSVZlY3RvcjQpOiBib29sZWFuIHtcbiAgICBpZiAodGhpcy5fdlswXSA9PT0gdmVjLl92WzBdICYmIHRoaXMuX3ZbMV0gPT09IHZlYy5fdlsxXSAmJiB0aGlzLl92WzJdID09PSB2ZWMuX3ZbMl0gJiYgdGhpcy5fdlszXSA9PT0gdmVjLl92WzNdKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNvbXBvbmVudCB2YWx1ZSBhdCB0aGUgc3BlY2lmaWVkIGluZGV4LlxuICAgKlxuICAgKiBAcGFyYW0gaSAtIFRoZSBpbmRleCAoMD14LCAxPXksIDI9eiwgMz13KVxuICAgKiBAcmV0dXJucyBUaGUgY29tcG9uZW50IHZhbHVlIGF0IHRoZSBzcGVjaWZpZWQgaW5kZXhcbiAgICovXG4gIGF0KGk6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLl92W2ldO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCAobWFnbml0dWRlKSBvZiB0aGUgdmVjdG9yIHVzaW5nIHRoZSBFdWNsaWRlYW4gbm9ybS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxlbmd0aCBvZiB0aGUgdmVjdG9yXG4gICAqL1xuICBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIE1hdGguaHlwb3QodGhpcy5fdlswXSwgdGhpcy5fdlsxXSwgdGhpcy5fdlsyXSwgdGhpcy5fdlszXSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBsZW5ndGggKG1hZ25pdHVkZSkgb2YgdGhlIHZlY3Rvci5cbiAgICogVGhpcyBpcyBtb3JlIGVmZmljaWVudCB0aGFuIGxlbmd0aCgpIHdoZW4gb25seSBjb21wYXJpbmcgbWFnbml0dWRlcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNxdWFyZWQgbGVuZ3RoIG9mIHRoZSB2ZWN0b3JcbiAgICovXG4gIGxlbmd0aFNxdWFyZWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5fdlswXSAqKiAyICsgdGhpcy5fdlsxXSAqKiAyICsgdGhpcy5fdlsyXSAqKiAyICsgdGhpcy5fdlszXSAqKiAyO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGRpc3RhbmNlIGZyb20gdGhpcyB2ZWN0b3IgdG8gYW5vdGhlciB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdGFyZ2V0IHZlY3RvciB0byBjYWxjdWxhdGUgZGlzdGFuY2UgdG9cbiAgICogQHJldHVybnMgVGhlIGRpc3RhbmNlIGJldHdlZW4gdGhlIHR3byB2ZWN0b3JzXG4gICAqL1xuICBsZW5ndGhUbyh2ZWM6IElWZWN0b3I0KSB7XG4gICAgY29uc3QgZGVsdGFYID0gdGhpcy5fdlswXSAtIHZlYy5fdlswXTtcbiAgICBjb25zdCBkZWx0YVkgPSB0aGlzLl92WzFdIC0gdmVjLl92WzFdO1xuICAgIGNvbnN0IGRlbHRhWiA9IHRoaXMuX3ZbMl0gLSB2ZWMuX3ZbMl07XG4gICAgY29uc3QgZGVsdGFXID0gdGhpcy5fdlszXSAtIHZlYy5fdlszXTtcbiAgICByZXR1cm4gTWF0aC5oeXBvdChkZWx0YVgsIGRlbHRhWSwgZGVsdGFaLCBkZWx0YVcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGRvdCBwcm9kdWN0IGJldHdlZW4gdGhpcyB2ZWN0b3IgYW5kIGFub3RoZXIgdmVjdG9yLlxuICAgKiBUaGUgZG90IHByb2R1Y3QgaXMgdGhlIHN1bSBvZiB0aGUgcHJvZHVjdHMgb2YgY29ycmVzcG9uZGluZyBjb21wb25lbnRzLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBjYWxjdWxhdGUgZG90IHByb2R1Y3Qgd2l0aFxuICAgKiBAcmV0dXJucyBUaGUgZG90IHByb2R1Y3Qgb2YgdGhlIHR3byB2ZWN0b3JzXG4gICAqL1xuICBkb3QodmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiB0aGlzLl92WzBdICogdmVjLl92WzBdICsgdGhpcy5fdlsxXSAqIHZlYy5fdlsxXSArIHRoaXMuX3ZbMl0gKiB2ZWMuX3ZbMl0gKyB0aGlzLl92WzNdICogdmVjLl92WzNdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGNsYXNzIG5hbWUgb2YgdGhpcyB2ZWN0b3IgdHlwZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHN0cmluZyBcIlZlY3RvcjRcIlxuICAgKi9cbiAgZ2V0IGNsYXNzTmFtZSgpIHtcbiAgICByZXR1cm4gJ1ZlY3RvcjQnO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkZWVwIGNvcHkgb2YgdGhpcyB2ZWN0b3IuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IHZlY3RvciBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIGNvbXBvbmVudCB2YWx1ZXNcbiAgICovXG4gIGNsb25lKCkge1xuICAgIHJldHVybiBuZXcgKHRoaXMuY29uc3RydWN0b3IgYXMgYW55KShcbiAgICAgIG5ldyAodGhpcy5fdi5jb25zdHJ1Y3RvciBhcyBhbnkpKFt0aGlzLl92WzBdLCB0aGlzLl92WzFdLCB0aGlzLl92WzJdLCB0aGlzLl92WzNdXSlcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG51bWJlciBvZiBieXRlcyBwZXIgY29tcG9uZW50IGluIHRoZSB1bmRlcmx5aW5nIHR5cGVkIGFycmF5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbnVtYmVyIG9mIGJ5dGVzIHBlciBlbGVtZW50ICg0IGZvciBGbG9hdDMyQXJyYXksIDggZm9yIEZsb2F0NjRBcnJheSlcbiAgICovXG4gIGdldCBieXRlc1BlckNvbXBvbmVudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fdi5CWVRFU19QRVJfRUxFTUVOVDtcbiAgfVxufVxuXG4vKipcbiAqIEltbXV0YWJsZSA0RCh4LHkseix3KSBWZWN0b3IgY2xhc3Mgd2l0aCAzMi1iaXQgZmxvYXQgY29tcG9uZW50cy5cbiAqXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGNvbXByZWhlbnNpdmUgdmVjdG9yIG9wZXJhdGlvbnMgZm9yIDQtZGltZW5zaW9uYWwgbWF0aGVtYXRpY3MsXG4gKiBjb21tb25seSB1c2VkIGluIGdyYXBoaWNzIHByb2dyYW1taW5nIGZvciByZXByZXNlbnRpbmcgcG9zaXRpb25zLCBkaXJlY3Rpb25zLFxuICogY29sb3JzIChSR0JBKSwgYW5kIGhvbW9nZW5lb3VzIGNvb3JkaW5hdGVzLlxuICpcbiAqIEFsbCBvcGVyYXRpb25zIHJldHVybiBuZXcgdmVjdG9yIGluc3RhbmNlcywgcHJlc2VydmluZyBpbW11dGFiaWxpdHkuXG4gKiBGb3IgcGVyZm9ybWFuY2UtY3JpdGljYWwgYXBwbGljYXRpb25zIHdoZXJlIG11dGF0aW9uIGlzIGFjY2VwdGFibGUsXG4gKiBjb25zaWRlciB1c2luZyB0aGUgY29ycmVzcG9uZGluZyBtdXRhYmxlIHZlY3RvciB0eXBlcyBvciB0aGUgKlRvIG1ldGhvZHMuXG4gKlxuICogQGV4YW1wbGUgQmFzaWMgdXNhZ2U6XG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCB2ZWMxID0gVmVjdG9yNC5mcm9tQ29weTQoMSwgMiwgMywgMSk7XG4gKiBjb25zdCB2ZWMyID0gVmVjdG9yNC5mcm9tQ29weUFycmF5NChbMiwgMywgMywgMV0pO1xuICogY29uc3QgZG90UHJvZHVjdCA9IHZlYzEuZG90KHZlYzIpO1xuICogY29uc3Qgc3VtID0gVmVjdG9yNC5hZGQodmVjMSwgdmVjMik7XG4gKiBgYGBcbiAqXG4gKiBAZXhhbXBsZSBDcmVhdGluZyB2ZWN0b3JzIGZyb20gZGlmZmVyZW50IHNvdXJjZXM6XG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBmcm9tQXJyYXkgPSBWZWN0b3I0LmZyb21Db3B5QXJyYXkoWzEsIDIsIDMsIDQsIDVdKTsgLy8gVGFrZXMgZmlyc3QgNCBlbGVtZW50c1xuICogY29uc3QgZnJvbVZlYzMgPSBWZWN0b3I0LmZyb21Db3B5VmVjdG9yMyhzb21lVmVjdG9yMyk7IC8vIFcgY29tcG9uZW50IHNldCB0byAxXG4gKiBjb25zdCB6ZXJvID0gVmVjdG9yNC56ZXJvKCk7XG4gKiBjb25zdCBub3JtYWxpemVkID0gVmVjdG9yNC5ub3JtYWxpemUoc29tZVZlY3Rvcik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGNsYXNzIFZlY3RvcjQgZXh0ZW5kcyBWZWN0b3I0XzxGbG9hdDMyQXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBWZWN0b3I0IGluc3RhbmNlIGZyb20gYSBGbG9hdDMyQXJyYXkuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIEZsb2F0MzJBcnJheSBjb250YWluaW5nIHZlY3RvciBjb21wb25lbnRzXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih4OiBGbG9hdDMyQXJyYXkpIHtcbiAgICBzdXBlcih4LCB7IHR5cGU6IEZsb2F0MzJBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjQgYnkgY29weWluZyB2YWx1ZXMgZnJvbSBhbiBhcnJheS5cbiAgICogVGFrZXMgdGhlIGZpcnN0IDQgZWxlbWVudHMgZnJvbSB0aGUgYXJyYXkuIElmIHRoZSBhcnJheSBoYXMgZmV3ZXIgdGhhbiA0IGVsZW1lbnRzLFxuICAgKiB0aGUgcmVtYWluaW5nIGNvbXBvbmVudHMgd2lsbCBiZSB1bmRlZmluZWQuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIEFycmF5IGNvbnRhaW5pbmcgbnVtZXJpYyB2YWx1ZXMgKGF0IGxlYXN0IDQgZWxlbWVudHMgcmVjb21tZW5kZWQpXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgaW5zdGFuY2Ugd2l0aCBjb3BpZWQgdmFsdWVzXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUFycmF5KGFycmF5OiBBcnJheTxudW1iZXI+KTogVmVjdG9yNCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5KGFycmF5LCBGbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVmVjdG9yNCBmcm9tIGEgNC1lbGVtZW50IGFycmF5IGJ5IGNvcHlpbmcgdGhlIHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIGFycmF5IC0gQXJyYXkgY29udGFpbmluZyBleGFjdGx5IDQgbnVtZXJpYyB2YWx1ZXMgW3gsIHksIHosIHddXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgaW5zdGFuY2Ugd2l0aCB0aGUgY29waWVkIHZhbHVlc1xuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTQoYXJyYXk6IEFycmF5NDxudW1iZXI+KTogVmVjdG9yNCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weUFycmF5NChhcnJheSwgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjQgZnJvbSBpbmRpdmlkdWFsIGNvbXBvbmVudCB2YWx1ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB4IC0gVGhlIFggY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB5IC0gVGhlIFkgY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB6IC0gVGhlIFogY29tcG9uZW50IHZhbHVlXG4gICAqIEBwYXJhbSB3IC0gVGhlIFcgY29tcG9uZW50IHZhbHVlXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgaW5zdGFuY2Ugd2l0aCB0aGUgc3BlY2lmaWVkIGNvbXBvbmVudCB2YWx1ZXNcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5NCh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB3OiBudW1iZXIpOiBWZWN0b3I0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5NCh4LCB5LCB6LCB3LCBGbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVmVjdG9yNCBmcm9tIGEgVmVjdG9yMywgc2V0dGluZyB0aGUgVyBjb21wb25lbnQgdG8gMS5cbiAgICogVGhpcyBpcyBjb21tb25seSB1c2VkIGZvciBjb252ZXJ0aW5nIDNEIHBvc2l0aW9ucyB0byBob21vZ2VuZW91cyBjb29yZGluYXRlcy5cbiAgICpcbiAgICogQHBhcmFtIHZlYzMgLSBUaGUgc291cmNlIFZlY3RvcjMgdG8gY29weSBmcm9tXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgd2l0aCAodmVjMy54LCB2ZWMzLnksIHZlYzMueiwgMS4wKVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlWZWN0b3IzKHZlYzM6IElWZWN0b3IzKTogVmVjdG9yNCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weVZlY3RvcjModmVjMywgRmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjQgYnkgY29weWluZyB2YWx1ZXMgZnJvbSBhbm90aGVyIFZlY3RvcjQuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWM0IC0gVGhlIHNvdXJjZSBWZWN0b3I0IHRvIGNvcHkgZnJvbVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0IGluc3RhbmNlIHdpdGggY29waWVkIHZhbHVlcyBmcm9tIHRoZSBzb3VyY2UgdmVjdG9yXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weVZlY3RvcjQodmVjNDogSVZlY3RvcjQpOiBWZWN0b3I0IHtcbiAgICByZXR1cm4gc3VwZXIuX2Zyb21Db3B5VmVjdG9yNCh2ZWM0LCBGbG9hdDMyQXJyYXkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVmVjdG9yNCBmcm9tIGFuIEFycmF5QnVmZmVyLlxuICAgKiBUaGUgQXJyYXlCdWZmZXIgc2hvdWxkIGNvbnRhaW4gYXQgbGVhc3QgMTYgYnl0ZXMgKDQgZmxvYXQzMiB2YWx1ZXMpLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXlCdWZmZXIgLSBUaGUgQXJyYXlCdWZmZXIgY29udGFpbmluZyB2ZWN0b3IgZGF0YVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0IGluc3RhbmNlIHVzaW5nIHRoZSBBcnJheUJ1ZmZlciBkYXRhXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBmcm9tQXJyYXlCdWZmZXIoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKTogVmVjdG9yNCB7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3I0KG5ldyBGbG9hdDMyQXJyYXkoYXJyYXlCdWZmZXIpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjQgZnJvbSBhIEZsb2F0MzJBcnJheS5cbiAgICogVGhlIEZsb2F0MzJBcnJheSBpcyB1c2VkIGRpcmVjdGx5IHdpdGhvdXQgY29weWluZy5cbiAgICpcbiAgICogQHBhcmFtIGZsb2F0MzJBcnJheSAtIFRoZSBGbG9hdDMyQXJyYXkgY29udGFpbmluZyB2ZWN0b3IgY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0IGluc3RhbmNlIHVzaW5nIHRoZSBwcm92aWRlZCBGbG9hdDMyQXJyYXlcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGZyb21GbG9hdDMyQXJyYXkoZmxvYXQzMkFycmF5OiBGbG9hdDMyQXJyYXkpOiBWZWN0b3I0IHtcbiAgICByZXR1cm4gbmV3IFZlY3RvcjQoZmxvYXQzMkFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjQgYnkgY29weWluZyBmcm9tIGEgRmxvYXQzMkFycmF5LlxuICAgKiBUaGlzIGNyZWF0ZXMgYSBuZXcgRmxvYXQzMkFycmF5IGNvcHkgb2YgdGhlIGlucHV0IGRhdGEuXG4gICAqXG4gICAqIEBwYXJhbSBmbG9hdDMyQXJyYXkgLSBUaGUgRmxvYXQzMkFycmF5IHRvIGNvcHkgZnJvbVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0IGluc3RhbmNlIHdpdGggY29waWVkIEZsb2F0MzJBcnJheSBkYXRhXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBmcm9tQ29weUZsb2F0MzJBcnJheShmbG9hdDMyQXJyYXk6IEZsb2F0MzJBcnJheSk6IFZlY3RvcjQge1xuICAgIHJldHVybiBuZXcgVmVjdG9yNChmbG9hdDMyQXJyYXkuc2xpY2UoMCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB6ZXJvIHZlY3RvciAoMCwgMCwgMCwgMCkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gemVyb1xuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgemVybygpIHtcbiAgICByZXR1cm4gc3VwZXIuX3plcm8oRmxvYXQzMkFycmF5KSBhcyBWZWN0b3I0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMSAoMSwgMSwgMSwgMSkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgb25lKCkge1xuICAgIHJldHVybiBzdXBlci5fb25lKEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZHVtbXkgdmVjdG9yIHdpdGggbm8gY29tcG9uZW50cyAoZW1wdHkgYXJyYXkpLlxuICAgKiBUaGlzIGlzIHVzZWQgYXMgYSBwbGFjZWhvbGRlciB3aGVuIGEgdmVjdG9yIGlzIG5lZWRlZCBidXQgbm90IHlldCBpbml0aWFsaXplZC5cbiAgICpcbiAgICogQHJldHVybnMgQSBuZXcgZHVtbXkgVmVjdG9yNCB3aXRoIGVtcHR5IGNvbXBvbmVudHNcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGR1bW15KCkge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQzMkFycmF5KSBhcyBWZWN0b3I0O1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBub3JtYWxpemVkIHZlcnNpb24gb2YgdGhlIGdpdmVuIHZlY3Rvci5cbiAgICogQSBub3JtYWxpemVkIHZlY3RvciBoYXMgYSBsZW5ndGggb2YgMSB3aGlsZSBtYWludGFpbmluZyBpdHMgZGlyZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBub3JtYWxpemVcbiAgICogQHJldHVybnMgQSBuZXcgbm9ybWFsaXplZCBWZWN0b3I0XG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBub3JtYWxpemUodmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fbm9ybWFsaXplKHZlYywgRmxvYXQzMkFycmF5KSBhcyBWZWN0b3I0O1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UgYW5kIHJldHVybnMgYSBuZXcgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNCBjb250YWluaW5nIHRoZSBzdW0gKGxfdmVjICsgcl92ZWMpXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBhZGQobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQpIHtcbiAgICByZXR1cm4gc3VwZXIuX2FkZChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTdWJ0cmFjdHMgdGhlIHJpZ2h0IHZlY3RvciBmcm9tIHRoZSBsZWZ0IHZlY3RvciBjb21wb25lbnQtd2lzZSBhbmQgcmV0dXJucyBhIG5ldyB2ZWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yIChtaW51ZW5kKVxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3IgKHN1YnRyYWhlbmQpXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZSAobF92ZWMgLSByX3ZlYylcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9zdWJ0cmFjdChsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlIGFuZCByZXR1cm5zIGEgbmV3IHZlY3Rvci5cbiAgICogVGhpcyBvcGVyYXRpb24gc2NhbGVzIHRoZSB2ZWN0b3Igd2hpbGUgcHJlc2VydmluZyBpdHMgZGlyZWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBtdWx0aXBseVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIG11bHRpcGx5IGJ5XG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgd2l0aCBlYWNoIGNvbXBvbmVudCBtdWx0aXBsaWVkIGJ5IHRoZSBzY2FsYXJcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5KHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX211bHRpcGx5KHZlYywgdmFsdWUsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlIGFuZCByZXR1cm5zIGEgbmV3IHZlY3Rvci5cbiAgICogVGhpcyBpcyBhbHNvIGtub3duIGFzIHRoZSBIYWRhbWFyZCBwcm9kdWN0IG9yIGVsZW1lbnQtd2lzZSBtdWx0aXBsaWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjQgd2l0aCBlYWNoIGNvbXBvbmVudCBiZWluZyB0aGUgcHJvZHVjdCBvZiBjb3JyZXNwb25kaW5nIGNvbXBvbmVudHNcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIG11bHRpcGx5VmVjdG9yKGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9tdWx0aXBseVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXZpZGVzIGEgdmVjdG9yIGJ5IGEgc2NhbGFyIHZhbHVlIGFuZCByZXR1cm5zIGEgbmV3IHZlY3Rvci5cbiAgICogSWYgdGhlIGRpdmlzb3IgaXMgemVybywgdGhlIHJlc3VsdCBjb21wb25lbnRzIHdpbGwgYmUgc2V0IHRvIDAgYW5kIGFuIGVycm9yIHdpbGwgYmUgbG9nZ2VkLlxuICAgKlxuICAgKiBAcGFyYW0gdmVjIC0gVGhlIHZlY3RvciB0byBkaXZpZGVcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBkaXZpZGUgYnlcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNCB3aXRoIGVhY2ggY29tcG9uZW50IGRpdmlkZWQgYnkgdGhlIHNjYWxhclxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgZGl2aWRlKHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZSh2ZWMsIHZhbHVlLCBGbG9hdDMyQXJyYXkpIGFzIFZlY3RvcjQ7XG4gIH1cblxuICAvKipcbiAgICogRGl2aWRlcyB0aGUgbGVmdCB2ZWN0b3IgYnkgdGhlIHJpZ2h0IHZlY3RvciBjb21wb25lbnQtd2lzZSBhbmQgcmV0dXJucyBhIG5ldyB2ZWN0b3IuXG4gICAqIElmIGFueSBjb21wb25lbnQgb2YgdGhlIHJpZ2h0IHZlY3RvciBpcyB6ZXJvLCB0aGUgY29ycmVzcG9uZGluZyByZXN1bHQgY29tcG9uZW50IHdpbGwgYmUgc2V0IHRvIDAuXG4gICAqXG4gICAqIEBwYXJhbSBsX3ZlYyAtIFRoZSBsZWZ0IG9wZXJhbmQgdmVjdG9yIChkaXZpZGVuZClcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yIChkaXZpc29yKVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0IHdpdGggY29tcG9uZW50LXdpc2UgZGl2aXNpb24gcmVzdWx0XG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBkaXZpZGVWZWN0b3IobF92ZWM6IElWZWN0b3I0LCByX3ZlYzogSVZlY3RvcjQpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZVZlY3RvcihsX3ZlYywgcl92ZWMsIEZsb2F0MzJBcnJheSkgYXMgVmVjdG9yNDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0IGluc3RhbmNlIHdpdGggdGhlIHNhbWUgY29tcG9uZW50IHZhbHVlc1xuICAgKi9cbiAgY2xvbmUoKSB7XG4gICAgcmV0dXJuIHN1cGVyLmNsb25lKCkgYXMgVmVjdG9yNDtcbiAgfVxufVxuXG4vKipcbiAqIEltbXV0YWJsZSA0RCh4LHkseix3KSBWZWN0b3IgY2xhc3Mgd2l0aCA2NC1iaXQgZmxvYXQgY29tcG9uZW50cy5cbiAqXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIHRoZSBzYW1lIGZ1bmN0aW9uYWxpdHkgYXMgVmVjdG9yNCBidXQgd2l0aCBkb3VibGUgcHJlY2lzaW9uXG4gKiBmbG9hdGluZy1wb2ludCBjb21wb25lbnRzLiBVc2UgdGhpcyB3aGVuIGhpZ2hlciBwcmVjaXNpb24gaXMgcmVxdWlyZWQgZm9yXG4gKiBtYXRoZW1hdGljYWwgY2FsY3VsYXRpb25zIG9yIHdoZW4gd29ya2luZyB3aXRoIHZlcnkgbGFyZ2Ugb3IgdmVyeSBzbWFsbCBudW1iZXJzLlxuICpcbiAqIEBleGFtcGxlIEJhc2ljIHVzYWdlOlxuICogYGBgdHlwZXNjcmlwdFxuICogY29uc3QgdmVjMSA9IFZlY3RvcjRELmZyb21Db3B5NCgxLjAsIDIuMCwgMy4wLCAxLjApO1xuICogY29uc3QgdmVjMiA9IFZlY3RvcjRELmZyb21Db3B5QXJyYXk0KFsyLjAsIDMuMCwgMy4wLCAxLjBdKTtcbiAqIGNvbnN0IGRvdFByb2R1Y3QgPSB2ZWMxLmRvdCh2ZWMyKTtcbiAqIGNvbnN0IHN1bSA9IFZlY3RvcjRELmFkZCh2ZWMxLCB2ZWMyKTtcbiAqIGBgYFxuICovXG5leHBvcnQgY2xhc3MgVmVjdG9yNEQgZXh0ZW5kcyBWZWN0b3I0XzxGbG9hdDY0QXJyYXlDb25zdHJ1Y3Rvcj4ge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBWZWN0b3I0RCBpbnN0YW5jZSBmcm9tIGEgRmxvYXQ2NEFycmF5LlxuICAgKlxuICAgKiBAcGFyYW0geCAtIFRoZSBGbG9hdDY0QXJyYXkgY29udGFpbmluZyB2ZWN0b3IgY29tcG9uZW50c1xuICAgKiBAcHJpdmF0ZSBUaGlzIGNvbnN0cnVjdG9yIGlzIHByaXZhdGUgdG8gcHJldmVudCBkaXJlY3QgaW5zdGFudGlhdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3Rvcih4OiBGbG9hdDY0QXJyYXkpIHtcbiAgICBzdXBlcih4LCB7IHR5cGU6IEZsb2F0NjRBcnJheSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjREIGZyb20gYSA0LWVsZW1lbnQgYXJyYXkgYnkgY29weWluZyB0aGUgdmFsdWVzLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBcnJheSBjb250YWluaW5nIGV4YWN0bHkgNCBudW1lcmljIHZhbHVlcyBbeCwgeSwgeiwgd11cbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNEQgaW5zdGFuY2Ugd2l0aCB0aGUgY29waWVkIHZhbHVlc1xuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgZnJvbUNvcHlBcnJheTQoYXJyYXk6IEFycmF5NDxudW1iZXI+KTogVmVjdG9yNEQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheTQoYXJyYXksIEZsb2F0NjRBcnJheSkgYXMgVmVjdG9yNEQ7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBWZWN0b3I0RCBmcm9tIGluZGl2aWR1YWwgY29tcG9uZW50IHZhbHVlcy5cbiAgICpcbiAgICogQHBhcmFtIHggLSBUaGUgWCBjb21wb25lbnQgdmFsdWVcbiAgICogQHBhcmFtIHkgLSBUaGUgWSBjb21wb25lbnQgdmFsdWVcbiAgICogQHBhcmFtIHogLSBUaGUgWiBjb21wb25lbnQgdmFsdWVcbiAgICogQHBhcmFtIHcgLSBUaGUgVyBjb21wb25lbnQgdmFsdWVcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNEQgaW5zdGFuY2Ugd2l0aCB0aGUgc3BlY2lmaWVkIGNvbXBvbmVudCB2YWx1ZXNcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5NCh4OiBudW1iZXIsIHk6IG51bWJlciwgejogbnVtYmVyLCB3OiBudW1iZXIpOiBWZWN0b3I0RCB7XG4gICAgcmV0dXJuIHN1cGVyLl9mcm9tQ29weTQoeCwgeSwgeiwgdywgRmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjREIGJ5IGNvcHlpbmcgdmFsdWVzIGZyb20gYW4gYXJyYXkuXG4gICAqIFRha2VzIHRoZSBmaXJzdCA0IGVsZW1lbnRzIGZyb20gdGhlIGFycmF5LiBJZiB0aGUgYXJyYXkgaGFzIGZld2VyIHRoYW4gNCBlbGVtZW50cyxcbiAgICogdGhlIHJlbWFpbmluZyBjb21wb25lbnRzIHdpbGwgYmUgdW5kZWZpbmVkLlxuICAgKlxuICAgKiBAcGFyYW0gYXJyYXkgLSBBcnJheSBjb250YWluaW5nIG51bWVyaWMgdmFsdWVzIChhdCBsZWFzdCA0IGVsZW1lbnRzIHJlY29tbWVuZGVkKVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0RCBpbnN0YW5jZSB3aXRoIGNvcGllZCB2YWx1ZXNcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGZyb21Db3B5QXJyYXkoYXJyYXk6IEFycmF5NDxudW1iZXI+KTogVmVjdG9yNEQge1xuICAgIHJldHVybiBzdXBlci5fZnJvbUNvcHlBcnJheShhcnJheSwgRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3I0RDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbmV3IFZlY3RvcjREIGZyb20gYW4gQXJyYXlCdWZmZXIuXG4gICAqIFRoZSBBcnJheUJ1ZmZlciBzaG91bGQgY29udGFpbiBhdCBsZWFzdCAzMiBieXRlcyAoNCBmbG9hdDY0IHZhbHVlcykuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheUJ1ZmZlciAtIFRoZSBBcnJheUJ1ZmZlciBjb250YWluaW5nIHZlY3RvciBkYXRhXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjREIGluc3RhbmNlIHVzaW5nIHRoZSBBcnJheUJ1ZmZlciBkYXRhXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBmcm9tQXJyYXlCdWZmZXIoYXJyYXlCdWZmZXI6IEFycmF5QnVmZmVyKTogVmVjdG9yNEQge1xuICAgIHJldHVybiBuZXcgVmVjdG9yNEQobmV3IEZsb2F0NjRBcnJheShhcnJheUJ1ZmZlcikpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgVmVjdG9yNEQgZnJvbSBhIEZsb2F0NjRBcnJheS5cbiAgICogVGhlIEZsb2F0NjRBcnJheSBpcyB1c2VkIGRpcmVjdGx5IHdpdGhvdXQgY29weWluZy5cbiAgICpcbiAgICogQHBhcmFtIGZsb2F0NjRBcnJheSAtIFRoZSBGbG9hdDY0QXJyYXkgY29udGFpbmluZyB2ZWN0b3IgY29tcG9uZW50c1xuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0RCBpbnN0YW5jZSB1c2luZyB0aGUgcHJvdmlkZWQgRmxvYXQ2NEFycmF5XG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBmcm9tRmxvYXQ2NEFycmF5KGZsb2F0NjRBcnJheTogRmxvYXQ2NEFycmF5KTogVmVjdG9yNEQge1xuICAgIHJldHVybiBuZXcgVmVjdG9yNEQoZmxvYXQ2NEFycmF5KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgemVybyB2ZWN0b3IgKDAsIDAsIDAsIDApLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0RCB3aXRoIGFsbCBjb21wb25lbnRzIHNldCB0byB6ZXJvXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyB6ZXJvKCkge1xuICAgIHJldHVybiBzdXBlci5femVybyhGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSB2ZWN0b3Igd2l0aCBhbGwgY29tcG9uZW50cyBzZXQgdG8gMSAoMSwgMSwgMSwgMSkuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjREIHdpdGggYWxsIGNvbXBvbmVudHMgc2V0IHRvIDFcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIG9uZSgpIHtcbiAgICByZXR1cm4gc3VwZXIuX29uZShGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBkdW1teSB2ZWN0b3Igd2l0aCBubyBjb21wb25lbnRzIChlbXB0eSBhcnJheSkuXG4gICAqIFRoaXMgaXMgdXNlZCBhcyBhIHBsYWNlaG9sZGVyIHdoZW4gYSB2ZWN0b3IgaXMgbmVlZGVkIGJ1dCBub3QgeWV0IGluaXRpYWxpemVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBkdW1teSBWZWN0b3I0RCB3aXRoIGVtcHR5IGNvbXBvbmVudHNcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGR1bW15KCkge1xuICAgIHJldHVybiBzdXBlci5fZHVtbXkoRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3I0RDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgbm9ybWFsaXplZCB2ZXJzaW9uIG9mIHRoZSBnaXZlbiB2ZWN0b3IuXG4gICAqIEEgbm9ybWFsaXplZCB2ZWN0b3IgaGFzIGEgbGVuZ3RoIG9mIDEgd2hpbGUgbWFpbnRhaW5pbmcgaXRzIGRpcmVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gICAqIEByZXR1cm5zIEEgbmV3IG5vcm1hbGl6ZWQgVmVjdG9yNERcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIG5vcm1hbGl6ZSh2ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9ub3JtYWxpemUodmVjLCBGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIEFkZHMgdHdvIHZlY3RvcnMgY29tcG9uZW50LXdpc2UgYW5kIHJldHVybnMgYSBuZXcgdmVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvclxuICAgKiBAcGFyYW0gcl92ZWMgLSBUaGUgcmlnaHQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNEQgY29udGFpbmluZyB0aGUgc3VtIChsX3ZlYyArIHJfdmVjKVxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgYWRkKGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9hZGQobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1YnRyYWN0cyB0aGUgcmlnaHQgdmVjdG9yIGZyb20gdGhlIGxlZnQgdmVjdG9yIGNvbXBvbmVudC13aXNlIGFuZCByZXR1cm5zIGEgbmV3IHZlY3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3IgKG1pbnVlbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvciAoc3VidHJhaGVuZClcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNEQgY29udGFpbmluZyB0aGUgZGlmZmVyZW5jZSAobF92ZWMgLSByX3ZlYylcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIHN1YnRyYWN0KGxfdmVjOiBJVmVjdG9yNCwgcl92ZWM6IElWZWN0b3I0KSB7XG4gICAgcmV0dXJuIHN1cGVyLl9zdWJ0cmFjdChsX3ZlYywgcl92ZWMsIEZsb2F0NjRBcnJheSkgYXMgVmVjdG9yNEQ7XG4gIH1cblxuICAvKipcbiAgICogTXVsdGlwbGllcyBhIHZlY3RvciBieSBhIHNjYWxhciB2YWx1ZSBhbmQgcmV0dXJucyBhIG5ldyB2ZWN0b3IuXG4gICAqIFRoaXMgb3BlcmF0aW9uIHNjYWxlcyB0aGUgdmVjdG9yIHdoaWxlIHByZXNlcnZpbmcgaXRzIGRpcmVjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlYyAtIFRoZSB2ZWN0b3IgdG8gbXVsdGlwbHlcbiAgICogQHBhcmFtIHZhbHVlIC0gVGhlIHNjYWxhciB2YWx1ZSB0byBtdWx0aXBseSBieVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0RCB3aXRoIGVhY2ggY29tcG9uZW50IG11bHRpcGxpZWQgYnkgdGhlIHNjYWxhclxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgbXVsdGlwbHkodmVjOiBJVmVjdG9yNCwgdmFsdWU6IG51bWJlcikge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHkodmVjLCB2YWx1ZSwgRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3I0RDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNdWx0aXBsaWVzIHR3byB2ZWN0b3JzIGNvbXBvbmVudC13aXNlIGFuZCByZXR1cm5zIGEgbmV3IHZlY3Rvci5cbiAgICogVGhpcyBpcyBhbHNvIGtub3duIGFzIHRoZSBIYWRhbWFyZCBwcm9kdWN0IG9yIGVsZW1lbnQtd2lzZSBtdWx0aXBsaWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGxfdmVjIC0gVGhlIGxlZnQgb3BlcmFuZCB2ZWN0b3JcbiAgICogQHBhcmFtIHJfdmVjIC0gVGhlIHJpZ2h0IG9wZXJhbmQgdmVjdG9yXG4gICAqIEByZXR1cm5zIEEgbmV3IFZlY3RvcjREIHdpdGggZWFjaCBjb21wb25lbnQgYmVpbmcgdGhlIHByb2R1Y3Qgb2YgY29ycmVzcG9uZGluZyBjb21wb25lbnRzXG4gICAqIEBzdGF0aWNcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseVZlY3RvcihsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fbXVsdGlwbHlWZWN0b3IobF92ZWMsIHJfdmVjLCBGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgYSB2ZWN0b3IgYnkgYSBzY2FsYXIgdmFsdWUgYW5kIHJldHVybnMgYSBuZXcgdmVjdG9yLlxuICAgKiBJZiB0aGUgZGl2aXNvciBpcyB6ZXJvLCB0aGUgcmVzdWx0IGNvbXBvbmVudHMgd2lsbCBiZSBzZXQgdG8gMCBhbmQgYW4gZXJyb3Igd2lsbCBiZSBsb2dnZWQuXG4gICAqXG4gICAqIEBwYXJhbSB2ZWMgLSBUaGUgdmVjdG9yIHRvIGRpdmlkZVxuICAgKiBAcGFyYW0gdmFsdWUgLSBUaGUgc2NhbGFyIHZhbHVlIHRvIGRpdmlkZSBieVxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0RCB3aXRoIGVhY2ggY29tcG9uZW50IGRpdmlkZWQgYnkgdGhlIHNjYWxhclxuICAgKiBAc3RhdGljXG4gICAqL1xuICBzdGF0aWMgZGl2aWRlKHZlYzogSVZlY3RvcjQsIHZhbHVlOiBudW1iZXIpIHtcbiAgICByZXR1cm4gc3VwZXIuX2RpdmlkZSh2ZWMsIHZhbHVlLCBGbG9hdDY0QXJyYXkpIGFzIFZlY3RvcjREO1xuICB9XG5cbiAgLyoqXG4gICAqIERpdmlkZXMgdGhlIGxlZnQgdmVjdG9yIGJ5IHRoZSByaWdodCB2ZWN0b3IgY29tcG9uZW50LXdpc2UgYW5kIHJldHVybnMgYSBuZXcgdmVjdG9yLlxuICAgKiBJZiBhbnkgY29tcG9uZW50IG9mIHRoZSByaWdodCB2ZWN0b3IgaXMgemVybywgdGhlIGNvcnJlc3BvbmRpbmcgcmVzdWx0IGNvbXBvbmVudCB3aWxsIGJlIHNldCB0byAwLlxuICAgKlxuICAgKiBAcGFyYW0gbF92ZWMgLSBUaGUgbGVmdCBvcGVyYW5kIHZlY3RvciAoZGl2aWRlbmQpXG4gICAqIEBwYXJhbSByX3ZlYyAtIFRoZSByaWdodCBvcGVyYW5kIHZlY3RvciAoZGl2aXNvcilcbiAgICogQHJldHVybnMgQSBuZXcgVmVjdG9yNEQgd2l0aCBjb21wb25lbnQtd2lzZSBkaXZpc2lvbiByZXN1bHRcbiAgICogQHN0YXRpY1xuICAgKi9cbiAgc3RhdGljIGRpdmlkZVZlY3RvcihsX3ZlYzogSVZlY3RvcjQsIHJfdmVjOiBJVmVjdG9yNCkge1xuICAgIHJldHVybiBzdXBlci5fZGl2aWRlVmVjdG9yKGxfdmVjLCByX3ZlYywgRmxvYXQ2NEFycmF5KSBhcyBWZWN0b3I0RDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgdmVjdG9yLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIG5ldyBWZWN0b3I0RCBpbnN0YW5jZSB3aXRoIHRoZSBzYW1lIGNvbXBvbmVudCB2YWx1ZXNcbiAgICovXG4gIGNsb25lKCkge1xuICAgIHJldHVybiBzdXBlci5jbG9uZSgpIGFzIFZlY3RvcjREO1xuICB9XG59XG5cbi8qKlxuICogQ29uc3RhbnQgVmVjdG9yNCB3aXRoIGFsbCBjb21wb25lbnRzIHNldCB0byAxICgxLCAxLCAxLCAxKS5cbiAqIFVzZWZ1bCBmb3IgaW5pdGlhbGl6YXRpb24gYW5kIG1hdGhlbWF0aWNhbCBvcGVyYXRpb25zLlxuICovXG5leHBvcnQgY29uc3QgQ29uc3RWZWN0b3I0XzFfMV8xXzEgPSBWZWN0b3I0LmZyb21Db3B5NCgxLCAxLCAxLCAxKTtcblxuLyoqXG4gKiBDb25zdGFudCBWZWN0b3I0IHJlcHJlc2VudGluZyBhIGhvbW9nZW5lb3VzIGNvb3JkaW5hdGUgd2l0aCBXPTEgKDAsIDAsIDAsIDEpLlxuICogQ29tbW9ubHkgdXNlZCBmb3IgcmVwcmVzZW50aW5nIHBvc2l0aW9ucyBpbiBob21vZ2VuZW91cyBjb29yZGluYXRlcy5cbiAqL1xuZXhwb3J0IGNvbnN0IENvbnN0VmVjdG9yNF8wXzBfMF8xID0gVmVjdG9yNC5mcm9tQ29weTQoMCwgMCwgMCwgMSk7XG5cbi8qKlxuICogQ29uc3RhbnQgVmVjdG9yNCB3aXRoIGFsbCBjb21wb25lbnRzIHNldCB0byAwICgwLCAwLCAwLCAwKS5cbiAqIFJlcHJlc2VudHMgdGhlIHplcm8gdmVjdG9yIG9yIG51bGwgdmVjdG9yLlxuICovXG5leHBvcnQgY29uc3QgQ29uc3RWZWN0b3I0XzBfMF8wXzAgPSBWZWN0b3I0LmZyb21Db3B5NCgwLCAwLCAwLCAwKTtcblxuLyoqXG4gKiBBbGlhcyBmb3IgdGhlIDMyLWJpdCAoRmxvYXQzMkFycmF5KSBpbXBsZW1lbnRhdGlvbiwgbWFraW5nIHRoZSBwcmVjaXNpb24gZXhwbGljaXQuXG4gKi9cbmV4cG9ydCB7IFZlY3RvcjQgYXMgVmVjdG9yNEYgfTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGNBQWM7QUFDdkIsU0FBUyxzQkFBc0I7QUFFL0IsU0FBUyxnQkFBZ0I7QUFTbEIsSUFBTSxXQUFOLGNBQTZELGVBQW1DO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVEzRixZQUFZLEdBQW9CLFVBQXVCO0FBQy9ELFVBQU07QUFDTixTQUFLLEtBQUs7QUFBQSxFQUNaO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxJQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxJQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxJQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxJQUFZO0FBQ2QsV0FBTyxLQUFLLEdBQUcsQ0FBQztBQUFBLEVBQ2xCO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsSUFBSSxpQkFBaUI7QUFDbkIsV0FBTyxRQUFRLFNBQVM7QUFBQSxNQUN0QixLQUFLLEdBQUcsQ0FBQztBQUFBLElBQ1gsQ0FBQyxLQUFLLFNBQVMsMkJBQTJCLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FB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
