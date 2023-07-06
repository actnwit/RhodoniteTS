import { IColorRgba } from '../../math/IColor';
import { IVector3 } from '../../math/IVector';
import { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
export interface CubeDescriptor extends IAnyPrimitiveDescriptor {
    /** three width (width, height, depth) in (x, y, z) */
    widthVector?: IVector3;
    /** color */
    color?: IColorRgba;
}
/**
 * The Cube Primitive class
 */
export declare class Cube extends IShape {
    /**
     * Generates a cube object
     * @param _desc a descriptor object of a Cube
     */
    generate(_desc: CubeDescriptor): void;
}
