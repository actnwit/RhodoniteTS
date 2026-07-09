import type { Size } from '../../../types/CommonTypes';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
/**
 * Interface describing the configuration options for creating a plane geometry
 * @interface PlaneDescriptor
 * @extends IAnyPrimitiveDescriptor
 */
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
 * A class for generating plane geometry with customizable dimensions and tessellation
 *
 * The Plane class creates a rectangular mesh that lies in the XZ plane (Y=0) by default.
 * It supports various configuration options including size, subdivision, and texture mapping.
 *
 * @class Plane
 * @extends IShape
 */
export declare class Plane extends IShape {
    /**
     * Generates a plane geometry with the specified parameters
     *
     * Creates a rectangular plane mesh with configurable width, height, and tessellation.
     * The plane is generated in the XZ plane with Y=0, centered at the origin.
     * Supports texture coordinate generation with optional UV repetition and Y-axis flipping.
     *
     * @param _desc - Configuration object containing plane generation parameters
     * @param _desc.width - The width of the plane along the X-axis (default: 1)
     * @param _desc.height - The height of the plane along the Z-axis (default: 1)
     * @param _desc.uSpan - Number of subdivisions along the U(X)-axis (default: 1)
     * @param _desc.vSpan - Number of subdivisions along the V(Z)-axis (default: 1)
     * @param _desc.isUVRepeat - Whether to repeat texture coordinates instead of normalizing (default: false)
     * @param _desc.flipTextureCoordinateY - Whether to flip texture coordinates along the V-axis (default: false)
     * @param _desc.material - Optional material to assign to the generated geometry
     *
     * @returns void
     *
     * @example
     * ```typescript
     * const plane = new Plane();
     * plane.generate({
     *   width: 2,
     *   height: 2,
     *   uSpan: 4,
     *   vSpan: 4,
     *   isUVRepeat: false,
     *   flipTextureCoordinateY: true
     * });
     * ```
     */
    generate(_desc: PlaneDescriptor): void;
}
