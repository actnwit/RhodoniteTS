import { IAnyPrimitiveDescriptor, Primitive } from '../Primitive';
import { VertexAttribute } from '../../definitions/VertexAttribute';
import { PrimitiveMode } from '../../definitions/PrimitiveMode';
import { IVector3 } from '../../math/IVector';
import { IShape } from './IShape';
import { Vector3 } from '../../math/Vector3';

/**
 * Descriptor interface for configuring Line geometry generation
 */
export interface LineDescriptor extends IAnyPrimitiveDescriptor {
  /** the start position */
  startPos?: IVector3;
  /** the end position */
  endPos?: IVector3;
  /** whether it has the terminal mark */
  hasTerminalMark?: boolean;
}

/**
 * A geometric shape class for creating line primitives with optional terminal markers.
 * Extends IShape to provide line-specific geometry generation capabilities.
 */
export class Line extends IShape {
  /**
   * Generates a line geometry with optional terminal markers at both endpoints.
   * Creates a line between two points with small cross-shaped markers to indicate
   * the start and end positions when hasTerminalMark is enabled.
   *
   * @param _desc - Configuration object containing line parameters
   * @param _desc.startPos - Starting position of the line (defaults to origin)
   * @param _desc.endPos - Ending position of the line (defaults to (1,0,0))
   * @param _desc.hasTerminalMark - Whether to add cross markers at endpoints (defaults to true)
   * @param _desc.material - Material to apply to the generated geometry
   *
   * @example
   * ```typescript
   * const line = new Line();
   * line.generate({
   *   startPos: Vector3.fromCopy3(0, 0, 0),
   *   endPos: Vector3.fromCopy3(5, 0, 0),
   *   hasTerminalMark: true,
   *   material: myMaterial
   * });
   * ```
   */
  public generate(_desc: LineDescriptor): void {
    const desc = {
      startPos: _desc.startPos ?? Vector3.fromCopy3(0, 0, 0),
      endPos: _desc.endPos ?? Vector3.fromCopy3(1, 0, 0),
      hasTerminalMark: _desc.hasTerminalMark ?? true,
      material: _desc.material,
    };

    const positions: number[] = [];

    positions.push(...desc.startPos.flattenAsArray());
    positions.push(...desc.endPos.flattenAsArray());

    if (desc.hasTerminalMark) {
      const length = desc.startPos.lengthTo(desc.endPos);
      const markSize = length * 0.1;

      positions.push(desc.startPos.x - markSize, desc.startPos.y, desc.startPos.z);
      positions.push(desc.startPos.x + markSize, desc.startPos.y, desc.startPos.z);

      positions.push(desc.startPos.x, desc.startPos.y, desc.startPos.z - markSize);
      positions.push(desc.startPos.x, desc.startPos.y, desc.startPos.z + markSize);

      positions.push(desc.endPos.x - markSize, desc.endPos.y, desc.endPos.z);
      positions.push(desc.endPos.x + markSize, desc.endPos.y, desc.endPos.z);

      positions.push(desc.endPos.x, desc.endPos.y, desc.endPos.z - markSize);
      positions.push(desc.endPos.x, desc.endPos.y, desc.endPos.z + markSize);
    }

    const attributes = [new Float32Array(positions)];

    // Check Size
    const attributeSemantics = [VertexAttribute.Position.XYZ];

    this.copyVertexData({
      attributes,
      attributeSemantics,
      primitiveMode: PrimitiveMode.Lines,
      material: desc.material,
    });
  }
}
