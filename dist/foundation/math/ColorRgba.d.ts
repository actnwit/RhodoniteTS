import Vector4 from './Vector4';
import { IVector4 } from './IVector';
import { IColorRgba } from './IColor';
import { TypedArray } from '../../commontypes/CommonTypes';
export default class ColorRgba extends Vector4 implements IVector4, IColorRgba {
    constructor(r: number | TypedArray | IVector4 | Array<number> | null, g?: number, b?: number, a?: number);
    get x(): number;
    get y(): number;
    get z(): number;
    get w(): number;
    get r(): number;
    get g(): number;
    get b(): number;
    get a(): number;
    static zero(): ColorRgba;
    static one(): ColorRgba;
    static dummy(): ColorRgba;
    static normalize(vec: IVector4): ColorRgba;
    static add(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static subtract(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static multiply(vec: IVector4, value: number): ColorRgba;
    static multiplyVector(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    static divide(vec: IVector4, value: number): ColorRgba;
    static divideVector(l_vec: IVector4, r_vec: IVector4): ColorRgba;
    clone(): ColorRgba;
}
