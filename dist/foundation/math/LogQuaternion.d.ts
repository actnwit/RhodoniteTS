import Vector4 from './Vector4';
import { IVector3 } from './IVector';
import { TypedArray } from '../../types/CommonTypes';
export default class LogQuaternion implements IVector3 {
    v: TypedArray;
    constructor(x?: number | TypedArray | IVector3 | Vector4 | Array<number> | null, y?: number, z?: number);
    get x(): number;
    get y(): number;
    get z(): number;
}
