import type { TypedArray } from '../../types/CommonTypes';

/**
 * VectorN represents an N-dimensional vector with arbitrary length.
 * This class provides basic vector operations using TypedArray for efficient memory usage.
 */
export class VectorN {
  public _v: TypedArray;

  /**
   * Creates a new VectorN instance.
   * @param typedArray - The typed array containing the vector components
   */
  constructor(typedArray: TypedArray) {
    this._v = typedArray;
  }

  /**
   * Creates a deep copy of this vector.
   * @returns A new VectorN instance with the same components as this vector
   */
  clone() {
    return new VectorN(this._v.slice());
  }

  /**
   * Creates a dummy vector with no components.
   *
   * @returns A new dummy VectorN instance
   */
  static dummy() {
    return new VectorN(new Float32Array([]));
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
}
