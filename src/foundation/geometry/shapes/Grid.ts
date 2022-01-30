import {IAnyPrimitiveDescriptor, Primitive} from '../Primitive';
import {VertexAttribute} from '../../definitions/VertexAttribute';
import {PrimitiveMode} from '../../definitions/PrimitiveMode';
import {Size} from '../../../types/CommonTypes';
import {IShape} from './IShape';

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
export class Grid extends IShape {
  /**
   * Generates a grid object
   * @param desc a descriptor object of a Grid
   */
  public generate(desc: GridDescriptor): void {
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
