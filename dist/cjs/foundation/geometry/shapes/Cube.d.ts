import { IColorRgba } from '../../math/IColor';
import { IVector3 } from '../../math/IVector';
import { IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
import { IShape } from './IShape';
export interface CubeDescriptor extends IAnyPrimitiveDescriptor {
    /** three width (width, height, depth) in (x, y, z) */
    widthVector: IVector3;
    /** color */
    color?: IColorRgba;
}
/**
 * The Cube Primitive class
 */
export declare class Cube extends Primitive implements IShape {
    /**
     * Generates a cube object
     * @param desc a descriptor object of a Cube
     */
    generate(desc: CubeDescriptor): void;
}