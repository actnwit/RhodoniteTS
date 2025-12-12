import type { TypedArray } from '../../types/CommonTypes';
import type { IQuaternion } from './IQuaternion';

/**
 * Base interface for immutable vector types.
 * Provides common read-only operations for vector mathematics.
 */
export interface IVector {
  /** The x component of the vector */
  readonly x: number;
  /** The underlying typed array containing vector components */
  readonly _v: TypedArray;
  /** The class name identifier */
  readonly className: string;
  /** Number of bytes per component in the underlying array */
  readonly bytesPerComponent: number;
  /** GLSL string representation for float type */
  readonly glslStrAsFloat: string;
  /** GLSL string representation for integer type */
  readonly glslStrAsInt: string;
  /** GLSL string representation for unsigned integer type */
  readonly glslStrAsUint: string;
  /** WGSL string representation for float type */
  readonly wgslStrAsFloat: string;
  /** WGSL string representation for integer type */
  readonly wgslStrAsInt: string;
  /** WGSL string representation for unsigned integer type */
  readonly wgslStrAsUint: string;

  /**
   * Returns a string representation of the vector.
   * @returns String representation of the vector
   */
  toString(): string;

  /**
   * Returns an approximate string representation of the vector with rounded values.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the vector to a flat array of numbers.
   * @returns Array containing all vector components
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy/placeholder vector.
   * @returns True if this is a dummy vector
   */
  isDummy(): boolean;

  /**
   * Checks if this vector is equal to another vector within a tolerance.
   * @param vec - The vector to compare with
   * @param delta - Optional tolerance value (default: small epsilon)
   * @returns True if vectors are approximately equal
   */
  isEqual(vec: IVector, delta?: number): boolean;

  /**
   * Checks if this vector is strictly equal to another vector.
   * @param vec - The vector to compare with
   * @returns True if vectors are exactly equal
   */
  isStrictEqual(vec: IVector): boolean;

  /**
   * Gets the component value at the specified index.
   * @param i - The component index
   * @returns The component value
   */
  at(i: number): number;

  /**
   * Gets the component value at the specified index (alias for at).
   * @param i - The component index
   * @returns The component value
   */
  v(i: number): number;

  /**
   * Calculates the length (magnitude) of the vector.
   * @returns The vector length
   */
  length(): number;

  /**
   * Calculates the squared length of the vector (faster than length).
   * @returns The squared vector length
   */
  lengthSquared(): number;

  /**
   * Calculates the distance to another vector.
   * @param vec - The target vector
   * @returns The distance between vectors
   */
  lengthTo(vec: IVector): number;

  /**
   * Calculates the dot product with another vector.
   * @param vec - The other vector
   * @returns The dot product result
   */
  dot(vec: IVector): number;

  /**
   * Checks if this vector shares the same source array buffer.
   * @param arrayBuffer - The array buffer to check
   * @returns True if using the same source buffer
   */
  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}

/**
 * Base interface for mutable vector types.
 * Extends IVector with mutation operations that modify the vector in-place.
 */
export interface IMutableVector extends IVector {
  /** The underlying typed array containing vector components (mutable) */
  _v: TypedArray;
  /** The class name identifier */
  readonly className: string;

  /**
   * Gets the raw underlying typed array.
   * @returns The raw typed array
   */
  raw(): TypedArray;

  /**
   * Sets the component value at the specified index.
   * @param i - The component index
   * @param value - The new value
   * @returns This vector for method chaining
   */
  setAt(i: number, value: number): IMutableVector;

  /**
   * Sets all components of the vector.
   * @param num - The component values
   * @returns This vector for method chaining
   */
  setComponents(...num: number[]): IMutableVector;

  /**
   * Copies components from another vector.
   * @param vec - The source vector
   * @returns This vector for method chaining
   */
  copyComponents(vec: any): IMutableVector;

  /**
   * Sets all components to zero.
   * @returns This vector for method chaining
   */
  zero(): IMutableVector;

  /**
   * Sets all components to one.
   * @returns This vector for method chaining
   */
  one(): IMutableVector;

