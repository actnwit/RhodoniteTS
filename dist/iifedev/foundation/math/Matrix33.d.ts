import type { Array9 } from '../../types';
import type { FloatTypedArrayConstructor, TypedArray } from '../../types/CommonTypes';
import { AbstractMatrix } from './AbstractMatrix';
import type { IMatrix, IMatrix33, IMatrix44, IMutableMatrix33 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IMutableVector3, IVector3 } from './IVector';
import type { MutableVector3 } from './MutableVector3';
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
export declare class Matrix33_<T extends FloatTypedArrayConstructor> extends AbstractMatrix implements IMatrix, IMatrix33 {
    /**
     * Creates a new Matrix33_ instance.
     * @param m - Typed array containing 9 matrix values in column-major order
     * @param _options - Configuration object containing the typed array constructor
     */
    constructor(m: TypedArray, _options: {
        type: T;
    });
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
    static _zero(type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates an identity matrix.
     * @returns A new identity matrix (optimized IdentityMatrix33 instance)
     */
    static _identity(type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a dummy matrix with empty data array.
     * Used for placeholder purposes.
     * @returns A new Matrix33 with empty Float32Array
     */
    static _dummy(type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates the transpose of the given matrix.
     * @param mat - The matrix to transpose
     * @returns A new transposed matrix
     */
    static _transpose(mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Attempts to create the inverse of the given matrix.
     *
     * Returns null instead of dividing by zero when the matrix is numerically
     * singular (see {@link MathUtil.isSingularDet}).
     *
     * @param mat - The matrix to invert
     * @returns A new inverted matrix, or null if the matrix is not invertible
     */
    static _tryInvert(mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33 | null;
    /**
     * Creates the inverse of the given matrix.
     *
     * If the matrix is numerically singular, an identity matrix is returned
     * instead of dividing by zero. Use {@link Matrix33.tryInvert} when the
     * caller needs to detect the failure.
     *
     * @param mat - The matrix to invert
     * @returns A new inverted matrix, or the identity matrix if the input is singular
     */
    static _invert(mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Attempts to calculate the inverse of the given matrix and stores the
     * result in the output matrix. The output matrix is left untouched when the
     * input is numerically singular.
     *
     * @param mat - The matrix to invert
     * @param outMat - The output mutable matrix to store the result
     * @returns True if the inversion succeeded, false if the matrix is singular
     */
    static _tryInvertTo(mat: IMatrix33, outMat: IMutableMatrix33): boolean;
    /**
     * Calculates the inverse of the given matrix and stores the result in the output matrix.
     *
     * If the matrix is numerically singular, the output matrix is set to the
     * identity matrix instead of being filled with `Infinity`/`NaN`.
     * Use {@link Matrix33.tryInvertTo} when the caller needs to detect the failure.
     *
     * @param mat - The matrix to invert
     * @param outMat - The output mutable matrix to store the result
     * @returns The output matrix containing the inverted matrix, or the identity matrix if the input is singular
     */
    static _invertTo(mat: IMatrix33, outMat: IMutableMatrix33): IMutableMatrix33;
    /**
     * Creates a rotation matrix around the X-axis.
     * @param radian - The rotation angle in radians
     * @returns A new rotation matrix
     */
    static _rotateX(radian: number, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a rotation matrix around the Y-axis.
     * @param radian - The rotation angle in radians
     * @returns A new rotation matrix
     */
    static _rotateY(radian: number, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a rotation matrix around the Z-axis.
     * @param radian - The rotation angle in radians
     * @returns A new rotation matrix
     */
    static _rotateZ(radian: number, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a rotation matrix from Euler angles in XYZ order.
     * @param x - Rotation around X-axis in radians
     * @param y - Rotation around Y-axis in radians
     * @param z - Rotation around Z-axis in radians
     * @returns A new rotation matrix representing the combined rotations
     */
    static _rotateXYZ(x: number, y: number, z: number, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a rotation matrix from a Vector3 containing Euler angles.
     * @param vec - Vector3 containing rotation angles (x, y, z) in radians
     * @returns A new rotation matrix
     */
    static _rotate(vec: IVector3, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a scaling matrix.
     * @param vec - Vector3 containing scale factors for each axis
     * @returns A new scaling matrix
     */
    static _scale(vec: IVector3, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Multiplies two matrices together.
     * @param l_mat - The left matrix
     * @param r_mat - The right matrix
     * @returns A new matrix representing l_mat * r_mat
     */
    static _multiply(l_mat: IMatrix33, r_mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Multiplies two matrices and stores the result in an output matrix.
     * @param l_mat - The left matrix
     * @param r_mat - The right matrix
     * @param outMat - The output mutable matrix to store the result
     * @returns The output matrix containing l_mat * r_mat
     */
    static _multiplyTo(l_mat: IMatrix33, r_mat: IMatrix33, outMat: IMutableMatrix33): IMutableMatrix33;
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
    static _fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number, type: FloatTypedArrayConstructor): IMatrix33;
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
    static _fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 from the upper-left 3x3 portion of a Matrix44.
     * @param mat - The Matrix44 to extract from
     * @returns A new Matrix33 instance
     */
    static _fromCopyMatrix44(mat: IMatrix44, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 using the provided Float32Array directly (no copy).
     * @param float32Array - The Float32Array in column-major order
     * @returns A new Matrix33 instance
     */
    static _fromTypedArrayColumnMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 by copying from a Float32Array in column-major order.
     * @param float32Array - The Float32Array to copy from
     * @returns A new Matrix33 instance
     */
    static _fromCopyTypedArrayColumnMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 by copying from a Float32Array in row-major order.
     * @param array - The Float32Array in row-major order
     * @returns A new Matrix33 instance
     */
    static _fromCopyTypedArrayRowMajor(array: TypedArray, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 by copying from another IMatrix33.
     * @param mat - The matrix to copy from
     * @returns A new Matrix33 instance
     */
    static _fromCopyMatrix33(mat: IMatrix33, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 from an Array9 in column-major order.
     * @param array - The Array9 containing 9 numbers
     * @returns A new Matrix33 instance
     */
    static _fromCopyArray9ColumnMajor(array: Array9<number>, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 from a regular array in column-major order.
     * @param array - The array containing at least 9 numbers
     * @returns A new Matrix33 instance
     */
    static _fromCopyArrayColumnMajor(array: Array<number>, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 from an Array9 in row-major order.
     * @param array - The Array9 containing 9 numbers in row-major order
     * @returns A new Matrix33 instance
     */
    static _fromCopyArray9RowMajor(array: Array9<number>, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 from a regular array in row-major order.
     * @param array - The array containing at least 9 numbers in row-major order
     * @returns A new Matrix33 instance
     */
    static _fromCopyArrayRowMajor(array: Array<number>, type: FloatTypedArrayConstructor): IMatrix33;
    /**
     * Creates a Matrix33 from a quaternion representing rotation.
     * @param q - The quaternion to convert
     * @returns A new Matrix33 representing the rotation
     */
    static _fromCopyQuaternion(q: IQuaternion, type: FloatTypedArrayConstructor): IMatrix33;
}
/**
 * Immutable 3x3 matrix with 32-bit float components.
 * This is the standard precision implementation for normal matrices and other 3D math.
 */
export declare class Matrix33 extends Matrix33_<Float32ArrayConstructor> {
    /**
     * Creates a new Matrix33 instance.
     * @param m - The typed array containing the matrix components
     */
    constructor(m: TypedArray);
    /** Creates a zero matrix. */
    static zero(): Matrix33;
    /** Creates an identity matrix (optimized IdentityMatrix33 instance). */
    static identity(): IMatrix33;
    /** Creates a dummy matrix with an empty array. */
    static dummy(): Matrix33;
    /** Creates the transpose of the given matrix. */
    static transpose(mat: IMatrix33): Matrix33;
    /** Attempts to invert the given matrix, returning null when it is singular. */
    static tryInvert(mat: IMatrix33): Matrix33 | null;
    /** Creates the inverse of the given matrix (identity when singular). */
    static invert(mat: IMatrix33): Matrix33;
    /** Attempts to invert the given matrix into outMat. */
    static tryInvertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): boolean;
    /** Inverts the given matrix into outMat (identity when singular). */
    static invertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): T;
    /** Creates a rotation matrix around the X-axis. */
    static rotateX(radian: number): Matrix33;
    /** Creates a rotation matrix around the Y-axis. */
    static rotateY(radian: number): Matrix33;
    /** Creates a rotation matrix around the Z-axis. */
    static rotateZ(radian: number): Matrix33;
    /** Creates a rotation matrix from Euler angles in XYZ order. */
    static rotateXYZ(x: number, y: number, z: number): Matrix33;
    /** Creates a rotation matrix from a Vector3 containing Euler angles. */
    static rotate(vec: IVector3): Matrix33;
    /** Creates a scaling matrix. */
    static scale(vec: IVector3): Matrix33;
    /** Multiplies two matrices. */
    static multiply(l_mat: IMatrix33, r_mat: IMatrix33): Matrix33;
    /** Multiplies two matrices and stores the result in outMat. */
    static multiplyTo<T extends IMutableMatrix33>(l_mat: IMatrix33, r_mat: IMatrix33, outMat: T): T;
    /** Creates a matrix from row-major components. */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Matrix33;
    /** Creates a matrix from column-major components. */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): Matrix33;
    /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
    static fromCopyMatrix44(mat: IMatrix44): Matrix33;
    /** Creates a matrix that directly uses the given Float32Array. */
    static fromFloat32ArrayColumnMajor(array: Float32Array): Matrix33;
    /** Creates a matrix by copying a Float32Array in column-major order. */
    static fromCopyFloat32ArrayColumnMajor(array: Float32Array): Matrix33;
    /** Creates a matrix by copying a Float32Array in row-major order. */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix33;
    /** Creates a matrix by copying another matrix. */
    static fromCopyMatrix33(mat: IMatrix33): Matrix33;
    /** Creates a matrix from a 9-element array in column-major order. */
    static fromCopyArray9ColumnMajor(array: Array9<number>): Matrix33;
    /** Creates a matrix from an array in column-major order. */
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix33;
    /** Creates a matrix from a 9-element array in row-major order. */
    static fromCopyArray9RowMajor(array: Array9<number>): Matrix33;
    /** Creates a matrix from an array in row-major order. */
    static fromCopyArrayRowMajor(array: Array<number>): Matrix33;
    /** Creates a matrix from a quaternion representing a rotation. */
    static fromCopyQuaternion(q: IQuaternion): Matrix33;
}
/**
 * Immutable 3x3 matrix with 64-bit float components.
 * Use this implementation when higher numerical precision is required.
 */
export declare class Matrix33D extends Matrix33_<Float64ArrayConstructor> {
    /**
     * Creates a new Matrix33D instance.
     * @param m - The typed array containing the matrix components
     */
    private constructor();
    /** Creates a zero matrix. */
    static zero(): Matrix33D;
    /** Creates an identity matrix. */
    static identity(): Matrix33D;
    /** Creates a dummy matrix with an empty array. */
    static dummy(): Matrix33D;
    /** Creates the transpose of the given matrix. */
    static transpose(mat: IMatrix33): Matrix33D;
    /** Attempts to invert the given matrix, returning null when it is singular. */
    static tryInvert(mat: IMatrix33): Matrix33D | null;
    /** Creates the inverse of the given matrix (identity when singular). */
    static invert(mat: IMatrix33): Matrix33D;
    /** Attempts to invert the given matrix into outMat. */
    static tryInvertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): boolean;
    /** Inverts the given matrix into outMat (identity when singular). */
    static invertTo<T extends IMutableMatrix33>(mat: IMatrix33, outMat: T): T;
    /** Creates a rotation matrix around the X-axis. */
    static rotateX(radian: number): Matrix33D;
    /** Creates a rotation matrix around the Y-axis. */
    static rotateY(radian: number): Matrix33D;
    /** Creates a rotation matrix around the Z-axis. */
    static rotateZ(radian: number): Matrix33D;
    /** Creates a rotation matrix from Euler angles in XYZ order. */
    static rotateXYZ(x: number, y: number, z: number): Matrix33D;
    /** Creates a rotation matrix from a Vector3 containing Euler angles. */
    static rotate(vec: IVector3): Matrix33D;
    /** Creates a scaling matrix. */
    static scale(vec: IVector3): Matrix33D;
    /** Multiplies two matrices. */
    static multiply(l_mat: IMatrix33, r_mat: IMatrix33): Matrix33D;
    /** Multiplies two matrices and stores the result in outMat. */
    static multiplyTo<T extends IMutableMatrix33>(l_mat: IMatrix33, r_mat: IMatrix33, outMat: T): T;
    /** Creates a matrix from row-major components. */
    static fromCopy9RowMajor(m00: number, m01: number, m02: number, m10: number, m11: number, m12: number, m20: number, m21: number, m22: number): Matrix33D;
    /** Creates a matrix from column-major components. */
    static fromCopy9ColumnMajor(m00: number, m10: number, m20: number, m01: number, m11: number, m21: number, m02: number, m12: number, m22: number): Matrix33D;
    /** Creates a matrix from the upper-left 3x3 portion of a 4x4 matrix. */
    static fromCopyMatrix44(mat: IMatrix44): Matrix33D;
    /** Creates a matrix that directly uses the given Float64Array. */
    static fromFloat64ArrayColumnMajor(array: Float64Array): Matrix33D;
    /** Creates a matrix by copying a Float64Array in column-major order. */
    static fromCopyFloat64ArrayColumnMajor(array: Float64Array): Matrix33D;
    /** Creates a matrix by copying a Float64Array in row-major order. */
    static fromCopyFloat64ArrayRowMajor(array: Float64Array): Matrix33D;
    /** Creates a matrix by copying another matrix. */
    static fromCopyMatrix33(mat: IMatrix33): Matrix33D;
    /** Creates a matrix from a 9-element array in column-major order. */
    static fromCopyArray9ColumnMajor(array: Array9<number>): Matrix33D;
    /** Creates a matrix from an array in column-major order. */
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix33D;
    /** Creates a matrix from a 9-element array in row-major order. */
    static fromCopyArray9RowMajor(array: Array9<number>): Matrix33D;
    /** Creates a matrix from an array in row-major order. */
    static fromCopyArrayRowMajor(array: Array<number>): Matrix33D;
    /** Creates a matrix from a quaternion representing a rotation. */
    static fromCopyQuaternion(q: IQuaternion): Matrix33D;
}
/**
 * Alias for the 32-bit (Float32Array) implementation, making the precision explicit.
 */
export { Matrix33 as Matrix33F };
