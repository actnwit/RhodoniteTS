// src/foundation/math/AABB.ts
import { MathUtil } from "./MathUtil.js";
import { MutableVector3 } from "./MutableVector3.js";
import { Vector3 } from "./Vector3.js";
var _AABB = class _AABB {
  constructor() {
    this.__min = MutableVector3.fromCopyArray([Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]);
    this.__max = MutableVector3.fromCopyArray([
      -Number.MAX_VALUE,
      -Number.MAX_VALUE,
      -Number.MAX_VALUE
    ]);
    this.__centerPoint = MutableVector3.zero();
    this.__lengthCenterToCorner = 0;
    this.__isCenterPointDirty = false;
    this.__isLengthCenterToCornerDirty = false;
    this.__isVanilla = true;
  }
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
    const instance = new _AABB();
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
  copyComponents(aabb) {
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
  set minPoint(val) {
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
    return this.__min;
  }
  /**
   * Sets the maximum point of the bounding box.
   *
   * Setting the maximum point will invalidate cached values and mark
   * the AABB as non-vanilla.
   *
   * @param val - The new maximum point vector
   */
  set maxPoint(val) {
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
    return this.__max;
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
  addPosition(positionVector) {
    this.__min.x = Math.min(positionVector.x, this.__min.x);
    this.__min.y = Math.min(positionVector.y, this.__min.y);
    this.__min.z = Math.min(positionVector.z, this.__min.z);
    this.__max.x = Math.max(this.__max.x, positionVector.x);
    this.__max.y = Math.max(this.__max.y, positionVector.y);
    this.__max.z = Math.max(this.__max.z, positionVector.z);
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
  addPositionWithArray(array, index) {
    this.__min.x = Math.min(array[index + 0], this.__min.x);
    this.__min.y = Math.min(array[index + 1], this.__min.y);
    this.__min.z = Math.min(array[index + 2], this.__min.z);
    this.__max.x = Math.max(this.__max.x, array[index + 0]);
    this.__max.y = Math.max(this.__max.y, array[index + 1]);
    this.__max.z = Math.max(this.__max.z, array[index + 2]);
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
  mergeAABB(aabb) {
    if (aabb.isVanilla()) {
      return false;
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
  static multiplyMatrixTo(matrix, aabb, outAabb) {
    if (aabb.isVanilla()) {
      return outAabb.copyComponents(aabb);
    }
    outAabb.initialize();
    _AABB.__tmpVector3.x = aabb.__min.x;
    _AABB.__tmpVector3.y = aabb.__min.y;
    _AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(_AABB.__tmpVector3, _AABB.__tmpVector3);
    outAabb.addPosition(_AABB.__tmpVector3);
    _AABB.__tmpVector3.x = aabb.__max.x;
    _AABB.__tmpVector3.y = aabb.__min.y;
    _AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(_AABB.__tmpVector3, _AABB.__tmpVector3);
    outAabb.addPosition(_AABB.__tmpVector3);
    _AABB.__tmpVector3.x = aabb.__min.x;
    _AABB.__tmpVector3.y = aabb.__max.y;
    _AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(_AABB.__tmpVector3, _AABB.__tmpVector3);
    outAabb.addPosition(_AABB.__tmpVector3);
    _AABB.__tmpVector3.x = aabb.__min.x;
    _AABB.__tmpVector3.y = aabb.__min.y;
    _AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(_AABB.__tmpVector3, _AABB.__tmpVector3);
    outAabb.addPosition(_AABB.__tmpVector3);
    _AABB.__tmpVector3.x = aabb.__min.x;
    _AABB.__tmpVector3.y = aabb.__max.y;
    _AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(_AABB.__tmpVector3, _AABB.__tmpVector3);
    outAabb.addPosition(_AABB.__tmpVector3);
    _AABB.__tmpVector3.x = aabb.__max.x;
    _AABB.__tmpVector3.y = aabb.__min.y;
    _AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(_AABB.__tmpVector3, _AABB.__tmpVector3);
    outAabb.addPosition(_AABB.__tmpVector3);
    _AABB.__tmpVector3.x = aabb.__max.x;
    _AABB.__tmpVector3.y = aabb.__max.y;
    _AABB.__tmpVector3.z = aabb.__min.z;
    matrix.multiplyVector3To(_AABB.__tmpVector3, _AABB.__tmpVector3);
    outAabb.addPosition(_AABB.__tmpVector3);
    _AABB.__tmpVector3.x = aabb.__max.x;
    _AABB.__tmpVector3.y = aabb.__max.y;
    _AABB.__tmpVector3.z = aabb.__max.z;
    matrix.multiplyVector3To(_AABB.__tmpVector3, _AABB.__tmpVector3);
    outAabb.addPosition(_AABB.__tmpVector3);
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
    return `AABB_min: ${this.__min}
AABB_max: ${this.__max}
centerPoint: ${this.__centerPoint}
lengthCenterToCorner: ${this.__lengthCenterToCorner}`;
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
    return `AABB_max: ${this.__max.toStringApproximately()}
AABB_min: ${this.__min.toStringApproximately()}
centerPoint: ${this.centerPoint.toStringApproximately()}
lengthCenterToCorner: ${MathUtil.financial(this.lengthCenterToCorner)}`;
  }
};
_AABB.__tmpVector3 = MutableVector3.zero();
var AABB = _AABB;
export {
  AABB
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vc3JjL2ZvdW5kYXRpb24vbWF0aC9BQUJCLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgdHlwZSB7IEluZGV4IH0gZnJvbSAnLi4vLi4vdHlwZXMvQ29tbW9uVHlwZXMnO1xuaW1wb3J0IHsgTWF0aFV0aWwgfSBmcm9tICcuL01hdGhVdGlsJztcbmltcG9ydCB0eXBlIHsgTWF0cml4NDQgfSBmcm9tICcuL01hdHJpeDQ0JztcbmltcG9ydCB7IE11dGFibGVWZWN0b3IzIH0gZnJvbSAnLi9NdXRhYmxlVmVjdG9yMyc7XG5pbXBvcnQgeyBWZWN0b3IzIH0gZnJvbSAnLi9WZWN0b3IzJztcblxuLyoqXG4gKiBBIDNEIGF4aXMtYWxpZ25lZCBib3VuZGluZyBib3ggKEFBQkIpIGNsYXNzIGZvciBzcGF0aWFsIGNhbGN1bGF0aW9ucyBhbmQgY29sbGlzaW9uIGRldGVjdGlvbi5cbiAqXG4gKiBUaGUgQUFCQiByZXByZXNlbnRzIGEgcmVjdGFuZ3VsYXIgYm94IGFsaWduZWQgd2l0aCB0aGUgY29vcmRpbmF0ZSBheGVzLCBkZWZpbmVkIGJ5XG4gKiBtaW5pbXVtIGFuZCBtYXhpbXVtIHBvaW50cy4gSXQgcHJvdmlkZXMgZWZmaWNpZW50IG1ldGhvZHMgZm9yIHNwYXRpYWwgcXVlcmllcyxcbiAqIHRyYW5zZm9ybWF0aW9ucywgYW5kIG1lcmdpbmcgb3BlcmF0aW9ucyBjb21tb25seSB1c2VkIGluIDNEIGdyYXBoaWNzIGFuZCBwaHlzaWNzIHNpbXVsYXRpb25zLlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGB0eXBlc2NyaXB0XG4gKiBjb25zdCBhYWJiID0gbmV3IEFBQkIoKTtcbiAqIGFhYmIuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tVmFsdWVzKDEsIDIsIDMpKTtcbiAqIGFhYmIuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tVmFsdWVzKDQsIDUsIDYpKTtcbiAqIGNvbnNvbGUubG9nKGFhYmIuY2VudGVyUG9pbnQpOyAvLyBDZW50ZXIgb2YgdGhlIGJvdW5kaW5nIGJveFxuICogYGBgXG4gKi9cbmV4cG9ydCBjbGFzcyBBQUJCIHtcbiAgcHJpdmF0ZSBfX21pbjogTXV0YWJsZVZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy5mcm9tQ29weUFycmF5KFtOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFLCBOdW1iZXIuTUFYX1ZBTFVFXSk7XG4gIHByaXZhdGUgX19tYXg6IE11dGFibGVWZWN0b3IzID0gTXV0YWJsZVZlY3RvcjMuZnJvbUNvcHlBcnJheShbXG4gICAgLU51bWJlci5NQVhfVkFMVUUsXG4gICAgLU51bWJlci5NQVhfVkFMVUUsXG4gICAgLU51bWJlci5NQVhfVkFMVUUsXG4gIF0pO1xuICBwcml2YXRlIF9fY2VudGVyUG9pbnQgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19sZW5ndGhDZW50ZXJUb0Nvcm5lciA9IDA7XG4gIHByaXZhdGUgX19pc0NlbnRlclBvaW50RGlydHkgPSBmYWxzZTtcbiAgcHJpdmF0ZSBfX2lzTGVuZ3RoQ2VudGVyVG9Db3JuZXJEaXJ0eSA9IGZhbHNlO1xuICBwcml2YXRlIHN0YXRpYyBfX3RtcFZlY3RvcjMgPSBNdXRhYmxlVmVjdG9yMy56ZXJvKCk7XG4gIHByaXZhdGUgX19pc1ZhbmlsbGEgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgZGVlcCBjb3B5IG9mIHRoaXMgQUFCQiBpbnN0YW5jZS5cbiAgICpcbiAgICogQWxsIGludGVybmFsIHN0YXRlIGluY2x1ZGluZyBib3VuZHMsIGNhY2hlZCB2YWx1ZXMsIGFuZCBkaXJ0eSBmbGFnc1xuICAgKiBhcmUgY29waWVkIHRvIHRoZSBuZXcgaW5zdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgbmV3IEFBQkIgaW5zdGFuY2UgdGhhdCBpcyBhbiBleGFjdCBjb3B5IG9mIHRoaXMgb25lXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3Qgb3JpZ2luYWxBQUJCID0gbmV3IEFBQkIoKTtcbiAgICogb3JpZ2luYWxBQUJCLmFkZFBvc2l0aW9uKFZlY3RvcjMuZnJvbVZhbHVlcygxLCAxLCAxKSk7XG4gICAqIGNvbnN0IGNsb25lZEFBQkIgPSBvcmlnaW5hbEFBQkIuY2xvbmUoKTtcbiAgICogYGBgXG4gICAqL1xuICBjbG9uZSgpIHtcbiAgICBjb25zdCBpbnN0YW5jZSA9IG5ldyBBQUJCKCk7XG4gICAgaW5zdGFuY2UuX19tYXggPSB0aGlzLl9fbWF4LmNsb25lKCk7XG4gICAgaW5zdGFuY2UuX19taW4gPSB0aGlzLl9fbWluLmNsb25lKCk7XG4gICAgaW5zdGFuY2UuX19jZW50ZXJQb2ludCA9IHRoaXMuX19jZW50ZXJQb2ludC5jbG9uZSgpO1xuICAgIGluc3RhbmNlLl9fbGVuZ3RoQ2VudGVyVG9Db3JuZXIgPSB0aGlzLl9fbGVuZ3RoQ2VudGVyVG9Db3JuZXI7XG4gICAgaW5zdGFuY2UuX19pc0NlbnRlclBvaW50RGlydHkgPSB0aGlzLl9faXNDZW50ZXJQb2ludERpcnR5O1xuICAgIGluc3RhbmNlLl9faXNMZW5ndGhDZW50ZXJUb0Nvcm5lckRpcnR5ID0gdGhpcy5fX2lzTGVuZ3RoQ2VudGVyVG9Db3JuZXJEaXJ0eTtcbiAgICBpbnN0YW5jZS5fX2lzVmFuaWxsYSA9IHRoaXMuX19pc1ZhbmlsbGE7XG5cbiAgICByZXR1cm4gaW5zdGFuY2U7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIGFsbCBjb21wb25lbnRzIGFuZCBzdGF0ZSBmcm9tIGFub3RoZXIgQUFCQiBpbnRvIHRoaXMgaW5zdGFuY2UuXG4gICAqXG4gICAqIFRoaXMgaXMgYSBtb3JlIGVmZmljaWVudCBhbHRlcm5hdGl2ZSB0byBjcmVhdGluZyBhIG5ldyBpbnN0YW5jZSB3aGVuIHlvdVxuICAgKiB3YW50IHRvIG92ZXJ3cml0ZSB0aGUgY3VycmVudCBBQUJCJ3Mgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSBhYWJiIC0gVGhlIHNvdXJjZSBBQUJCIHRvIGNvcHkgZnJvbVxuICAgKiBAcmV0dXJucyBUaGlzIEFBQkIgaW5zdGFuY2UgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IHNvdXJjZUFBQkIgPSBuZXcgQUFCQigpO1xuICAgKiBjb25zdCB0YXJnZXRBQUJCID0gbmV3IEFBQkIoKTtcbiAgICogdGFyZ2V0QUFCQi5jb3B5Q29tcG9uZW50cyhzb3VyY2VBQUJCKTtcbiAgICogYGBgXG4gICAqL1xuICBjb3B5Q29tcG9uZW50cyhhYWJiOiBBQUJCKSB7XG4gICAgdGhpcy5fX21heC5jb3B5Q29tcG9uZW50cyhhYWJiLl9fbWF4KTtcbiAgICB0aGlzLl9fbWluLmNvcHlDb21wb25lbnRzKGFhYmIuX19taW4pO1xuICAgIHRoaXMuX19jZW50ZXJQb2ludC5jb3B5Q29tcG9uZW50cyhhYWJiLl9fY2VudGVyUG9pbnQpO1xuICAgIHRoaXMuX19sZW5ndGhDZW50ZXJUb0Nvcm5lciA9IGFhYmIuX19sZW5ndGhDZW50ZXJUb0Nvcm5lcjtcbiAgICB0aGlzLl9faXNDZW50ZXJQb2ludERpcnR5ID0gYWFiYi5fX2lzQ2VudGVyUG9pbnREaXJ0eTtcbiAgICB0aGlzLl9faXNMZW5ndGhDZW50ZXJUb0Nvcm5lckRpcnR5ID0gYWFiYi5fX2lzTGVuZ3RoQ2VudGVyVG9Db3JuZXJEaXJ0eTtcblxuICAgIHRoaXMuX19pc1ZhbmlsbGEgPSBmYWxzZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXNldHMgdGhpcyBBQUJCIHRvIGl0cyBpbml0aWFsIHZhbmlsbGEgc3RhdGUuXG4gICAqXG4gICAqIENsZWFycyBhbGwgYm91bmRzLCBjYWNoZWQgdmFsdWVzLCBhbmQgbWFya3MgdGhlIEFBQkIgYXMgdmFuaWxsYS5cbiAgICogQWZ0ZXIgaW5pdGlhbGl6YXRpb24sIHRoZSBBQUJCIHdpbGwgbmVlZCBuZXcgcG9zaXRpb25zIGFkZGVkIHRvIGJlY29tZSB2YWxpZC5cbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBhYWJiID0gbmV3IEFBQkIoKTtcbiAgICogYWFiYi5hZGRQb3NpdGlvbihWZWN0b3IzLmZyb21WYWx1ZXMoMSwgMSwgMSkpO1xuICAgKiBhYWJiLmluaXRpYWxpemUoKTsgLy8gUmVzZXQgdG8gdmFuaWxsYSBzdGF0ZVxuICAgKiBjb25zb2xlLmxvZyhhYWJiLmlzVmFuaWxsYSgpKTsgLy8gdHJ1ZVxuICAgKiBgYGBcbiAgICovXG4gIGluaXRpYWxpemUoKSB7XG4gICAgdGhpcy5fX21pbi5zZXRDb21wb25lbnRzKE51bWJlci5NQVhfVkFMVUUsIE51bWJlci5NQVhfVkFMVUUsIE51bWJlci5NQVhfVkFMVUUpO1xuICAgIHRoaXMuX19tYXguc2V0Q29tcG9uZW50cygtTnVtYmVyLk1BWF9WQUxVRSwgLU51bWJlci5NQVhfVkFMVUUsIC1OdW1iZXIuTUFYX1ZBTFVFKTtcbiAgICB0aGlzLl9fY2VudGVyUG9pbnQuemVybygpO1xuICAgIHRoaXMuX19sZW5ndGhDZW50ZXJUb0Nvcm5lciA9IDA7XG4gICAgdGhpcy5fX2lzQ2VudGVyUG9pbnREaXJ0eSA9IGZhbHNlO1xuICAgIHRoaXMuX19pc0xlbmd0aENlbnRlclRvQ29ybmVyRGlydHkgPSBmYWxzZTtcblxuICAgIHRoaXMuX19pc1ZhbmlsbGEgPSB0cnVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgdGhlIG1pbmltdW0gcG9pbnQgb2YgdGhlIGJvdW5kaW5nIGJveC5cbiAgICpcbiAgICogU2V0dGluZyB0aGUgbWluaW11bSBwb2ludCB3aWxsIGludmFsaWRhdGUgY2FjaGVkIHZhbHVlcyBhbmQgbWFya1xuICAgKiB0aGUgQUFCQiBhcyBub24tdmFuaWxsYS5cbiAgICpcbiAgICogQHBhcmFtIHZhbCAtIFRoZSBuZXcgbWluaW11bSBwb2ludCB2ZWN0b3JcbiAgICovXG4gIHNldCBtaW5Qb2ludCh2YWw6IFZlY3RvcjMpIHtcbiAgICB0aGlzLl9fbWluLmNvcHlDb21wb25lbnRzKHZhbCk7XG4gICAgdGhpcy5fX2lzQ2VudGVyUG9pbnREaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX2lzTGVuZ3RoQ2VudGVyVG9Db3JuZXJEaXJ0eSA9IHRydWU7XG5cbiAgICB0aGlzLl9faXNWYW5pbGxhID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgbWluaW11bSBwb2ludCBvZiB0aGUgYm91bmRpbmcgYm94LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbWluaW11bSBwb2ludCBhcyBhIHJlYWQtb25seSBWZWN0b3IzXG4gICAqL1xuICBnZXQgbWluUG9pbnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19taW4gYXMgVmVjdG9yMztcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIHRoZSBtYXhpbXVtIHBvaW50IG9mIHRoZSBib3VuZGluZyBib3guXG4gICAqXG4gICAqIFNldHRpbmcgdGhlIG1heGltdW0gcG9pbnQgd2lsbCBpbnZhbGlkYXRlIGNhY2hlZCB2YWx1ZXMgYW5kIG1hcmtcbiAgICogdGhlIEFBQkIgYXMgbm9uLXZhbmlsbGEuXG4gICAqXG4gICAqIEBwYXJhbSB2YWwgLSBUaGUgbmV3IG1heGltdW0gcG9pbnQgdmVjdG9yXG4gICAqL1xuICBzZXQgbWF4UG9pbnQodmFsOiBWZWN0b3IzKSB7XG4gICAgdGhpcy5fX21heC5jb3B5Q29tcG9uZW50cyh2YWwpO1xuICAgIHRoaXMuX19pc0NlbnRlclBvaW50RGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX19pc0xlbmd0aENlbnRlclRvQ29ybmVyRGlydHkgPSB0cnVlO1xuXG4gICAgdGhpcy5fX2lzVmFuaWxsYSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIG1heGltdW0gcG9pbnQgb2YgdGhlIGJvdW5kaW5nIGJveC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG1heGltdW0gcG9pbnQgYXMgYSByZWFkLW9ubHkgVmVjdG9yM1xuICAgKi9cbiAgZ2V0IG1heFBvaW50KCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF4IGFzIFZlY3RvcjM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2tzIHdoZXRoZXIgdGhpcyBBQUJCIGlzIGluIHZhbmlsbGEgKHVuaW5pdGlhbGl6ZWQpIHN0YXRlLlxuICAgKlxuICAgKiBBIHZhbmlsbGEgQUFCQiBoYXMgbm90IGhhZCBhbnkgcG9zaXRpb25zIGFkZGVkIGFuZCBjb250YWlucyBpbnZhbGlkIGJvdW5kcy5cbiAgICogTW9zdCBvcGVyYXRpb25zIG9uIHZhbmlsbGEgQUFCQnMgd2lsbCByZXR1cm4gZWFybHkgb3IgcHJvZHVjZSB1bmRlZmluZWQgcmVzdWx0cy5cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB0aGlzIEFBQkIgaXMgdmFuaWxsYSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAqIGNvbnNvbGUubG9nKGFhYmIuaXNWYW5pbGxhKCkpOyAvLyB0cnVlXG4gICAqIGFhYmIuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tVmFsdWVzKDEsIDEsIDEpKTtcbiAgICogY29uc29sZS5sb2coYWFiYi5pc1ZhbmlsbGEoKSk7IC8vIGZhbHNlXG4gICAqIGBgYFxuICAgKi9cbiAgaXNWYW5pbGxhKCkge1xuICAgIHJldHVybiB0aGlzLl9faXNWYW5pbGxhO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZHMgdGhlIEFBQkIgdG8gaW5jbHVkZSB0aGUgZ2l2ZW4gcG9zaXRpb24uXG4gICAqXG4gICAqIElmIHRoaXMgaXMgdGhlIGZpcnN0IHBvc2l0aW9uIGFkZGVkIHRvIGEgdmFuaWxsYSBBQUJCLCBpdCB3aWxsIHNldCBib3RoXG4gICAqIG1pbiBhbmQgbWF4IHBvaW50cyB0byB0aGlzIHBvc2l0aW9uLiBPdGhlcndpc2UsIGl0IHdpbGwgZXhwYW5kIHRoZSBib3VuZHNcbiAgICogYXMgbmVjZXNzYXJ5IHRvIGVuY29tcGFzcyB0aGUgbmV3IHBvc2l0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcG9zaXRpb25WZWN0b3IgLSBUaGUgcG9zaXRpb24gdG8gaW5jbHVkZSBpbiB0aGUgYm91bmRpbmcgYm94XG4gICAqIEByZXR1cm5zIFRoZSBpbnB1dCBwb3NpdGlvbiB2ZWN0b3IgZm9yIGNvbnZlbmllbmNlXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAqIGFhYmIuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tVmFsdWVzKDEsIDIsIDMpKTtcbiAgICogYWFiYi5hZGRQb3NpdGlvbihWZWN0b3IzLmZyb21WYWx1ZXMoNCwgMSwgMikpO1xuICAgKiAvLyBBQUJCIG5vdyBlbmNvbXBhc3NlcyBib3RoIHBvaW50c1xuICAgKiBgYGBcbiAgICovXG4gIGFkZFBvc2l0aW9uKHBvc2l0aW9uVmVjdG9yOiBWZWN0b3IzKSB7XG4gICAgdGhpcy5fX21pbi54ID0gTWF0aC5taW4ocG9zaXRpb25WZWN0b3IueCwgdGhpcy5fX21pbi54KTtcbiAgICB0aGlzLl9fbWluLnkgPSBNYXRoLm1pbihwb3NpdGlvblZlY3Rvci55LCB0aGlzLl9fbWluLnkpO1xuICAgIHRoaXMuX19taW4ueiA9IE1hdGgubWluKHBvc2l0aW9uVmVjdG9yLnosIHRoaXMuX19taW4ueik7XG5cbiAgICB0aGlzLl9fbWF4LnggPSBNYXRoLm1heCh0aGlzLl9fbWF4LngsIHBvc2l0aW9uVmVjdG9yLngpO1xuICAgIHRoaXMuX19tYXgueSA9IE1hdGgubWF4KHRoaXMuX19tYXgueSwgcG9zaXRpb25WZWN0b3IueSk7XG4gICAgdGhpcy5fX21heC56ID0gTWF0aC5tYXgodGhpcy5fX21heC56LCBwb3NpdGlvblZlY3Rvci56KTtcblxuICAgIHRoaXMuX19pc0NlbnRlclBvaW50RGlydHkgPSB0cnVlO1xuICAgIHRoaXMuX19pc0xlbmd0aENlbnRlclRvQ29ybmVyRGlydHkgPSB0cnVlO1xuXG4gICAgdGhpcy5fX2lzVmFuaWxsYSA9IGZhbHNlO1xuXG4gICAgcmV0dXJuIHBvc2l0aW9uVmVjdG9yO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cGFuZHMgdGhlIEFBQkIgdG8gaW5jbHVkZSBhIHBvc2l0aW9uIGZyb20gYW4gYXJyYXkgYXQgdGhlIHNwZWNpZmllZCBpbmRleC5cbiAgICpcbiAgICogVGhpcyBpcyBhIG1vcmUgZWZmaWNpZW50IHdheSB0byBhZGQgcG9zaXRpb25zIHdoZW4gd29ya2luZyB3aXRoIHBhY2tlZFxuICAgKiB2ZXJ0ZXggZGF0YSBvciBvdGhlciBhcnJheS1iYXNlZCBwb3NpdGlvbiByZXByZXNlbnRhdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBhcnJheSAtIFRoZSBhcnJheSBjb250YWluaW5nIHBvc2l0aW9uIGRhdGFcbiAgICogQHBhcmFtIGluZGV4IC0gVGhlIHN0YXJ0aW5nIGluZGV4IGluIHRoZSBhcnJheSAoeCwgeSwgeiB2YWx1ZXMgYXQgaW5kZXgsIGluZGV4KzEsIGluZGV4KzIpXG4gICAqIEByZXR1cm5zIFRoZSBpbnB1dCBhcnJheSBmb3IgY29udmVuaWVuY2VcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBwb3NpdGlvbnMgPSBbMSwgMiwgMywgNCwgNSwgNl07IC8vIFR3byAzRCBwb3NpdGlvbnNcbiAgICogY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAqIGFhYmIuYWRkUG9zaXRpb25XaXRoQXJyYXkocG9zaXRpb25zLCAwKTsgLy8gQWRkIHBvc2l0aW9uICgxLCAyLCAzKVxuICAgKiBhYWJiLmFkZFBvc2l0aW9uV2l0aEFycmF5KHBvc2l0aW9ucywgMyk7IC8vIEFkZCBwb3NpdGlvbiAoNCwgNSwgNilcbiAgICogYGBgXG4gICAqL1xuICBhZGRQb3NpdGlvbldpdGhBcnJheShhcnJheTogbnVtYmVyW10sIGluZGV4OiBJbmRleCkge1xuICAgIHRoaXMuX19taW4ueCA9IE1hdGgubWluKGFycmF5W2luZGV4ICsgMF0sIHRoaXMuX19taW4ueCk7XG4gICAgdGhpcy5fX21pbi55ID0gTWF0aC5taW4oYXJyYXlbaW5kZXggKyAxXSwgdGhpcy5fX21pbi55KTtcbiAgICB0aGlzLl9fbWluLnogPSBNYXRoLm1pbihhcnJheVtpbmRleCArIDJdLCB0aGlzLl9fbWluLnopO1xuICAgIHRoaXMuX19tYXgueCA9IE1hdGgubWF4KHRoaXMuX19tYXgueCwgYXJyYXlbaW5kZXggKyAwXSk7XG4gICAgdGhpcy5fX21heC55ID0gTWF0aC5tYXgodGhpcy5fX21heC55LCBhcnJheVtpbmRleCArIDFdKTtcbiAgICB0aGlzLl9fbWF4LnogPSBNYXRoLm1heCh0aGlzLl9fbWF4LnosIGFycmF5W2luZGV4ICsgMl0pO1xuXG4gICAgdGhpcy5fX2lzQ2VudGVyUG9pbnREaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5fX2lzTGVuZ3RoQ2VudGVyVG9Db3JuZXJEaXJ0eSA9IHRydWU7XG5cbiAgICB0aGlzLl9faXNWYW5pbGxhID0gZmFsc2U7XG5cbiAgICByZXR1cm4gYXJyYXk7XG4gIH1cblxuICAvKipcbiAgICogTWVyZ2VzIHRoaXMgQUFCQiB3aXRoIGFub3RoZXIgQUFCQiB0byBjcmVhdGUgYSBjb21iaW5lZCBib3VuZGluZyB2b2x1bWUuXG4gICAqXG4gICAqIFRoZSByZXN1bHRpbmcgQUFCQiB3aWxsIGVuY29tcGFzcyBib3RoIHRoZSBvcmlnaW5hbCBhbmQgdGhlIG1lcmdlZCBBQUJCLlxuICAgKiBJZiBlaXRoZXIgQUFCQiBpcyB2YW5pbGxhLCBzcGVjaWFsIGhhbmRsaW5nIGlzIGFwcGxpZWQuXG4gICAqXG4gICAqIEBwYXJhbSBhYWJiIC0gVGhlIEFBQkIgdG8gbWVyZ2Ugd2l0aCB0aGlzIG9uZVxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHRoZSBtZXJnZSB3YXMgc3VjY2Vzc2Z1bCwgZmFsc2UgaWYgdGhlIGlucHV0IEFBQkIgaXMgdmFuaWxsYVxuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IGFhYmIxID0gbmV3IEFBQkIoKTtcbiAgICogY29uc3QgYWFiYjIgPSBuZXcgQUFCQigpO1xuICAgKiBhYWJiMS5hZGRQb3NpdGlvbihWZWN0b3IzLmZyb21WYWx1ZXMoMCwgMCwgMCkpO1xuICAgKiBhYWJiMi5hZGRQb3NpdGlvbihWZWN0b3IzLmZyb21WYWx1ZXMoNSwgNSwgNSkpO1xuICAgKiBhYWJiMS5tZXJnZUFBQkIoYWFiYjIpOyAvLyBhYWJiMSBub3cgZW5jb21wYXNzZXMgYm90aCB2b2x1bWVzXG4gICAqIGBgYFxuICAgKi9cbiAgbWVyZ2VBQUJCKGFhYmI6IEFBQkIpIHtcbiAgICBpZiAoYWFiYi5pc1ZhbmlsbGEoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlOyAvLyBjYW4ndCBtZXJnZSB3aXRoIHZhbmlsbGEgQUFCQi5cbiAgICB9XG5cbiAgICB0aGlzLl9faXNDZW50ZXJQb2ludERpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLl9faXNMZW5ndGhDZW50ZXJUb0Nvcm5lckRpcnR5ID0gdHJ1ZTtcblxuICAgIGlmICh0aGlzLmlzVmFuaWxsYSgpKSB7XG4gICAgICB0aGlzLl9fbWluLmNvcHlDb21wb25lbnRzKGFhYmIubWluUG9pbnQpO1xuICAgICAgdGhpcy5fX21heC5jb3B5Q29tcG9uZW50cyhhYWJiLm1heFBvaW50KTtcbiAgICAgIHRoaXMuX19pc1ZhbmlsbGEgPSBmYWxzZTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGlmIChhYWJiLm1pblBvaW50LnggPCB0aGlzLl9fbWluLngpIHtcbiAgICAgIHRoaXMuX19taW4ueCA9IGFhYmIubWluUG9pbnQueDtcbiAgICB9XG4gICAgaWYgKGFhYmIubWluUG9pbnQueSA8IHRoaXMuX19taW4ueSkge1xuICAgICAgdGhpcy5fX21pbi55ID0gYWFiYi5taW5Qb2ludC55O1xuICAgIH1cbiAgICBpZiAoYWFiYi5taW5Qb2ludC56IDwgdGhpcy5fX21pbi56KSB7XG4gICAgICB0aGlzLl9fbWluLnogPSBhYWJiLm1pblBvaW50Lno7XG4gICAgfVxuICAgIGlmICh0aGlzLl9fbWF4LnggPCBhYWJiLm1heFBvaW50LngpIHtcbiAgICAgIHRoaXMuX19tYXgueCA9IGFhYmIubWF4UG9pbnQueDtcbiAgICB9XG4gICAgaWYgKHRoaXMuX19tYXgueSA8IGFhYmIubWF4UG9pbnQueSkge1xuICAgICAgdGhpcy5fX21heC55ID0gYWFiYi5tYXhQb2ludC55O1xuICAgIH1cbiAgICBpZiAodGhpcy5fX21heC56IDwgYWFiYi5tYXhQb2ludC56KSB7XG4gICAgICB0aGlzLl9fbWF4LnogPSBhYWJiLm1heFBvaW50Lno7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgY2VudGVyIHBvaW50IG9mIHRoZSBib3VuZGluZyBib3guXG4gICAqXG4gICAqIFRoZSBjZW50ZXIgcG9pbnQgaXMgY2FsY3VsYXRlZCBhcyB0aGUgbWlkcG9pbnQgYmV0d2VlbiB0aGUgbWluaW11bSBhbmQgbWF4aW11bSBwb2ludHMuXG4gICAqIFRoaXMgdmFsdWUgaXMgY2FjaGVkIGFuZCBvbmx5IHJlY2FsY3VsYXRlZCB3aGVuIHRoZSBib3VuZHMgY2hhbmdlLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY2VudGVyIHBvaW50IG9mIHRoZSBBQUJCXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAqIGFhYmIubWluUG9pbnQgPSBWZWN0b3IzLmZyb21WYWx1ZXMoMCwgMCwgMCk7XG4gICAqIGFhYmIubWF4UG9pbnQgPSBWZWN0b3IzLmZyb21WYWx1ZXMoNCwgNiwgOCk7XG4gICAqIGNvbnNvbGUubG9nKGFhYmIuY2VudGVyUG9pbnQpOyAvLyBWZWN0b3IzKDIsIDMsIDQpXG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0IGNlbnRlclBvaW50KCkge1xuICAgIGlmICh0aGlzLl9faXNDZW50ZXJQb2ludERpcnR5KSB7XG4gICAgICBNdXRhYmxlVmVjdG9yMy5hZGRUbyh0aGlzLl9fbWluLCB0aGlzLl9fbWF4LCB0aGlzLl9fY2VudGVyUG9pbnQpLmRpdmlkZSgyKTtcbiAgICAgIHRoaXMuX19pc0NlbnRlclBvaW50RGlydHkgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19jZW50ZXJQb2ludDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkaXN0YW5jZSBmcm9tIHRoZSBjZW50ZXIgcG9pbnQgdG8gYW55IGNvcm5lciBvZiB0aGUgYm91bmRpbmcgYm94LlxuICAgKlxuICAgKiBUaGlzIHJlcHJlc2VudHMgdGhlIHJhZGl1cyBvZiBhIHNwaGVyZSB0aGF0IHdvdWxkIGNvbXBsZXRlbHkgY29udGFpbiB0aGUgQUFCQlxuICAgKiB3aGVuIGNlbnRlcmVkIGF0IHRoZSBBQUJCJ3MgY2VudGVyIHBvaW50LiBVc2VmdWwgZm9yIHNwaGVyZS1iYXNlZCBjdWxsaW5nIG9wZXJhdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkaXN0YW5jZSBmcm9tIGNlbnRlciB0byBjb3JuZXJcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBhYWJiID0gbmV3IEFBQkIoKTtcbiAgICogYWFiYi5taW5Qb2ludCA9IFZlY3RvcjMuZnJvbVZhbHVlcygtMSwgLTEsIC0xKTtcbiAgICogYWFiYi5tYXhQb2ludCA9IFZlY3RvcjMuZnJvbVZhbHVlcygxLCAxLCAxKTtcbiAgICogY29uc29sZS5sb2coYWFiYi5sZW5ndGhDZW50ZXJUb0Nvcm5lcik7IC8vIHNxcnQoMykgXHUyMjQ4IDEuNzMyXG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0IGxlbmd0aENlbnRlclRvQ29ybmVyKCkge1xuICAgIGlmICh0aGlzLl9faXNMZW5ndGhDZW50ZXJUb0Nvcm5lckRpcnR5KSB7XG4gICAgICB0aGlzLl9fbGVuZ3RoQ2VudGVyVG9Db3JuZXIgPSBWZWN0b3IzLmxlbmd0aEJ0dyh0aGlzLmNlbnRlclBvaW50LCB0aGlzLm1heFBvaW50KTtcbiAgICAgIHRoaXMuX19pc0xlbmd0aENlbnRlclRvQ29ybmVyRGlydHkgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19sZW5ndGhDZW50ZXJUb0Nvcm5lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB3aWR0aCBvZiB0aGUgYm91bmRpbmcgYm94IGFsb25nIHRoZSBYLWF4aXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkaWZmZXJlbmNlIGJldHdlZW4gbWF4aW11bSBhbmQgbWluaW11bSBYIGNvb3JkaW5hdGVzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAqIGFhYmIubWluUG9pbnQgPSBWZWN0b3IzLmZyb21WYWx1ZXMoMSwgMCwgMCk7XG4gICAqIGFhYmIubWF4UG9pbnQgPSBWZWN0b3IzLmZyb21WYWx1ZXMoNSwgMCwgMCk7XG4gICAqIGNvbnNvbGUubG9nKGFhYmIuc2l6ZVgpOyAvLyA0XG4gICAqIGBgYFxuICAgKi9cbiAgZ2V0IHNpemVYKCkge1xuICAgIHJldHVybiB0aGlzLl9fbWF4LnggLSB0aGlzLl9fbWluLng7XG4gIH1cblxuICAvKipcbiAgICogR2V0cyB0aGUgaGVpZ2h0IG9mIHRoZSBib3VuZGluZyBib3ggYWxvbmcgdGhlIFktYXhpcy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGRpZmZlcmVuY2UgYmV0d2VlbiBtYXhpbXVtIGFuZCBtaW5pbXVtIFkgY29vcmRpbmF0ZXNcbiAgICpcbiAgICogQGV4YW1wbGVcbiAgICogYGBgdHlwZXNjcmlwdFxuICAgKiBjb25zdCBhYWJiID0gbmV3IEFBQkIoKTtcbiAgICogYWFiYi5taW5Qb2ludCA9IFZlY3RvcjMuZnJvbVZhbHVlcygwLCAyLCAwKTtcbiAgICogYWFiYi5tYXhQb2ludCA9IFZlY3RvcjMuZnJvbVZhbHVlcygwLCA4LCAwKTtcbiAgICogY29uc29sZS5sb2coYWFiYi5zaXplWSk7IC8vIDZcbiAgICogYGBgXG4gICAqL1xuICBnZXQgc2l6ZVkoKSB7XG4gICAgcmV0dXJuIHRoaXMuX19tYXgueSAtIHRoaXMuX19taW4ueTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXRzIHRoZSBkZXB0aCBvZiB0aGUgYm91bmRpbmcgYm94IGFsb25nIHRoZSBaLWF4aXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBkaWZmZXJlbmNlIGJldHdlZW4gbWF4aW11bSBhbmQgbWluaW11bSBaIGNvb3JkaW5hdGVzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAqIGFhYmIubWluUG9pbnQgPSBWZWN0b3IzLmZyb21WYWx1ZXMoMCwgMCwgLTIpO1xuICAgKiBhYWJiLm1heFBvaW50ID0gVmVjdG9yMy5mcm9tVmFsdWVzKDAsIDAsIDMpO1xuICAgKiBjb25zb2xlLmxvZyhhYWJiLnNpemVaKTsgLy8gNVxuICAgKiBgYGBcbiAgICovXG4gIGdldCBzaXplWigpIHtcbiAgICByZXR1cm4gdGhpcy5fX21heC56IC0gdGhpcy5fX21pbi56O1xuICB9XG5cbiAgLyoqXG4gICAqIFRyYW5zZm9ybXMgYW4gQUFCQiBieSBhIG1hdHJpeCBhbmQgc3RvcmVzIHRoZSByZXN1bHQgaW4gYW4gb3V0cHV0IEFBQkIuXG4gICAqXG4gICAqIFRoaXMgbWV0aG9kIHRyYW5zZm9ybXMgYWxsIDggY29ybmVycyBvZiB0aGUgaW5wdXQgQUFCQiB1c2luZyB0aGUgZ2l2ZW4gbWF0cml4LFxuICAgKiB0aGVuIGNhbGN1bGF0ZXMgdGhlIGF4aXMtYWxpZ25lZCBib3VuZGluZyBib3ggdGhhdCBlbmNvbXBhc3NlcyBhbGwgdHJhbnNmb3JtZWQgY29ybmVycy5cbiAgICogVGhpcyBpcyBuZWNlc3NhcnkgYmVjYXVzZSBtYXRyaXggdHJhbnNmb3JtYXRpb25zIGNhbiByb3RhdGUgdGhlIEFBQkIsIHJlcXVpcmluZ1xuICAgKiByZWNhbGN1bGF0aW9uIG9mIHRoZSBheGlzLWFsaWduZWQgYm91bmRzLlxuICAgKlxuICAgKiBAcGFyYW0gbWF0cml4IC0gVGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeCB0byBhcHBseVxuICAgKiBAcGFyYW0gYWFiYiAtIFRoZSBzb3VyY2UgQUFCQiB0byB0cmFuc2Zvcm1cbiAgICogQHBhcmFtIG91dEFhYmIgLSBUaGUgb3V0cHV0IEFBQkIgdG8gc3RvcmUgdGhlIHJlc3VsdFxuICAgKiBAcmV0dXJucyBUaGUgb3V0cHV0IEFBQkIgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICAgKlxuICAgKiBAZXhhbXBsZVxuICAgKiBgYGB0eXBlc2NyaXB0XG4gICAqIGNvbnN0IG1hdHJpeCA9IE1hdHJpeDQ0LnJvdGF0ZVkoTWF0aC5QSSAvIDQpOyAvLyA0NS1kZWdyZWUgcm90YXRpb25cbiAgICogY29uc3Qgc291cmNlQUFCQiA9IG5ldyBBQUJCKCk7XG4gICAqIGNvbnN0IHJlc3VsdEFBQkIgPSBuZXcgQUFCQigpO1xuICAgKiBzb3VyY2VBQUJCLmFkZFBvc2l0aW9uKFZlY3RvcjMuZnJvbVZhbHVlcygxLCAxLCAxKSk7XG4gICAqIEFBQkIubXVsdGlwbHlNYXRyaXhUbyhtYXRyaXgsIHNvdXJjZUFBQkIsIHJlc3VsdEFBQkIpO1xuICAgKiBgYGBcbiAgICovXG4gIHN0YXRpYyBtdWx0aXBseU1hdHJpeFRvKG1hdHJpeDogTWF0cml4NDQsIGFhYmI6IEFBQkIsIG91dEFhYmI6IEFBQkIpIHtcbiAgICBpZiAoYWFiYi5pc1ZhbmlsbGEoKSkge1xuICAgICAgcmV0dXJuIG91dEFhYmIuY29weUNvbXBvbmVudHMoYWFiYik7XG4gICAgfVxuICAgIG91dEFhYmIuaW5pdGlhbGl6ZSgpO1xuXG4gICAgQUFCQi5fX3RtcFZlY3RvcjMueCA9IGFhYmIuX19taW4ueDtcbiAgICBBQUJCLl9fdG1wVmVjdG9yMy55ID0gYWFiYi5fX21pbi55O1xuICAgIEFBQkIuX190bXBWZWN0b3IzLnogPSBhYWJiLl9fbWluLno7XG4gICAgbWF0cml4Lm11bHRpcGx5VmVjdG9yM1RvKEFBQkIuX190bXBWZWN0b3IzLCBBQUJCLl9fdG1wVmVjdG9yMyk7XG4gICAgb3V0QWFiYi5hZGRQb3NpdGlvbihBQUJCLl9fdG1wVmVjdG9yMyk7XG5cbiAgICBBQUJCLl9fdG1wVmVjdG9yMy54ID0gYWFiYi5fX21heC54O1xuICAgIEFBQkIuX190bXBWZWN0b3IzLnkgPSBhYWJiLl9fbWluLnk7XG4gICAgQUFCQi5fX3RtcFZlY3RvcjMueiA9IGFhYmIuX19taW4uejtcbiAgICBtYXRyaXgubXVsdGlwbHlWZWN0b3IzVG8oQUFCQi5fX3RtcFZlY3RvcjMsIEFBQkIuX190bXBWZWN0b3IzKTtcbiAgICBvdXRBYWJiLmFkZFBvc2l0aW9uKEFBQkIuX190bXBWZWN0b3IzKTtcblxuICAgIEFBQkIuX190bXBWZWN0b3IzLnggPSBhYWJiLl9fbWluLng7XG4gICAgQUFCQi5fX3RtcFZlY3RvcjMueSA9IGFhYmIuX19tYXgueTtcbiAgICBBQUJCLl9fdG1wVmVjdG9yMy56ID0gYWFiYi5fX21pbi56O1xuICAgIG1hdHJpeC5tdWx0aXBseVZlY3RvcjNUbyhBQUJCLl9fdG1wVmVjdG9yMywgQUFCQi5fX3RtcFZlY3RvcjMpO1xuICAgIG91dEFhYmIuYWRkUG9zaXRpb24oQUFCQi5fX3RtcFZlY3RvcjMpO1xuXG4gICAgQUFCQi5fX3RtcFZlY3RvcjMueCA9IGFhYmIuX19taW4ueDtcbiAgICBBQUJCLl9fdG1wVmVjdG9yMy55ID0gYWFiYi5fX21pbi55O1xuICAgIEFBQkIuX190bXBWZWN0b3IzLnogPSBhYWJiLl9fbWF4Lno7XG4gICAgbWF0cml4Lm11bHRpcGx5VmVjdG9yM1RvKEFBQkIuX190bXBWZWN0b3IzLCBBQUJCLl9fdG1wVmVjdG9yMyk7XG4gICAgb3V0QWFiYi5hZGRQb3NpdGlvbihBQUJCLl9fdG1wVmVjdG9yMyk7XG5cbiAgICBBQUJCLl9fdG1wVmVjdG9yMy54ID0gYWFiYi5fX21pbi54O1xuICAgIEFBQkIuX190bXBWZWN0b3IzLnkgPSBhYWJiLl9fbWF4Lnk7XG4gICAgQUFCQi5fX3RtcFZlY3RvcjMueiA9IGFhYmIuX19tYXguejtcbiAgICBtYXRyaXgubXVsdGlwbHlWZWN0b3IzVG8oQUFCQi5fX3RtcFZlY3RvcjMsIEFBQkIuX190bXBWZWN0b3IzKTtcbiAgICBvdXRBYWJiLmFkZFBvc2l0aW9uKEFBQkIuX190bXBWZWN0b3IzKTtcblxuICAgIEFBQkIuX190bXBWZWN0b3IzLnggPSBhYWJiLl9fbWF4Lng7XG4gICAgQUFCQi5fX3RtcFZlY3RvcjMueSA9IGFhYmIuX19taW4ueTtcbiAgICBBQUJCLl9fdG1wVmVjdG9yMy56ID0gYWFiYi5fX21heC56O1xuICAgIG1hdHJpeC5tdWx0aXBseVZlY3RvcjNUbyhBQUJCLl9fdG1wVmVjdG9yMywgQUFCQi5fX3RtcFZlY3RvcjMpO1xuICAgIG91dEFhYmIuYWRkUG9zaXRpb24oQUFCQi5fX3RtcFZlY3RvcjMpO1xuXG4gICAgQUFCQi5fX3RtcFZlY3RvcjMueCA9IGFhYmIuX19tYXgueDtcbiAgICBBQUJCLl9fdG1wVmVjdG9yMy55ID0gYWFiYi5fX21heC55O1xuICAgIEFBQkIuX190bXBWZWN0b3IzLnogPSBhYWJiLl9fbWluLno7XG4gICAgbWF0cml4Lm11bHRpcGx5VmVjdG9yM1RvKEFBQkIuX190bXBWZWN0b3IzLCBBQUJCLl9fdG1wVmVjdG9yMyk7XG4gICAgb3V0QWFiYi5hZGRQb3NpdGlvbihBQUJCLl9fdG1wVmVjdG9yMyk7XG5cbiAgICBBQUJCLl9fdG1wVmVjdG9yMy54ID0gYWFiYi5fX21heC54O1xuICAgIEFBQkIuX190bXBWZWN0b3IzLnkgPSBhYWJiLl9fbWF4Lnk7XG4gICAgQUFCQi5fX3RtcFZlY3RvcjMueiA9IGFhYmIuX19tYXguejtcbiAgICBtYXRyaXgubXVsdGlwbHlWZWN0b3IzVG8oQUFCQi5fX3RtcFZlY3RvcjMsIEFBQkIuX190bXBWZWN0b3IzKTtcbiAgICBvdXRBYWJiLmFkZFBvc2l0aW9uKEFBQkIuX190bXBWZWN0b3IzKTtcblxuICAgIHJldHVybiBvdXRBYWJiO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYSBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIEFBQkIgd2l0aCBmdWxsIHByZWNpc2lvbi5cbiAgICpcbiAgICogSW5jbHVkZXMgbWluaW11bSBhbmQgbWF4aW11bSBwb2ludHMsIGNlbnRlciBwb2ludCwgYW5kIGNlbnRlci10by1jb3JuZXIgZGlzdGFuY2UuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgZGV0YWlsZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBBQUJCXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAqIGFhYmIuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tVmFsdWVzKDEsIDIsIDMpKTtcbiAgICogY29uc29sZS5sb2coYWFiYi50b1N0cmluZygpKTtcbiAgICogLy8gT3V0cHV0OiBcIkFBQkJfbWluOiAoMSwgMiwgMylcXG5BQUJCX21heDogKDEsIDIsIDMpXFxuLi4uXCJcbiAgICogYGBgXG4gICAqL1xuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gYEFBQkJfbWluOiAke3RoaXMuX19taW59XFxuQUFCQl9tYXg6ICR7dGhpcy5fX21heH1cXG5jZW50ZXJQb2ludDogJHt0aGlzLl9fY2VudGVyUG9pbnR9XFxubGVuZ3RoQ2VudGVyVG9Db3JuZXI6ICR7dGhpcy5fX2xlbmd0aENlbnRlclRvQ29ybmVyfWA7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgQUFCQiB3aXRoIHJvdW5kZWQgbnVtYmVycyBmb3IgcmVhZGFiaWxpdHkuXG4gICAqXG4gICAqIFNpbWlsYXIgdG8gdG9TdHJpbmcoKSBidXQgd2l0aCBhcHByb3hpbWF0ZSB2YWx1ZXMgdGhhdCBhcmUgZWFzaWVyIHRvIHJlYWQuXG4gICAqIFVzZWZ1bCBmb3IgZGVidWdnaW5nIGFuZCBsb2dnaW5nIHdoZXJlIGV4YWN0IHByZWNpc2lvbiBpcyBub3QgcmVxdWlyZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIEEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIHdpdGggYXBwcm94aW1hdGVkIG51bWVyaWMgdmFsdWVzXG4gICAqXG4gICAqIEBleGFtcGxlXG4gICAqIGBgYHR5cGVzY3JpcHRcbiAgICogY29uc3QgYWFiYiA9IG5ldyBBQUJCKCk7XG4gICAqIGFhYmIuYWRkUG9zaXRpb24oVmVjdG9yMy5mcm9tVmFsdWVzKDEuMjM0NTY3ODksIDIuMzQ1Njc4OSwgMy40NTY3ODkpKTtcbiAgICogY29uc29sZS5sb2coYWFiYi50b1N0cmluZ0FwcHJveGltYXRlbHkoKSk7XG4gICAqIC8vIE91dHB1dCB3aXRoIHJvdW5kZWQgdmFsdWVzIGZvciBiZXR0ZXIgcmVhZGFiaWxpdHlcbiAgICogYGBgXG4gICAqL1xuICB0b1N0cmluZ0FwcHJveGltYXRlbHkoKSB7XG4gICAgcmV0dXJuIGBBQUJCX21heDogJHt0aGlzLl9fbWF4LnRvU3RyaW5nQXBwcm94aW1hdGVseSgpfVxcbkFBQkJfbWluOiAke3RoaXMuX19taW4udG9TdHJpbmdBcHByb3hpbWF0ZWx5KCl9XFxuY2VudGVyUG9pbnQ6ICR7dGhpcy5jZW50ZXJQb2ludC50b1N0cmluZ0FwcHJveGltYXRlbHkoKX1cXG5sZW5ndGhDZW50ZXJUb0Nvcm5lcjogJHtNYXRoVXRpbC5maW5hbmNpYWwodGhpcy5sZW5ndGhDZW50ZXJUb0Nvcm5lcil9YDtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUNBLFNBQVMsZ0JBQWdCO0FBRXpCLFNBQVMsc0JBQXNCO0FBQy9CLFNBQVMsZUFBZTtBQWlCakIsSUFBTSxRQUFOLE1BQU0sTUFBSztBQUFBLEVBQVg7QUFDTCxTQUFRLFFBQXdCLGVBQWUsY0FBYyxDQUFDLE9BQU8sV0FBVyxPQUFPLFdBQVcsT0FBTyxTQUFTLENBQUM7QUFDbkgsU0FBUSxRQUF3QixlQUFlLGNBQWM7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QUssYUFBYSxJQUFJLEtBQUssTUFBTTtBQUNqQyxXQUFPLGtCQUFrQixNQUFLLGNBQWMsTUFBSyxZQUFZO0FBQzdELFlBQVEsWUFBWSxNQUFLLFlBQVk7QUFFckMsVUFBSyxhQUFhLElBQUksS0FBSyxNQUFNO0FBQ2pDLFVBQUssYUFBYSxJQUFJLEtBQUssTUFBTTtBQUNqQyxVQUFLLGFBQWEsSUFBSSxLQUFLLE1BQU07QUFDakMsV0FBTyxrQkFBa0IsTUFBSyxjQUFjLE1BQUssWUFBWTtBQUM3RCxZQUFRLFlBQVksTUFBSyxZQUFZO0FBRXJDLFVBQUssYUFBYSxJQUFJLEtBQUssTUFBTTtBQUNqQyxVQUFLLGFBQWEsSUFBSSxLQUFLLE1BQU07QUFDakMsVUFBSyxhQUFhLElBQUksS0FBSyxNQUFNO0FBQ2pDLFdBQU8sa0JBQWtCLE1BQUssY0FBYyxNQUFLLFlBQVk7QUFDN0QsWUFBUSxZQUFZLE1BQUssWUFBWTtBQUVyQyxVQUFLLGFBQWEsSUFBSSxLQUFLLE1BQU07QUFDakMsVUFBSyxhQUFhLElBQUksS0FBSyxNQUFNO0FBQ2pDLFVBQUssYUFBYSxJQUFJLEtBQUssTUFBTTtBQUNqQyxXQUFPLGtCQUFrQixNQUFLLGNBQWMsTUFBSyxZQUFZO0FBQzdELFlBQVEsWUFBWSxNQUFLLFlBQVk7QUFFckMsV0FBTztBQUFBLEVBQ1Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQWlCQSxXQUFXO0FBQ1QsV0FBTyxhQUFhLEtBQUssS0FBSztBQUFBLFlBQWUsS0FBSyxLQUFLO0FBQUEsZUFBa0IsS0FBSyxhQUFhO0FBQUEsd0JBQTJCLEtBQUssc0JBQXNCO0FBQUEsRUFDbko7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBa0JBLHdCQUF3QjtBQUN0QixXQUFPLGFBQWEsS0FBSyxNQUFNLHNCQUFzQixDQUFDO0FBQUEsWUFBZSxLQUFLLE1BQU0sc0JBQXNCLENBQUM7QUFBQSxlQUFrQixLQUFLLFlBQVksc0JBQXNCLENBQUM7QUFBQSx3QkFBMkIsU0FBUyxVQUFVLEtBQUssb0JBQW9CLENBQUM7QUFBQSxFQUMzTztBQUNGO0FBemZhLE1BV0ksZUFBZSxlQUFlLEtBQUs7QUFYN0MsSUFBTSxPQUFOOyIsCiAgIm5hbWVzIjogW10KfQo=