  /**
   * Normalizes the vector to unit length.
   * @returns This vector for method chaining
   */
  normalize(): IMutableVector;

  /**
   * Adds another vector to this vector.
   * @param vec - The vector to add
   * @returns This vector for method chaining
   */
  add(vec: any): IMutableVector;

  /**
   * Subtracts another vector from this vector.
   * @param vec - The vector to subtract
   * @returns This vector for method chaining
   */
  subtract(vec: any): IMutableVector;

  /**
   * Multiplies this vector by a scalar value.
   * @param value - The scalar multiplier
   * @returns This vector for method chaining
   */
  multiply(value: number): IMutableVector;

  /**
   * Multiplies this vector component-wise by another vector.
   * @param vec - The vector to multiply by
   * @returns This vector for method chaining
   */
  multiplyVector(vec: any): IMutableVector;

  /**
   * Divides this vector by a scalar value.
   * @param value - The scalar divisor
   * @returns This vector for method chaining
   */
  divide(value: number): IMutableVector;

  /**
   * Divides this vector component-wise by another vector.
   * @param vec - The vector to divide by
   * @returns This vector for method chaining
   */
  divideVector(vec: any): IMutableVector;
}

/**
 * Interface for scalar values (1-component vectors).
 */
export interface IScalar extends IVector {
  /** The underlying typed array */
  _v: TypedArray;
  /** The scalar value (x component) */
  readonly x: number;
}

/**
 * Interface for mutable scalar values.
 */
export interface IMutableScalar extends IMutableVector {
  /** The scalar value (x component) */
  readonly x: number;
}

/**
 * Interface for immutable 2D vectors.
 * Provides operations specific to 2-component vectors.
 */
export interface IVector2 extends IVector {
  /** The class name identifier */
  readonly className: string;

  /** The x component */
  readonly x: number;
  /** The y component */
  readonly y: number;

  /**
   * Returns a string representation of the vector.
   * @returns String representation
   */
  toString(): string;

  /**
   * Returns an approximate string representation with rounded values.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the vector to a flat array.
   * @returns Array containing [x, y]
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy vector.
   * @returns True if dummy
   */
  isDummy(): boolean;

  /**
   * Checks equality with another Vector2 within tolerance.
   * @param vec - Vector to compare with
   * @param delta - Optional tolerance
   * @returns True if approximately equal
   */
  isEqual(vec: IVector2, delta?: number): boolean;

  /**
   * Checks strict equality with another Vector2.
   * @param vec - Vector to compare with
   * @returns True if exactly equal
   */
  isStrictEqual(vec: IVector2): boolean;

  /**
   * Gets component at index.
   * @param i - Component index (0=x, 1=y)
   * @returns Component value
   */
  at(i: number): number;

  /**
   * Calculates vector length.
   * @returns Vector magnitude
   */
  length(): number;

  /**
   * Calculates squared length.
   * @returns Squared magnitude
   */
  lengthSquared(): number;

  /**
   * Calculates distance to another Vector2.
   * @param vec - Target vector
   * @returns Distance
   */
  lengthTo(vec: IVector2): number;

  /**
   * Calculates dot product with another Vector2.
   * @param vec - Other vector
   * @returns Dot product
   */
  dot(vec: IVector2): number;

  /**
   * Creates a copy of this vector.
   * @returns New Vector2 instance
   */
  clone(): IVector2;
}

/**
 * Interface for mutable 2D vectors.
 * Provides in-place operations for 2-component vectors.
 */
export interface IMutableVector2 extends IMutableVector {
  /** The class name identifier */
  readonly className: string;

  /** The x component (mutable) */
  x: number;
  /** The y component (mutable) */
  y: number;

  // common with immutable vector2
  /**
   * Returns a string representation of the vector.
   * @returns String representation
   */
  toString(): string;

  /**
   * Returns an approximate string representation with rounded values.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the vector to a flat array.
   * @returns Array containing [x, y]
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy vector.
   * @returns True if dummy
   */
  isDummy(): boolean;

  /**
   * Checks equality with another Vector2 within tolerance.
   * @param vec - Vector to compare with
   * @param delta - Optional tolerance
   * @returns True if approximately equal
   */
  isEqual(vec: IVector2, delta?: number): boolean;

