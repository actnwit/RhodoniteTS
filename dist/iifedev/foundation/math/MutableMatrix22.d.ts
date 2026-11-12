import type { Array4, FloatTypedArrayConstructor, Index, TypedArray } from '../../types/CommonTypes';
import type { IMatrix22, IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix22 } from './IMatrix';
import type { IVector2 } from './IVector';
import { Matrix22_ } from './Matrix22';
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
export declare class MutableMatrix22_<T extends FloatTypedArrayConstructor> extends Matrix22_<T> implements IMutableMatrix, IMutableMatrix22 {
    /**
     * Creates a new MutableMatrix22_ instance.
     * @param m - The typed array containing the matrix components
     * @param options - Configuration object containing the typed array constructor
     */
    constructor(m: TypedArray, options: {
        type: T;
    });
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
    raw(): TypedArray;
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
     * Attempts to invert this matrix in place.
     *
     * The matrix is left unchanged when it is numerically singular, which
     * lets callers keep the previous valid value.
     *
     * @returns True if the inversion succeeded, false if the matrix is singular
     */
    tryInvert(): boolean;
    /**
     * Inverts this matrix in place.
     *
     * If the matrix is numerically singular, it is set to the identity matrix
     * instead of being filled with `Infinity`/`NaN`.
     * Use {@link MutableMatrix22.tryInvert} when the caller needs to detect the failure.
     *
     * @returns This matrix instance for method chaining
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
}
export declare class MutableMatrix22 extends MutableMatrix22_<Float32ArrayConstructor> {
    /**
     * Creates a new MutableMatrix22 instance.
     * @param m - The typed array containing the matrix components
     */
    constructor(m: TypedArray);
    /** Creates a zero matrix. */
    static zero(): MutableMatrix22;
    /** Creates an identity matrix. */
    static identity(): MutableMatrix22;
    /** Creates a dummy matrix with an empty array. */
    static dummy(): MutableMatrix22;
    /** Creates the transpose of the given matrix. */
    static transpose(mat: IMatrix22): MutableMatrix22;
    /** Attempts to invert the given matrix, returning null when it is singular. */
    static tryInvert(mat: IMatrix22): MutableMatrix22 | null;
    /** Creates the inverse of the given matrix (identity when singular). */
    static invert(mat: IMatrix22): MutableMatrix22;
    /** Attempts to invert the given matrix into outMat. */
    static tryInvertTo<T extends IMutableMatrix22>(mat: IMatrix22, outMat: T): boolean;
    /** Inverts the given matrix into outMat (identity when singular). */
    static invertTo<T extends IMutableMatrix22>(mat: IMatrix22, outMat: T): T;
    /** Creates a 2D rotation matrix. */
    static rotate(radian: number): MutableMatrix22;
    /** Creates a 2D scaling matrix. */
    static scale(vec: IVector2): MutableMatrix22;
    /** Multiplies two 2x2 matrices. */
    static multiply(l_mat: IMatrix22, r_mat: IMatrix22): MutableMatrix22;
    /** Multiplies two matrices and stores the result in outMat. */
    static multiplyTo<T extends IMutableMatrix22>(l_mat: IMatrix22, r_mat: IMatrix22, outMat: T): T;
    /** Creates a matrix from row-major components. */
    static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): MutableMatrix22;
    /** Creates a matrix from column-major components. */
    static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): MutableMatrix22;
    /** Creates a matrix that directly uses the given Float32Array. */
    static fromFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix22;
    /** Creates a matrix by copying a Float32Array in column-major order. */
    static fromCopyFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix22;
    /** Creates a matrix by copying a Float32Array in row-major order. */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix22;
    /** Creates a matrix by copying another matrix. */
    static fromCopyMatrix22(mat: IMatrix22): MutableMatrix22;
    /** Creates a matrix from a 4-element array in column-major order. */
    static fromCopyArray9ColumnMajor(array: Array4<number>): MutableMatrix22;
    /** Creates a matrix from an array in column-major order. */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix22;
    /** Creates a matrix from a 4-element array in row-major order. */
    static fromCopyArray9RowMajor(array: Array4<number>): MutableMatrix22;
    /** Creates a matrix from an array in row-major order. */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix22;
}
/**
 * Immutable 2x2 matrix with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export declare class MutableMatrix22D extends MutableMatrix22_<Float64ArrayConstructor> {
    /**
     * Creates a new MutableMatrix22D instance.
     * @param m - The typed array containing the matrix components
     */
    private constructor();
    /** Creates a zero matrix. */
    static zero(): MutableMatrix22D;
    /** Creates an identity matrix. */
    static identity(): MutableMatrix22D;
    /** Creates a dummy matrix with an empty array. */
    static dummy(): MutableMatrix22D;
    /** Creates the transpose of the given matrix. */
    static transpose(mat: IMatrix22): MutableMatrix22D;
    /** Attempts to invert the given matrix, returning null when it is singular. */
    static tryInvert(mat: IMatrix22): MutableMatrix22D | null;
    /** Creates the inverse of the given matrix (identity when singular). */
    static invert(mat: IMatrix22): MutableMatrix22D;
    /** Attempts to invert the given matrix into outMat. */
    static tryInvertTo<T extends IMutableMatrix22>(mat: IMatrix22, outMat: T): boolean;
    /** Inverts the given matrix into outMat (identity when singular). */
    static invertTo<T extends IMutableMatrix22>(mat: IMatrix22, outMat: T): T;
    /** Creates a 2D rotation matrix. */
    static rotate(radian: number): MutableMatrix22D;
    /** Creates a 2D scaling matrix. */
    static scale(vec: IVector2): MutableMatrix22D;
    /** Multiplies two 2x2 matrices. */
    static multiply(l_mat: IMatrix22, r_mat: IMatrix22): MutableMatrix22D;
    /** Multiplies two matrices and stores the result in outMat. */
    static multiplyTo<T extends IMutableMatrix22>(l_mat: IMatrix22, r_mat: IMatrix22, outMat: T): T;
    /** Creates a matrix from row-major components. */
    static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): MutableMatrix22D;
    /** Creates a matrix from column-major components. */
    static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): MutableMatrix22D;
    /** Creates a matrix that directly uses the given Float64Array. */
    static fromFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix22D;
    /** Creates a matrix by copying a Float64Array in column-major order. */
    static fromCopyFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix22D;
    /** Creates a matrix by copying a Float64Array in row-major order. */
    static fromCopyFloat64ArrayRowMajor(array: Float64Array): MutableMatrix22D;
    /** Creates a matrix by copying another matrix. */
    static fromCopyMatrix22(mat: IMatrix22): MutableMatrix22D;
    /** Creates a matrix from a 4-element array in column-major order. */
    static fromCopyArray9ColumnMajor(array: Array4<number>): MutableMatrix22D;
    /** Creates a matrix from an array in column-major order. */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix22D;
    /** Creates a matrix from a 4-element array in row-major order. */
    static fromCopyArray9RowMajor(array: Array4<number>): MutableMatrix22D;
    /** Creates a matrix from an array in row-major order. */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix22D;
}
/**
 * Alias for the 32-bit (Float32Array) implementation, making the precision explicit.
 */
export { MutableMatrix22 as MutableMatrix22F };
