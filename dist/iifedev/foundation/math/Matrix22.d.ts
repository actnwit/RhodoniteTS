import type { Array4 } from '../../types';
import { AbstractMatrix } from './AbstractMatrix';
import type { IMatrix22 } from './IMatrix';
import type { IVector2 } from './IVector';
import type { Matrix33 } from './Matrix33';
import type { MutableMatrix22 } from './MutableMatrix22';
import type { MutableVector2 } from './MutableVector2';
import { Vector2 } from './Vector2';
/**
 * A 2x2 matrix class for 2D transformations and linear algebra operations.
 *
 * This immutable matrix class supports common 2D transformations including
 * rotation, scaling, and general linear transformations. The matrix data
 * is stored in column-major order as a Float32Array for WebGL compatibility.
 *
 * Matrix layout:
 * ```
 * | m00 m01 |
 * | m10 m11 |
 * ```
 *
 * @example
 * ```typescript
 * // Create identity matrix
 * const identity = Matrix22.identity();
 *
 * // Create rotation matrix
 * const rotation = Matrix22.rotate(Math.PI / 4);
 *
 * // Create scale matrix
 * const scale = Matrix22.scale(Vector2.fromCopyArray2([2, 3]));
 * ```
 */
export declare class Matrix22 extends AbstractMatrix implements IMatrix22 {
    /**
     * Creates a new Matrix22 instance.
     *
     * @param m - Float32Array containing matrix values in column-major order
     */
    constructor(m: Float32Array);
    /**
     * Gets the matrix element at row 0, column 0.
     *
     * @returns The m00 component of the matrix
     */
    get m00(): number;
    /**
     * Gets the matrix element at row 1, column 0.
     *
     * @returns The m10 component of the matrix
     */
    get m10(): number;
    /**
     * Gets the matrix element at row 0, column 1.
     *
     * @returns The m01 component of the matrix
     */
    get m01(): number;
    /**
     * Gets the matrix element at row 1, column 1.
     *
     * @returns The m11 component of the matrix
     */
    get m11(): number;
    /**
     * Gets the class name for this matrix type.
     *
     * @returns The string 'Matrix22'
     */
    get className(): string;
    /**
     * Gets the composition type for this matrix.
     *
     * @returns The CompositionType.Mat2 enum value
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
        readonly __dummyStr: "MAT2";
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
     * Creates a 2x2 zero matrix.
     *
     * @returns A new Matrix22 with all elements set to 0
     *
     * @example
     * ```typescript
     * const zero = Matrix22.zero();
     * // Returns:
     * // | 0 0 |
     * // | 0 0 |
     * ```
     */
    static zero(): Matrix22;
    /**
     * Creates a 2x2 identity matrix.
     *
     * @returns A new Matrix22 identity matrix
     *
     * @example
     * ```typescript
     * const identity = Matrix22.identity();
     * // Returns:
     * // | 1 0 |
     * // | 0 1 |
     * ```
     */
    static identity(): Matrix22;
    /**
     * Creates a dummy matrix with empty data.
     * Used as a placeholder when no valid matrix data is available.
     *
     * @returns A new Matrix22 with empty Float32Array
     */
    static dummy(): Matrix22;
    /**
     * Creates the transpose of the given matrix.
     * The transpose swaps rows and columns: (i,j) becomes (j,i).
     *
     * @param mat - The matrix to transpose
     * @returns A new Matrix22 that is the transpose of the input matrix
     *
     * @example
     * ```typescript
     * const mat = Matrix22.fromCopy4RowMajor(1, 2, 3, 4);
     * const transposed = Matrix22.transpose(mat);
     * // Original:    Transposed:
     * // | 1 2 |  ->  | 1 3 |
     * // | 3 4 |      | 2 4 |
     * ```
     */
    static transpose(mat: IMatrix22): Matrix22;
    /**
     * Creates the inverse of the given matrix.
     *
     * For a 2x2 matrix, the inverse is calculated using the formula:
     * A^(-1) = (1/det(A)) * | d -b |
     *                        |-c  a |
     * where A = | a b | and det(A) = ad - bc
     *           | c d |
     *
     * @param mat - The matrix to invert
     * @returns A new Matrix22 that is the inverse of the input matrix
     * @throws Error if the matrix is singular (determinant is 0)
     *
     * @example
     * ```typescript
     * const mat = Matrix22.fromCopy4RowMajor(2, 0, 0, 2);
     * const inverse = Matrix22.invert(mat);
     * // Returns:
     * // | 0.5   0 |
     * // |   0 0.5 |
     * ```
     */
    static invert(mat: IMatrix22): Matrix22;
    /**
     * Calculates the inverse of the given matrix and stores the result in the output matrix.
     * This method avoids creating a new matrix instance for better performance.
     *
     * @param mat - The matrix to invert
     * @param outMat - The mutable matrix to store the result
     * @returns The output matrix containing the inverse
     * @throws Error if the matrix is singular (determinant is 0)
     */
    static invertTo(mat: Matrix22, outMat: MutableMatrix22): MutableMatrix22;
    /**
     * Creates a 2D rotation matrix for the given angle.
     *
     * The rotation matrix is:
     * | cos(θ) -sin(θ) |
     * | sin(θ)  cos(θ) |
     *
     * @param radian - The rotation angle in radians (positive values rotate counter-clockwise)
     * @returns A new Matrix22 representing the rotation transformation
     *
     * @example
     * ```typescript
     * // 90-degree counter-clockwise rotation
     * const rotation = Matrix22.rotate(Math.PI / 2);
     * ```
     */
    static rotate(radian: number): Matrix22;
    /**
     * Creates a 2D scaling matrix from a 2D vector.
     *
     * The scaling matrix is:
     * | sx  0 |
     * |  0 sy |
     *
     * @param vec - A Vector2 containing the scale factors for x and y axes
     * @returns A new Matrix22 representing the scaling transformation
     *
     * @example
     * ```typescript
     * const scale = Matrix22.scale(Vector2.fromCopyArray2([2, 3]));
     * // Creates a matrix that scales x by 2 and y by 3
     * ```
     */
    static scale(vec: IVector2): Matrix22;
    /**
     * Multiplies two 2x2 matrices and returns the result.
     * Matrix multiplication is not commutative: A * B ≠ B * A in general.
     *
     * @param l_mat - The left matrix operand
     * @param r_mat - The right matrix operand
     * @returns A new Matrix22 containing the product l_mat * r_mat
     *
     * @example
     * ```typescript
     * const a = Matrix22.scale(Vector2.fromCopyArray2([2, 2]));
     * const b = Matrix22.rotate(Math.PI / 4);
     * const result = Matrix22.multiply(a, b); // Scale then rotate
     * ```
     */
    static multiply(l_mat: IMatrix22, r_mat: IMatrix22): Matrix22;
    /**
     * Multiplies two matrices and stores the result in the output matrix.
     * This method avoids creating a new matrix instance for better performance.
     *
     * Note: The parameter types suggest Matrix33, but this appears to be a bug
     * as this should operate on Matrix22 instances.
     *
     * @param l_mat - The left matrix operand
     * @param r_mat - The right matrix operand
     * @param outMat - The mutable matrix to store the result
     * @returns The output matrix containing the product
     */
    static multiplyTo(l_mat: Matrix33, r_mat: Matrix33, outMat: MutableMatrix22): MutableMatrix22;
    /**
     * Returns a string representation of the matrix in a readable format.
     *
     * @returns A string showing the matrix in 2x2 layout
     *
     * @example
     * ```typescript
     * const mat = Matrix22.identity();
     * console.log(mat.toString());
     * // Output:
     * // 1 0
     * // 0 1
     * ```
     */
    toString(): string;
    /**
     * Returns an approximate string representation of the matrix with rounded values.
     * Uses financial rounding for cleaner display of floating-point numbers.
     *
     * @returns A string showing the matrix with rounded values
     */
    toStringApproximately(): string;
    /**
     * Returns the matrix elements as a flat array in column-major order.
     *
     * @returns An array containing [m00, m10, m01, m11]
     */
    flattenAsArray(): number[];
    /**
     * Checks if this is a dummy matrix (empty data).
     *
     * @returns True if the matrix has no data, false otherwise
     */
    isDummy(): boolean;
    /**
     * Checks if this matrix is approximately equal to another matrix within a tolerance.
     *
     * @param mat - The matrix to compare with
     * @param delta - The tolerance for comparison (default: Number.EPSILON)
     * @returns True if all corresponding elements are within the tolerance
     */
    isEqual(mat: Matrix22, delta?: number): boolean;
    /**
     * Checks if this matrix is exactly equal to another matrix.
     * Uses strict equality comparison for all elements.
     *
     * @param mat - The matrix to compare with
     * @returns True if all corresponding elements are exactly equal
     */
    isStrictEqual(mat: Matrix22): boolean;
    /**
     * Gets the matrix element at the specified row and column.
     *
     * @param row_i - The row index (0 or 1)
     * @param column_i - The column index (0 or 1)
     * @returns The matrix element at the specified position
     *
     * @example
     * ```typescript
     * const mat = Matrix22.identity();
     * const m01 = mat.at(0, 1); // Returns 0
     * ```
     */
    at(row_i: number, column_i: number): number;
    /**
     * Calculates the determinant of this 2x2 matrix.
     *
     * For a 2x2 matrix | a b |, the determinant is ad - bc.
     *                   | c d |
     *
     * @returns The determinant value
     *
     * @example
     * ```typescript
     * const mat = Matrix22.fromCopy4RowMajor(2, 3, 1, 4);
     * const det = mat.determinant(); // Returns 2*4 - 3*1 = 5
     * ```
     */
    determinant(): number;
    /**
     * Multiplies this matrix by a 2D vector and returns the result.
     *
     * @param vec - The 2D vector to multiply
     * @returns A new Vector2 containing the transformed vector
     *
     * @example
     * ```typescript
     * const rotation = Matrix22.rotate(Math.PI / 2);
     * const vec = Vector2.fromCopyArray2([1, 0]);
     * const result = rotation.multiplyVector(vec); // Rotates (1,0) to (0,1)
     * ```
     */
    multiplyVector(vec: Vector2): Vector2;
    /**
     * Multiplies this matrix by a 2D vector and stores the result in the output vector.
     * This method avoids creating a new vector instance for better performance.
     *
     * @param vec - The 2D vector to multiply
     * @param outVec - The mutable vector to store the result
     * @returns The output vector containing the transformed vector
     */
    multiplyVectorTo(vec: Vector2, outVec: MutableVector2): MutableVector2;
    /**
     * Extracts the scale factors from this transformation matrix.
     * Calculates the length of each column vector to determine the scale.
     *
     * @returns A Vector2 containing the scale factors for x and y axes
     *
     * @example
     * ```typescript
     * const scaleAndRotation = Matrix22.multiply(
     *   Matrix22.scale(Vector2.fromCopyArray2([2, 3])),
     *   Matrix22.rotate(Math.PI / 4)
     * );
     * const scale = scaleAndRotation.getScale(); // Returns approximately [2, 3]
     * ```
     */
    getScale(): Vector2;
    /**
     * Extracts the scale factors from this transformation matrix and stores them in the output vector.
     * This method avoids creating a new vector instance for better performance.
     *
     * @param outVec - The mutable vector to store the scale factors
     * @returns The output vector containing the scale factors
     */
    getScaleTo(outVec: MutableVector2): MutableVector2;
    /**
     * Creates a deep copy of this matrix.
     *
     * @returns A new Matrix22 instance with the same values
     */
    clone(): any;
    /**
     * Creates a new Matrix22 from individual components in row-major order.
     *
     * Row-major means you specify values as they appear visually:
     * ```
     * | m00 m01 |
     * | m10 m11 |
     * ```
     *
     * Note: Internally, WebGL matrices are stored in column-major order.
     *
     * @param m00 - Element at row 0, column 0
     * @param m01 - Element at row 0, column 1
     * @param m10 - Element at row 1, column 0
     * @param m11 - Element at row 1, column 1
     * @returns A new Matrix22 with the specified values
     *
     * @example
     * ```typescript
     * const mat = Matrix22.fromCopy4RowMajor(1, 2, 3, 4);
     * // Creates:
     * // | 1 2 |
     * // | 3 4 |
     * ```
     */
    static fromCopy4RowMajor(m00: number, m01: number, m10: number, m11: number): Matrix22;
    /**
     * Creates a new Matrix22 from individual components in column-major order.
     *
     * Column-major means you specify values column by column:
     * First column: m00, m10
     * Second column: m01, m11
     *
     * Note: WebGL matrices are stored in column-major order internally.
     *
     * @param m00 - Element at row 0, column 0
     * @param m10 - Element at row 1, column 0
     * @param m01 - Element at row 0, column 1
     * @param m11 - Element at row 1, column 1
     * @returns A new Matrix22 with the specified values
     */
    static fromCopy4ColumnMajor(m00: number, m10: number, m01: number, m11: number): Matrix22;
    /**
     * Creates a new Matrix22 that directly uses the provided Float32Array.
     * The array is used as-is without copying, so modifications to the array
     * will affect the matrix.
     *
     * @param float32Array - Float32Array containing matrix values in column-major order
     * @returns A new Matrix22 using the provided array
     */
    static fromFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix22;
    /**
     * Creates a new Matrix22 by copying values from a Float32Array in column-major order.
     *
     * @param float32Array - Float32Array containing matrix values in column-major order
     * @returns A new Matrix22 with copied values
     */
    static fromCopyFloat32ArrayColumnMajor(float32Array: Float32Array): Matrix22;
    /**
     * Creates a new Matrix22 by copying values from a Float32Array in row-major order.
     *
     * @param array - Float32Array containing matrix values in row-major order
     * @returns A new Matrix22 with values converted to column-major order
     */
    static fromCopyFloat32ArrayRowMajor(array: Float32Array): Matrix22;
    /**
     * Creates a new Matrix22 by copying values from another IMatrix22.
     *
     * @param mat - The matrix to copy from
     * @returns A new Matrix22 with copied values
     */
    static fromCopyMatrix22(mat: IMatrix22): Matrix22;
    /**
     * Creates a new Matrix22 from a 4-element array in column-major order.
     *
     * @param array - Array4 containing exactly 4 numbers in column-major order
     * @returns A new Matrix22 with the array values
     */
    static fromCopyArray9ColumnMajor(array: Array4<number>): Matrix22;
    /**
     * Creates a new Matrix22 from a variable-length array in column-major order.
     * Only the first 4 elements are used.
     *
     * @param array - Array containing matrix values in column-major order
     * @returns A new Matrix22 with the first 4 array values
     */
    static fromCopyArrayColumnMajor(array: Array<number>): Matrix22;
    /**
     * Creates a new Matrix22 from a 4-element array in row-major order.
     *
     * @param array - Array4 containing exactly 4 numbers in row-major order
     * @returns A new Matrix22 with values converted to column-major order
     */
    static fromCopyArray9RowMajor(array: Array4<number>): Matrix22;
    /**
     * Creates a new Matrix22 from a variable-length array in row-major order.
     * Only the first 4 elements are used.
     *
     * @param array - Array containing matrix values in row-major order
     * @returns A new Matrix22 with values converted to column-major order
     */
    static fromCopyArrayRowMajor(array: Array<number>): Matrix22;
}