  /**
   * Checks strict equality with another Vector2.
   * @param vec - Vector to compare with
   * @returns True if exactly equal
   */
  isStrictEqual(vec: IVector2): boolean;

  /**
   * Gets component at index.
   * @param i - Component index (0=x, 1=y)
   * @returns Component value
   */
  at(i: number): number;

  /**
   * Calculates vector length.
   * @returns Vector magnitude
   */
  length(): number;

  /**
   * Calculates squared length.
   * @returns Squared magnitude
   */
  lengthSquared(): number;

  /**
   * Calculates distance to another Vector2.
   * @param vec - Target vector
   * @returns Distance
   */
  lengthTo(vec: IVector2): number;

  /**
   * Calculates dot product with another Vector2.
   * @param vec - Other vector
   * @returns Dot product
   */
  dot(vec: IVector2): number;

  /**
   * Creates a copy of this vector.
   * @returns New mutable Vector2 instance
   */
  clone(): IMutableVector2;

  // only for mutable vector2
  /**
   * Gets the raw underlying typed array.
   * @returns The raw typed array
   */
  raw(): TypedArray;

  /**
   * Sets component at index.
   * @param i - Component index (0=x, 1=y)
   * @param value - New value
   * @returns This vector for chaining
   */
  setAt(i: number, value: number): IMutableVector2;

  /**
   * Sets both components.
   * @param x - X component value
   * @param y - Y component value
   * @returns This vector for chaining
   */
  setComponents(x: number, y: number): IMutableVector2;

  /**
   * Copies components from another Vector2.
   * @param vec - Source vector
   * @returns This vector for chaining
   */
  copyComponents(vec: IVector2): IMutableVector2;

  /**
   * Sets vector to (0, 0).
   * @returns This vector for chaining
   */
  zero(): IMutableVector2;

  /**
   * Sets vector to (1, 1).
   * @returns This vector for chaining
   */
  one(): IMutableVector2;

  /**
   * Normalizes vector to unit length.
   * @returns This vector for chaining
   */
  normalize(): IMutableVector2;

  /**
   * Adds another Vector2 to this vector.
   * @param vec - Vector to add
   * @returns This vector for chaining
   */
  add(vec: IVector2): IMutableVector2;

  /**
   * Subtracts another Vector2 from this vector.
   * @param vec - Vector to subtract
   * @returns This vector for chaining
   */
  subtract(vec: IVector2): IMutableVector2;

  /**
   * Multiplies vector by scalar.
   * @param value - Scalar multiplier
   * @returns This vector for chaining
   */
  multiply(value: number): IMutableVector2;

  /**
   * Multiplies vector component-wise by another Vector2.
   * @param vec - Vector to multiply by
   * @returns This vector for chaining
   */
  multiplyVector(vec: IVector2): IMutableVector2;

  /**
   * Divides vector by scalar.
   * @param value - Scalar divisor
   * @returns This vector for chaining
   */
  divide(value: number): IMutableVector2;

  /**
   * Divides vector component-wise by another Vector2.
   * @param vec - Vector to divide by
   * @returns This vector for chaining
   */
  divideVector(vec: IVector2): IMutableVector2;
}

/**
 * Interface for immutable 3D vectors.
 * Provides operations specific to 3-component vectors with homogeneous coordinate support.
 */
export interface IVector3 extends IVector {
  /** The class name identifier */
  readonly className: string;

  /** The x component */
  readonly x: number;
  /** The y component */
  readonly y: number;
  /** The z component */
  readonly z: number;
  /** The w component (homogeneous coordinate, typically 1.0 for points, 0.0 for vectors) */
  readonly w: number;

  /**
   * Returns a string representation of the vector.
   * @returns String representation
   */
  toString(): string;

  /**
   * Returns an approximate string representation with rounded values.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the vector to a flat array.
   * @returns Array containing [x, y, z]
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy vector.
   * @returns True if dummy
   */
  isDummy(): boolean;

