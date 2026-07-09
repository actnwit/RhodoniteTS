import type { IVector3 } from '../../math/IVector';
import type { IAnyPrimitiveDescriptor } from '../Primitive';
import { IShape } from './IShape';
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
export declare class Line extends IShape {
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
    generate(_desc: LineDescriptor): void;
}
