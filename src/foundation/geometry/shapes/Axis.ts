import {IAnyPrimitiveDescriptor, Primitive} from '../Primitive';
import {VertexAttribute} from '../../definitions/VertexAttribute';
import {PrimitiveMode} from '../../definitions/PrimitiveMode';
import {Size} from '../../../types/CommonTypes';

export interface AxisDescriptor extends IAnyPrimitiveDescriptor {
  /** the length of axis */
  length: Size;
}

/**
 * the Axis class
 */
export class Axis extends Primitive {
  /**
   * Generates a axis object
   * @param desc a descriptor object of a Axis
   */
  public generate(desc: AxisDescriptor): void {
    // prettier-ignore
    const positions = new Float32Array([
      // X axis
      0, 0, 0,
      desc.length, 0, 0,

      // Y axis
      0, 0, 0,
      0, desc.length, 0,

      // Z axis
      0, 0, 0,
      0, 0, desc.length,
    ]);

    // prettier-ignore
    const colors = new Float32Array([
      // X axis as Red
      1, 0, 0,
      1, 0, 0,

      // Y axis as Green
      0, 1, 0,
      0, 1, 0,

      // Z axis as Blue
      0, 0, 1,
      0, 0, 1,
    ]);

    const attributes = [new Float32Array(positions), new Float32Array(colors)];

    // Check Size
    const attributeSemantics = [
      VertexAttribute.Position.XYZ,
      VertexAttribute.Normal.XYZ,
      VertexAttribute.Texcoord0.XY,
    ];

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode: PrimitiveMode.Lines,
      material: desc?.material,
    });
  }
}
