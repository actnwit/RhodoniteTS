import type { Array9, Index } from '../../types/CommonTypes';
import type { IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix33 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { Matrix33 } from './Matrix33';
/**
 * A mutable 3x3 matrix class that extends Matrix33 and provides mutating operations.
 * This class stores matrix data in column-major order as a Float32Array.
 * All transformation methods modify the matrix in place and return the same instance for method chaining.
 *
 * Matrix layout in memory (column-major order):
 * ```
 * [m00, m10, m20, m01, m11, m21, m02, m12, m22]
 *  [0]  [1]  [2]  [3]  [4]  [5]  [6]  [7]  [8]
 * ```
 *
 * Which represents the matrix:
 * ```
 * | m00  m01  m02 |
 * | m10  m11  m12 |
 * | m20  m21  m22 |
 * ```
 */
export declare class MutableMatrix33 extends Matrix33 implements IMutableMatrix, IMutableMatrix33 {
    /**
     * Sets the matrix element at position (0,0).
     * @param val - The value to set
     */
    set m00(val: number);
    /**
     * Gets the matrix element at position (0,0).
     * @returns The value at position (0,0)
     */
    get m00(): number;
    /**
     * Sets the matrix element at position (1,0).
     * @param val - The value to set
     */
    set m10(val: number);
    /**
     * Gets the matrix element at position (1,0).
     * @returns The value at position (1,0)
     */
    get m10(): number;
    /**
     * Sets the matrix element at position (2,0).
     * @param val - The value to set
     */
    set m20(val: number);
    /**
     * Gets the matrix element at position (2,0).
     * @returns The value at position (2,0)
     */
    get m20(): number;
    /**
     * Sets the matrix element at position (0,1).
     * @param val - The value to set
     */
    set m01(val: number);
    /**
     * Gets the matrix element at position (0,1).
     * @returns The value at position (0,1)
     */
    get m01(): number;
    /**
     * Sets the matrix element at position (1,1).
     * @param val - The value to set
     */
    set m11(val: number);
    /**
     * Gets the matrix element at position (1,1).
     * @returns The value at position (1,1)
     */
    get m11(): number;
    /**
     * Sets the matrix element at position (2,1).
     * @param val - The value to set
     */
    set m21(val: number);
    /**
     * Gets the matrix element at position (2,1).
     * @returns The value at position (2,1)
     */
    get m21(): number;
    /**
     * Sets the matrix element at position (0,2).
     * @param val - The value to set
     */
    set m02(val: number);
    /**
     * Gets the matrix element at position (0,2).
     * @returns The value at position (0,2)
     */
    get m02(): number;
    /**
     * Sets the matrix element at position (1,2).
     * @param val - The value to set
     */
    set m12(val: number);
    /**
     * Gets the matrix element at position (1,2).
     * @returns The value at position (1,2)
     */
    get m12(): number;
    /**
     * Sets the matrix element at position (2,2).
     * @param val - The value to set
     */
    set m22(val: number);
    /**
     * Gets the matrix element at position (2,2).
     * @returns The value at position (2,2)
     */
    get m22(): number;
    /**
     * Gets the class name for debugging purposes.
     * @returns The string 'MutableMatrix33'
     */
    get className(): string;
    /**
     * Creates a new zero matrix (all elements set to 0).
     * @returns A new MutableMatrix33 instance with all elements set to 0
     */
    static zero(): MutableMatrix33;
    /**
     * Creates a new identity matrix.
     * @returns A new MutableMatrix33 instance representing the identity matrix
     */
    static identity(): MutableMatrix33;
    /**
     * Creates a dummy matrix for testing purposes.
     * @returns A new MutableMatrix33 instance with default values
     */
    static dummy(): MutableMatrix33;
    /**
     * Creates a new matrix that is the transpose of the input matrix.
     * @param mat - The matrix to transpose
     * @returns A new MutableMatrix33 instance representing the transposed matrix
     */
    static transpose(mat: IMatrix33): MutableMatrix33;
    /**
     * Creates a new matrix that is the inverse of the input matrix.
     * @param mat - The matrix to invert
     * @returns A new MutableMatrix33 instance representing the inverted matrix
     */
    static invert(mat: IMatrix33): MutableMatrix33;
    /**
     * Creates a rotation matrix around the X-axis.
     * @param radian - The rotation angle in radians
     * @returns A new MutableMatrix33 instance representing the X-axis rotation
     */
    static rotateX(radian: number): MutableMatrix33;
    /**
     * Creates a rotation matrix around the Y-axis.
     * @param radian - The rotation angle in radians
     * @returns A new MutableMatrix33 instance representing the Y-axis rotation
     */
    static rotateY(radian: number): MutableMatrix33;
    /**
     * Creates a rotation matrix around the Z-axis.
     * @param radian - The rotation angle in radians
     * @returns A new MutableMatrix33 instance representing the Z-axis rotation
     */
    static rotateZ(radian: number): MutableMatrix33;
    /**
     * Creates a rotation matrix for combined X, Y, and Z axis rotations applied in that order.
     * @param x - Rotation angle around X-axis in radians
     * @param y - Rotation angle around Y-axis in radians
     * @param z - Rotation angle around Z-axis in radians
     * @returns A new MutableMatrix33 instance representing the combined rotation
     */
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix33;
    /**
     * Creates a rotation matrix from a vector containing rotation angles.
     * @param vec - A vector containing rotation angles for X, Y, and Z axes
     * @returns A new MutableMatrix33 instance representing the rotation
     */
    static rotate(vec: IVector3): MutableMatrix33;
    /**
     * Creates a scaling matrix from a vector.
     * @param vec - A vector containing scale factors for X, Y, and Z axes
     * @returns A new MutableMatrix33 instance representing the scaling transformation
     */
    static scale(vec: IVector3): MutableMatrix33;
    /**
     * Multiplies two matrices and returns the result as a new matrix.
     * @param l_mat - The left matrix operand
     * @param r_mat - The right matrix operand
     * @returns A new MutableMatrix33 instance representing l_mat * r_mat
     */
    static multiply(l_mat: IMatrix33, r_mat: IMatrix33): MutableMatrix33;
    /**
     * Creates a copy of this matrix.
     * @returns A new MutableMatrix33 instance with the same values
     */
    clone(): MutableMatrix33;
    /**
     * Gets the raw Float32Array containing the matrix data.
     * @returns The underlying Float32Array in column-major order
     */
    raw(): Float32Array;
    /**
     * Sets a value at the specified row and column position.
     * @param row_i - The row index (0-2)
     * @param column_i - The column index (0-2)
     * @param value - The value to set
     * @returns This matrix instance for method chaining
     */
    setAt(row_i: number, column_i: number, value: number): MutableMatrix33;
    /**
     * Sets all matrix components using row-major order parameters.
     * @param m00 - Element at position (0,0)
     * @param m01 - Element at position (0,1)
     * @param m02 - Element at position (0,2)
     * @param m10 - Element at position (1,0)
     * @param m11 - Element at position (1,1)
     * @param m12 - Element at position (1,2)
     * @param m20 - Element at position (2,0)
     * @param m21 - Element at position (2,1)
     * @param m22 - Element at position (2,2)
     * @returns This matrix instance for method chaining
     */
    setComponents(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33;
    /**
     * Copies components from another matrix (3x3 or 4x4) into this matrix.
     * For 4x4 matrices, only the upper-left 3x3 portion is copied.
     * @param mat - The source matrix to copy from
     * @returns This matrix instance for method chaining
     */
    copyComponents(mat: IMatrix33 | IMatrix44): MutableMatrix33;
    /**
     * Sets this matrix to the zero matrix (all elements set to 0).
     * @returns This matrix instance for method chaining
     */
    zero(): MutableMatrix33;
    /**
     * Sets this matrix to the identity matrix.
     * @returns This matrix instance for method chaining
     */
    identity(): MutableMatrix33;
    /**
     * Swaps two elements in the internal array.
     * @param l - Index of the first element
     * @param r - Index of the second element
     * @private
     */
    _swap(l: Index, r: Index): void;
    /**
     * Transposes this matrix in place.
     * @returns This matrix instance for method chaining
     */
    transpose(): MutableMatrix33;
    /**
     * Inverts this matrix in place using the determinant method.
     * Logs an error if the determinant is 0 (matrix is not invertible).
     * @returns This matrix instance for method chaining
     */
    invert(): MutableMatrix33;
    /**
     * Sets this matrix to a rotation matrix around the X-axis.
     * @param radian - The rotation angle in radians
     * @returns This matrix instance for method chaining
     */
    rotateX(radian: number): MutableMatrix33;
    /**
     * Sets this matrix to a rotation matrix around the Y-axis.
     * @param radian - The rotation angle in radians
     * @returns This matrix instance for method chaining
     */
    rotateY(radian: number): MutableMatrix33;
    /**
     * Sets this matrix to a rotation matrix around the Z-axis.
     * @param radian - The rotation angle in radians
     * @returns This matrix instance for method chaining
     */
    rotateZ(radian: number): MutableMatrix33;
    /**
     * Sets this matrix to a rotation matrix for combined X, Y, and Z axis rotations.
     * Rotations are applied in the order: Z * Y * X (which means X is applied first, then Y, then Z).
     * @param x - Rotation angle around X-axis in radians
     * @param y - Rotation angle around Y-axis in radians
     * @param z - Rotation angle around Z-axis in radians
     * @returns This matrix instance for method chaining
     */
    rotateXYZ(x: number, y: number, z: number): MutableMatrix33;
    /**
     * Sets this matrix to a rotation matrix from a vector containing rotation angles.
     * @param vec - A vector containing rotation angles for X, Y, and Z axes in radians
     * @returns This matrix instance for method chaining
     */
    rotate(vec: IVector3): MutableMatrix33;
    /**
     * Sets this matrix to a scaling matrix.
     * @param vec - A vector containing scale factors for X, Y, and Z axes
     * @returns This matrix instance for method chaining
     */
    scale(vec: IVector3): MutableMatrix33;
    /**
     * Multiplies this matrix by a scale matrix, applying scaling to the existing transformation.
     * Each column of the matrix is scaled by the corresponding component of the vector.
     * @param vec - A vector containing scale factors for X, Y, and Z axes
     * @returns This matrix instance for method chaining
     */
    multiplyScale(vec: IVector3): MutableMatrix33;
    /**
     * Multiplies this matrix by another matrix from the right side (this = this * mat).
     * If the input matrix is an identity matrix, no operation is performed for optimization.
     * @param mat - The matrix to multiply with from the right
     * @returns This matrix instance for method chaining
     */
    multiply(mat: IMatrix33): MutableMatrix33;
    /**
     * Multiplies this matrix by another matrix from the left side (this = mat * this).
     * If the input matrix is an identity matrix, no operation is performed for optimization.
     * @param mat - The matrix to multiply with from the left
     * @returns This matrix instance for method chaining
     */
    multiplyByLeft(mat: IMatrix33): MutableMatrix33;
    /**
     * Creates a new matrix from 9 values specified in row-major order.
     * This is more intuitive when writing matrix values as they appear visually.
     * @param m00 - Element at position (0,0)
     * @param m01 - Element at position (0,1)
     * @param m02 - Element at position (0,2)
     * @param m10 - Element at position (1,0)
     * @param m11 - Element at position (1,1)
     * @param m12 - Element at position (1,2)
     * @param m20 - Element at position (2,0)
     * @param m21 - Element at position (2,1)
     * @param m22 - Element at position (2,2)
     * @returns A new MutableMatrix33 instance
     */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33;
    /**
     * Creates a new matrix from 9 values specified in column-major order.
     * This matches the internal storage format of WebGL matrices.
     * @param m00 - Element at position (0,0)
     * @param m10 - Element at position (1,0)
     * @param m20 - Element at position (2,0)
     * @param m01 - Element at position (0,1)
     * @param m11 - Element at position (1,1)
     * @param m21 - Element at position (2,1)
     * @param m02 - Element at position (0,2)
     * @param m12 - Element at position (1,2)
     * @param m22 - Element at position (2,2)
     * @returns A new MutableMatrix33 instance
     */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): MutableMatrix33;
    /**
     * Creates a new 3x3 matrix by copying the upper-left 3x3 portion of a 4x4 matrix.
     * @param mat - The 4x4 matrix to copy from
     * @returns A new MutableMatrix33 instance
     */
    static fromCopyMatrix44(mat: IMatrix44): MutableMatrix33;
    /**
     * Creates a new matrix using the provided Float32Array directly (no copy).
     * The array should contain 9 elements in column-major order.
     * @param float32Array - A Float32Array containing the matrix data
     * @returns A new MutableMatrix33 instance that shares the array reference
     */
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix33;
    /**
     * Creates a new matrix by copying data from a Float32Array in column-major order.
     * @param float32Array - A Float32Array containing the matrix data to copy
     * @returns A new MutableMatrix33 instance with copied data
     */
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix33;
    /**
     * Creates a new matrix by copying data from a Float32Array in row-major order.
     * The data is converted to column-major order during the copy process.
     * @param array - A Float32Array containing the matrix data in row-major order
     * @returns A new MutableMatrix33 instance with converted data
     */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix33;
    /**
     * Creates a new matrix by copying from another 3x3 matrix.
     * @param mat - The source matrix to copy from
     * @returns A new MutableMatrix33 instance with copied data
     */
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix33;
    /**
     * Creates a new matrix from a 9-element array in column-major order.
     * @param array - An array containing exactly 9 numbers in column-major order
     * @returns A new MutableMatrix33 instance
     */
    static fromCopyArray9ColumnMajor(array: Array9<number>): MutableMatrix33;
    /**
     * Creates a new matrix from an array in column-major order.
     * Only the first 9 elements are used if the array is larger.
     * @param array - An array containing the matrix data in column-major order
     * @returns A new MutableMatrix33 instance
     */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix33;
    /**
     * Creates a new matrix from a 9-element array in row-major order.
     * The data is converted to column-major order during the creation process.
     * @param array - An array containing exactly 9 numbers in row-major order
     * @returns A new MutableMatrix33 instance
     */
    static fromCopyArray9RowMajor(array: Array9<number>): MutableMatrix33;
    /**
     * Creates a new matrix from an array in row-major order.
     * Only the first 9 elements are used if the array is larger.
     * The data is converted to column-major order during the creation process.
     * @param array - An array containing the matrix data in row-major order
     * @returns A new MutableMatrix33 instance
     */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix33;
    /**
     * Creates a new rotation matrix from a quaternion.
     * Converts the quaternion representation to its equivalent 3x3 rotation matrix.
     * @param q - The quaternion to convert (should be normalized)
     * @returns A new MutableMatrix33 instance representing the rotation
     */
    static fromCopyQuaternion(q: IQuaternion): MutableMatrix33;
}
