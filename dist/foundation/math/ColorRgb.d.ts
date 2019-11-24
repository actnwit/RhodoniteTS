import Vector4 from './Vector4';
import { IVector3 } from './IVector';
import { IColorRgb } from './IColor';
import { TypedArray } from '../../types/CommonTypes';
export default class ColorRgb implements IVector3, IColorRgb {
    v: TypedArray;
    constructor(r?: number | TypedArray | IVector3 | Vector4 | Array<number> | ColorRgb | null, g?: number, b?: number);
    get x(): number;
    get y(): number;
    get z(): number;
    get r(): number;
    get g(): number;
    get b(): number;
}
