import type { Array16, ArrayType, FloatTypedArrayConstructor, Index, TypedArray } from '../../types/CommonTypes';
import type { IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix44 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { Matrix44_ } from './Matrix44';
import type { MutableVector3 } from './MutableVector3';
/**
 * A mutable 4x4 matrix class that extends the immutable Matrix44 class.
 *
 * This class provides a mutable interface for 4x4 matrix operations commonly used
 * in 3D graphics, including transformations, rotations, scaling, and projections.
 * The matrix is stored in column-major order internally, which is compatible with WebGL.
 *
 * @example
 * ```typescript
 * const matrix = MutableMatrix44.identity();
 * matrix.translate(Vector3.fromCopy(1, 2, 3));
 * matrix.rotateY(Math.PI / 4);
 * ```
 */
export declare class MutableMatrix44_<T extends FloatTypedArrayConstructor> extends Matrix44_<T> implements IMutableMatrix, IMutableMatrix44 {
    /**
     * Creates a new MutableMatrix44_ instance.
     * @param m - The typed array containing the matrix components
     * @param options - Configuration object containing the typed array constructor
     */
    constructor(m: TypedArray, options: {
        type: T;
    });
    /**
     * Sets the value at position (0,0) in the matrix.
     *
     * @param val - The value to set
     */
    set m00(val: number);
    /**
     * Gets the value at position (0,0) in the matrix.
     *
     * @returns The value at position (0,0)
     */
    get m00(): number;
    /**
     * Sets the value at position (1,0) in the matrix.
     *
     * @param val - The value to set
     */
    set m10(val: number);
    /**
     * Gets the value at position (1,0) in the matrix.
     *
     * @returns The value at position (1,0)
     */
    get m10(): number;
    /**
     * Sets the value at position (2,0) in the matrix.
     *
     * @param val - The value to set
     */
    set m20(val: number);
    /**
     * Gets the value at position (2,0) in the matrix.
     *
     * @returns The value at position (2,0)
     */
    get m20(): number;
    /**
     * Sets the value at position (3,0) in the matrix.
     *
     * @param val - The value to set
     */
    set m30(val: number);
    /**
     * Gets the value at position (3,0) in the matrix.
     *
     * @returns The value at position (3,0)
     */
    get m30(): number;
    /**
     * Sets the value at position (0,1) in the matrix.
     *
     * @param val - The value to set
     */
    set m01(val: number);
    /**
     * Gets the value at position (0,1) in the matrix.
     *
     * @returns The value at position (0,1)
     */
    get m01(): number;
    /**
     * Sets the value at position (1,1) in the matrix.
     *
     * @param val - The value to set
     */
    set m11(val: number);
    /**
     * Gets the value at position (1,1) in the matrix.
     *
     * @returns The value at position (1,1)
     */
    get m11(): number;
    /**
     * Sets the value at position (2,1) in the matrix.
     *
     * @param val - The value to set
     */
    set m21(val: number);
    /**
     * Gets the value at position (2,1) in the matrix.
     *
     * @returns The value at position (2,1)
     */
    get m21(): number;
    /**
     * Sets the value at position (3,1) in the matrix.
     *
     * @param val - The value to set
     */
    set m31(val: number);
    /**
     * Gets the value at position (3,1) in the matrix.
     *
     * @returns The value at position (3,1)
     */
    get m31(): number;
    /**
     * Sets the value at position (0,2) in the matrix.
     *
     * @param val - The value to set
     */
    set m02(val: number);
    /**
     * Gets the value at position (0,2) in the matrix.
     *
     * @returns The value at position (0,2)
     */
    get m02(): number;
    /**
     * Sets the value at position (1,2) in the matrix.
     *
     * @param val - The value to set
     */
    set m12(val: number);
    /**
     * Gets the value at position (1,2) in the matrix.
     *
     * @returns The value at position (1,2)
     */
    get m12(): number;
    /**
     * Sets the value at position (2,2) in the matrix.
     *
     * @param val - The value to set
     */
    set m22(val: number);
    /**
     * Gets the value at position (2,2) in the matrix.
     *
     * @returns The value at position (2,2)
     */
    get m22(): number;
    /**
     * Sets the value at position (3,2) in the matrix.
     *
     * @param val - The value to set
     */
    set m32(val: number);
    /**
     * Gets the value at position (3,2) in the matrix.
     *
     * @returns The value at position (3,2)
     */
    get m32(): number;
    /**
     * Sets the value at position (0,3) in the matrix.
     *
     * @param val - The value to set
     */
    set m03(val: number);
    /**
     * Gets the value at position (0,3) in the matrix.
     *
     * @returns The value at position (0,3)
     */
    get m03(): number;
    /**
     * Sets the value at position (1,3) in the matrix.
     *
     * @param val - The value to set
     */
    set m13(val: number);
    /**
     * Gets the value at position (1,3) in the matrix.
     *
     * @returns The value at position (1,3)
     */
    get m13(): number;
    /**
     * Sets the value at position (2,3) in the matrix.
     *
     * @param val - The value to set
     */
    set m23(val: number);
    /**
     * Gets the value at position (2,3) in the matrix.
     *
     * @returns The value at position (2,3)
     */
    get m23(): number;
    /**
     * Sets the value at position (3,3) in the matrix.
     *
     * @param val - The value to set
     */
    set m33(val: number);
    /**
     * Gets the value at position (3,3) in the matrix.
     *
     * @returns The value at position (3,3)
     */
    get m33(): number;
    /**
     * Gets the X translation component from the matrix.
     *
     * @returns The X translation value
     */
    get translateX(): number;
    /**
     * Sets the X translation component in the matrix.
     *
     * @param val - The X translation value to set
     */
    set translateX(val: number);
    /**
     * Gets the Y translation component from the matrix.
     *
     * @returns The Y translation value
     */
    get translateY(): number;
    /**
     * Sets the Y translation component in the matrix.
     *
     * @param val - The Y translation value to set
     */
    set translateY(val: number);
    /**
     * Gets the Z translation component from the matrix.
     *
     * @returns The Z translation value
     */
    get translateZ(): number;
    /**
     * Sets the Z translation component in the matrix.
     *
     * @param val - The Z translation value to set
     */
    set translateZ(val: number);
    /**
     * Gets the class name identifier for this matrix type.
     *
     * @returns The string 'MutableMatrix44'
     */
    get className(): string;
    /**
     * Creates a copy of this matrix.
     *
     * @returns A new MutableMatrix44 instance with the same values as this matrix
     */
    clone(): MutableMatrix44;
    /**
     * Extracts the rotation part of this matrix.
     *
     * @returns A new MutableMatrix44 instance containing only the rotation transformation
     */
    getRotate(): MutableMatrix44;
    /**
     * Extracts the translation part of this matrix.
     *
     * @returns A new MutableVector3 instance containing the translation values
     */
    getTranslate(): MutableVector3;
    /**
     * Extracts the translation part of this matrix into the provided vector.
     *
     * @param outVec - The vector to store the translation values
     * @returns The output vector with translation values
     */
    getTranslateTo(outVec: MutableVector3): MutableVector3;
    /**
     * Extracts the scale part of this matrix.
     *
     * @returns A new MutableVector3 instance containing the scale values for each axis
     */
    getScale(): MutableVector3;
    /**
     * Gets the raw Float32Array containing the matrix data.
     *
     * @returns The internal Float32Array with matrix values in column-major order
     */
    raw(): TypedArray;
    /**
     * Sets a value at the specified row and column position.
     *
     * @param row_i - The row index (0-3)
     * @param column_i - The column index (0-3)
     * @param value - The value to set
     * @returns This matrix instance for method chaining
     */
    setAt(row_i: number, column_i: number, value: number): MutableMatrix44;
    /**
     * Sets all 16 components of the matrix with individual values.
     * Values are specified in row-major order but stored internally in column-major order.
     *
     * @param m00 - Element at row 0, column 0
     * @param m01 - Element at row 0, column 1
     * @param m02 - Element at row 0, column 2
     * @param m03 - Element at row 0, column 3
     * @param m10 - Element at row 1, column 0
     * @param m11 - Element at row 1, column 1
     * @param m12 - Element at row 1, column 2
     * @param m13 - Element at row 1, column 3
     * @param m20 - Element at row 2, column 0
     * @param m21 - Element at row 2, column 1
     * @param m22 - Element at row 2, column 2
     * @param m23 - Element at row 2, column 3
     * @param m30 - Element at row 3, column 0
     * @param m31 - Element at row 3, column 1
     * @param m32 - Element at row 3, column 2
     * @param m33 - Element at row 3, column 3
     * @returns This matrix instance for method chaining
     */
    setComponents(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): MutableMatrix44;
    /**
     * Copies all components from another matrix to this matrix.
     *
     * @param mat - The source matrix to copy from
     * @returns This matrix instance for method chaining
     */
    copyComponents(mat: IMatrix44): MutableMatrix44;
    /**
     * Sets this matrix to the zero matrix (all elements are 0).
     *
     * @returns This matrix instance for method chaining
     */
    zero(): MutableMatrix44;
    /**
     * Sets this matrix to the identity matrix.
     *
     * @returns This matrix instance for method chaining
     */
    identity(): MutableMatrix44;
    _swap(l: Index, r: Index): void;
    /**
     * Transposes this matrix in place (swaps rows and columns).
     *
     * @returns This matrix instance for method chaining
     */
    transpose(): MutableMatrix44;
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
     * Use {@link MutableMatrix44.tryInvert} when the caller needs to detect the failure.
     *
     * @returns This matrix instance for method chaining
     */
    invert(): MutableMatrix44;
    /**
     * Sets this matrix to a translation matrix with the given vector.
     *
     * @param vec - The translation vector
     * @returns This matrix instance for method chaining
     */
    translate(vec: IVector3): MutableMatrix44;
    /**
     * Sets the translation component of this matrix without affecting other components.
     *
     * @param vec - The translation vector to set
     * @returns This matrix instance for method chaining
     */
    putTranslate(vec: IVector3): MutableMatrix44;
    /**
     * Adds the given vector to the current translation component.
     *
     * @param vec - The translation vector to add
     * @returns This matrix instance for method chaining
     */
    addTranslate(vec: IVector3): MutableMatrix44;
    /**
     * Sets this matrix to a rotation matrix around the X-axis.
     *
     * @param radian - The rotation angle in radians
     * @returns This matrix instance for method chaining
     */
    rotateX(radian: number): MutableMatrix44;
    /**
     * Sets this matrix to a rotation matrix around the Y-axis.
     *
     * @param radian - The rotation angle in radians
     * @returns This matrix instance for method chaining
     */
    rotateY(radian: number): MutableMatrix44;
    /**
     * Sets this matrix to a rotation matrix around the Z-axis.
     *
     * @param radian - The rotation angle in radians
     * @returns This matrix instance for method chaining
     */
    rotateZ(radian: number): MutableMatrix44;
    /**
     * Sets this matrix to a rotation matrix with rotations around X, Y, and Z axes in that order.
     * The rotation order is: Z * Y * X (applied from right to left).
     *
     * @param x - Rotation angle around X-axis in radians
     * @param y - Rotation angle around Y-axis in radians
     * @param z - Rotation angle around Z-axis in radians
     * @returns This matrix instance for method chaining
     */
    rotateXYZ(x: number, y: number, z: number): MutableMatrix44;
    /**
     * Sets this matrix to a rotation matrix from a vector containing X, Y, Z rotation angles.
     *
     * @param vec - Vector containing rotation angles (x, y, z) in radians
     * @returns This matrix instance for method chaining
     */
    rotate(vec: IVector3): MutableMatrix44;
    /**
     * Sets this matrix to a scaling matrix with the given vector.
     *
     * @param vec - The scaling factors for X, Y, and Z axes
     * @returns This matrix instance for method chaining
     */
    scale(vec: IVector3): MutableMatrix44;
    /**
     * Multiplies the scaling factors to the current matrix.
     * This applies scaling transformation to each column of the matrix.
     *
     * @param vec - The scaling factors for X, Y, and Z axes
     * @returns This matrix instance for method chaining
     */
    multiplyScale(vec: IVector3): MutableMatrix44;
    /**
     * Multiplies this matrix by another matrix from the right side (this * mat).
     * This operation transforms this matrix in place.
     *
     * @param mat - The matrix to multiply from the right
     * @returns This matrix instance for method chaining
     */
    multiply(mat: IMatrix44): MutableMatrix44;
    /**
     * Multiplies this matrix by another matrix from the left side (mat * this).
     * This operation transforms this matrix in place.
     *
     * @param mat - The matrix to multiply from the left
     * @returns This matrix instance for method chaining
     */
    multiplyByLeft(mat: IMatrix44): MutableMatrix44;
    /**
     * Sets this matrix to a rotation matrix based on the given quaternion.
     *
     * @param quat - The quaternion to convert to a rotation matrix
     * @returns This matrix instance for method chaining
     */
    fromQuaternion(quat: IQuaternion): MutableMatrix44;
}
export declare class MutableMatrix44 extends MutableMatrix44_<Float32ArrayConstructor> {
    /**
     * Creates a new MutableMatrix44 instance.
     * @param m - The typed array containing the matrix components
     */
    constructor(m: TypedArray);
    /** Creates a zero matrix. */
    static zero(): MutableMatrix44;
    /** Creates an identity matrix (optimized IdentityMatrix44 instance). */
    static identity(): MutableMatrix44;
    /** Creates a dummy matrix with an empty array. */
    static dummy(): MutableMatrix44;
    /** Creates the transpose of the given matrix. */
    static transpose(mat: IMatrix44): MutableMatrix44;
    /** Attempts to invert the given matrix, returning null when it is singular. */
    static tryInvert(mat: IMatrix44): MutableMatrix44 | null;
    /** Creates the inverse of the given matrix (identity when singular). */
    static invert(mat: IMatrix44): MutableMatrix44;
    /** Attempts to invert the given matrix into outMat. */
    static tryInvertTo<T extends IMutableMatrix44>(mat: IMatrix44, outMat: T): boolean;
    /** Inverts the given matrix into outMat (identity when singular). */
    static invertTo<T extends IMutableMatrix44>(mat: IMatrix44, outMat: T): T;
    /** Creates a translation matrix. */
    static translate(vec: IVector3): MutableMatrix44;
    /** Creates a rotation matrix around the X-axis. */
    static rotateX(radian: number): MutableMatrix44;
    /** Creates a rotation matrix around the Y-axis. */
    static rotateY(radian: number): MutableMatrix44;
    /** Creates a rotation matrix around the Z-axis. */
    static rotateZ(radian: number): MutableMatrix44;
    /** Creates a rotation matrix from Euler angles in XYZ order. */
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix44;
    /** Creates a rotation matrix from a vector containing Euler angles. */
    static rotate(vec: IVector3): MutableMatrix44;
    /** Creates a scaling matrix. */
    static scale(vec: IVector3): MutableMatrix44;
    /** Multiplies two matrices. */
    static multiply(l_mat: IMatrix44, r_mat: IMatrix44): MutableMatrix44;
    /** Multiplies two matrices and stores the result in outMat. */
    static multiplyTo<T extends IMutableMatrix44>(l_mat: IMatrix44, r_mat: IMatrix44, outMat: T): T;
    /** Multiplies a matrix with typed array data and stores the result in outMat. */
    static multiplyTypedArrayTo<T extends IMutableMatrix44>(l_mat: IMatrix44, r_array: ArrayType, outMat: T, offsetAsComposition: number): T;
    /** Creates a rotation matrix from a quaternion and stores it in outMat. */
    static fromQuaternionTo<T extends IMutableMatrix44>(quat: IQuaternion, outMat: T): T;
    /** Creates a matrix from row-major components. */
    static fromCopy16RowMajor(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): MutableMatrix44;
    /** Creates a matrix from column-major components. */
    static fromCopy16ColumnMajor(m00: number, m10: number, m20: number, m30: number, m01: number, m11: number, m21: number, m31: number, m02: number, m12: number, m22: number, m32: number, m03: number, m13: number, m23: number, m33: number): MutableMatrix44;
    /** Creates a matrix by copying another matrix. */
    static fromCopyMatrix44(mat: IMatrix44): MutableMatrix44;
    /** Creates a matrix that directly uses the given Float32Array. */
    static fromFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix44;
    /** Creates a matrix by copying a Float32Array in column-major order. */
    static fromCopyFloat32ArrayColumnMajor(array: Float32Array): MutableMatrix44;
    /** Creates a matrix by copying a Float32Array in row-major order. */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix44;
    /** Creates a matrix from a 3x3 matrix embedded in the upper-left corner. */
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix44;
    /** Creates a matrix from a 16-element array in column-major order. */
    static fromCopyArray16ColumnMajor(array: Array16<number>): MutableMatrix44;
    /** Creates a matrix from an array in column-major order. */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix44;
    /** Creates a matrix from a 16-element array in row-major order. */
    static fromCopyArray16RowMajor(array: Array16<number>): MutableMatrix44;
    /** Creates a matrix from an array in row-major order. */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix44;
    /** Creates a rotation matrix from a quaternion. */
    static fromCopyQuaternion(q: IQuaternion): MutableMatrix44;
}
/**
 * Immutable 4x4 matrix with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export declare class MutableMatrix44D extends MutableMatrix44_<Float64ArrayConstructor> {
    /**
     * Creates a new MutableMatrix44D instance.
     * @param m - The typed array containing the matrix components
     */
    private constructor();
    /** Creates a zero matrix. */
    static zero(): MutableMatrix44D;
    /** Creates an identity matrix. */
    static identity(): MutableMatrix44D;
    /** Creates a dummy matrix with an empty array. */
    static dummy(): MutableMatrix44D;
    /** Creates the transpose of the given matrix. */
    static transpose(mat: IMatrix44): MutableMatrix44D;
    /** Attempts to invert the given matrix, returning null when it is singular. */
    static tryInvert(mat: IMatrix44): MutableMatrix44D | null;
    /** Creates the inverse of the given matrix (identity when singular). */
    static invert(mat: IMatrix44): MutableMatrix44D;
    /** Attempts to invert the given matrix into outMat. */
    static tryInvertTo<T extends IMutableMatrix44>(mat: IMatrix44, outMat: T): boolean;
    /** Inverts the given matrix into outMat (identity when singular). */
    static invertTo<T extends IMutableMatrix44>(mat: IMatrix44, outMat: T): T;
    /** Creates a translation matrix. */
    static translate(vec: IVector3): MutableMatrix44D;
    /** Creates a rotation matrix around the X-axis. */
    static rotateX(radian: number): MutableMatrix44D;
    /** Creates a rotation matrix around the Y-axis. */
    static rotateY(radian: number): MutableMatrix44D;
    /** Creates a rotation matrix around the Z-axis. */
    static rotateZ(radian: number): MutableMatrix44D;
    /** Creates a rotation matrix from Euler angles in XYZ order. */
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix44D;
    /** Creates a rotation matrix from a vector containing Euler angles. */
    static rotate(vec: IVector3): MutableMatrix44D;
    /** Creates a scaling matrix. */
    static scale(vec: IVector3): MutableMatrix44D;
    /** Multiplies two matrices. */
    static multiply(l_mat: IMatrix44, r_mat: IMatrix44): MutableMatrix44D;
    /** Multiplies two matrices and stores the result in outMat. */
    static multiplyTo<T extends IMutableMatrix44>(l_mat: IMatrix44, r_mat: IMatrix44, outMat: T): T;
    /** Multiplies a matrix with typed array data and stores the result in outMat. */
    static multiplyTypedArrayTo<T extends IMutableMatrix44>(l_mat: IMatrix44, r_array: ArrayType, outMat: T, offsetAsComposition: number): T;
    /** Creates a rotation matrix from a quaternion and stores it in outMat. */
    static fromQuaternionTo<T extends IMutableMatrix44>(quat: IQuaternion, outMat: T): T;
    /** Creates a matrix from row-major components. */
    static fromCopy16RowMajor(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): MutableMatrix44D;
    /** Creates a matrix from column-major components. */
    static fromCopy16ColumnMajor(m00: number, m10: number, m20: number, m30: number, m01: number, m11: number, m21: number, m31: number, m02: number, m12: number, m22: number, m32: number, m03: number, m13: number, m23: number, m33: number): MutableMatrix44D;
    /** Creates a matrix by copying another matrix. */
    static fromCopyMatrix44(mat: IMatrix44): MutableMatrix44D;
    /** Creates a matrix that directly uses the given Float64Array. */
    static fromFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix44D;
    /** Creates a matrix by copying a Float64Array in column-major order. */
    static fromCopyFloat64ArrayColumnMajor(array: Float64Array): MutableMatrix44D;
    /** Creates a matrix by copying a Float64Array in row-major order. */
    static fromCopyFloat64ArrayRowMajor(array: Float64Array): MutableMatrix44D;
    /** Creates a matrix from a 3x3 matrix embedded in the upper-left corner. */
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix44D;
    /** Creates a matrix from a 16-element array in column-major order. */
    static fromCopyArray16ColumnMajor(array: Array16<number>): MutableMatrix44D;
    /** Creates a matrix from an array in column-major order. */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix44D;
    /** Creates a matrix from a 16-element array in row-major order. */
    static fromCopyArray16RowMajor(array: Array16<number>): MutableMatrix44D;
    /** Creates a matrix from an array in row-major order. */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix44D;
    /** Creates a rotation matrix from a quaternion. */
    static fromCopyQuaternion(q: IQuaternion): MutableMatrix44D;
}
/**
 * Alias for the 32-bit (Float32Array) implementation, making the precision explicit.
 */
export { MutableMatrix44 as MutableMatrix44F };
