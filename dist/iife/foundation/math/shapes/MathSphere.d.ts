import type { FloatTypedArrayConstructor } from '../../../types/CommonTypes';
import type { IMutableVector3, IVector3 } from '../IVector';
import type { MutableVector3_ } from '../MutableVector3';
/**
 * A mathematical sphere class with position and radius properties.
 * Supports collision detection with rays and provides basic sphere operations.
 *
 * @template T - The floating-point typed array constructor type (Float32Array or Float64Array)
 */
export declare class MathSphere_<T extends FloatTypedArrayConstructor> {
    private __position;
    private __radius;
    private __type;
    /**
     * Creates a new MathSphere instance.
     *
     * @param position - The center position of the sphere as a mutable 3D vector
     * @param radius - The radius of the sphere (must be positive)
     */
    constructor(position: IMutableVector3, radius: number);
    /**
     * Gets the center position of the sphere.
     *
     * @returns The mutable 3D vector representing the sphere's center position
     */
    get position(): MutableVector3_<T>;
    /**
     * Gets the radius of the sphere.
     *
     * @returns The radius value of the sphere
     */
    get radius(): number;
    /**
     * Calculates whether a ray intersects with this sphere using ray-sphere intersection algorithm.
     * This method uses the geometric approach with quadratic formula to determine intersection.
     *
     * @param rayPos - The starting position of the ray
     * @param rayDir - The direction vector of the ray (should be normalized for accurate results)
     * @returns True if the ray intersects with the sphere, false otherwise
     */
    calcCollision(rayPos: IVector3, rayDir: IVector3): boolean;
}
/**
 * A 32-bit floating-point precision mathematical sphere.
 * This is the standard precision version for most use cases.
 */
export declare class MathSphere extends MathSphere_<Float32ArrayConstructor> {
}
/**
 * A 64-bit floating-point precision mathematical sphere.
 * This provides double precision for applications requiring higher accuracy.
 */
export declare class MathSphereD extends MathSphere_<Float64ArrayConstructor> {
}
/**
 * Type alias for the standard 32-bit floating-point mathematical sphere.
 */
export type MathSphereF = MathSphere;
