import type { Array9, FloatTypedArrayConstructor, Index, TypedArray } from '../../types/CommonTypes';
import type { IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix33 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { Matrix33_ } from './Matrix33';
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
export declare class MutableMatrix33_<T extends FloatTypedArrayConstructor> extends Matrix33_<T> implements IMutableMatrix, IMutableMatrix33 {
    /**
     * Creates a new MutableMatrix33_ instance.
     * @param m - The typed array containing the matrix components
     * @param options - Configuration object containing the typed array constructor
     */
    constructor(m: TypedArray, options: {
        type: T;
    });
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
     * Creates a copy of this matrix.
     * @returns A new MutableMatrix33 instance with the same values
     */
    clone(): MutableMatrix33;
    /**
     * Gets the raw Float32Array containing the matrix data.
     * @returns The underlying Float32Array in column-major order
     */
    raw(): TypedArray;
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
     * Attempts to invert this matrix in place.
     *
     * The matrix is left unchanged when it is numerically singular, which
     * lets callers keep the previous valid value.
     *
     * @returns True if the inversion succeeded, false if the matrix is singular
     */
    tryInvert(): boolean;
    /**
     * Inverts this matrix in place using the determinant method.
     *
     * If the matrix is numerically singular, it is set to the identity matrix
     * instead of being filled with `Infinity`/`NaN`.
     * Use {@link MutableMatrix33.tryInvert} when the caller needs to detect the failure.
     *
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
}
export declare class MutableMatrix33 extends MutableMatrix33_<Float32ArrayConstructor> {
    /**
     * Creates a new MutableMatrix33 instance.
     * @param m - The typed array containing the matrix components
     */
    constructor(m: TypedArray);
    /** Creates a zero matrix. */
    static zero(): MutableMatrix33;
    /** Creates an identity matrix (optimized IdentityMatrix33 instance). */
    static identity(): MutableMatrix33;
    /** Creates a dummy matrix with an empty array. */
    static dummy(): MutableMatrix33;
    /** Creates the transpose of the given matrix. */
    static transpose(mat: IMatrix33): MutableMatrix33;
    /** Attempts to invert the given matrix, returning null when it is singular. */
    static tryInvert(mat: IMatrix33): MutableMatrix33 | null;
    /** Creates the inverse of the given matrix (identity when singular). */
    static invert(mat: IMatrix33): MutableMatrix33;
    /** Attempts to invert the given matrix into outMat. */
    static tryInvertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): boolean;
    /** Inverts the given matrix into outMat (identity when singular). */
    static invertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): T;
    /** Creates a rotation matrix around the X-axis. */
    static rotateX(radian: number): MutableMatrix33;
    /** Creates a rotation matrix around the Y-axis. */
    static rotateY(radian: number): MutableMatrix33;
    /** Creates a rotation matrix around the Z-axis. */
    static rotateZ(radian: number): MutableMatrix33;
    /** Creates a rotation matrix from Euler angles in XYZ order. */
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix33;
    /** Creates a rotation matrix from a Vector3 containing Euler angles. */
    static rotate(vec: IVector3): MutableMatrix33;
    /** Creates a scaling matrix. */
    static scale(vec: IVector3): MutableMatrix33;
    /** Multiplies two matrices. */
    static multiply(l_mat: IMatrix33, r_mat: IMatrix33): MutableMatrix33;
    /** Multiplies two matrices and stores the result in outMat. */
    static multiplyTo<T extends IMutableMatrix33>(l_mat: IMatrix33, r_mat: IMatrix33, outMat: T): T;
    /** Creates a matrix from row-major components. */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33;
    /** Creates a matrix from column-major components. */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): MutableMatrix33;
    /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
    static fromCopyMatrix44(mat: IMatrix44): MutableMatrix33;
    /** Creates a matrix that directly uses the given Float32Array. */
    static fromFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix33;
    /** Creates a matrix by copying a Float32Array in column-major order. */
    static fromCopyFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix33;
    /** Creates a matrix by copying a Float32Array in row-major order. */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix33;
    /** Creates a matrix by copying another matrix. */
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix33;
    /** Creates a matrix from a 9-element array in column-major order. */
    static fromCopyArray9ColumnMajor(array: Array9<number>): MutableMatrix33;
    /** Creates a matrix from an array in column-major order. */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix33;
    /** Creates a matrix from a 9-element array in row-major order. */
    static fromCopyArray9RowMajor(array: Array9<number>): MutableMatrix33;
    /** Creates a matrix from an array in row-major order. */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix33;
    /** Creates a matrix from a quaternion representing a rotation. */
    static fromCopyQuaternion(q: IQuaternion): MutableMatrix33;
}
/**
 * Immutable 3x3 matrix with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export declare class MutableMatrix33D extends MutableMatrix33_<Float64ArrayConstructor> {
    /**
     * Creates a new MutableMatrix33D instance.
     * @param m - The typed array containing the matrix components
     */
    private constructor();
    /** Creates a zero matrix. */
    static zero(): MutableMatrix33D;
    /** Creates an identity matrix. */
    static identity(): MutableMatrix33D;
    /** Creates a dummy matrix with an empty array. */
    static dummy(): MutableMatrix33D;
    /** Creates the transpose of the given matrix. */
    static transpose(mat: IMatrix33): MutableMatrix33D;
    /** Attempts to invert the given matrix, returning null when it is singular. */
    static tryInvert(mat: IMatrix33): MutableMatrix33D | null;
    /** Creates the inverse of the given matrix (identity when singular). */
    static invert(mat: IMatrix33): MutableMatrix33D;
    /** Attempts to invert the given matrix into outMat. */
    static tryInvertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): boolean;
    /** Inverts the given matrix into outMat (identity when singular). */
    static invertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): T;
    /** Creates a rotation matrix around the X-axis. */
    static rotateX(radian: number): MutableMatrix33D;
    /** Creates a rotation matrix around the Y-axis. */
    static rotateY(radian: number): MutableMatrix33D;
    /** Creates a rotation matrix around the Z-axis. */
    static rotateZ(radian: number): MutableMatrix33D;
    /** Creates a rotation matrix from Euler angles in XYZ order. */
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix33D;
    /** Creates a rotation matrix from a Vector3 containing Euler angles. */
    static rotate(vec: IVector3): MutableMatrix33D;
    /** Creates a scaling matrix. */
    static scale(vec: IVector3): MutableMatrix33D;
    /** Multiplies two matrices. */
    static multiply(l_mat: IMatrix33, r_mat: IMatrix33): MutableMatrix33D;
    /** Multiplies two matrices and stores the result in outMat. */
    static multiplyTo<T extends IMutableMatrix33>(l_mat: IMatrix33, r_mat: IMatrix33, outMat: T): T;
    /** Creates a matrix from row-major components. */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): MutableMatrix33D;
    /** Creates a matrix from column-major components. */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): MutableMatrix33D;
    /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
    static fromCopyMatrix44(mat: IMatrix44): MutableMatrix33D;
    /** Creates a matrix that directly uses the given Float64Array. */
    static fromFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix33D;
    /** Creates a matrix by copying a Float64Array in column-major order. */
    static fromCopyFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix33D;
    /** Creates a matrix by copying a Float64Array in row-major order. */
    static fromCopyFloat64ArrayRowMajor(array: Float64Array): MutableMatrix33D;
    /** Creates a matrix by copying another matrix. */
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix33D;
    /** Creates a matrix from a 9-element array in column-major order. */
    static fromCopyArray9ColumnMajor(array: Array9<number>): MutableMatrix33D;
    /** Creates a matrix from an array in column-major order. */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix33D;
    /** Creates a matrix from a 9-element array in row-major order. */
    static fromCopyArray9RowMajor(array: Array9<number>): MutableMatrix33D;
    /** Creates a matrix from an array in row-major order. */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix33D;
    /** Creates a matrix from a quaternion representing a rotation. */
    static fromCopyQuaternion(q: IQuaternion): MutableMatrix33D;
}
/**
 * Alias for the 32-bit (Float32Array) implementation, making the precision explicit.
 */
export { MutableMatrix33 as MutableMatrix33F };
