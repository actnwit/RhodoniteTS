import { Vector3 } from './Vector3';
import { Matrix44 } from './Matrix44';
import { MutableVector3 } from './MutableVector3';
import { Index } from '../../types/CommonTypes';
import { MathUtil } from './MathUtil';

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
export class AABB {
  private __min: MutableVector3 = MutableVector3.fromCopyArray([
    Number.MAX_VALUE,
    Number.MAX_VALUE,
    Number.MAX_VALUE,
  ]);
  private __max: MutableVector3 = MutableVector3.fromCopyArray([
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
    -Number.MAX_VALUE,
  ]);
  private __centerPoint = MutableVector3.zero();
  private __lengthCenterToCorner = 0;
  private __isCenterPointDirty = false;
  private __isLengthCenterToCornerDirty = false;
  private static __tmpVector3 = MutableVector3.zero();
  private __isVanilla = true;

  /**
   * Creates a new AABB instance in vanilla (uninitialized) state.
   *
   * The AABB is initially in "vanilla" state with invalid bounds until
   * positions are added or bounds are explicitly set.
   */
  constructor() {}

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
  clone() {
    const instance = new AABB();
    instance.__max = this.__max.clone();
    instance.__min = this.__min.clone();
    instance.__centerPoint = this.__centerPoint.clone();
    instance.__lengthCenterToCorner = this.__lengthCenterToCorner;
    instance.__isCenterPointDirty = this.__isCenterPointDirty;
    instance.__isLengthCenterToCornerDirty = this.__isLengthCenterToCornerDirty;
    instance.__isVanilla = this.__isVanilla;

    return instance;
  }

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
  copyComponents(aabb: AABB) {
    this.__max.copyComponents(aabb.__max);
    this.__min.copyComponents(aabb.__min);
    this.__centerPoint.copyComponents(aabb.__centerPoint);
    this.__lengthCenterToCorner = aabb.__lengthCenterToCorner;
    this.__isCenterPointDirty = aabb.__isCenterPointDirty;
    this.__isLengthCenterToCornerDirty = aabb.__isLengthCenterToCornerDirty;

    this.__isVanilla = false;
    return this;
  }

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
  initialize() {
    this.__min.setComponents(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    this.__max.setComponents(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    this.__centerPoint.zero();
    this.__lengthCenterToCorner = 0;
    this.__isCenterPointDirty = false;
    this.__isLengthCenterToCornerDirty = false;

    this.__isVanilla = true;
  }

  /**
   * Sets the minimum point of the bounding box.
   *
   * Setting the minimum point will invalidate cached values and mark
   * the AABB as non-vanilla.
   *
   * @param val - The new minimum point vector
   */
  set minPoint(val: Vector3) {
    this.__min.copyComponents(val);
    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    this.__isVanilla = false;
  }

  /**
   * Gets the minimum point of the bounding box.
   *
   * @returns The minimum point as a read-only Vector3
   */
  get minPoint() {
    return this.__min as Vector3;
  }

  /**
   * Sets the maximum point of the bounding box.
   *
   * Setting the maximum point will invalidate cached values and mark
   * the AABB as non-vanilla.
   *
   * @param val - The new maximum point vector
   */
  set maxPoint(val: Vector3) {
    this.__max.copyComponents(val);
    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    this.__isVanilla = false;
  }

  /**
   * Gets the maximum point of the bounding box.
   *
   * @returns The maximum point as a read-only Vector3
   */
  get maxPoint() {
    return this.__max as Vector3;
  }

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
  isVanilla() {
    return this.__isVanilla;
  }

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
  addPosition(positionVector: Vector3) {
    this.__min.x = positionVector.x < this.__min.x ? positionVector.x : this.__min.x;
    this.__min.y = positionVector.y < this.__min.y ? positionVector.y : this.__min.y;
    this.__min.z = positionVector.z < this.__min.z ? positionVector.z : this.__min.z;

    this.__max.x = this.__max.x < positionVector.x ? positionVector.x : this.__max.x;
    this.__max.y = this.__max.y < positionVector.y ? positionVector.y : this.__max.y;
    this.__max.z = this.__max.z < positionVector.z ? positionVector.z : this.__max.z;

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    this.__isVanilla = false;

    return positionVector;
  }

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
  addPositionWithArray(array: number[], index: Index) {
    this.__min.x = array[index + 0] < this.__min.x ? array[index + 0] : this.__min.x;
    this.__min.y = array[index + 1] < this.__min.y ? array[index + 1] : this.__min.y;
    this.__min.z = array[index + 2] < this.__min.z ? array[index + 2] : this.__min.z;
    this.__max.x = this.__max.x < array[index + 0] ? array[index + 0] : this.__max.x;
    this.__max.y = this.__max.y < array[index + 1] ? array[index + 1] : this.__max.y;
    this.__max.z = this.__max.z < array[index + 2] ? array[index + 2] : this.__max.z;

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    this.__isVanilla = false;

    return array;
  }

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
  mergeAABB(aabb: AABB) {
    if (aabb.isVanilla()) {
      return false; // can't merge with vanilla AABB.
    }

    this.__isCenterPointDirty = true;
    this.__isLengthCenterToCornerDirty = true;

    if (this.isVanilla()) {
      this.__min.copyComponents(aabb.minPoint);
      this.__max.copyComponents(aabb.maxPoint);
      this.__isVanilla = false;
      return true;
    }

    if (aabb.minPoint.x < this.__min.x) {
      this.__min.x = aabb.minPoint.x;
    }
    if (aabb.minPoint.y < this.__min.y) {
      this.__min.y = aabb.minPoint.y;
    }
    if (aabb.minPoint.z < this.__min.z) {
      this.__min.z = aabb.minPoint.z;
    }
    if (this.__max.x < aabb.maxPoint.x) {
      this.__max.x = aabb.maxPoint.x;
    }
    if (this.__max.y < aabb.maxPoint.y) {
      this.__max.y = aabb.maxPoint.y;
    }
    if (this.__max.z < aabb.maxPoint.z) {
      this.__max.z = aabb.maxPoint.z;
    }

    return true;
  }

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
  get centerPoint() {
    if (this.__isCenterPointDirty) {
      MutableVector3.addTo(this.__min, this.__max, this.__centerPoint).divide(2);
      this.__isCenterPointDirty = false;
    }
    return this.__centerPoint;
  }

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
  get lengthCenterToCorner() {
    if (this.__isLengthCenterToCornerDirty) {
      this.__lengthCenterToCorner = Vector3.lengthBtw(this.centerPoint, this.maxPoint);
      this.__isLengthCenterToCornerDirty = false;
    }
    return this.__lengthCenterToCorner;
  }

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
  get sizeX() {
    return this.__max.x - this.__min.x;
  }

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
  get sizeY() {
    return this.__max.y - this.__min.y;
  }

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
  get sizeZ() {
    return this.__max.z - this.__min.z;
  }

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
  static multiplyMatrixTo(matrix: Matrix44, aabb: AABB, outAabb: AABB) {
    if (aabb.isVanilla()) {
      return outAabb.copyComponents(aabb);
    }
    outAabb.initialize();

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__min.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__min.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    AABB.__tmpVector3.x = aabb.__max.x;
    AABB.__tmpVector3.y = aabb.__max.y;
    AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(AABB.__tmpVector3, AABB.__tmpVector3);
    outAabb.addPosition(AABB.__tmpVector3);

    return outAabb;
  }

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
  toString() {
    return (
      'AABB_min: ' +
      this.__min +
      '\n' +
      'AABB_max: ' +
      this.__max +
      '\n' +
      'centerPoint: ' +
      this.__centerPoint +
      '\n' +
      'lengthCenterToCorner: ' +
      this.__lengthCenterToCorner
    );
  }

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
  toStringApproximately() {
    return (
      'AABB_max: ' +
      this.__max.toStringApproximately() +
      '\n' +
      'AABB_min: ' +
      this.__min.toStringApproximately() +
      '\n' +
      'centerPoint: ' +
      this.centerPoint.toStringApproximately() +
      '\n' +
      'lengthCenterToCorner: ' +
      MathUtil.financial(this.lengthCenterToCorner)
    );
  }
}
