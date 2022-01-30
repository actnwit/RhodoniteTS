import {IAnyPrimitiveDescriptor, Primitive} from '../Primitive';
import {VertexAttribute} from '../../definitions/VertexAttribute';
import {PrimitiveMode} from '../../definitions/PrimitiveMode';
import {Size} from '../../../types/CommonTypes';
import {IShape} from './IShape';

export interface GridDescriptor extends IAnyPrimitiveDescriptor {
  /** the length of axis */
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
export class Grid extends IShape {
  /**
   * Generates a grid object
   * @param desc a descriptor object of a Grid
   */
  public generate(desc: GridDescriptor): void {
    const positions: number[] = [];
    for (let i = 0; i < desc.division * 2 + 3; i++) {
      const start = -length;
      const oneUnitLength = length / (desc.division + 1);

      // XZ grid
      if (desc.isXZ) {
        positions.push(-length, 0, start + oneUnitLength * i);
        positions.push(length, 0, start + oneUnitLength * i);

        positions.push(start + oneUnitLength * i, 0, -length);
        positions.push(start + oneUnitLength * i, 0, length);
      }

      // XY grid
      if (desc.isXY) {
        positions.push(-length, start + oneUnitLength * i, 0);
        positions.push(length, start + oneUnitLength * i, 0);

        positions.push(start + oneUnitLength * i, -length, 0);
        positions.push(start + oneUnitLength * i, length, 0);
      }

      // YZ grid
      if (desc.isYZ) {
        positions.push(0, -length, start + oneUnitLength * i);
        positions.push(0, length, start + oneUnitLength * i);

        positions.push(0, start + oneUnitLength * i, -length);
        positions.push(0, start + oneUnitLength * i, length);
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
