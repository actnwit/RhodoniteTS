import { IMatrix } from './IMatrix';

/**
 * Abstract base class for matrix implementations.
 *
 * This class provides a common interface and basic functionality for all matrix types
 * in the system. It implements the IMatrix interface and serves as the foundation
 * for concrete matrix classes like Matrix44, Matrix33, etc.
 *
 * @abstract
 */
export abstract class AbstractMatrix implements IMatrix {
  /** Internal Float32Array storage for matrix elements */
  _v: Float32Array = new Float32Array();

  /**
   * Gets the matrix element at the specified row and column.
   *
   * @param row_i - The zero-based row index
   * @param column_i - The zero-based column index
   * @returns The matrix element value at the specified position
   * @throws Error when not implemented in derived classes
   */
  at(row_i: number, column_i: number): number {
    throw new Error('Method not implemented.');
  }

  /**
   * Converts the matrix to a string representation.
   *
   * @returns A string representation of the matrix
   * @throws Error when not implemented in derived classes
   */
  toString(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Converts the matrix to an approximate string representation.
   *
   * This method is useful for displaying matrices with rounded values
   * for better readability in debugging or logging scenarios.
   *
   * @returns An approximate string representation of the matrix
   * @throws Error when not implemented in derived classes
   */
  toStringApproximately(): string {
    throw new Error('Method not implemented.');
  }

  /**
   * Flattens the matrix into a one-dimensional array.
   *
   * @returns A flat array containing all matrix elements in row-major order
   * @throws Error when not implemented in derived classes
   */
  flattenAsArray(): number[] {
    throw new Error('Method not implemented.');
  }

  /**
   * Checks if this matrix is a dummy (uninitialized) matrix.
   *
   * A matrix is considered dummy if its internal storage has zero length,
   * indicating it hasn't been properly initialized with matrix data.
   *
   * @returns True if the matrix is dummy/uninitialized, false otherwise
   */
  isDummy(): boolean {
    if (this._v.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Gets the matrix element at the specified flat index.
   *
   * This provides direct access to the underlying Float32Array storage
   * using a single index rather than row/column coordinates.
   *
   * @param i - The zero-based flat index into the matrix storage
   * @returns The matrix element value at the specified index
   */
  v(i: number): number {
    return this._v[i];
  }

  /**
   * Calculates the determinant of the matrix.
   *
   * @returns The determinant value of the matrix
   * @throws Error when not implemented in derived classes
   */
  determinant(): number {
    throw new Error('Method not implemented.');
  }

  /**
   * Gets the class name of this matrix instance.
   *
   * @returns The name of the constructor function (class name)
   */
  get className(): string {
    return this.constructor.name;
  }

  /**
   * Indicates whether this matrix is an identity matrix class.
   *
   * This property should be overridden in derived classes that represent
   * identity matrices to return true.
   *
   * @returns False for the base AbstractMatrix class
   */
  get isIdentityMatrixClass(): boolean {
    return false;
  }

  /**
   * Checks if the matrix's internal storage shares the same ArrayBuffer as the provided one.
   *
   * This method is useful for determining if two matrices share the same underlying
   * memory, which can be important for performance optimizations and avoiding
   * unnecessary data copying.
   *
   * @param arrayBuffer - The ArrayBuffer to compare against
   * @returns True if the internal storage uses the same ArrayBuffer, false otherwise
   */
  isTheSourceSame(arrayBuffer: ArrayBuffer): boolean {
    return this._v.buffer === arrayBuffer;
  }
}
