import type { IQuaternion } from './IQuaternion';
import type { IMutableVector3, IVector3 } from './IVector';
/**
 * Abstract base class for quaternion implementations.
 *
 * Quaternions are a mathematical system that extends complex numbers and are commonly used
 * in 3D graphics for representing rotations. A quaternion consists of four components (x, y, z, w)
 * where (x, y, z) represents the vector part and w represents the scalar part.
 *
 * This abstract class provides common functionality and interface for all quaternion implementations
 * while leaving specific operations to be implemented by concrete subclasses.
 */
export declare abstract class AbstractQuaternion implements IQuaternion {
    /**
     * Gets the class name of the quaternion implementation.
     * @returns The name of the constructor function
     */
    get className(): string;
    /**
     * Gets the x component (i coefficient) of the quaternion.
     * @returns The x component value
     */
    get x(): number;
    /**
     * Gets the y component (j coefficient) of the quaternion.
     * @returns The y component value
     */
    get y(): number;
    /**
     * Gets the z component (k coefficient) of the quaternion.
     * @returns The z component value
     */
    get z(): number;
    /**
     * Gets the w component (scalar part) of the quaternion.
     * @returns The w component value
     */
    get w(): number;
    /**
     * Gets the component at the specified index.
     * @param i - The index (0=x, 1=y, 2=z, 3=w)
     * @returns The component value at the given index
     */
    at(i: number): number;
    /**
     * Calculates the magnitude (length) of the quaternion.
     * @returns The Euclidean norm of the quaternion
     */
    length(): number;
    /**
     * Calculates the squared magnitude of the quaternion.
     * This is more efficient than length() when you only need to compare magnitudes.
     * @returns The squared Euclidean norm of the quaternion
     */
    lengthSquared(): number;
    /**
     * Converts the quaternion to a string representation.
     * @returns String representation of the quaternion
     * @throws Error - Method must be implemented by subclass
     */
    toString(): string;
    /**
     * Converts the quaternion to an approximate string representation.
     * Useful for debugging when exact precision is not required.
     * @returns Approximate string representation of the quaternion
     * @throws Error - Method must be implemented by subclass
     */
    toStringApproximately(): string;
    /**
     * Flattens the quaternion components into a plain number array.
     * @returns Array containing [x, y, z, w] components
     * @throws Error - Method must be implemented by subclass
     */
    flattenAsArray(): number[];
    /**
     * Checks if this quaternion is a dummy/placeholder instance.
     * @returns True if this is a dummy quaternion, false otherwise
     * @throws Error - Method must be implemented by subclass
     */
    isDummy(): boolean;
    /**
     * Checks if this quaternion is approximately equal to another quaternion within a tolerance.
     * @param vec - The quaternion to compare against
     * @param delta - Optional tolerance value for comparison
     * @returns True if quaternions are approximately equal, false otherwise
     * @throws Error - Method must be implemented by subclass
     */
    isEqual(_vec: IQuaternion, _delta?: number): boolean;
    /**
     * Checks if this quaternion is exactly equal to another quaternion.
     * @param vec - The quaternion to compare against
     * @returns True if quaternions are exactly equal, false otherwise
     * @throws Error - Method must be implemented by subclass
     */
    isStrictEqual(_vec: IQuaternion): boolean;
    /**
     * Converts the quaternion to Euler angles and stores the result in the output vector.
     * @param out - The mutable vector to store the resulting Euler angles
     * @returns The output vector containing the Euler angles
     * @throws Error - Method must be implemented by subclass
     */
    toEulerAnglesTo(_out: IMutableVector3): IMutableVector3;
    /**
     * Converts the quaternion to Euler angles.
     * @returns A new vector containing the Euler angles
     * @throws Error - Method must be implemented by subclass
     */
    toEulerAngles(): IVector3;
    /**
     * Transforms a 3D vector by this quaternion rotation.
     * @param vec - The vector to transform
     * @returns A new transformed vector
     * @throws Error - Method must be implemented by subclass
     */
    transformVector3(_vec: IVector3): IVector3;
    /**
     * Transforms a 3D vector by this quaternion rotation and stores the result in the output vector.
     * @param vec - The vector to transform
     * @param out - The mutable vector to store the result
     * @returns The output vector containing the transformed result
     * @throws Error - Method must be implemented by subclass
     */
    transformVector3To(_vec: IVector3, _out: IMutableVector3): IVector3;
    /**
     * Transforms a 3D vector by the inverse of this quaternion rotation.
     * @param vec - The vector to transform
     * @returns A new vector transformed by the inverse rotation
     * @throws Error - Method must be implemented by subclass
     */
    transformVector3Inverse(_vec: IVector3): IVector3;
    /**
     * Calculates the dot product between this quaternion and another quaternion.
     * The dot product of two quaternions gives a scalar value that represents
     * the cosine of half the angle between them when both quaternions are unit quaternions.
     * @param quat - The quaternion to compute the dot product with
     * @returns The dot product result
     */
    dot(quat: IQuaternion): number;
    /**
     * Creates a deep copy of this quaternion.
     * @returns A new quaternion instance with the same values
     * @throws Error - Method must be implemented by subclass
     */
    clone(): IQuaternion;
    /**
     * Internal typed array storage for quaternion components [x, y, z, w].
     * @protected
     */
    _v: Float32Array;
}
