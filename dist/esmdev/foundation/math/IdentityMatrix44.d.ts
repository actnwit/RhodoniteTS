import { type CompositionTypeEnum } from '../definitions/CompositionType';
import { AbstractMatrix } from './AbstractMatrix';
import type { IMatrix, IMatrix44 } from './IMatrix';
import type { IVector, IVector3, IVector4 } from './IVector';
import type { MutableVector3 } from './MutableVector3';
import type { MutableVector4 } from './MutableVector4';
import { Vector3 } from './Vector3';
/**
 * Represents a 4x4 identity matrix that provides optimized operations for identity transformations.
 * This class implements the identity matrix pattern where all diagonal elements are 1 and all other elements are 0.
 * It extends AbstractMatrix and implements both IMatrix and IMatrix44 interfaces.
 *
 * The identity matrix is immutable and provides efficient implementations since the result of many operations
 * can be computed without actual matrix multiplication.
 *
 * @example
 * ```typescript
 * const identity = new IdentityMatrix44();
 * const vector = new Vector4(1, 2, 3, 1);
 * const result = identity.multiplyVector(vector); // Returns the same vector
 * ```
 */
export declare class IdentityMatrix44 extends AbstractMatrix implements IMatrix, IMatrix44 {
    /**
     * Static array representing the identity matrix values in column-major order.
     * This is shared across all instances for memory efficiency.
     */
    static readonly __v: Float32Array<ArrayBuffer>;
    /**
     * Creates a new IdentityMatrix44 instance.
     * The internal array reference points to the static identity matrix values.
     */
    constructor();
    /**
     * Returns a string representation of the identity matrix in a readable format.
     * Each row is separated by newlines for visual clarity.
     *
     * @returns A formatted string showing the 4x4 identity matrix
     */
    toString(): string;
    /**
     * Returns an approximate string representation of the matrix.
     * For identity matrix, this is identical to toString() since all values are exact.
     *
     * @returns A formatted string showing the 4x4 identity matrix
     */
    toStringApproximately(): string;
    /**
     * Returns the matrix elements as a flat array in column-major order.
     *
     * @returns An array of 16 numbers representing the identity matrix
     */
    flattenAsArray(): number[];
    /**
     * Indicates whether this matrix is a dummy/placeholder matrix.
     * Identity matrix is not considered a dummy matrix.
     *
     * @returns Always false for identity matrix
     */
    isDummy(): boolean;
    /**
     * Checks if the given matrix is approximately equal to this identity matrix within a tolerance.
     * Compares each element of the input matrix against the corresponding identity matrix element.
     *
     * @param mat - The matrix to compare against this identity matrix
     * @param delta - The tolerance for floating-point comparison (default: Number.EPSILON)
     * @returns True if the matrix is approximately an identity matrix, false otherwise
     */
    isEqual(mat: IMatrix44, delta?: number): boolean;
    /**
     * Performs a strict equality check against another matrix.
     * Uses exact floating-point comparison without tolerance.
     *
     * @param mat - The matrix to compare for strict equality
     * @returns True if the matrix is exactly an identity matrix, false otherwise
     */
    isStrictEqual(mat: IMatrix): boolean;
    /**
     * Gets the matrix element at the specified row and column indices.
     * For identity matrix, returns 1 for diagonal elements and 0 for off-diagonal elements.
     *
     * @param row_i - The row index (0-based)
     * @param column_i - The column index (0-based)
     * @returns 1 if row equals column (diagonal), 0 otherwise
     */
    at(row_i: number, column_i: number): number;
    /**
     * Gets the matrix element at the specified linear index in column-major order.
     * For identity matrix, returns 1 for diagonal positions and 0 elsewhere.
     *
     * @param i - The linear index (0-15) in column-major order
     * @returns 1 for diagonal elements (indices 0, 5, 10, 15), 0 otherwise
     */
    v(i: number): number;
    /**
     * Calculates the determinant of this identity matrix.
     * The determinant of an identity matrix is always 1.
     *
     * @returns Always returns 1
     */
    determinant(): number;
    /**
     * Multiplies this identity matrix with a 4D vector.
     * Since this is an identity matrix, the result is the input vector unchanged.
     *
     * @param vec - The 4D vector to multiply
     * @returns The same vector (identity transformation)
     */
    multiplyVector(vec: IVector4): IVector4;
    /**
     * Multiplies this identity matrix with a 3D vector.
     * Since this is an identity matrix, the result is the input vector unchanged.
     *
     * @param vec - The 3D vector to multiply
     * @returns The same vector (identity transformation)
     */
    multiplyVector3(vec: IVector3): IVector3;
    /**
     * Multiplies this identity matrix with a vector and stores the result in an output vector.
     * Since this is an identity matrix, copies the input vector to the output vector.
     *
     * @param vec - The input vector to multiply
     * @param outVec - The mutable vector to store the result
     * @returns The output vector containing the copied values
     */
    multiplyVectorTo(vec: IVector, outVec: MutableVector4): MutableVector4;
    /**
     * Extracts the scale components from this transformation matrix.
     * For identity matrix, the scale is (1, 1, 1).
     *
     * @returns A Vector3 with all components set to 1
     */
    getScale(): Vector3;
    /**
     * Extracts the scale components and stores them in an output vector.
     * For identity matrix, sets all scale components to 1.
     *
     * @param outVec - The mutable vector to store the scale values
     * @returns The output vector with scale components set to 1
     */
    getScaleTo(outVec: MutableVector3): MutableVector3;
    /**
     * Creates a copy of this identity matrix.
     * Returns a new IdentityMatrix44 instance.
     *
     * @returns A new IdentityMatrix44 instance
     */
    clone(): IdentityMatrix44;
    /**
     * Extracts the rotation part of this transformation matrix.
     * For identity matrix, the rotation is also an identity matrix.
     *
     * @returns A new IdentityMatrix44 representing no rotation
     */
    getRotate(): IdentityMatrix44;
    /**
     * Extracts the translation components from this transformation matrix.
     * For identity matrix, the translation is (0, 0, 0).
     *
     * @returns A Vector3 with all components set to 0
     */
    getTranslate(): Vector3;
    /**
     * Gets the matrix element at row 0, column 0.
     * @returns Always 1 for identity matrix
     */
    get m00(): number;
    /**
     * Gets the matrix element at row 1, column 0.
     * @returns Always 0 for identity matrix
     */
    get m10(): number;
    /**
     * Gets the matrix element at row 2, column 0.
     * @returns Always 0 for identity matrix
     */
    get m20(): number;
    /**
     * Gets the matrix element at row 3, column 0.
     * @returns Always 0 for identity matrix
     */
    get m30(): number;
    /**
     * Gets the matrix element at row 0, column 1.
     * @returns Always 0 for identity matrix
     */
    get m01(): number;
    /**
     * Gets the matrix element at row 1, column 1.
     * @returns Always 1 for identity matrix
     */
    get m11(): number;
    /**
     * Gets the matrix element at row 2, column 1.
     * @returns Always 0 for identity matrix
     */
    get m21(): number;
    /**
     * Gets the matrix element at row 3, column 1.
     * @returns Always 0 for identity matrix
     */
    get m31(): number;
    /**
     * Gets the matrix element at row 0, column 2.
     * @returns Always 0 for identity matrix
     */
    get m02(): number;
    /**
     * Gets the matrix element at row 1, column 2.
     * @returns Always 0 for identity matrix
     */
    get m12(): number;
    /**
     * Gets the matrix element at row 2, column 2.
     * @returns Always 1 for identity matrix
     */
    get m22(): number;
    /**
     * Gets the matrix element at row 3, column 2.
     * @returns Always 0 for identity matrix
     */
    get m32(): number;
    /**
     * Gets the matrix element at row 0, column 3.
     * @returns Always 0 for identity matrix
     */
    get m03(): number;
    /**
     * Gets the matrix element at row 1, column 3.
     * @returns Always 0 for identity matrix
     */
    get m13(): number;
    /**
     * Gets the matrix element at row 2, column 3.
     * @returns Always 0 for identity matrix
     */
    get m23(): number;
    /**
     * Gets the matrix element at row 3, column 3.
     * @returns Always 1 for identity matrix
     */
    get m33(): number;
    /**
     * Gets the X translation component from the matrix.
     * @returns Always 0 for identity matrix
     */
    get translateX(): number;
    /**
     * Gets the Y translation component from the matrix.
     * @returns Always 0 for identity matrix
     */
    get translateY(): number;
    /**
     * Gets the Z translation component from the matrix.
     * @returns Always 0 for identity matrix
     */
    get translateZ(): number;
    /**
     * Gets the class name for debugging and reflection purposes.
     * @returns The string 'IdentityMatrix44'
     */
    get className(): string;
    /**
     * Gets the composition type for this matrix class.
     * @returns CompositionType.Mat4 indicating this is a 4x4 matrix
     */
    static get compositionType(): CompositionTypeEnum;
    /**
     * Indicates whether this matrix is an identity matrix class.
     * @returns Always true for IdentityMatrix44
     */
    get isIdentityMatrixClass(): boolean;
}
