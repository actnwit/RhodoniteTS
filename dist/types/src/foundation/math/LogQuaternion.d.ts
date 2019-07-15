import Vector4 from './Vector4';
import { IVector3 } from './IVector';
export default class LogQuaternion implements IVector3 {
    v: TypedArray;
    constructor(x?: number | TypedArray | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number);
    readonly x: number;
    readonly y: number;
    readonly z: number;
}
