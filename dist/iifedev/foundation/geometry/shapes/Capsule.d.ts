import type { Count } from '../../../types/CommonTypes';
import type { PhysicsProperty } from '../../physics/PhysicsProperty';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
/**
 * The argument descriptor for Capsule primitives
 */
export interface CapsuleDescriptor extends IAnyPrimitiveDescriptor {
    /**
     * The radius of the capsule (half-spheres and cylinder).
     * @default 0.5
     */
    radius?: number;
    /**
     * The height of the capsule (distance between the centers of the two half-spheres).
     * @default 1
     */
    height?: number;
    /**
     * The number of segments that define the capsule's width (horizontal divisions).
     * @default 16
     */
    widthSegments?: Count;
    /**
     * The number of segments that define the capsule's height (vertical divisions for each half-sphere).
     * @default 8
     */
    heightSegments?: Count;
    /**
     * Physics properties associated with the capsule, such as mass and collision settings.
     */
    physics?: PhysicsProperty;
}
/**
 * Capsule class for generating capsule geometry with customizable parameters.
 * A capsule consists of a cylinder with hemispherical caps at both ends.
 * The capsule is oriented along the Y-axis, with the center at the origin.
 */
export declare class Capsule extends IShape {
    /**
     * Generates capsule geometry with the specified parameters
     *
     * @param _desc - The capsule descriptor containing generation parameters
     * @param _desc.radius - The radius of the capsule (default: 0.5)
     * @param _desc.height - The height of the cylinder part (default: 1)
     * @param _desc.widthSegments - The number of horizontal segments (default: 16)
     * @param _desc.heightSegments - The number of vertical segments for each hemisphere (default: 8)
     * @param _desc.material - The material to apply to the capsule
     *
     * @remarks
     * This method generates vertex positions, texture coordinates, normals, and indices
     * for a capsule shape. The capsule is centered at the origin with its axis along the Y-axis.
     * The total height of the capsule is (height + 2 * radius).
     *
     * If the radius is zero or nearly zero, it will be clamped to 0.001 for safety.
     *
     * @example
     * ```typescript
     * const capsule = new Capsule();
     * capsule.generate({
     *   radius: 0.5,
     *   height: 2.0,
     *   widthSegments: 24,
     *   heightSegments: 12,
     *   material: myMaterial
     * });
     * ```
     */
    generate(_desc: CapsuleDescriptor): void;
}
