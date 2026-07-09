import type { Count } from '../../../types/CommonTypes';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
/**
 * Descriptor for generating a cone primitive.
 */
export interface ConeDescriptor extends IAnyPrimitiveDescriptor {
    /**
     * Radius of the cone base.
     * @defaultValue 0.1
     */
    radius?: number;
    /**
     * Height of the cone measured along the +Y axis.
     * @defaultValue 0.25
     */
    height?: number;
    /**
     * Number of radial segments that form the cone circumference.
     * @defaultValue 12
     */
    radialSegments?: Count;
    /**
     * Whether to generate a base disk that caps the cone.
     * @defaultValue true
     */
    includeBase?: boolean;
}
/**
 * Cone primitive aligned along the +Y axis (base on the XZ plane, tip along +Y).
 */
export declare class Cone extends IShape {
    /**
     * Generates vertex buffers for a cone shape.
     * @param _desc - Cone descriptor with geometry options.
     */
    generate(_desc: ConeDescriptor): void;
}
