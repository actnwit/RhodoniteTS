import type { TypedArray } from '../../types/CommonTypes';
import type { IVector } from './IVector';

/**
 * Abstract base class for vector implementations.
 * Provides common functionality and defines the interface that all vector classes must implement.
 * This class handles basic vector operations and serves as a foundation for specific vector types.
 */
export abstract class AbstractVector implements IVector {
  /** Internal typed array storage for vector components */
  _v: TypedArray = new Float32Array();

  /**
   * Gets the x-component (first component) of the vector.
   * @returns The x-component value
   */
  get x(): number {
    return this._v[0];
  }

  /**
   * Gets the GLSL string representation of the vector as float values.
   * @returns GLSL-formatted string for float values
   * @throws Error - Must be implemented by subclasses
   */
  get glslStrAsFloat(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the GLSL string representation of the vector as integer values.
   * @returns GLSL-formatted string for integer values
   * @throws Error - Must be implemented by subclasses
   */
  get glslStrAsInt(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the WGSL string representation of the vector as float values.
   * @returns WGSL-formatted string for float values
   * @throws Error - Must be implemented by subclasses
   */
  get wgslStrAsFloat(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the WGSL string representation of the vector as integer values.
   * @returns WGSL-formatted string for integer values
   * @throws Error - Must be implemented by subclasses
   */
  get wgslStrAsInt(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Checks if this vector is approximately equal to another vector within a specified tolerance.
   * @param vec - The vector to compare against
   * @param delta - Optional tolerance value for comparison
   * @returns True if vectors are approximately equal, false otherwise
   * @throws Error - Must be implemented by subclasses
   */
  isEqual(vec: IVector, delta?: number): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Checks if this vector is strictly equal to another vector (exact equality).
   * @param vec - The vector to compare against
   * @returns True if vectors are exactly equal, false otherwise
   * @throws Error - Must be implemented by subclasses
   */
  isStrictEqual(vec: IVector): boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Calculates the length (magnitude) of the vector.
   * @returns The length of the vector
   * @throws Error - Must be implemented by subclasses
   */
  length(): number {
    throw new Error('Method not implemented.');
  }

  /**
   * Calculates the squared length of the vector.
   * This is more efficient than length() when only relative comparisons are needed.
   * @returns The squared length of the vector
   * @throws Error - Must be implemented by subclasses
   */
  lengthSquared(): number {
    throw new Error('Method not implemented.');
  }

  /**
   * Calculates the distance from this vector to another vector.
   * @param vec - The target vector
   * @returns The distance between the vectors
   * @throws Error - Must be implemented by subclasses
   */
  lengthTo(vec: IVector): number {
    throw new Error('Method not implemented.');
  }

  /**
   * Calculates the dot product between this vector and another vector.
   * @param vec - The vector to calculate dot product with
   * @returns The dot product result
   * @throws Error - Must be implemented by subclasses
   */
  dot(vec: IVector): number {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the component value at the specified index.
   * @param i - The index of the component to retrieve
   * @returns The component value at the given index
   */
  at(i: number): number {
    return this._v[i];
  }

  /**
   * Converts the vector to its string representation.
   * @returns String representation of the vector
   * @throws Error - Must be implemented by subclasses
   */
  toString(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Converts the vector to an approximate string representation.
   * Useful for debugging when exact precision is not required.
   * @returns Approximate string representation of the vector
   * @throws Error - Must be implemented by subclasses
   */
  toStringApproximately(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Converts the vector to a flat array of numbers.
   * @returns Array containing all vector components
   * @throws Error - Must be implemented by subclasses
   */
  flattenAsArray(): number[] {
    throw new Error('Method not implemented.');
  }

  /**
   * Checks if this vector is a dummy (empty) vector.
   * A dummy vector has no components and is typically used as a placeholder.
   * @returns True if the vector is dummy, false otherwise
   */
  isDummy(): boolean {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets the component value at the specified index.
   * Alias for the at() method for convenience.
   * @param i - The index of the component to retrieve
   * @returns The component value at the given index
   */
  v(i: number): number {
    return this._v[i];
  }

  /**
   * Checks if the internal storage shares the same ArrayBuffer as the provided one.
   * Useful for determining if vectors share underlying memory.
   * @param arrayBuffer - The ArrayBuffer to compare against
   * @returns True if the same ArrayBuffer is used, false otherwise
   */
  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean {
    return this._v.buffer === arrayBuffer;
  }

  /**
   * Gets the class name of this vector instance.
   * @returns The constructor name of the class
   */
  get className(): string {
    return this.constructor.name;
  }

  /**
   * Gets the number of bytes per component in the underlying typed array.
   * @returns Bytes per component
   * @throws Error - Must be implemented by subclasses
   */
  get bytesPerComponent(): number {
    throw new Error('Method not implemented.');
  }
}
