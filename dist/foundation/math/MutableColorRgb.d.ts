import Vector4 from './Vector4';
import { IVector3 } from './IVector';
import { IMutableColorRgb } from './IColor';
import ColorRgb from './ColorRgb';
import { TypedArray } from '../../commontypes/CommonTypes';
export default class MutableColorRgb extends ColorRgb implements IVector3, IMutableColorRgb {
    constructor(r?: number | TypedArray | IVector3 | Vector4 | Array<number> | ColorRgb | null, g?: number, b?: number);
    get x(): number;
    set x(val: number);
    get y(): number;
    set y(val: number);
    get z(): number;
    set z(val: number);
    get r(): number;
    set r(val: number);
    get g(): number;
    set g(val: number);
    get b(): number;
    set b(val: number);
}
