import {Primitive} from './Primitive';
import {VertexAttribute} from '../definitions/VertexAttribute';
import {PrimitiveMode} from '../definitions/PrimitiveMode';
import Material from '../materials/core/Material';
import {Size} from '../../types/CommonTypes';

export interface GridDescriptor {
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
  /** attach a rhodonite material to this plane(the default material is the classicUberMaterial */
  material?: Material;
}

/**
 * the Grid class
 */
export class Grid extends Primitive {
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
        const pos = [];
        pos.push(-length, 0, start + oneUnitLength * i);
        pos.push(length, 0, start + oneUnitLength * i);

        pos.push(start + oneUnitLength * i, 0, -length);
        pos.push(start + oneUnitLength * i, 0, length);
        Array.prototype.push.apply(pos);
      }

      // XY grid
      if (desc.isXY) {
        const pos = [];
        pos.push(-length, start + oneUnitLength * i, 0);
        pos.push(length, start + oneUnitLength * i, 0);

        pos.push(start + oneUnitLength * i, -length, 0);
        pos.push(start + oneUnitLength * i, length, 0);
        Array.prototype.push.apply(pos);
      }

      // YZ grid
      if (desc.isYZ) {
        const pos = [];
        pos.push(0, -length, start + oneUnitLength * i);
        pos.push(0, length, start + oneUnitLength * i);

        pos.push(0, start + oneUnitLength * i, -length);
        pos.push(0, start + oneUnitLength * i, length);
        Array.prototype.push.apply(pos);
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
