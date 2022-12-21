import { IAnyPrimitiveDescriptor } from '../Primitive';
import { Size } from '../../../types/CommonTypes';
import { IShape } from './IShape';
export interface GridDescriptor extends IAnyPrimitiveDescriptor {
    /** the desc.length of axis */
    length: Size;
    /** the division of grid */
    division: Size;
    /** the XZ axis */
    isXZ: boolean;
    /** the XY axis */
    isXY: boolean;
    /** the YZ axis */
    isYZ: boolean;
}
/**
 * the Grid class
 */
export declare class Grid extends IShape {
    /**
     * Generates a grid object
     * @param desc a descriptor object of a Grid
     */
    generate(desc: GridDescriptor): void;
}
