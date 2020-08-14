import { IVector3, IVector4 } from './IVector';
import { TypedArray } from '../../commontypes/CommonTypes';
import { ILogQuaternion, IQuaternion } from './IQuaternion';
export default class LogQuaternion implements ILogQuaternion {
    v: TypedArray;
    constructor(x: number | TypedArray | IVector3 | IVector4 | IQuaternion | Array<number> | null, y?: number, z?: number);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get className(): string;
}
