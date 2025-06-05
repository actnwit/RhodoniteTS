import { TypedArray } from '../../types/CommonTypes';
import { IArrayBufferBasedMathNumber } from './IMathNumber';

/**
 * Abstract base class for math number implementations that are backed by ArrayBuffer.
 * This class provides common functionality for typed array-based mathematical objects.
 *
 * @abstract
 */
export abstract class AbstractArrayBufferBaseMathNumber implements IArrayBufferBasedMathNumber {
  _v: TypedArray = new Float32Array();

  /**
   * Checks if the internal typed array is backed by the same ArrayBuffer as the provided one.
   * This is useful for determining if two math objects share the same underlying memory.
   *
   * @param arrayBuffer - The ArrayBuffer to compare against
   * @returns True if the internal typed array uses the same ArrayBuffer, false otherwise
   */
  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean {
    return this._v.buffer === arrayBuffer;
  }
}
