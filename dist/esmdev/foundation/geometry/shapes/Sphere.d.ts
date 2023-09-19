import { IAnyPrimitiveDescriptor } from '../Primitive';
import { Count } from '../../../types/CommonTypes';
import { IShape } from './IShape';
import { PhysicsProperty } from '../../physics/PhysicsProperty';
/**
 * The argument descriptor for Plane primitives
 */
export interface SphereDescriptor extends IAnyPrimitiveDescriptor {
    /** radius */
    radius?: number;
    /** the number of segments for width direction */
    widthSegments?: Count;
    /** the number of segments for height direction */
    heightSegments?: Count;
    physics?: PhysicsProperty;
}
/**
 * Sphere class
 */
export declare class Sphere extends IShape {
    constructor();
    generate(_desc: SphereDescriptor): void;
}
