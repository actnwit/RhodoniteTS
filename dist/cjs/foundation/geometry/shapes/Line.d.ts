import { IAnyPrimitiveDescriptor } from '../Primitive';
import { IVector3 } from '../../math/IVector';
import { IShape } from './IShape';
export interface LineDescriptor extends IAnyPrimitiveDescriptor {
    /** the start position */
    startPos?: IVector3;
    /** the end position */
    endPos?: IVector3;
    /** whether it has the terminal mark */
    hasTerminalMark?: boolean;
}
/**
 * the Line class
 */
export declare class Line extends IShape {
    /**
     * Generates a line object
     * @param _desc a descriptor object of a Line
     */
    generate(_desc: LineDescriptor): void;
}
