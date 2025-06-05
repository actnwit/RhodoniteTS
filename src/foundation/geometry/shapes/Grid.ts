import { IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { Size } from '../../../types/CommonTypes';
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
export class Grid extends IShape {
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
  public generate(_desc: GridDescriptor): void {
    const desc = {
      length: _desc.length ?? 1,
      division: _desc.division ?? 10,
      isXY: _desc.isXY ?? true,
      isXZ: _desc.isXZ ?? true,
      isYZ: _desc.isYZ ?? true,
      material: _desc.material,
    };
    const positions: number[] = [];
    for (let i = 0; i < desc.division * 2 + 3; i++) {
      const start = -desc.length;
      const oneUnitLength = desc.length / (desc.division + 1);

      // XZ grid
      if (desc.isXZ) {
        positions.push(-desc.length, 0, start + oneUnitLength * i);
        positions.push(desc.length, 0, start + oneUnitLength * i);

        positions.push(start + oneUnitLength * i, 0, -desc.length);
        positions.push(start + oneUnitLength * i, 0, desc.length);
      }

      // XY grid
      if (desc.isXY) {
        positions.push(-desc.length, start + oneUnitLength * i, 0);
        positions.push(desc.length, start + oneUnitLength * i, 0);

        positions.push(start + oneUnitLength * i, -desc.length, 0);
        positions.push(start + oneUnitLength * i, desc.length, 0);
      }

      // YZ grid
      if (desc.isYZ) {
        positions.push(0, -desc.length, start + oneUnitLength * i);
        positions.push(0, desc.length, start + oneUnitLength * i);

        positions.push(0, start + oneUnitLength * i, -desc.length);
        positions.push(0, start + oneUnitLength * i, desc.length);
      }
    }

    const attributes = [new Float32Array(positions)];

    // Index Buffer
    // Check Size
    const attributeSemantics = [VertexAttribute.Position.XYZ];

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode: PrimitiveMode.Lines,
      material: desc?.material,
    });
  }
}
