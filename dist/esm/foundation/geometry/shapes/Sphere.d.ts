import type { Count } from '../../../types/CommonTypes';
import type { PhysicsProperty } from '../../physics/PhysicsProperty';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
/**
 * The argument descriptor for Sphere primitives
 */
export interface SphereDescriptor extends IAnyPrimitiveDescriptor {
    /**
     * The radius of the sphere.
     * @default 1
     */
    radius?: number;
    /**
     * The number of segments that define the sphere's width (horizontal divisions).
     * @default 10
     */
    widthSegments?: Count;
    /**
     * The number of segments that define the sphere's height (vertical divisions).
     * @default 10
     */
    heightSegments?: Count;
    /**
     * Indicates whether to invert the normals of the sphere's surface.
     * @default false
     */
    inverseNormal?: boolean;
    /**
     * Physics properties associated with the sphere, such as mass and collision settings.
     */
    physics?: PhysicsProperty;
}
/**
 * Sphere class for generating spherical geometry with customizable parameters
 */
export declare class Sphere extends IShape {
    /**
     * Generates sphere geometry with the specified parameters
     *
     * @param _desc - The sphere descriptor containing generation parameters
     * @param _desc.radius - The radius of the sphere (default: 1)
     * @param _desc.widthSegments - The number of horizontal segments (default: 10)
     * @param _desc.heightSegments - The number of vertical segments (default: 10)
     * @param _desc.material - The material to apply to the sphere
     * @param _desc.inverseNormal - Whether to invert the normals (default: false)
     *
     * @remarks
     * This method generates vertex positions, texture coordinates, normals, and indices
     * for a UV sphere using spherical coordinates. The sphere is centered at the origin.
     *
     * If the radius is zero or nearly zero, it will be clamped to 0.001 for safety.
     * A small shift value is applied to avoid singularities at the poles.
     *
     * The texture coordinates are mapped so that u ranges from 0 to 1 (longitude)
     * and v ranges from 0 to 1 (latitude).
     *
     * @example
     * ```typescript
     * const sphere = new Sphere();
     * sphere.generate({
     *   radius: 2.0,
     *   widthSegments: 20,
     *   heightSegments: 20,
     *   material: myMaterial
     * });
     * ```
     */
    generate(_desc: SphereDescriptor): void;
}