  /**
   * Checks equality with another Vector3 within tolerance.
   * @param vec - Vector to compare with
   * @param delta - Optional tolerance
   * @returns True if approximately equal
   */
  isEqual(vec: IVector3, delta?: number): boolean;

  /**
   * Checks strict equality with another Vector3.
   * @param vec - Vector to compare with
   * @returns True if exactly equal
   */
  isStrictEqual(vec: IVector3): boolean;

  /**
   * Gets component at index.
   * @param i - Component index (0=x, 1=y, 2=z)
   * @returns Component value
   */
  at(i: number): number;

  /**
   * Calculates vector length.
   * @returns Vector magnitude
   */
  length(): number;

  /**
   * Calculates squared length.
   * @returns Squared magnitude
   */
  lengthSquared(): number;

  /**
   * Calculates distance to another Vector3.
   * @param vec - Target vector
   * @returns Distance
   */
  lengthTo(vec: IVector3): number;

  /**
   * Calculates dot product with another Vector3.
   * @param vec - Other vector
   * @returns Dot product
   */
  dot(vec: IVector3): number;

  /**
   * Creates a copy of this vector.
   * @returns New Vector3 instance
   */
  clone(): IVector3;
}

/**
 * Interface for mutable 3D vectors.
 * Provides in-place operations for 3-component vectors including cross product and quaternion multiplication.
 */
export interface IMutableVector3 extends IMutableVector {
  /** The class name identifier */
  readonly className: string;

  /** The x component (mutable) */
  x: number;
  /** The y component (mutable) */
  y: number;
  /** The z component (mutable) */
  z: number;
  /** The w component (homogeneous coordinate, read-only) */
  readonly w: number;

  // common with immutable vector3
  /**
   * Returns a string representation of the vector.
   * @returns String representation
   */
  toString(): string;

  /**
   * Returns an approximate string representation with rounded values.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the vector to a flat array.
   * @returns Array containing [x, y, z]
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy vector.
   * @returns True if dummy
   */
  isDummy(): boolean;

  /**
   * Checks equality with another Vector3 within tolerance.
   * @param vec - Vector to compare with
   * @param delta - Optional tolerance
   * @returns True if approximately equal
   */
  isEqual(vec: IVector3, delta?: number): boolean;

  /**
   * Checks strict equality with another Vector3.
   * @param vec - Vector to compare with
   * @returns True if exactly equal
   */
  isStrictEqual(vec: IVector3): boolean;

  /**
   * Gets component at index.
   * @param i - Component index (0=x, 1=y, 2=z)
   * @returns Component value
   */
  at(i: number): number;

  /**
   * Calculates vector length.
   * @returns Vector magnitude
   */
  length(): number;

  /**
   * Calculates squared length.
   * @returns Squared magnitude
   */
  lengthSquared(): number;

  /**
   * Calculates distance to another Vector3.
   * @param vec - Target vector
   * @returns Distance
   */
  lengthTo(vec: IVector3): number;

  /**
   * Calculates dot product with another Vector3.
   * @param vec - Other vector
   * @returns Dot product
   */
  dot(vec: IVector3): number;

  /**
   * Creates a copy of this vector.
   * @returns New mutable Vector3 instance
   */
  clone(): IMutableVector3;

  // only for mutable vector3
  /**
   * Gets the raw underlying typed array.
   * @returns The raw typed array
   */
  raw(): TypedArray;

  /**
   * Sets component at index.
   * @param i - Component index (0=x, 1=y, 2=z)
   * @param value - New value
   * @returns This vector for chaining
   */
  setAt(i: number, value: number): IMutableVector3;

  /**
   * Sets all three components.
   * @param x - X component value
   * @param y - Y component value
   * @param z - Z component value
   * @returns This vector for chaining
   */
  setComponents(x: number, y: number, z: number): IMutableVector3;

  /**
   * Copies components from another Vector3.
   * @param vec - Source vector
   * @returns This vector for chaining
   */
  copyComponents(vec: IVector3): IMutableVector3;

  /**
   * Sets vector to (0, 0, 0).
   * @returns This vector for chaining
   */
  zero(): IMutableVector3;

