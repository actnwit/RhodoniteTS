import type { Array16, Index } from '../../types/CommonTypes';
import type { IMatrix33, IMatrix44, IMutableMatrix, IMutableMatrix44 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { Matrix44 } from './Matrix44';
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
export declare class MutableMatrix44 extends Matrix44 implements IMutableMatrix, IMutableMatrix44 {
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
     * Creates a zero matrix (all elements are 0).
     *
     * @returns A new MutableMatrix44 instance with all elements set to 0
     */
    static zero(): MutableMatrix44;
    /**
     * Creates an identity matrix.
     *
     * @returns A new MutableMatrix44 instance representing the 4x4 identity matrix
     */
    static identity(): MutableMatrix44;
    /**
     * Creates a dummy matrix (typically used as a placeholder).
     *
     * @returns A new MutableMatrix44 instance representing a dummy matrix
     */
    static dummy(): MutableMatrix44;
    /**
     * Creates a transposed matrix from the given matrix.
     *
     * @param mat - The matrix to transpose
     * @returns A new MutableMatrix44 instance that is the transpose of the input matrix
     */
    static transpose(mat: IMatrix44): MutableMatrix44;
    /**
     * Creates an inverted matrix from the given matrix.
     *
     * @param mat - The matrix to invert
     * @returns A new MutableMatrix44 instance that is the inverse of the input matrix
     */
    static invert(mat: IMatrix44): MutableMatrix44;
    /**
     * Creates a translation matrix from the given vector.
     *
     * @param vec - The translation vector
     * @returns A new MutableMatrix44 instance representing the translation transformation
     */
    static translate(vec: IVector3): MutableMatrix44;
    /**
     * Creates a rotation matrix around the X-axis.
     *
     * @param radian - The rotation angle in radians
     * @returns A new MutableMatrix44 instance representing the X-axis rotation
     */
    static rotateX(radian: number): MutableMatrix44;
    /**
     * Creates a rotation matrix around the Y-axis.
     *
     * @param radian - The rotation angle in radians
     * @returns A new MutableMatrix44 instance representing the Y-axis rotation
     */
    static rotateY(radian: number): MutableMatrix44;
    /**
     * Creates a rotation matrix around the Z-axis.
     *
     * @param radian - The rotation angle in radians
     * @returns A new MutableMatrix44 instance representing the Z-axis rotation
     */
    static rotateZ(radian: number): MutableMatrix44;
    /**
     * Creates a rotation matrix with rotations around X, Y, and Z axes in that order.
     *
     * @param x - Rotation angle around X-axis in radians
     * @param y - Rotation angle around Y-axis in radians
     * @param z - Rotation angle around Z-axis in radians
     * @returns A new MutableMatrix44 instance representing the combined rotation
     */
    static rotateXYZ(x: number, y: number, z: number): MutableMatrix44;
    /**
     * Creates a rotation matrix from a vector containing X, Y, Z rotation angles.
     *
     * @param vec - Vector containing rotation angles (x, y, z) in radians
     * @returns A new MutableMatrix44 instance representing the rotation transformation
     */
    static rotate(vec: IVector3): MutableMatrix44;
    /**
     * Creates a scaling matrix from the given vector.
     *
     * @param vec - The scaling factors for X, Y, and Z axes
     * @returns A new MutableMatrix44 instance representing the scaling transformation
     */
    static scale(vec: IVector3): MutableMatrix44;
    /**
     * Multiplies two matrices and returns the result as a new matrix.
     *
     * @param l_mat - The left matrix in the multiplication
     * @param r_mat - The right matrix in the multiplication
     * @returns A new MutableMatrix44 instance representing the product l_mat * r_mat
     */
    static multiply(l_mat: IMatrix44, r_mat: IMatrix44): MutableMatrix44;
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
    raw(): Float32Array;
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
     * Inverts this matrix in place.
     * The matrix must be invertible (determinant != 0), otherwise an error is logged.
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
    /**
     * Creates a matrix from 16 values in row-major order.
     * Values are provided in row-major order but stored internally in column-major order.
     *
     * @param m00-m33 - Matrix elements in row-major order
     * @returns A new MutableMatrix44 instance
     */
    static fromCopy16RowMajor(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): MutableMatrix44;
    /**
     * Creates a matrix from 16 values in column-major order.
     *
     * @param m00-m33 - Matrix elements in column-major order
     * @returns A new MutableMatrix44 instance
     */
    static fromCopy16ColumnMajor(m00: number, m10: number, m20: number, m30: number, m01: number, m11: number, m21: number, m31: number, m02: number, m12: number, m22: number, m32: number, m03: number, m13: number, m23: number, m33: number): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 from an existing Matrix44 instance.
     * This creates a copy of the matrix data, so modifications to the new matrix
     * will not affect the original.
     *
     * @param mat - The source Matrix44 to copy from
     * @returns A new MutableMatrix44 instance with copied data
     */
    static fromCopyMatrix44(mat: IMatrix44): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 directly from a Float32Array in column-major order.
     * This method does not copy the array, so the matrix will share the same memory
     * as the input array.
     *
     * @param float32Array - A Float32Array containing 16 elements in column-major order
     * @returns A new MutableMatrix44 instance using the provided array
     */
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 from a Float32Array in column-major order.
     * This method creates a copy of the input array, so modifications to the matrix
     * will not affect the original array.
     *
     * @param float32Array - A Float32Array containing 16 elements in column-major order
     * @returns A new MutableMatrix44 instance with copied data
     */
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 from a Float32Array in row-major order.
     * The input data is converted from row-major to column-major order during creation.
     *
     * @param array - A Float32Array containing 16 elements in row-major order
     * @returns A new MutableMatrix44 instance with data converted to column-major order
     */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 from a 3x3 matrix.
     * The 3x3 matrix is embedded in the upper-left corner of the 4x4 matrix,
     * with the bottom row and right column set to [0, 0, 0, 1].
     *
     * @param mat - The source 3x3 matrix to convert
     * @returns A new MutableMatrix44 instance with the 3x3 matrix embedded
     */
    static fromCopyMatrix33(mat: IMatrix33): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 from an Array16 in column-major order.
     * This method copies the array data into a new Float32Array.
     *
     * @param array - An Array16 containing 16 elements in column-major order
     * @returns A new MutableMatrix44 instance with copied data
     */
    static fromCopyArray16ColumnMajor(array: Array16<number>): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 from a regular array in column-major order.
     * Only the first 16 elements are used if the array is larger.
     *
     * @param array - An array containing at least 16 elements in column-major order
     * @returns A new MutableMatrix44 instance with copied data
     */
    static fromCopyArrayColumnMajor(array: Array<number>): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 from an Array16 in row-major order.
     * The input data is converted from row-major to column-major order during creation.
     *
     * @param array - An Array16 containing 16 elements in row-major order
     * @returns A new MutableMatrix44 instance with data converted to column-major order
     */
    static fromCopyArray16RowMajor(array: Array16<number>): MutableMatrix44;
    /**
     * Creates a new MutableMatrix44 from a regular array in row-major order.
     * The input data is converted from row-major to column-major order during creation.
     * Only the first 16 elements are used if the array is larger.
     *
     * @param array - An array containing at least 16 elements in row-major order
     * @returns A new MutableMatrix44 instance with data converted to column-major order
     */
    static fromCopyArrayRowMajor(array: Array<number>): MutableMatrix44;
    /**
     * Creates a matrix from a quaternion.
     *
     * @param q - The quaternion to convert
     * @returns A new MutableMatrix44 instance representing the rotation
     */
    static fromCopyQuaternion(q: IQuaternion): MutableMatrix44;
}
