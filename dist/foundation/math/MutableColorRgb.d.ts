import Vector4 from './Vector4';
import { IVector3 } from './IVector';
import { IMutableColorRgb } from './IColor';
import ColorRgb from './ColorRgb';
export default class MutableColorRgb extends ColorRgb implements IVector3, IMutableColorRgb {
    constructor(r?: number | TypedArray | IVector3 | Vector4 | Array<number> | ColorRgb | null, g?: number, b?: number);
    x: number;
    y: number;
    z: number;
    r: number;
    g: number;
    b: number;
}
