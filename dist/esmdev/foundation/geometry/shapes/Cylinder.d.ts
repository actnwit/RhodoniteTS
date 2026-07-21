import type { Count } from '../../../types/CommonTypes';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
/** Descriptor for a capped cylinder or truncated cone aligned with the Y axis. */
export interface CylinderDescriptor extends IAnyPrimitiveDescriptor {
    radiusBottom?: number;
    radiusTop?: number;
    height?: number;
    radialSegments?: Count;
    includeCaps?: boolean;
}
/** A centered, capped cylinder that also supports different top and bottom radii. */
export declare class Cylinder extends IShape {
    generate(_desc?: CylinderDescriptor): void;
    private __appendCap;
}
