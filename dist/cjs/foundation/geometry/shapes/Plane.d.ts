import { IAnyPrimitiveDescriptor } from '../Primitive';
import { Size } from '../../../types/CommonTypes';
import { IShape } from './IShape';
export interface PlaneDescriptor extends IAnyPrimitiveDescriptor {
    /** the length of U(X)-axis direction */
    width?: Size;
    /** the length of V(Y)-axis direction */
    height?: Size;
    /** number of spans in U(X)-axis direction */
    uSpan?: Size;
    /** number of spans in V(Y)-axis direction */
    vSpan?: Size;
    /** draw uSpan times vSpan number of textures */
    isUVRepeat?: boolean;
    /** draw textures by flipping on the V(Y)-axis */
    flipTextureCoordinateY?: boolean;
}
/**
 * Plane class
 *
 */
export declare class Plane extends IShape {
    /**
     * Generates a plane object
     * @param _desc a descriptor object of a Plane
     */
    generate(_desc: PlaneDescriptor): void;
}
