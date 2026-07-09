import type { TypedArray } from '../../types/CommonTypes';
/**
 * VectorN represents an N-dimensional vector with arbitrary length.
 * This class provides basic vector operations using TypedArray for efficient memory usage.
 */
export declare class VectorN {
    _v: TypedArray;
    /**
     * Creates a new VectorN instance.
     * @param typedArray - The typed array containing the vector components
     */
    constructor(typedArray: TypedArray);
    /**
     * Creates a deep copy of this vector.
     * @returns A new VectorN instance with the same components as this vector
     */
    clone(): VectorN;
    /**
     * Creates a dummy vector with no components.
     *
     * @returns A new dummy VectorN instance
     */
    static dummy(): VectorN;
    /**
     * Checks if this vector is a dummy vector (has no components).
     *
     * @returns True if the vector has no components, false otherwise
     */
    isDummy(): boolean;
    copyComponents(vec: VectorN): void;
    setAt(i: number, value: number): void;
    getAt(i: number): number;
}
