import type { Count } from '../../../types/CommonTypes';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
/**
 * Type definition for ring axis orientation
 */
export type RingAxis = 'x' | 'y' | 'z';
/**
 * Descriptor for generating a ring primitive.
 */
export interface RingDescriptor extends IAnyPrimitiveDescriptor {
    /**
     * The radius of the ring (distance from center to middle of the ring band).
     * @defaultValue 1
     */
    radius?: number;
    /**
     * The thickness of the ring band (half-width on each side of the radius).
     * @defaultValue 0.1
     */
    thickness?: number;
    /**
     * Number of segments that form the ring circumference.
     * @defaultValue 64
     */
    segments?: Count;
    /**
     * The axis perpendicular to the ring plane.
     * - 'x': Ring lies in the YZ plane
     * - 'y': Ring lies in the XZ plane
     * - 'z': Ring lies in the XY plane
     * @defaultValue 'y'
     */
    axis?: RingAxis;
}
/**
 * Ring primitive that creates a flat ring (annulus) shape.
 *
 * The ring is generated as a triangle strip with an outer and inner edge,
 * lying flat perpendicular to the specified axis.
 *
 * @example
 * ```typescript
 * const ring = new Ring();
 * ring.generate({
 *   radius: 2,
 *   thickness: 0.3,
 *   segments: 32,
 *   axis: 'y'
 * });
 * ```
 */
export declare class Ring extends IShape {
    /**
     * Generates vertex buffers for a ring shape.
     * @param _desc - Ring descriptor with geometry options.
     */
    generate(_desc: RingDescriptor): void;
}
