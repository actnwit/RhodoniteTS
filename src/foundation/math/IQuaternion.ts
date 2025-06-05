import { TypedArray } from '../../types/CommonTypes';
import { IVector3, IMutableVector3 } from './IVector';
import { IMatrix44 } from './IMatrix';

/**
 * Immutable quaternion interface representing a rotation in 3D space.
 * Quaternions are a mathematical notation for representing rotations and orientations.
 * They consist of four components: x, y, z (imaginary parts) and w (real part).
 */
export interface IQuaternion {
  /** The class name identifier */
  readonly className: string;

  /** Internal Float32Array storage for quaternion components */
  _v: Float32Array;

  /** The x component (i quaternion basis) */
  readonly x: number;

  /** The y component (j quaternion basis) */
  readonly y: number;

  /** The z component (k quaternion basis) */
  readonly z: number;

  /** The w component (real quaternion basis) */
  readonly w: number;

  /**
   * Returns a string representation of the quaternion.
   * @returns String representation of the quaternion
   */
  toString(): string;

  /**
   * Returns an approximate string representation of the quaternion with limited precision.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the quaternion to a flat array of numbers.
   * @returns Array containing [x, y, z, w] components
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this quaternion is a dummy/invalid quaternion.
   * @returns True if the quaternion is dummy, false otherwise
   */
  isDummy(): boolean;

  /**
   * Compares this quaternion with another quaternion for equality within a tolerance.
   * @param vec - The quaternion to compare with
   * @param delta - Optional tolerance value for comparison (default uses system epsilon)
   * @returns True if quaternions are equal within tolerance, false otherwise
   */
  isEqual(vec: IQuaternion, delta?: number): boolean;

  /**
   * Compares this quaternion with another quaternion for strict equality.
   * @param vec - The quaternion to compare with
   * @returns True if quaternions are exactly equal, false otherwise
   */
  isStrictEqual(vec: IQuaternion): boolean;

  /**
   * Gets the component value at the specified index.
   * @param i - Index (0=x, 1=y, 2=z, 3=w)
   * @returns The component value at the given index
   */
  at(i: number): number;

  /**
   * Calculates the magnitude (length) of the quaternion.
   * @returns The magnitude of the quaternion
   */
  length(): number;

  /**
   * Calculates the squared magnitude of the quaternion.
   * More efficient than length() when only comparison is needed.
   * @returns The squared magnitude of the quaternion
   */
  lengthSquared(): number;

  /**
   * Calculates the dot product between this quaternion and another.
   * @param vec - The other quaternion
   * @returns The dot product result
   */
  dot(vec: IQuaternion): number;

  /**
   * Converts the quaternion to Euler angles and stores the result in the provided vector.
   * @param out - The output vector to store the Euler angles
   * @returns The output vector containing Euler angles (x=pitch, y=yaw, z=roll)
   */
  toEulerAnglesTo(out: IMutableVector3): IMutableVector3;

  /**
   * Converts the quaternion to Euler angles.
   * @returns A new vector containing Euler angles (x=pitch, y=yaw, z=roll)
   */
  toEulerAngles(): IVector3;

  /**
   * Creates a copy of this quaternion.
   * @returns A new quaternion with the same values
   */
  clone(): IQuaternion;

  /**
   * Transforms a 3D vector by this quaternion rotation.
   * @param vec - The vector to transform
   * @returns A new transformed vector
   */
  transformVector3(vec: IVector3): IVector3;

  /**
   * Transforms a 3D vector by this quaternion rotation and stores the result in the output vector.
   * @param vec - The vector to transform
   * @param out - The output vector to store the result
   * @returns The output vector containing the transformed result
   */
  transformVector3To(vec: IVector3, out: IMutableVector3): IVector3;

  /**
   * Transforms a 3D vector by the inverse of this quaternion rotation.
   * @param vec - The vector to transform
   * @returns A new transformed vector
   */
  transformVector3Inverse(vec: IVector3): IVector3;
}

/**
 * Mutable quaternion interface that extends IQuaternion with modification capabilities.
 * Provides methods to modify quaternion components and perform in-place operations.
 */
export interface IMutableQuaternion extends IQuaternion {
  /** The class name identifier */
  readonly className: string;

  /** The x component (i quaternion basis) - mutable */
  x: number;

  /** The y component (j quaternion basis) - mutable */
  y: number;

  /** The z component (k quaternion basis) - mutable */
  z: number;

  /** The w component (real quaternion basis) - mutable */
  w: number;

  // common with immutable quaternion
  /**
   * Returns a string representation of the quaternion.
   * @returns String representation of the quaternion
   */
  toString(): string;

  /**
   * Returns an approximate string representation of the quaternion with limited precision.
   * @returns Approximate string representation
   */
  toStringApproximately(): string;

  /**
   * Converts the quaternion to a flat array of numbers.
   * @returns Array containing [x, y, z, w] components
   */
  flattenAsArray(): Array<number>;

  /**
   * Checks if this quaternion is a dummy/invalid quaternion.
   * @returns True if the quaternion is dummy, false otherwise
   */
  isDummy(): boolean;

