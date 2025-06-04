import { TypedArray } from '../../types/CommonTypes';

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
}
