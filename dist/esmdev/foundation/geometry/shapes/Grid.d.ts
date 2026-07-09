import type { Size } from '../../../types/CommonTypes';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
/**
 * Configuration interface for creating a grid shape
 * @interface GridDescriptor
 * @extends IAnyPrimitiveDescriptor
 */
export interface GridDescriptor extends IAnyPrimitiveDescriptor {
    /** The length of each axis from center to edge */
    length?: Size;
    /** The number of divisions along each axis */
    division?: Size;
    /** Whether to generate grid lines on the XZ plane */
    isXZ?: boolean;
    /** Whether to generate grid lines on the XY plane */
    isXY?: boolean;
    /** Whether to generate grid lines on the YZ plane */
    isYZ?: boolean;
}
/**
 * A 3D grid shape generator that creates line-based grid structures
 * Can generate grids on XY, XZ, and YZ planes with configurable divisions
 * @class Grid
 * @extends IShape
 */
export declare class Grid extends IShape {
    /**
     * Generates a 3D grid with lines based on the provided configuration
     * Creates evenly spaced grid lines on the specified planes (XY, XZ, YZ)
     *
     * @param _desc - Configuration object defining grid properties
     * @param _desc.length - Half-length of the grid from center to edge (default: 1)
     * @param _desc.division - Number of divisions between grid lines (default: 10)
     * @param _desc.isXY - Generate grid lines on XY plane (default: true)
     * @param _desc.isXZ - Generate grid lines on XZ plane (default: true)
     * @param _desc.isYZ - Generate grid lines on YZ plane (default: true)
     * @param _desc.material - Material to apply to the grid
     *
     * @example
     * ```typescript
     * const grid = new Grid();
     * grid.generate({
     *   length: 5,
     *   division: 20,
     *   isXZ: true,
     *   isXY: false,
     *   isYZ: false
     * });
     * ```
     */
    generate(_desc: GridDescriptor): void;
}
