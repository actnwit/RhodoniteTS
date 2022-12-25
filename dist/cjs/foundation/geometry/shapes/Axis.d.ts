import { IAnyPrimitiveDescriptor } from '../Primitive';
import { Size } from '../../../types/CommonTypes';
import { IShape } from '../shapes/IShape';
export interface AxisDescriptor extends IAnyPrimitiveDescriptor {
    /** the length of axis */
    length?: Size;
}
/**
 * the Axis class
 */
export declare class Axis extends IShape {
    /**
     * Generates a axis object
     * @param _desc a descriptor object of a Axis
     */
    generate(_desc: AxisDescriptor): void;
}
