import type { Size } from '../../../types/CommonTypes';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from '../shapes/IShape';
/**
 * Descriptor interface for creating an Axis shape
 * @public
 */
export interface AxisDescriptor extends IAnyPrimitiveDescriptor {
    /**
     * The length of each axis line
     * @defaultValue 1
     */
    length?: Size;
}
/**
 * A 3D coordinate axis shape that displays X, Y, and Z axes with different colors.
 * The X axis is rendered in red, Y axis in green, and Z axis in blue.
 * Each axis extends from the origin (0,0,0) to the specified length.
 * @public
 */
export declare class Axis extends IShape {
    /**
     * Generates vertex data for a 3D coordinate axis with colored lines
     * representing X (red), Y (green), and Z (blue) axes.
     *
     * @param _desc - Configuration object containing axis properties
     * @param _desc.length - The length of each axis line (defaults to 1)
     * @param _desc.material - Material to be applied to the axis
     *
     * @remarks
     * This method creates three colored lines extending from the origin:
     * - X axis: Red line from (0,0,0) to (length,0,0)
     * - Y axis: Green line from (0,0,0) to (0,length,0)
     * - Z axis: Blue line from (0,0,0) to (0,0,length)
     *
     * The generated geometry uses LINE primitive mode for rendering.
     *
     * @public
     */
    generate(_desc: AxisDescriptor): void;
}
