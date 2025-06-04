import { FloatTypedArrayConstructor } from '../../../types/CommonTypes';
import { IMutableVector3, IVector3 } from '../IVector';
import { MutableVector3_ } from '../MutableVector3';
import { Vector3_ } from '../Vector3';

/**
 * A mathematical sphere class with position and radius properties.
 * Supports collision detection with rays and provides basic sphere operations.
 *
 * @template T - The floating-point typed array constructor type (Float32Array or Float64Array)
 */
export class MathSphere_<T extends FloatTypedArrayConstructor> {
  private __position: MutableVector3_<T>;
  private __radius: number;
  private __type: FloatTypedArrayConstructor;

  /**
   * Creates a new MathSphere instance.
   *
   * @param position - The center position of the sphere as a mutable 3D vector
   * @param radius - The radius of the sphere (must be positive)
   */
  constructor(position: IMutableVector3, radius: number) {
    this.__position = position;
    this.__radius = radius;
    if (this.__position.bytesPerComponent === 4) {
      this.__type = Float32Array;
    } else {
      this.__type = Float64Array;
    }
  }

  /**
   * Gets the center position of the sphere.
   *
   * @returns The mutable 3D vector representing the sphere's center position
   */
  get position() {
    return this.__position;
  }

  /**
   * Gets the radius of the sphere.
   *
   * @returns The radius value of the sphere
   */
  get radius() {
    return this.__radius;
  }

  /**
   * Calculates whether a ray intersects with this sphere using ray-sphere intersection algorithm.
   * This method uses the geometric approach with quadratic formula to determine intersection.
   *
   * @param rayPos - The starting position of the ray
   * @param rayDir - The direction vector of the ray (should be normalized for accurate results)
   * @returns True if the ray intersects with the sphere, false otherwise
   */
  calcCollision(rayPos: IVector3, rayDir: IVector3): boolean {
    const m = Vector3_._subtract(rayPos, this.__position, this.__type);
    const b = Vector3_.dot(m, rayDir);
    const c = Vector3_.dot(m, m) - this.__radius * this.__radius;

    if (c > 0 && b > 0) {
      return false;
    }

    const discR = b * b - c;
    if (discR < 0) {
      return false;
    }

    return true;
  }
}

/**
 * A 32-bit floating-point precision mathematical sphere.
 * This is the standard precision version for most use cases.
 */
export class MathSphere extends MathSphere_<Float32ArrayConstructor> {}

/**
 * A 64-bit floating-point precision mathematical sphere.
 * This provides double precision for applications requiring higher accuracy.
 */
export class MathSphereD extends MathSphere_<Float64ArrayConstructor> {}

/**
 * Type alias for the standard 32-bit floating-point mathematical sphere.
 */
export type MathSphereF = MathSphere;
