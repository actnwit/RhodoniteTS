import type { Index } from '../../types/CommonTypes';
import type { Matrix44 } from './Matrix44';
import { MutableVector3 } from './MutableVector3';
import { Vector3 } from './Vector3';
/**
 * A 3D axis-aligned bounding box (AABB) class for spatial calculations and collision detection.
 *
 * The AABB represents a rectangular box aligned with the coordinate axes, defined by
 * minimum and maximum points. It provides efficient methods for spatial queries,
 * transformations, and merging operations commonly used in 3D graphics and physics simulations.
 *
 * @example
 * ```typescript
 * const aabb = new AABB();
 * aabb.addPosition(Vector3.fromValues(1, 2, 3));
 * aabb.addPosition(Vector3.fromValues(4, 5, 6));
 * console.log(aabb.centerPoint); // Center of the bounding box
 * ```
 */
export declare class AABB {
    private __min;
    private __max;
    private __centerPoint;
    private __lengthCenterToCorner;
    private __isCenterPointDirty;
    private __isLengthCenterToCornerDirty;
    private static __tmpVector3;
    private __isVanilla;
    /**
     * Creates a deep copy of this AABB instance.
     *
     * All internal state including bounds, cached values, and dirty flags
     * are copied to the new instance.
     *
     * @returns A new AABB instance that is an exact copy of this one
     *
     * @example
     * ```typescript
     * const originalAABB = new AABB();
     * originalAABB.addPosition(Vector3.fromValues(1, 1, 1));
     * const clonedAABB = originalAABB.clone();
     * ```
     */
    clone(): AABB;
    /**
     * Copies all components and state from another AABB into this instance.
     *
     * This is a more efficient alternative to creating a new instance when you
     * want to overwrite the current AABB's state.
     *
     * @param aabb - The source AABB to copy from
     * @returns This AABB instance for method chaining
     *
     * @example
     * ```typescript
     * const sourceAABB = new AABB();
     * const targetAABB = new AABB();
     * targetAABB.copyComponents(sourceAABB);
     * ```
     */
    copyComponents(aabb: AABB): this;
    /**
     * Resets this AABB to its initial vanilla state.
     *
     * Clears all bounds, cached values, and marks the AABB as vanilla.
     * After initialization, the AABB will need new positions added to become valid.
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.addPosition(Vector3.fromValues(1, 1, 1));
     * aabb.initialize(); // Reset to vanilla state
     * console.log(aabb.isVanilla()); // true
     * ```
     */
    initialize(): void;
    /**
     * Sets the minimum point of the bounding box.
     *
     * Setting the minimum point will invalidate cached values and mark
     * the AABB as non-vanilla.
     *
     * @param val - The new minimum point vector
     */
    set minPoint(val: Vector3);
    /**
     * Gets the minimum point of the bounding box.
     *
     * @returns The minimum point as a read-only Vector3
     */
    get minPoint(): Vector3;
    /**
     * Sets the maximum point of the bounding box.
     *
     * Setting the maximum point will invalidate cached values and mark
     * the AABB as non-vanilla.
     *
     * @param val - The new maximum point vector
     */
    set maxPoint(val: Vector3);
    /**
     * Gets the maximum point of the bounding box.
     *
     * @returns The maximum point as a read-only Vector3
     */
    get maxPoint(): Vector3;
    /**
     * Checks whether this AABB is in vanilla (uninitialized) state.
     *
     * A vanilla AABB has not had any positions added and contains invalid bounds.
     * Most operations on vanilla AABBs will return early or produce undefined results.
     *
     * @returns True if this AABB is vanilla, false otherwise
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * console.log(aabb.isVanilla()); // true
     * aabb.addPosition(Vector3.fromValues(1, 1, 1));
     * console.log(aabb.isVanilla()); // false
     * ```
     */
    isVanilla(): boolean;
    /**
     * Expands the AABB to include the given position.
     *
     * If this is the first position added to a vanilla AABB, it will set both
     * min and max points to this position. Otherwise, it will expand the bounds
     * as necessary to encompass the new position.
     *
     * @param positionVector - The position to include in the bounding box
     * @returns The input position vector for convenience
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.addPosition(Vector3.fromValues(1, 2, 3));
     * aabb.addPosition(Vector3.fromValues(4, 1, 2));
     * // AABB now encompasses both points
     * ```
     */
    addPosition(positionVector: Vector3): Vector3;
    /**
     * Expands the AABB to include a position from an array at the specified index.
     *
     * This is a more efficient way to add positions when working with packed
     * vertex data or other array-based position representations.
     *
     * @param array - The array containing position data
     * @param index - The starting index in the array (x, y, z values at index, index+1, index+2)
     * @returns The input array for convenience
     *
     * @example
     * ```typescript
     * const positions = [1, 2, 3, 4, 5, 6]; // Two 3D positions
     * const aabb = new AABB();
     * aabb.addPositionWithArray(positions, 0); // Add position (1, 2, 3)
     * aabb.addPositionWithArray(positions, 3); // Add position (4, 5, 6)
     * ```
     */
    addPositionWithArray(array: number[], index: Index): number[];
    /**
     * Merges this AABB with another AABB to create a combined bounding volume.
     *
     * The resulting AABB will encompass both the original and the merged AABB.
     * If either AABB is vanilla, special handling is applied.
     *
     * @param aabb - The AABB to merge with this one
     * @returns True if the merge was successful, false if the input AABB is vanilla
     *
     * @example
     * ```typescript
     * const aabb1 = new AABB();
     * const aabb2 = new AABB();
     * aabb1.addPosition(Vector3.fromValues(0, 0, 0));
     * aabb2.addPosition(Vector3.fromValues(5, 5, 5));
     * aabb1.mergeAABB(aabb2); // aabb1 now encompasses both volumes
     * ```
     */
    mergeAABB(aabb: AABB): boolean;
    /**
     * Gets the center point of the bounding box.
     *
     * The center point is calculated as the midpoint between the minimum and maximum points.
     * This value is cached and only recalculated when the bounds change.
     *
     * @returns The center point of the AABB
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.minPoint = Vector3.fromValues(0, 0, 0);
     * aabb.maxPoint = Vector3.fromValues(4, 6, 8);
     * console.log(aabb.centerPoint); // Vector3(2, 3, 4)
     * ```
     */
    get centerPoint(): MutableVector3;
    /**
     * Gets the distance from the center point to any corner of the bounding box.
     *
     * This represents the radius of a sphere that would completely contain the AABB
     * when centered at the AABB's center point. Useful for sphere-based culling operations.
     *
     * @returns The distance from center to corner
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.minPoint = Vector3.fromValues(-1, -1, -1);
     * aabb.maxPoint = Vector3.fromValues(1, 1, 1);
     * console.log(aabb.lengthCenterToCorner); // sqrt(3) ≈ 1.732
     * ```
     */
    get lengthCenterToCorner(): number;
    /**
     * Gets the width of the bounding box along the X-axis.
     *
     * @returns The difference between maximum and minimum X coordinates
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.minPoint = Vector3.fromValues(1, 0, 0);
     * aabb.maxPoint = Vector3.fromValues(5, 0, 0);
     * console.log(aabb.sizeX); // 4
     * ```
     */
    get sizeX(): number;
    /**
     * Gets the height of the bounding box along the Y-axis.
     *
     * @returns The difference between maximum and minimum Y coordinates
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.minPoint = Vector3.fromValues(0, 2, 0);
     * aabb.maxPoint = Vector3.fromValues(0, 8, 0);
     * console.log(aabb.sizeY); // 6
     * ```
     */
    get sizeY(): number;
    /**
     * Gets the depth of the bounding box along the Z-axis.
     *
     * @returns The difference between maximum and minimum Z coordinates
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.minPoint = Vector3.fromValues(0, 0, -2);
     * aabb.maxPoint = Vector3.fromValues(0, 0, 3);
     * console.log(aabb.sizeZ); // 5
     * ```
     */
    get sizeZ(): number;
    /**
     * Transforms an AABB by a matrix and stores the result in an output AABB.
     *
     * This method transforms all 8 corners of the input AABB using the given matrix,
     * then calculates the axis-aligned bounding box that encompasses all transformed corners.
     * This is necessary because matrix transformations can rotate the AABB, requiring
     * recalculation of the axis-aligned bounds.
     *
     * @param matrix - The transformation matrix to apply
     * @param aabb - The source AABB to transform
     * @param outAabb - The output AABB to store the result
     * @returns The output AABB for method chaining
     *
     * @example
     * ```typescript
     * const matrix = Matrix44.rotateY(Math.PI / 4); // 45-degree rotation
     * const sourceAABB = new AABB();
     * const resultAABB = new AABB();
     * sourceAABB.addPosition(Vector3.fromValues(1, 1, 1));
     * AABB.multiplyMatrixTo(matrix, sourceAABB, resultAABB);
     * ```
     */
    static multiplyMatrixTo(matrix: Matrix44, aabb: AABB, outAabb: AABB): AABB;
    /**
     * Returns a string representation of the AABB with full precision.
     *
     * Includes minimum and maximum points, center point, and center-to-corner distance.
     *
     * @returns A detailed string representation of the AABB
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.addPosition(Vector3.fromValues(1, 2, 3));
     * console.log(aabb.toString());
     * // Output: "AABB_min: (1, 2, 3)\nAABB_max: (1, 2, 3)\n..."
     * ```
     */
    toString(): string;
    /**
     * Returns a string representation of the AABB with rounded numbers for readability.
     *
     * Similar to toString() but with approximate values that are easier to read.
     * Useful for debugging and logging where exact precision is not required.
     *
     * @returns A string representation with approximated numeric values
     *
     * @example
     * ```typescript
     * const aabb = new AABB();
     * aabb.addPosition(Vector3.fromValues(1.23456789, 2.3456789, 3.456789));
     * console.log(aabb.toStringApproximately());
     * // Output with rounded values for better readability
     * ```
     */
    toStringApproximately(): string;
}
