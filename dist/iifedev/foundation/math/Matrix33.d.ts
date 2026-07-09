import type { Array9 } from '../../types';
import { AbstractMatrix } from './AbstractMatrix';
import type { IMatrix, IMatrix33 } from './IMatrix';
import type { IMutableVector3, IVector3 } from './IVector';
import type { Matrix44 } from './Matrix44';
import type { MutableMatrix33 } from './MutableMatrix33';
import type { MutableVector3 } from './MutableVector3';
import type { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
/**
 * Immutable 3x3 matrix class for 3D transformations.
 * Matrix values are stored in column-major order for WebGL compatibility.
 * Provides various matrix operations including rotation, scaling, and multiplication.
 *
 * @example
 * ```typescript
 * // Create identity matrix
 * const identity = Matrix33.identity();
 *
 * // Create rotation matrix
 * const rotation = Matrix33.rotateZ(Math.PI / 4);
 *
 * // Create scale matrix
 * const scale = Matrix33.scale(Vector3.fromCopyArray([2, 2, 2]));
 *
 * // Matrix multiplication
 * const result = Matrix33.multiply(rotation, scale);
 * ```
 */
export declare class Matrix33 extends AbstractMatrix implements IMatrix, IMatrix33 {
    /**
     * Creates a new Matrix33 instance.
     * @param m - Float32Array containing 9 matrix values in column-major order
     */
    constructor(m: Float32Array);
    /**
     * Gets the matrix element at row 0, column 0.
     * @returns The m00 component
     */
    get m00(): number;
    /**
     * Gets the matrix element at row 1, column 0.
     * @returns The m10 component
     */
    get m10(): number;
    /**
     * Gets the matrix element at row 2, column 0.
     * @returns The m20 component
     */
    get m20(): number;
    /**
     * Gets the matrix element at row 0, column 1.
     * @returns The m01 component
     */
    get m01(): number;
    /**
     * Gets the matrix element at row 1, column 1.
     * @returns The m11 component
     */
    get m11(): number;
    /**
     * Gets the matrix element at row 2, column 1.
     * @returns The m21 component
     */
    get m21(): number;
    /**
     * Gets the matrix element at row 0, column 2.
     * @returns The m02 component
     */
    get m02(): number;
    /**
     * Gets the matrix element at row 1, column 2.
     * @returns The m12 component
     */
    get m12(): number;
    /**
     * Gets the matrix element at row 2, column 2.
     * @returns The m22 component
     */
    get m22(): number;
    /**
     * Gets the class name.
     * @returns The string "Matrix33"
     */
    get className(): string;
    /**
     * Gets the matrix as a GLSL mat3 string with float precision.
     * @returns GLSL mat3 constructor string
     */
    get glslStrAsFloat(): string;
    /**
     * Gets the matrix as a GLSL mat3 string with integer values.
     * @returns GLSL mat3 constructor string with floored values
     */
    get glslStrAsInt(): string;
    /**
     * Gets the matrix as a WGSL mat3x3f string with float precision.
     * @returns WGSL mat3x3f constructor string
     */
    get wgslStrAsFloat(): string;
    /**
     * Gets the matrix as a WGSL mat3x3i string with integer values.
     * @returns WGSL mat3x3i constructor string with floored values
     */
    get wgslStrAsInt(): string;
    /**
     * Gets the composition type for this matrix.
     * @returns CompositionType.Mat3
     */
    static get compositionType(): {
        toString(): string;
        toJSON(): number;
        readonly __numberOfComponents: number;
        readonly __glslStr: string;
        readonly __hlslStr: string;
        readonly __webgpuStr: string;
        readonly __wgslStr: string;
        readonly __isArray: boolean;
        readonly __vec4SizeOfProperty: import("../../types").IndexOf16Bytes;
        readonly __dummyStr: "MAT3";
        get webgpu(): string;
        get wgsl(): string;
        getNumberOfComponents(): import("../../types").Count;
        getGlslStr(componentType: import("..").ComponentTypeEnum): string;
        getGlslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        getWgslInitialValue(componentType: import("..").ComponentTypeEnum): string;
        toWGSLType(componentType: import("..").ComponentTypeEnum): string;
        getVec4SizeOfProperty(): import("../../types").IndexOf16Bytes;
        readonly index: number;
        readonly symbol: symbol;
        readonly str: string;
    };
    /**
     * Creates a zero matrix (all elements are 0).
     * @returns A new Matrix33 with all zero elements
     */
    static zero(): Matrix33;
    /**
     * Creates an identity matrix.
     * @returns A new identity matrix (optimized IdentityMatrix33 instance)
     */
    static identity(): IMatrix33;
    /**
     * Creates a dummy matrix with empty data array.
     * Used for placeholder purposes.
     * @returns A new Matrix33 with empty Float32Array
     */
    static dummy(): Matrix33;
    /**
     * Creates the transpose of the given matrix.
     * @param mat - The matrix to transpose
     * @returns A new transposed matrix
     */
    static transpose(mat: IMatrix33): IMatrix33;
    /**
     * Creates the inverse of the given matrix.
     * @param mat - The matrix to invert
     * @returns A new inverted matrix
     * @throws Will log an error if the matrix is not invertible (determinant is 0)
     */
    static invert(mat: IMatrix33): IMatrix33 | Matrix33;
    /**
     * Calculates the inverse of the given matrix and stores the result in the output matrix.
     * @param mat - The matrix to invert
     * @param outMat - The output mutable matrix to store the result
     * @returns The output matrix containing the inverted matrix
     * @throws Will log an error if the matrix is not invertible (determinant is 0)
     */
    static invertTo(mat: IMatrix33, outMat: MutableMatrix33): MutableMatrix33;
    /**
     * Creates a rotation matrix around the X-axis.
     * @param radian - The rotation angle in radians
     * @returns A new rotation matrix
     */
    static rotateX(radian: number): Matrix33;
    /**
     * Creates a rotation matrix around the Y-axis.
     * @param radian - The rotation angle in radians
     * @returns A new rotation matrix
     */
    static rotateY(radian: number): Matrix33;
    /**
     * Creates a rotation matrix around the Z-axis.
     * @param radian - The rotation angle in radians
     * @returns A new rotation matrix
     */
    static rotateZ(radian: number): Matrix33;
    /**
     * Creates a rotation matrix from Euler angles in XYZ order.
     * @param x - Rotation around X-axis in radians
     * @param y - Rotation around Y-axis in radians
     * @param z - Rotation around Z-axis in radians
     * @returns A new rotation matrix representing the combined rotations
     */
    static rotateXYZ(x: number, y: number, z: number): Matrix33;
    /**
     * Creates a rotation matrix from a Vector3 containing Euler angles.
     * @param vec - Vector3 containing rotation angles (x, y, z) in radians
     * @returns A new rotation matrix
     */
    static rotate(vec: Vector3): Matrix33;
    /**
     * Creates a scaling matrix.
     * @param vec - Vector3 containing scale factors for each axis
     * @returns A new scaling matrix
     */
    static scale(vec: IVector3): Matrix33;
    /**
     * Multiplies two matrices together.
     * @param l_mat - The left matrix
     * @param r_mat - The right matrix
     * @returns A new matrix representing l_mat * r_mat
     */
    static multiply(l_mat: IMatrix33, r_mat: IMatrix33): IMatrix33;
    /**
     * Multiplies two matrices and stores the result in an output matrix.
     * @param l_mat - The left matrix
     * @param r_mat - The right matrix
     * @param outMat - The output mutable matrix to store the result
     * @returns The output matrix containing l_mat * r_mat
     */
    static multiplyTo(l_mat: IMatrix33, r_mat: IMatrix33, outMat: MutableMatrix33): MutableMatrix33;
    /**
     * Converts the matrix to a human-readable string representation.
     * @returns A formatted string showing the matrix in 3x3 layout
     */
    toString(): string;
    /**
     * Converts the matrix to a human-readable string with rounded values.
     * @returns A formatted string showing the matrix with financially rounded values
     */
    toStringApproximately(): string;
    /**
     * Converts the matrix to a flat array in column-major order.
     * @returns An array containing all 9 matrix elements
     */
    flattenAsArray(): number[];
    /**
     * Checks if this matrix is a dummy matrix (empty data array).
     * @returns True if the matrix has no data, false otherwise
     */
    isDummy(): boolean;
    /**
     * Checks if this matrix is approximately equal to another matrix.
     * @param mat - The matrix to compare with
     * @param delta - The tolerance for comparison (default: Number.EPSILON)
     * @returns True if matrices are approximately equal, false otherwise
     */
    isEqual(mat: IMatrix33, delta?: number): boolean;
    /**
     * Checks if this matrix is strictly equal to another matrix.
     * @param mat - The matrix to compare with
     * @returns True if all elements are exactly equal, false otherwise
     */
    isStrictEqual(mat: Matrix33): boolean;
    /**
     * Gets the matrix element at the specified row and column.
     * @param row_i - The row index (0-2)
     * @param column_i - The column index (0-2)
     * @returns The matrix element at the specified position
     */
    at(row_i: number, column_i: number): number;
    /**
     * Gets the matrix element at the specified index in the internal array.
     * @param i - The index (0-8)
     * @returns The matrix element at the specified index
     */
    v(i: number): number;
    /**
     * Calculates the determinant of this matrix.
     * @returns The determinant value
     */
    determinant(): number;
    /**
     * Multiplies this matrix with a vector.
     * @param vec - The vector to multiply
     * @returns A new vector representing the result of matrix * vector
     */
    multiplyVector(vec: IVector3): any;
    /**
     * Multiplies this matrix with a vector and stores the result in an output vector.
     * @param vec - The vector to multiply
     * @param outVec - The output mutable vector to store the result
     * @returns The output vector containing the result of matrix * vector
     */
    multiplyVectorTo(vec: IVector3, outVec: IMutableVector3): IMutableVector3;
    /**
     * Extracts the scale factors from this matrix.
     * @returns A new Vector3 containing the scale factors for each axis
     */
    getScale(): Vector3;
    /**
     * Extracts the scale factors from this matrix and stores them in an output vector.
     * @param outVec - The output mutable vector to store the scale factors
     * @returns The output vector containing the scale factors
     */
    getScaleTo(outVec: MutableVector3): MutableVector3;
    /**
     * Creates a deep copy of this matrix.
     * @returns A new Matrix33 instance with the same values
     */
    clone(): any;
    /**
     * Creates a Matrix33 from 9 values in row-major order.
     * Values are stored internally in column-major order for WebGL compatibility.
     * @param m00 - Element at row 0, column 0
     * @param m01 - Element at row 0, column 1
     * @param m02 - Element at row 0, column 2
     * @param m10 - Element at row 1, column 0
     * @param m11 - Element at row 1, column 1
     * @param m12 - Element at row 1, column 2
     * @param m20 - Element at row 2, column 0
     * @param m21 - Element at row 2, column 1
     * @param m22 - Element at row 2, column 2
     * @returns A new Matrix33 instance
     */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Matrix33;
    /**
     * Creates a Matrix33 from 9 values in column-major order.
     * @param m00 - Element at row 0, column 0
     * @param m10 - Element at row 1, column 0
     * @param m20 - Element at row 2, column 0
     * @param m01 - Element at row 0, column 1
     * @param m11 - Element at row 1, column 1
     * @param m21 - Element at row 2, column 1
     * @param m02 - Element at row 0, column 2
     * @param m12 - Element at row 1, column 2
     * @param m22 - Element at row 2, column 2
     * @returns A new Matrix33 instance
     */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): Matrix33;
    /**
     * Creates a Matrix33 from the upper-left 3x3 portion of a Matrix44.
     * @param mat - The Matrix44 to extract from
     * @returns A new Matrix33 instance
     */
    static fromCopyMatrix44(mat: Matrix44): Matrix33;
    /**
     * Creates a Matrix33 using the provided Float32Array directly (no copy).
     * @param float32Array - The Float32Array in column-major order
     * @returns A new Matrix33 instance
     */
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix33;
    /**
     * Creates a Matrix33 by copying from a Float32Array in column-major order.
     * @param float32Array - The Float32Array to copy from
     * @returns A new Matrix33 instance
     */
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix33;
    /**
     * Creates a Matrix33 by copying from a Float32Array in row-major order.
     * @param array - The Float32Array in row-major order
     * @returns A new Matrix33 instance
     */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix33;
    /**
     * Creates a Matrix33 by copying from another IMatrix33.
     * @param mat - The matrix to copy from
     * @returns A new Matrix33 instance
     */
    static fromCopyMatrix33(mat: IMatrix33): Matrix33;
    /**
     * Creates a Matrix33 from an Array9 in column-major order.
     * @param array - The Array9 containing 9 numbers
     * @returns A new Matrix33 instance
     */
    static fromCopyArray9ColumnMajor(array: Array9<number>): Matrix33;
    /**
     * Creates a Matrix33 from a regular array in column-major order.
     * @param array - The array containing at least 9 numbers
     * @returns A new Matrix33 instance
     */
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix33;
    /**
     * Creates a Matrix33 from an Array9 in row-major order.
     * @param array - The Array9 containing 9 numbers in row-major order
     * @returns A new Matrix33 instance
     */
    static fromCopyArray9RowMajor(array: Array9<number>): Matrix33;
    /**
     * Creates a Matrix33 from a regular array in row-major order.
     * @param array - The array containing at least 9 numbers in row-major order
     * @returns A new Matrix33 instance
     */
    static fromCopyArrayRowMajor(array: Array<number>): Matrix33;
    /**
     * Creates a Matrix33 from a quaternion representing rotation.
     * @param q - The quaternion to convert
     * @returns A new Matrix33 representing the rotation
     */
    static fromCopyQuaternion(q: Quaternion): Matrix33;
}