  /**
   * Compares this quaternion with another quaternion for equality within a tolerance.
   * @param vec - The quaternion to compare with
   * @param delta - Optional tolerance value for comparison (default uses system epsilon)
   * @returns True if quaternions are equal within tolerance, false otherwise
   */
  isEqual(vec: IQuaternion, delta?: number): boolean;

  /**
   * Compares this quaternion with another quaternion for strict equality.
   * @param vec - The quaternion to compare with
   * @returns True if quaternions are exactly equal, false otherwise
   */
  isStrictEqual(vec: IQuaternion): boolean;

  /**
   * Gets the component value at the specified index.
   * @param i - Index (0=x, 1=y, 2=z, 3=w)
   * @returns The component value at the given index
   */
  at(i: number): number;

  /**
   * Calculates the magnitude (length) of the quaternion.
   * @returns The magnitude of the quaternion
   */
  length(): number;

  /**
   * Calculates the squared magnitude of the quaternion.
   * More efficient than length() when only comparison is needed.
   * @returns The squared magnitude of the quaternion
   */
  lengthSquared(): number;

  /**
   * Calculates the dot product between this quaternion and another.
   * @param vec - The other quaternion
   * @returns The dot product result
   */
  dot(vec: IQuaternion): number;

  /**
   * Converts the quaternion to Euler angles and stores the result in the provided vector.
   * @param out - The output vector to store the Euler angles
   * @returns The output vector containing Euler angles (x=pitch, y=yaw, z=roll)
   */
  toEulerAnglesTo(out: IMutableVector3): IMutableVector3;

  /**
   * Creates a mutable copy of this quaternion.
   * @returns A new mutable quaternion with the same values
   */
  clone(): IMutableQuaternion;

  // only for mutable quaternion
  /**
   * Gets the raw typed array backing this quaternion.
   * @returns The underlying TypedArray storage
   */
  raw(): TypedArray;

  /**
   * Sets the component value at the specified index.
   * @param i - Index (0=x, 1=y, 2=z, 3=w)
   * @param value - The value to set
   * @returns This quaternion for method chaining
   */
  setAt(i: number, value: number): IMutableQuaternion;

  /**
   * Sets all four components of the quaternion.
   * @param x - The x component value
   * @param y - The y component value
   * @param z - The z component value
   * @param w - The w component value
   * @returns This quaternion for method chaining
   */
  setComponents(x: number, y: number, z: number, w: number): IMutableQuaternion;

  /**
   * Copies the components from another quaternion into this one.
   * @param quat - The source quaternion to copy from
   * @returns This quaternion for method chaining
   */
  copyComponents(quat: IQuaternion): IMutableQuaternion;

  /**
   * Sets this quaternion to the identity quaternion (0, 0, 0, 1).
   * @returns This quaternion for method chaining
   */
  identity(): IMutableQuaternion;

  /**
   * Normalizes this quaternion to unit length in place.
   * @returns This quaternion for method chaining
   */
  normalize(): IMutableQuaternion;

  /**
   * Sets this quaternion to represent a rotation around an axis by a given angle.
   * @param vec - The axis of rotation (should be normalized)
   * @param radian - The angle of rotation in radians
   * @returns This quaternion for method chaining
   */
  axisAngle(vec: IVector3, radian: number): IMutableQuaternion;

  /**
   * Sets this quaternion from a rotation matrix.
   * @param mat - The source rotation matrix
   * @returns This quaternion for method chaining
   */
  fromMatrix(mat: IMatrix44): IMutableQuaternion;

  /**
   * Adds another quaternion to this one in place.
   * @param quat - The quaternion to add
   * @returns This quaternion for method chaining
   */
  add(quat: IQuaternion): IMutableQuaternion;

  /**
   * Subtracts another quaternion from this one in place.
   * @param quat - The quaternion to subtract
   * @returns This quaternion for method chaining
   */
  subtract(quat: IQuaternion): IMutableQuaternion;

  /**
   * Multiplies this quaternion by another quaternion in place (quaternion composition).
   * @param quat - The quaternion to multiply with
   * @returns This quaternion for method chaining
   */
  multiply(quat: IQuaternion): IMutableQuaternion;

  /**
   * Multiplies this quaternion by a scalar value in place.
   * @param value - The scalar value to multiply by
   * @returns This quaternion for method chaining
   */
  multiplyNumber(value: number): IMutableQuaternion;

  /**
   * Divides this quaternion by a scalar value in place.
   * @param value - The scalar value to divide by
   * @returns This quaternion for method chaining
   */
  divideNumber(value: number): IMutableQuaternion;

  /**
   * Creates a mutable copy of this quaternion.
   * @returns A new mutable quaternion with the same values
   */
  clone(): IMutableQuaternion;
}

/**
 * Logarithmic quaternion interface for representing quaternion logarithms.
 * Used in quaternion interpolation and advanced quaternion mathematics.
 */
export interface ILogQuaternion {
  /** The class name identifier */
  readonly className: string;

  /** Internal Float32Array storage for logarithmic quaternion components */
  readonly _v: Float32Array;

  /** The x component of the logarithmic quaternion */
  readonly x: number;

  /** The y component of the logarithmic quaternion */
  readonly y: number;

  /** The z component of the logarithmic quaternion */
  readonly z: number;

  /** The w component of the logarithmic quaternion */
  readonly w: number;
}
