import type { Array3, Array4 } from '../../types';
import type { IMatrix44 } from './IMatrix';
import type { IQuaternion } from './IQuaternion';
import type { IVector3 } from './IVector';
import { MutableMatrix44 } from './MutableMatrix44';
import { MutableQuaternion } from './MutableQuaternion';
import { MutableVector3 } from './MutableVector3';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';
/**
 * Represents a 3D transformation containing position, rotation, and scale components.
 * This class provides a convenient way to handle 3D object transformations with
 * automatic matrix composition and decomposition capabilities.
 *
 * @example
 * ```typescript
 * const transform = new Transform3D();
 * transform.position = Vector3.fromCopyArray([1, 2, 3]);
 * transform.scale = Vector3.fromCopyArray([2, 2, 2]);
 * transform.rotation = Quaternion.fromEulerAngles(0, Math.PI / 4, 0);
 * const matrix = transform.matrix;
 * ```
 */
export declare class Transform3D {
    private __position;
    private __scale;
    private __rotation;
    private __updateCount;
    private static __tmpMatrix44_0;
    private static __tmpVector3_0;
    private static __tmpVector3_1;
    private static __tmpVector3_2;
    private static __tmpQuaternion_0;
    /**
     * Creates a new Transform3D instance.
     * @param transform - Optional Transform3D instance to copy from
     */
    constructor();
    constructor(Transform3D: Transform3D);
    /**
     * Checks if this transform is equal to another transform within a given tolerance.
     * @param rhs - The transform to compare against
     * @param delta - The tolerance for comparison (default: Number.EPSILON)
     * @returns True if the transforms are equal within the specified tolerance
     */
    isEqual(rhs: Transform3D, delta?: number): boolean;
    /**
     * Creates a deep copy of this transform.
     * @returns A new Transform3D instance with the same values
     */
    clone(): Transform3D;
    /**
     * Sets the position of the transform.
     * @param vec - The new position vector
     */
    set position(vec: IVector3);
    /**
     * Sets the position using an array of three numbers.
     * @param array - Array containing [x, y, z] position values
     */
    setPositionAsArray3(array: Array3<number>): void;
    /**
     * Gets a copy of the local position vector.
     * @returns A cloned MutableVector3 representing the position
     */
    get position(): MutableVector3;
    /**
     * Gets the internal position vector (direct reference).
     * @returns The internal MutableVector3 position object
     */
    get positionInner(): MutableVector3;
    /**
     * Sets the rotation using Euler angles (XYZ order).
     * @param vec - Vector containing rotation angles in radians [x, y, z]
     */
    set eulerAngles(vec: IVector3);
    /**
     * Gets a copy of the rotation as Euler angles (XYZ order).
     * @returns A cloned Vector3 containing rotation angles in radians [x, y, z]
     */
    get eulerAngles(): IVector3;
    /**
     * Gets the rotation as Euler angles (XYZ order) - direct reference.
     * @returns A Vector3 containing rotation angles in radians [x, y, z]
     */
    get eulerAnglesInner(): Vector3;
    /**
     * Sets the scale of the transform.
     * @param vec - The new scale vector
     */
    set scale(vec: IVector3);
    /**
     * Sets the scale using an array of three numbers.
     * @param array - Array containing [x, y, z] scale values
     */
    setScaleAsArray3(array: Array3<number>): void;
    /**
     * Gets a copy of the local scale vector.
     * @returns A cloned MutableVector3 representing the scale
     */
    get scale(): IVector3;
    /**
     * Gets the internal scale vector (direct reference).
     * @returns The internal MutableVector3 scale object
     */
    get scaleInner(): MutableVector3;
    /**
     * Sets the rotation using a quaternion.
     * @param quat - The new rotation quaternion
     */
    set rotation(quat: IQuaternion);
    /**
     * Sets the rotation using an array of four numbers representing a quaternion.
     * @param array - Array containing [x, y, z, w] quaternion values
     */
    setRotationAsArray4(array: Array4<number>): void;
    /**
     * Gets a copy of the local rotation quaternion.
     * @returns A cloned Quaternion representing the rotation
     */
    get rotation(): IQuaternion;
    /**
     * Gets the internal rotation quaternion (direct reference).
     * @returns The internal Quaternion rotation object
     */
    get rotationInner(): Quaternion;
    /**
     * Internal method to increment the update counter when transform changes.
     * @private
     */
    __updateTransform(): void;
    /**
     * Sets the transform from a 4x4 transformation matrix.
     * Decomposes the matrix into position, rotation, and scale components.
     * @param mat - The transformation matrix to decompose
     */
    set matrix(mat: IMatrix44);
    /**
     * Gets a copy of the local transformation matrix.
     * @returns A new Matrix44 representing the composed transformation
     */
    get matrix(): IMatrix44;
    /**
     * Gets the local transformation matrix composed from position, rotation, and scale.
     * The matrix is computed as: Translation * Rotation * Scale
     * @returns A MutableMatrix44 representing the composed transformation
     */
    get matrixInner(): MutableMatrix44;
    /**
     * Efficiently computes the transformation matrix and stores it in the provided matrix.
     * This method avoids memory allocation by reusing an existing matrix object.
     * @param mat - The target matrix to store the result in
     */
    getMatrixInnerTo(mat: MutableMatrix44): void;
    /**
     * Gets the number of times this transform has been updated.
     * This can be useful for optimization and caching purposes.
     * @returns The update count as a number
     */
    get updateCount(): number;
    /**
     * Sets the rotation using a 4x4 rotation matrix.
     * @param rotateMatrix - The rotation matrix to extract rotation from
     */
    set rotateMatrix44(rotateMatrix: IMatrix44);
    /**
     * Gets the rotation as a 4x4 rotation matrix.
     * @returns A Matrix44 representing only the rotation component
     */
    get rotateMatrix44(): IMatrix44;
    /**
     * Sets transform properties from a JSON object.
     * Supports setting position, scale, rotation (as quaternion), and matrix properties.
     * @param arg - JSON object or JSON string containing transform properties
     */
    setPropertiesFromJson(arg: JSON): void;
    /**
     * Sets the rotation to align with specified up and front vectors.
     * Creates a coordinate system where the Y-axis aligns with the up vector
     * and the Z-axis aligns with the front vector.
     * @param UpVec - The desired up direction (Y-axis)
     * @param FrontVec - The desired front direction (Z-axis)
     */
    setRotationFromNewUpAndFront(UpVec: IVector3, FrontVec: IVector3): void;
    /**
     * Rotates the transform to face from one direction to another.
     * Calculates the rotation needed to align the 'from' direction with the 'to' direction.
     * @param fromVec - The current forward direction
     * @param toVec - The target direction to face towards
     */
    headToDirection(fromVec: Vector3, toVec: Vector3): void;
    /**
     * Sets multiple transform components at once for optimal performance.
     * This method reduces the cost of automatically updating transform matrices
     * by setting all components in a single operation. Useful for animation and
     * batch updates where performance is critical.
     *
     * Note: The provided transform components must be mutually consistent.
     * For example, if a matrix is provided, its decomposed translate, rotate, and scale
     * components should match the individual component arguments.
     *
     * @param translate - The position component
     * @param scale - The scale component
     * @param rotation - The rotation component as a quaternion
     */
    setTransform(translate: MutableVector3, scale: MutableVector3, rotation: MutableQuaternion): void;
}
