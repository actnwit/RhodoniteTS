import {IAnyPrimitiveDescriptor, Primitive} from '../Primitive';
import {VertexAttribute} from '../../definitions/VertexAttribute';
import {PrimitiveMode} from '../../definitions/PrimitiveMode';
import {IVector3} from '../../math/IVector';
import {IShape} from './IShape';

export interface LineDescriptor extends IAnyPrimitiveDescriptor {
  /** the start position */
  startPos: IVector3;
  /** the end position */
  endPos: IVector3;
  /** whether it has the terminal mark */
  hasTerminalMark: boolean;
}

/**
 * the Line class
 */
export class Line extends Primitive implements IShape {
  /**
   * Generates a line object
   * @param desc a descriptor object of a Line
   */
  public generate({
    startPos,
    endPos,
    hasTerminalMark,
    material,
  }: LineDescriptor): void {
    const positions: number[] = [];

    positions.push(...startPos.flattenAsArray());
    positions.push(...endPos.flattenAsArray());

    if (hasTerminalMark) {
      const length = startPos.lengthTo(endPos);
      const markSize = length * 0.1;

      positions.push(startPos.x - markSize, startPos.y, startPos.z);
      positions.push(startPos.x + markSize, startPos.y, startPos.z);

      positions.push(startPos.x, startPos.y, startPos.z - markSize);
      positions.push(startPos.x, startPos.y, startPos.z + markSize);

      positions.push(endPos.x - markSize, endPos.y, endPos.z);
      positions.push(endPos.x + markSize, endPos.y, endPos.z);

      positions.push(endPos.x, endPos.y, endPos.z - markSize);
      positions.push(endPos.x, endPos.y, endPos.z + markSize);
    }

    const attributes = [new Float32Array(positions)];

    // Check Size
    const attributeSemantics = [VertexAttribute.Position.XYZ];

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode: PrimitiveMode.Lines,
      material: material,
    });
  }
}