  /**
   * Sets vector to (1, 1, 1).
   * @returns This vector for chaining
   */
  one(): IMutableVector3;

  /**
   * Normalizes vector to unit length.
   * @returns This vector for chaining
   */
  normalize(): IMutableVector3;

  /**
   * Adds another Vector3 to this vector.
   * @param vec - Vector to add
   * @returns This vector for chaining
   */
  add(vec: IVector3): IMutableVector3;

  /**
   * Subtracts another Vector3 from this vector.
   * @param vec - Vector to subtract
   * @returns This vector for chaining
   */
  subtract(vec: IVector3): IMutableVector3;

  /**
   * Multiplies vector by scalar.
   * @param value - Scalar multiplier
   * @returns This vector for chaining
   */
  multiply(value: number): IMutableVector3;

  /**
   * Multiplies vector component-wise by another Vector3.
   * @param vec - Vector to multiply by
   * @returns This vector for chaining
   */
  multiplyVector(vec: IVector3): IMutableVector3;

  /**
   * Divides vector by scalar.
   * @param value - Scalar divisor
   * @returns This vector for chaining
   */
  divide(value: number): IMutableVector3;

  /**
   * Divides vector component-wise by another Vector3.
   * @param vec - Vector to divide by
   * @returns This vector for chaining
   */
  divideVector(vec: IVector3): IMutableVector3;

  /**
   * Calculates the cross product with another Vector3.
   * @param vec - Vector to cross with
   * @returns This vector for chaining
   */
  cross(vec: IVector3): IMutableVector3;

  /**
   * Multiplies this vector by a quaternion rotation.
   * @param quat - Quaternion to multiply by
   * @returns This vector for chaining
   */
  multiplyQuaternion(quat: IQuaternion): IMutableVector3;
}

/**
 * Interface for immutable 4D vectors.
 * Provides operations specific to 4-component vectors (homogeneous coordinates).
 */
export interface IVector4 extends IVector {
  /** The class name identifier */
  readonly className: string;

  /** The x component */
  readonly x: number;
  /** The y component */
  readonly y: number;
  /** The z component */
  readonly z: number;
  /** The w component */
  readonly w: number;

  /**
   * Returns a string representation of the vector.
   * @returns String representation
   */
  toString(): string;

  /**
   * Returns an approximate string representation with rounded values.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the vector to a flat array.
   * @returns Array containing [x, y, z, w]
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy vector.
   * @returns True if dummy
   */
  isDummy(): boolean;

  /**
   * Checks equality with another Vector4 within tolerance.
   * @param vec - Vector to compare with
   * @param delta - Optional tolerance
   * @returns True if approximately equal
   */
  isEqual(vec: IVector4, delta?: number): boolean;

  /**
   * Checks strict equality with another Vector4.
   * @param vec - Vector to compare with
   * @returns True if exactly equal
   */
  isStrictEqual(vec: IVector4): boolean;

  /**
   * Gets component at index.
   * @param i - Component index (0=x, 1=y, 2=z, 3=w)
   * @returns Component value
   */
  at(i: number): number;

  /**
   * Calculates vector length.
   * @returns Vector magnitude
   */
  length(): number;

  /**
   * Calculates squared length.
   * @returns Squared magnitude
   */
  lengthSquared(): number;

  /**
   * Calculates distance to another Vector4.
   * @param vec - Target vector
   * @returns Distance
   */
  lengthTo(vec: IVector4): number;

  /**
   * Calculates dot product with another Vector4.
   * @param vec - Other vector
   * @returns Dot product
   */
  dot(vec: IVector4): number;

  /**
   * Creates a copy of this vector.
   * @returns New Vector4 instance
   */
  clone(): IVector4;
}

/**
 * Interface for mutable 4D vectors.
 * Provides in-place operations for 4-component vectors including 3D normalization.
 */
export interface IMutableVector4 extends IMutableVector {
  /** The class name identifier */
  readonly className: string;

  /** The x component (mutable) */
  x: number;
  /** The y component (mutable) */
  y: number;
  /** The z component (mutable) */
  z: number;
  /** The w component (mutable) */
  w: number;

