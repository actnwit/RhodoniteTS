import type { Array16, ArrayType } from '../../types/CommonTypes';
import { type CompositionTypeEnum } from '../definitions/CompositionType';
import { AbstractMatrix } from './AbstractMatrix';
import { IdentityMatrix44 } from './IdentityMatrix44';
import type { IMatrix, IMatrix33, IMatrix44 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3, IVector4 } from './IVector';
import type { MutableMatrix44 } from './MutableMatrix44';
import type { MutableVector3 } from './MutableVector3';
import type { MutableVector4 } from './MutableVector4';
import { Vector3 } from './Vector3';
import { Vector4 } from './Vector4';
/**
 * Represents a 4x4 matrix stored in column-major order (OpenGL/WebGL style).
 * This class provides immutable matrix operations and is used for 3D transformations
 * including translation, rotation, and scaling.
 *
 * @example
 * ```typescript
 * const identity = Matrix44.identity();
 * const translation = Matrix44.translate(Vector3.fromCopyArray([1, 2, 3]));
 * const result = Matrix44.multiply(identity, translation);
 * ```
 */
export declare class Matrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {
    /**
     * Creates a new Matrix44 instance.
     * @param m - A Float32Array containing 16 matrix elements in column-major order
     */
    constructor(m: Float32Array);
    /**
     * Gets the matrix element at row 0, column 0.
     * @returns The m00 component of the matrix
     */
    get m00(): number;
    /**
     * Gets the matrix element at row 1, column 0.
     * @returns The m10 component of the matrix
     */
    get m10(): number;
    /**
     * Gets the matrix element at row 2, column 0.
     * @returns The m20 component of the matrix
     */
    get m20(): number;
    /**
     * Gets the matrix element at row 3, column 0.
     * @returns The m30 component of the matrix
     */
    get m30(): number;
    /**
     * Gets the matrix element at row 0, column 1.
     * @returns The m01 component of the matrix
     */
    get m01(): number;
    /**
     * Gets the matrix element at row 1, column 1.
     * @returns The m11 component of the matrix
     */
    get m11(): number;
    /**
     * Gets the matrix element at row 2, column 1.
     * @returns The m21 component of the matrix
     */
    get m21(): number;
    /**
     * Gets the matrix element at row 3, column 1.
     * @returns The m31 component of the matrix
     */
    get m31(): number;
    /**
     * Gets the matrix element at row 0, column 2.
     * @returns The m02 component of the matrix
     */
    get m02(): number;
    /**
     * Gets the matrix element at row 1, column 2.
     * @returns The m12 component of the matrix
     */
    get m12(): number;
    /**
     * Gets the matrix element at row 2, column 2.
     * @returns The m22 component of the matrix
     */
    get m22(): number;
    /**
     * Gets the matrix element at row 3, column 2.
     * @returns The m32 component of the matrix
     */
    get m32(): number;
    /**
     * Gets the matrix element at row 0, column 3.
     * @returns The m03 component of the matrix
     */
    get m03(): number;
    /**
     * Gets the matrix element at row 1, column 3.
     * @returns The m13 component of the matrix
     */
    get m13(): number;
    /**
     * Gets the matrix element at row 2, column 3.
     * @returns The m23 component of the matrix
     */
    get m23(): number;
    /**
     * Gets the matrix element at row 3, column 3.
     * @returns The m33 component of the matrix
     */
    get m33(): number;
    /**
     * Gets the X component of the translation vector from this matrix.
     * @returns The X translation value
     */
    get translateX(): number;
    /**
     * Gets the Y component of the translation vector from this matrix.
     * @returns The Y translation value
     */
    get translateY(): number;
    /**
     * Gets the Z component of the translation vector from this matrix.
     * @returns The Z translation value
     */
    get translateZ(): number;
    /**
     * Gets the composition type for this matrix class.
     * @returns The composition type enum value
     */
    static get compositionType(): CompositionTypeEnum;
    /**
     * Converts the matrix to a GLSL mat4 string representation with float precision.
     * @returns A GLSL-compatible string representation of the matrix
     */
    get glslStrAsFloat(): string;
    /**
     * Converts the matrix to a GLSL mat4 string representation with integer values.
     * @returns A GLSL-compatible string representation of the matrix with integer values
     */
    get glslStrAsInt(): string;
    /**
     * Converts the matrix to a WGSL mat4x4f string representation with float precision.
     * @returns A WGSL-compatible string representation of the matrix
     */
    get wgslStrAsFloat(): string;
    /**
     * Converts the matrix to a WGSL mat4x4i string representation with integer values.
     * @returns A WGSL-compatible string representation of the matrix with integer values
     */
    get wgslStrAsInt(): string;
    /**
     * Creates a zero matrix (all elements are 0).
     * @returns A new Matrix44 instance with all elements set to 0
     */
    static zero(): Matrix44;
    /**
     * Creates a 4x4 identity matrix.
     * @returns A new IdentityMatrix44 instance representing the identity matrix
     */
    static identity(): IdentityMatrix44;
    /**
     * Creates a dummy matrix with zero-length array (for placeholder purposes).
     * @returns A new Matrix44 instance with an empty array
     */
    static dummy(): Matrix44;
    /**
     * Creates a transpose matrix from the given matrix.
     * For identity matrices, returns the same matrix since transpose of identity is identity.
     * @param mat - The matrix to transpose
     * @returns A new Matrix44 instance representing the transposed matrix
     */
    static transpose(mat: IMatrix44): Matrix44;
    /**
     * Creates an inverse matrix from the given matrix.
     * Uses optimized computation for 4x4 matrix inversion.
     * @param mat - The matrix to invert
     * @returns A new Matrix44 instance representing the inverted matrix
     * @throws Logs an error if the matrix is not invertible (determinant is 0)
     */
    static invert(mat: IMatrix44): Matrix44;
    /**
     * Computes the inverse of a matrix and stores the result in an output matrix.
     * This is the mutable version of the invert method for performance optimization.
     * @param mat - The matrix to invert
     * @param outMat - The output matrix to store the result
     * @returns The output matrix containing the inverted matrix
     * @throws Logs an error if the matrix is not invertible (determinant is 0)
     */
    static invertTo(mat: IMatrix44, outMat: MutableMatrix44): MutableMatrix44;
    /**
     * Creates a translation matrix from a 3D vector.
     * @param vec - The translation vector
     * @returns A new Matrix44 instance representing the translation transformation
     */
    static translate(vec: Vector3): Matrix44;
    /**
     * Creates a rotation matrix around the X-axis.
     * @param radian - The rotation angle in radians
     * @returns A new Matrix44 instance representing the X-axis rotation
     */
    static rotateX(radian: number): Matrix44;
    /**
     * Creates a rotation matrix around the Y-axis.
     * @param radian - The rotation angle in radians
     * @returns A new Matrix44 instance representing the Y-axis rotation
     */
    static rotateY(radian: number): Matrix44;
    /**
     * Creates a rotation matrix around the Z-axis.
     * @param radian - The rotation angle in radians
     * @returns A new Matrix44 instance representing the Z-axis rotation
     */
    static rotateZ(radian: number): Matrix44;
    /**
     * Creates a rotation matrix from Euler angles (XYZ order).
     * Applies rotations in the order: X, then Y, then Z.
     * @param x - Rotation around X-axis in radians
     * @param y - Rotation around Y-axis in radians
     * @param z - Rotation around Z-axis in radians
     * @returns A new Matrix44 instance representing the combined rotation
     */
    static rotateXYZ(x: number, y: number, z: number): Matrix44;
    /**
     * Creates a rotation matrix from a 3D vector containing Euler angles.
     * @param vec - A vector containing rotation angles [x, y, z] in radians
     * @returns A new Matrix44 instance representing the rotation
     */
    static rotate(vec: IVector3): Matrix44;
    /**
     * Creates a scaling matrix from a 3D vector.
     * @param vec - The scaling factors for each axis [x, y, z]
     * @returns A new Matrix44 instance representing the scaling transformation
     */
    static scale(vec: IVector3): Matrix44;
    /**
     * Multiplies two 4x4 matrices and returns the result.
     * Optimized to handle identity matrices efficiently.
     * @param l_mat - The left matrix in the multiplication
     * @param r_mat - The right matrix in the multiplication
     * @returns A new Matrix44 instance representing the matrix product (l_mat * r_mat)
     */
    static multiply(l_mat: IMatrix44, r_mat: IMatrix44): Matrix44;
    /**
     * Multiplies two 4x4 matrices and stores the result in an output matrix.
     * This is the mutable version of the multiply method for performance optimization.
     * @param l_mat - The left matrix in the multiplication
     * @param r_mat - The right matrix in the multiplication
     * @param outMat - The output matrix to store the result
     * @returns The output matrix containing the multiplication result
     */
    static multiplyTo(l_mat: IMatrix44, r_mat: IMatrix44, outMat: MutableMatrix44): MutableMatrix44;
    /**
     * Multiplies a matrix with data from a typed array and stores the result.
     * This method is optimized for working with raw array data.
     * @param l_mat - The left matrix in the multiplication
     * @param r_array - The right operand as a typed array
     * @param outMat - The output matrix to store the result
     * @param offsetAsComposition - The offset in the array for composition data
     * @returns The output matrix containing the multiplication result
     */
    static multiplyTypedArrayTo(l_mat: IMatrix44, r_array: ArrayType, outMat: MutableMatrix44, offsetAsComposition: number): MutableMatrix44;
    /**
     * Creates a rotation matrix from a quaternion and stores it in an output matrix.
     * @param quat - The quaternion representing the rotation
     * @param outMat - The output matrix to store the result
     * @returns The output matrix containing the rotation matrix
     */
    static fromQuaternionTo(quat: IQuaternion, outMat: MutableMatrix44): MutableMatrix44;
    /**
     * Converts the matrix to a human-readable string representation.
     * Elements are displayed in row-major order for intuitive reading.
     * @returns A formatted string representation of the matrix
     */
    toString(): string;
    /**
     * Converts the matrix to a human-readable string with rounded values.
     * Uses financial rounding for better readability of floating-point numbers.
     * @returns A formatted string representation with approximated values
     */
    toStringApproximately(): string;
    /**
     * Flattens the matrix into a regular JavaScript array.
     * Elements are returned in column-major order (WebGL compatible).
     * @returns An array containing all 16 matrix elements
     */
    flattenAsArray(): number[];
    /**
     * Checks if this is a dummy matrix (empty array).
     * @returns true if the matrix has no elements, false otherwise
     */
    isDummy(): boolean;
    /**
     * Checks if this matrix is approximately equal to another matrix.
     * @param mat - The matrix to compare with
     * @param delta - The tolerance for floating-point comparison (default: Number.EPSILON)
     * @returns true if matrices are approximately equal within the given tolerance
     */
    isEqual(mat: IMatrix44, delta?: number): boolean;
    /**
     * Checks if this matrix is exactly equal to another matrix.
     * Uses strict equality comparison for all elements.
     * @param mat - The matrix to compare with
     * @returns true if matrices are exactly equal, false otherwise
     */
    isStrictEqual(mat: IMatrix44): boolean;
    /**
     * Gets a matrix element at the specified row and column.
     * @param row_i - The row index (0-3)
     * @param column_i - The column index (0-3)
     * @returns The matrix element at the given position
     */
    at(row_i: number, column_i: number): number;
    /**
     * Calculates the determinant of this 4x4 matrix.
     * @returns The determinant value
     */
    determinant(): number;
    /**
     * Multiplies this matrix with a 4D vector and returns the result.
     * @param vec - The 4D vector to multiply
     * @returns A new Vector4 containing the multiplication result
     */
    multiplyVector(vec: IVector4): Vector4;
    /**
     * Multiplies this matrix with a 4D vector and stores the result in an output vector.
     * @param vec - The 4D vector to multiply
     * @param outVec - The output vector to store the result
     * @returns The output vector containing the multiplication result
     */
    multiplyVectorTo(vec: IVector4, outVec: MutableVector4): MutableVector4;
    /**
     * Multiplies this matrix with a 4D vector and stores the XYZ components in a 3D vector.
     * @param vec - The 4D vector to multiply
     * @param outVec - The output 3D vector to store the XYZ components
     * @returns The output vector containing the XYZ components of the result
     */
    multiplyVectorToVec3(vec: IVector4, outVec: MutableVector3): MutableVector3;
    /**
     * Multiplies this matrix with a 3D vector (treating it as a point with w=1).
     * @param vec - The 3D vector to multiply
     * @returns A new Vector3 containing the transformed point
     */
    multiplyVector3(vec: IVector3): Vector3;
    /**
     * Multiplies this matrix with a 3D vector and stores the result (treating it as a point with w=1).
     * @param vec - The 3D vector to multiply
     * @param outVec - The output vector to store the result
     * @returns The output vector containing the transformed point
     */
    multiplyVector3To(vec: IVector3, outVec: MutableVector3): MutableVector3;
    /**
     * Extracts the translation vector from this transformation matrix.
     * @returns A new Vector3 containing the translation components
     */
    getTranslate(): Vector3;
    /**
     * Extracts the translation vector from this matrix and stores it in an output vector.
     * @param outVec - The output vector to store the translation
     * @returns The output vector containing the translation components
     */
    getTranslateTo(outVec: MutableVector3): MutableVector3;
    /**
     * Extracts the scale factors from this transformation matrix.
     * @returns A new Vector3 containing the scale components for each axis
     */
    getScale(): Vector3;
    /**
     * Extracts the scale factors from this matrix and stores them in an output vector.
     * @param outVec - The output vector to store the scale factors
     * @returns The output vector containing the scale components
     */
    getScaleTo(outVec: MutableVector3): MutableVector3;
    /**
     * Converts this transformation matrix to Euler angles (XYZ rotation order).
     * @returns A Vector3 containing the Euler angles [x, y, z] in radians
     */
    toEulerAngles(): Vector3;
    /**
     * Converts this transformation matrix to Euler angles and stores them in an output vector.
     * @param outVec3 - The output vector to store the Euler angles
     * @returns The output vector containing the Euler angles [x, y, z] in radians
     */
    toEulerAnglesTo(outVec3: MutableVector3): MutableVector3;
    /**
     * Creates a deep copy of this matrix.
     * @returns A new Matrix44 instance with the same values
     */
    clone(): Matrix44;
    /**
     * Extracts the rotation part of this transformation matrix.
     * Removes scaling effects to get pure rotation.
     * @returns A new Matrix44 containing only the rotation transformation
     */
    getRotate(): Matrix44;
    /**
     * Creates a matrix from 16 individual values in row-major order.
     * This is the most intuitive way to specify matrix values, as you can
     * write them in the same 4x4 layout as they appear visually.
     * Note that internally, WebGL uses column-major storage.
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
     * @returns A new Matrix44 instance
     */
    static fromCopy16RowMajor(m00: number, m01: number, m02: number, m03: number, m10: number, m11: number, m12: number, m13: number, m20: number, m21: number, m22: number, m23: number, m30: number, m31: number, m32: number, m33: number): Matrix44;
    /**
     * Creates a matrix from 16 individual values in column-major order.
     * This matches the internal storage format used by WebGL.
     *
     * @param m00 - Element at row 0, column 0
     * @param m10 - Element at row 1, column 0
     * @param m20 - Element at row 2, column 0
     * @param m30 - Element at row 3, column 0
     * @param m01 - Element at row 0, column 1
     * @param m11 - Element at row 1, column 1
     * @param m21 - Element at row 2, column 1
     * @param m31 - Element at row 3, column 1
     * @param m02 - Element at row 0, column 2
     * @param m12 - Element at row 1, column 2
     * @param m22 - Element at row 2, column 2
     * @param m32 - Element at row 3, column 2
     * @param m03 - Element at row 0, column 3
     * @param m13 - Element at row 1, column 3
     * @param m23 - Element at row 2, column 3
     * @param m33 - Element at row 3, column 3
     * @returns A new Matrix44 instance
     */
    static fromCopy16ColumnMajor(m00: number, m10: number, m20: number, m30: number, m01: number, m11: number, m21: number, m31: number, m02: number, m12: number, m22: number, m32: number, m03: number, m13: number, m23: number, m33: number): Matrix44;
    /**
     * Creates a new matrix by copying another Matrix44 instance.
     * @param mat - The source matrix to copy
     * @returns A new Matrix44 instance with copied values
     */
    static fromCopyMatrix44(mat: IMatrix44): Matrix44;
    /**
     * Creates a matrix directly from a Float32Array in column-major order.
     * The array is used directly without copying (shares the same memory).
     * @param float32Array - A Float32Array containing 16 matrix elements
     * @returns A new Matrix44 instance using the provided array
     */
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix44;
    /**
     * Creates a matrix from a Float32Array in column-major order with copying.
     * @param float32Array - A Float32Array containing 16 matrix elements
     * @returns A new Matrix44 instance with copied values
     */
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix44;
    /**
     * Creates a matrix from a Float32Array in row-major order with copying.
     * The input array is assumed to be in row-major order and will be converted
     * to column-major order for internal storage.
     * @param array - A Float32Array containing 16 matrix elements in row-major order
     * @returns A new Matrix44 instance with converted values
     */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix44;
    /**
     * Creates a 4x4 matrix from a 3x3 matrix by embedding it in the upper-left corner.
     * The resulting matrix has the 3x3 matrix in the upper-left, with the bottom-right
     * element set to 1 and other elements set to 0.
     * @param mat - The 3x3 matrix to embed
     * @returns A new Matrix44 instance
     */
    static fromCopyMatrix33(mat: IMatrix33): Matrix44;
    /**
     * Creates a matrix from a fixed-size array (Array16) in column-major order.
     * @param array - An Array16 containing exactly 16 matrix elements
     * @returns A new Matrix44 instance with copied values
     */
    static fromCopyArray16ColumnMajor(array: Array16<number>): Matrix44;
    /**
     * Creates a matrix from a variable-length array in column-major order.
     * @param array - An array containing at least 16 matrix elements
     * @returns A new Matrix44 instance with copied values
     */
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix44;
    /**
     * Creates a matrix from a fixed-size array (Array16) in row-major order.
     * The input array is converted from row-major to column-major order.
     * @param array - An Array16 containing exactly 16 matrix elements in row-major order
     * @returns A new Matrix44 instance with converted values
     */
    static fromCopyArray16RowMajor(array: Array16<number>): Matrix44;
    /**
     * Creates a matrix from a variable-length array in row-major order.
     * The input array is converted from row-major to column-major order.
     * @param array - An array containing at least 16 matrix elements in row-major order
     * @returns A new Matrix44 instance with converted values
     */
    static fromCopyArrayRowMajor(array: Array<number>): Matrix44;
    /**
     * Creates a rotation matrix from a quaternion.
     * @param q - The quaternion representing the rotation
     * @returns A new Matrix44 instance representing the rotation transformation
     */
    static fromCopyQuaternion(q: IQuaternion): Matrix44;
}
