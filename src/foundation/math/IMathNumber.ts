/**
 * Interface for math number types that are based on ArrayBuffer.
 * This interface provides functionality to check if the underlying ArrayBuffer
 * is the same as a given ArrayBuffer, which is useful for memory management
 * and avoiding unnecessary data copying operations.
 */
export interface IArrayBufferBasedMathNumber {
  /**
   * Checks whether the underlying ArrayBuffer of this math number object
   * is the same as the provided ArrayBuffer.
   *
   * @param arrayBuffer - The ArrayBuffer to compare with the underlying buffer
   * @returns true if the ArrayBuffer is the same instance, false otherwise
   */
  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean;
}
