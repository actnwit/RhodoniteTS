import type { Array4, Index } from '../../types/CommonTypes';
import type { IMatrix22, IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix22 } from './IMatrix';
import type { IVector2 } from './IVector';
import { Matrix22 } from './Matrix22';
/**
 * A mutable 2x2 matrix class that extends Matrix22 and provides modification capabilities.
 * This class allows in-place operations for matrix transformations, making it suitable
 * for performance-critical applications where object creation overhead should be minimized.
 *
 * The matrix is stored in column-major order as a Float32Array, compatible with WebGL.
 * Matrix layout:
 * ```
 * | m00 m01 |
 * | m10 m11 |
 * ```
 *
 * @example
 * ```typescript
 * const matrix = MutableMatrix22.identity();
 * matrix.rotate(Math.PI / 4); // Rotate 45 degrees
 * matrix.scale(Vector2.fromCopyArray([2, 3])); // Scale by 2x and 3y
 * ```
 */
export declare class MutableMatrix22 extends Matrix22 implements IMutableMatrix, IMutableMatrix22 {
    /**
     * Sets the value at position (0,0) of the matrix.
     *
     * @param val - The value to set
     */
    set m00(val: number);
    /**
     * Gets the value at position (0,0) of the matrix.
     *
     * @returns The value at position (0,0)
     */
    get m00(): number;
    /**
     * Sets the value at position (1,0) of the matrix.
     *
     * @param val - The value to set
     */
    set m10(val: number);
    /**
     * Gets the value at position (1,0) of the matrix.
     *
     * @returns The value at position (1,0)
     */
    get m10(): number;
    /**
     * Sets the value at position (0,1) of the matrix.
     *
     * @param val - The value to set
     */
    set m01(val: number);
    /**
     * Gets the value at position (0,1) of the matrix.
     *
     * @returns The value at position (0,1)
     */
    get m01(): number;
    /**
     * Sets the value at position (1,1) of the matrix.
     *
     * @param val - The value to set
     */
    set m11(val: number);
    /**
     * Gets the value at position (1,1) of the matrix.
     *
     * @returns The value at position (1,1)
     */
    get m11(): number;
    /**
     * Gets the class name for debugging purposes.
     *
     * @returns The class name "MutableMatrix22"
     */
    get className(): string;
    /**
     * Creates a new zero matrix where all elements are 0.
     *
     * @returns A new MutableMatrix22 instance with all zero values
     */
    static zero(): MutableMatrix22;
    /**
     * Creates a new 2x2 identity matrix.
     *
     * @returns A new MutableMatrix22 identity matrix
     */
    static identity(): MutableMatrix22;
    /**
     * Creates a dummy matrix for placeholder purposes.
     *
     * @returns A new MutableMatrix22 dummy instance
     */
    static dummy(): MutableMatrix22;
    /**
     * Creates a new matrix that is the transpose of the input matrix.
     *
     * @param mat - The matrix to transpose
     * @returns A new MutableMatrix22 containing the transposed matrix
     */
    static transpose(mat: IMatrix22): MutableMatrix22;
    /**
     * Creates a new matrix that is the inverse of the input matrix.
     *
     * @param mat - The matrix to invert
     * @returns A new MutableMatrix22 containing the inverted matrix
     * @throws Error if the matrix is not invertible (determinant is 0)
     */
    static invert(mat: IMatrix22): MutableMatrix22;
    /**
     * Creates a new rotation matrix for the given angle.
     *
     * @param radian - The rotation angle in radians
     * @returns A new MutableMatrix22 representing the rotation transformation
     */
    static rotate(radian: number): MutableMatrix22;
    /**
     * Creates a new scale matrix from a 2D vector.
     *
     * @param vec - Vector2 containing the scale factors for x and y axes
     * @returns A new MutableMatrix22 representing the scale transformation
     */
    static scale(vec: IVector2): MutableMatrix22;
    /**
     * Multiplies two matrices and returns a new matrix with the result.
     *
     * @param l_mat - The left matrix operand
     * @param r_mat - The right matrix operand
     * @returns A new MutableMatrix22 containing the multiplication result
     */
    static multiply(l_mat: IMatrix22, r_mat: IMatrix22): MutableMatrix22;
    /**
     * Creates a deep copy of this matrix.
     *
     * @returns A new MutableMatrix22 instance with the same values
     */
    clone(): MutableMatrix22;
    /**
     * Gets the raw Float32Array containing the matrix data.
     *
     * @returns The internal Float32Array in column-major order
     */
    raw(): Float32Array;
    /**
     * Sets the value at the specified row and column position.
     *
     * @param row_i - The row index (0-1)
     * @param column_i - The column index (0-1)
     * @param value - The value to set
     * @returns This matrix instance for method chaining
     */
    setAt(row_i: number, column_i: number, value: number): MutableMatrix22;
    /**
     * Sets all matrix components directly.
     *
     * @param m00 - Value for position (0,0)
     * @param m01 - Value for position (0,1)
     * @param m10 - Value for position (1,0)
     * @param m11 - Value for position (1,1)
     * @returns This matrix instance for method chaining
     */
    setComponents(m00: number, m01: number, m10: number, m11: number): MutableMatrix22;
    /**
     * Copies the 2x2 portion of another matrix into this matrix.
     * Works with Matrix22, Matrix33, or Matrix44 sources.
     *
     * @param mat - The source matrix to copy from
     * @returns This matrix instance for method chaining
     */
    copyComponents(mat: IMatrix22 | IMatrix33 | IMatrix44): MutableMatrix22;
    /**
     * Sets this matrix to a zero matrix (all elements are 0).
     *
     * @returns This matrix instance for method chaining
     */
    zero(): MutableMatrix22;
    /**
     * Sets this matrix to an identity matrix.
     *
     * @returns This matrix instance for method chaining
     */
    identity(): MutableMatrix22;
    /**
     * Internal helper method to swap two elements in the matrix array.
     *
     * @param l - Index of the first element
     * @param r - Index of the second element
     */
    _swap(l: Index, r: Index): void;
    /**
     * Transposes this matrix in place (swaps rows and columns).
     *
     * @returns This matrix instance for method chaining
     */
    transpose(): MutableMatrix22;
    /**
     * Inverts this matrix in place.
     *
     * @returns This matrix instance for method chaining
     * @throws Error if the matrix is not invertible (determinant is 0)
     */
    invert(): MutableMatrix22;
    /**
     * Sets this matrix to a rotation matrix for the given angle.
     *
     * @param radian - The rotation angle in radians
     * @returns This matrix instance for method chaining
     */
    rotate(radian: number): MutableMatrix22;
    /**
     * Sets this matrix to a scale matrix from a 2D vector.
     *
     * @param vec - Vector2 containing the scale factors for x and y axes
     * @returns This matrix instance for method chaining
     */
    scale(vec: IVector2): MutableMatrix22;
    /**
     * Multiplies this matrix by a scale transformation in place.
     *
     * @param vec - Vector2 containing the scale factors for x and y axes
     * @returns This matrix instance for method chaining
     */
    multiplyScale(vec: IVector2): MutableMatrix22;
    /**
     * Multiplies this matrix by another matrix from the right side (this * mat).
     *
     * @param mat - The matrix to multiply with
     * @returns This matrix instance for method chaining
     */
    multiply(mat: IMatrix22): MutableMatrix22;
    /**
     * Multiplies this matrix by another matrix from the left side (mat * this).
     *
     * @param mat - The matrix to multiply with from the left
     * @returns This matrix instance for method chaining
     */
    multiplyByLeft(mat: IMatrix22): MutableMatrix22;
    /**
     * Creates a new matrix from values provided in row-major order.
     * This is more intuitive for manual input as values are specified
     * in the same order they appear visually in the matrix.
     *
     * @param m00 - Value for position (0,0)
     * @param m01 - Value for position (0,1)
     * @param m10 - Value for position (1,0)
     * @param m11 - Value for position (1,1)
     * @returns A new MutableMatrix22 instance
     */
    static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): MutableMatrix22;
    /**
     * Creates a new matrix from values provided in column-major order.
     * This matches the internal storage format used by WebGL.
     *
     * @param m00 - Value for position (0,0)
     * @param m10 - Value for position (1,0)
     * @param m01 - Value for position (0,1)
     * @param m11 - Value for position (1,1)
     * @returns A new MutableMatrix22 instance
     */
    static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): MutableMatrix22;
    /**
     * Creates a new matrix using the provided Float32Array directly (no copy).
     * The array is expected to be in column-major order.
     *
     * @param float32Array - Float32Array containing matrix data in column-major order
     * @returns A new MutableMatrix22 instance sharing the provided array
     */
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix22;
    /**
     * Creates a new matrix by copying from a Float32Array in column-major order.
     *
     * @param float32Array - Float32Array containing matrix data in column-major order
     * @returns A new MutableMatrix22 instance with copied data
     */
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix22;
    /**
     * Creates a new matrix by copying from a Float32Array in row-major order.
     *
     * @param array - Float32Array containing matrix data in row-major order
     * @returns A new MutableMatrix22 instance with converted data
     */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix22;
    /**
     * Creates a new matrix by copying from another Matrix22 instance.
     *
     * @param mat - The source Matrix22 to copy from
     * @returns A new MutableMatrix22 instance with copied data
     */
    static fromCopyMatrix22(mat: IMatrix22): MutableMatrix22;
    /**
     * Creates a new matrix from a 4-element array in column-major order.
     *
     * @param array - Array4 containing matrix data in column-major order
     * @returns A new MutableMatrix22 instance with copied data
     */
    static fromCopyArray9ColumnMajor(array: Array4<number>): MutableMatrix22;
    /**
     * Creates a new matrix from an array in column-major order.
     *
     * @param array - Array containing matrix data in column-major order
     * @returns A new MutableMatrix22 instance with copied data
     */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix22;
    /**
     * Creates a new matrix from a 4-element array in row-major order.
     *
     * @param array - Array4 containing matrix data in row-major order
     * @returns A new MutableMatrix22 instance with converted data
     */
    static fromCopyArray9RowMajor(array: Array4<number>): MutableMatrix22;
    /**
     * Creates a new matrix from an array in row-major order.
     *
     * @param array - Array containing matrix data in row-major order
     * @returns A new MutableMatrix22 instance with converted data
     */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix22;
}