  // common with immutable vector3
  /**
   * Returns a string representation of the vector.
   * @returns String representation
   */
  toString(): string;

  /**
   * Returns an approximate string representation with rounded values.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the vector to a flat array.
   * @returns Array containing [x, y, z, w]
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this is a dummy vector.
   * @returns True if dummy
   */
  isDummy(): boolean;

  /**
   * Checks equality with another Vector4 within tolerance.
   * @param vec - Vector to compare with
   * @param delta - Optional tolerance
   * @returns True if approximately equal
   */
  isEqual(vec: IVector4, delta?: number): boolean;

  /**
   * Checks strict equality with another Vector4.
   * @param vec - Vector to compare with
   * @returns True if exactly equal
   */
  isStrictEqual(vec: IVector4): boolean;

  /**
   * Gets component at index.
   * @param i - Component index (0=x, 1=y, 2=z, 3=w)
   * @returns Component value
   */
  at(i: number): number;

  /**
   * Calculates vector length.
   * @returns Vector magnitude
   */
  length(): number;

  /**
   * Calculates squared length.
   * @returns Squared magnitude
   */
  lengthSquared(): number;

  /**
   * Calculates distance to another Vector4.
   * @param vec - Target vector
   * @returns Distance
   */
  lengthTo(vec: IVector4): number;

  /**
   * Calculates dot product with another Vector4.
   * @param vec - Other vector
   * @returns Dot product
   */
  dot(vec: IVector4): number;

  /**
   * Creates a copy of this vector.
   * @returns New mutable Vector4 instance
   */
  clone(): IMutableVector4;

  // only for mutable vector3
  /**
   * Gets the raw underlying typed array.
   * @returns The raw typed array
   */
  raw(): TypedArray;

  /**
   * Sets component at index.
   * @param i - Component index (0=x, 1=y, 2=z, 3=w)
   * @param value - New value
   * @returns This vector for chaining
   */
  setAt(i: number, value: number): IMutableVector4;

  /**
   * Sets all four components.
   * @param x - X component value
   * @param y - Y component value
   * @param z - Z component value
   * @param w - W component value
   * @returns This vector for chaining
   */
  setComponents(x: number, y: number, z: number, w: number): IMutableVector4;

  /**
   * Copies components from another Vector4.
   * @param vec - Source vector
   * @returns This vector for chaining
   */
  copyComponents(vec: IVector4): IMutableVector4;

  /**
   * Sets vector to (0, 0, 0, 0).
   * @returns This vector for chaining
   */
  zero(): IMutableVector4;

  /**
   * Sets vector to (1, 1, 1, 1).
   * @returns This vector for chaining
   */
  one(): IMutableVector4;

  /**
   * Normalizes vector to unit length (4D normalization).
   * @returns This vector for chaining
   */
  normalize(): IMutableVector4;

  /**
   * Normalizes only the xyz components, leaving w unchanged (3D normalization).
   * @returns This vector for chaining
   */
  normalize3(): IMutableVector4;

  /**
   * Adds another Vector4 to this vector.
   * @param vec - Vector to add
   * @returns This vector for chaining
   */
  add(vec: IVector4): IMutableVector4;

  /**
   * Subtracts another Vector4 from this vector.
   * @param vec - Vector to subtract
   * @returns This vector for chaining
   */
  subtract(vec: IVector4): IMutableVector4;

  /**
   * Multiplies vector by scalar.
   * @param value - Scalar multiplier
   * @returns This vector for chaining
   */
  multiply(value: number): IMutableVector4;

  /**
   * Multiplies vector component-wise by another Vector4.
   * @param vec - Vector to multiply by
   * @returns This vector for chaining
   */
  multiplyVector(vec: IVector4): IMutableVector4;

  /**
   * Divides vector by scalar.
   * @param value - Scalar divisor
   * @returns This vector for chaining
   */
  divide(value: number): IMutableVector4;

  /**
   * Divides vector component-wise by another Vector4.
   * @param vec - Vector to divide by
   * @returns This vector for chaining
   */
  divideVector(vec: IVector4): IMutableVector4;
}
