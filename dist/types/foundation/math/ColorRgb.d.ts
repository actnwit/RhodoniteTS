import Vector4 from './Vector4';
import { IVector3 } from './IVector';
import { IColorRgb } from './IColor';
import { TypedArray } from '../../types/CommonTypes';
export default class ColorRgb implements IVector3, IColorRgb {
    v: TypedArray;
    constructor(r?: number | TypedArray | IVector3 | Vector4 | Array<number> | ColorRgb | null, g?: number, b?: number);
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly r: number;
    readonly g: number;
    readonly b: number;
}
